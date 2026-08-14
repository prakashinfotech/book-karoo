import { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useCheckoutStore } from '@/shared/store/checkoutStore';
import { useAuthStore } from '@/features/auth/store/authStore';
import { useValidateCoupon, useVerifyPayment } from '../api/useBooking';
import { calculatePricing } from '@/shared/lib/pricing';
import { usePublicSettings, parseNum } from '@/shared/lib/usePublicSettings';
import { OrderSummaryPanel } from '../components/OrderSummaryPanel';
import { MockPaymentModal } from '../components/MockPaymentModal';
import { CountdownRing } from '@/shared/components/ui/CountdownRing';
import { toast } from '@/shared/components/ui/Toast';
import { ROUTES, TMDB_POSTER } from '@/shared/constants';
import { formatCurrency } from '@/shared/lib/utils';
import { openRazorpayCheckout } from '@/shared/lib/razorpay';
import type { BookingDetailResponse, CouponValidation, CreateOrderResponse } from '../types';
import type { ApiError } from '@/shared/types';

const paymentProvider = import.meta.env.VITE_PAYMENT_PROVIDER ?? 'mock';

export default function EventCheckoutPage() {
  const navigate       = useNavigate();
  const checkoutStore  = useCheckoutStore();
  const { user }       = useAuthStore();

  // Guard: no order → redirect to events
  useEffect(() => {
    if (!checkoutStore.orderResponse) {
      navigate(ROUTES.EVENTS);
    }
  }, []);

  const validateCoupon = useValidateCoupon();
  const verifyPayment  = useVerifyPayment();

  // Idempotency key is already used (embedded in order), nothing to re-create
  const [mobile, setMobile] = useState(user?.mobile ?? '');
  const [email,  setEmail]  = useState(user?.email  ?? '');

  const [couponInput,   setCouponInput]   = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<CouponValidation | null>(null);
  const [couponError,   setCouponError]   = useState<string | null>(null);

  const [agreedToTerms,    setAgreedToTerms]    = useState(false);
  const [showPaymentModal, setShowPaymentModal]  = useState(false);
  const [isVerifying,      setIsVerifying]       = useState(false);

  // Countdown based on lockExpiresAt from order response
  const orderResponse  = checkoutStore.orderResponse;
  const lockExpiresAt  = (orderResponse as { lockExpiresAt?: string } | null)?.lockExpiresAt ?? null;
  const [remaining, setRemaining] = useState(8 * 60);
  const expiredRef = useRef(false);

  const { data: publicSettings } = usePublicSettings();
  const totalSecs = parseNum(publicSettings?.seat_lock_minutes, 8) * 60;

  useEffect(() => {
    expiredRef.current = false;
    if (!lockExpiresAt) { setRemaining(totalSecs); return; }
    const tick = () => {
      const diff = Math.max(0, Math.floor((new Date(lockExpiresAt).getTime() - Date.now()) / 1000));
      setRemaining(diff);
      if (diff === 0 && !expiredRef.current) {
        expiredRef.current = true;
        toast('Your ticket hold expired. Please restart booking.', 'error');
        checkoutStore.clearAll();
        navigate('/events');
      }
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [lockExpiresAt, totalSecs]);

  // Pricing from order breakdown
  const breakdown    = orderResponse?.breakdown;
  const ticketAmount = breakdown?.ticketAmount ?? 0;
  const ticketQty    = orderResponse
    ? (orderResponse as { ticketQty?: number }).ticketQty ?? 1
    : 1;
  const avgPrice = ticketQty > 0 ? ticketAmount / ticketQty : ticketAmount;

  const stateCode = user?.stateCode ?? '27';
  const pricingConfig = {
    convFeePerTicket: parseNum(publicSettings?.convenience_fee_per_ticket, 59),
    offerFeeBase:     parseNum(publicSettings?.offer_processing_fee, 15),
    companyStateCode: publicSettings?.company_state_code ?? '24',
    gstRate:          parseNum(publicSettings?.gst_rate, 0.18),
  };

  const localBreakdown = calculatePricing(
    ticketQty,
    avgPrice,
    stateCode,
    appliedCoupon ? { discount: appliedCoupon.discount, hasOfferFee: true } : null,
    pricingConfig,
  );

  // ── Coupon handlers ───────────────────────────────────────────────────────
  async function handleApplyCoupon() {
    if (!couponInput) return;
    setCouponError(null);
    try {
      const result = await validateCoupon.mutateAsync({
        code:         couponInput,
        showId:       '',
        userId:       user?.id,
        ticketAmount: localBreakdown.ticketAmount,
      });
      setAppliedCoupon(result);
      toast(`${result.code} applied! ₹${result.discount} off.`, 'success');
    } catch (err: unknown) {
      const msg = (err as ApiError)?.message ?? 'Invalid coupon.';
      setCouponError(msg);
    }
  }

  function handleRemoveCoupon() {
    setAppliedCoupon(null);
    setCouponInput('');
    setCouponError(null);
  }

  // ── Razorpay handler ──────────────────────────────────────────────────────
  function handleRazorpayCheckout(order: CreateOrderResponse) {
    openRazorpayCheckout({
      keyId:          order.razorpayKeyId!,
      orderId:        order.providerOrderId,
      amount:         order.amount,
      currency:       order.currency,
      bookingRef:     order.bookingRef,
      customerName:   user?.name ?? '',
      customerEmail:  email,
      customerMobile: mobile,
      onSuccess: (response) => {
        setIsVerifying(true);
        verifyPayment.mutate(
          {
            razorpayOrderId:   response.razorpay_order_id,
            razorpayPaymentId: response.razorpay_payment_id,
            razorpaySignature: response.razorpay_signature,
          },
          {
            onSuccess: (detail) => {
              checkoutStore.setBookingDetail(detail);
              navigate(ROUTES.CONFIRMATION);
              setIsVerifying(false);
            },
            onError: (err: unknown) => {
              setIsVerifying(false);
              const apiErr = err as ApiError;
              toast(apiErr?.message ?? 'Payment verification failed. Please contact support.', 'error');
            },
          },
        );
      },
      onDismiss: () => {
        toast("Payment cancelled. Your seats are held for a few more minutes.", 'info');
      },
    });
  }

  // ── Pay handler ───────────────────────────────────────────────────────────
  function handlePay() {
    if (!mobile || !email) {
      toast('Please fill in your contact details.', 'error');
      return;
    }
    if (!/^\d{10}$/.test(mobile)) {
      toast('Enter a valid 10-digit mobile number.', 'error');
      return;
    }
    checkoutStore.setContact(mobile, email);
    const effectiveKeyId = orderResponse?.razorpayKeyId ?? import.meta.env.VITE_RAZORPAY_KEY_ID;
    if (paymentProvider === 'razorpay' && effectiveKeyId) {
      handleRazorpayCheckout({ ...orderResponse!, razorpayKeyId: effectiveKeyId });
    } else {
      setShowPaymentModal(true);
    }
  }

  function handlePaymentSuccess(detail: BookingDetailResponse) {
    checkoutStore.setBookingDetail(detail);
    navigate(ROUTES.CONFIRMATION);
  }

  if (!orderResponse) return null;

  const ctx = checkoutStore.eventContext;

  return (
    <div className="min-h-screen bg-bg-base text-text-primary font-sans pb-10">
      {/* Header */}
      <header className="sticky top-0 z-40 h-14 flex items-center gap-3 px-4 md:px-6 bg-bg-surface/90 backdrop-blur-md border-b border-border-default">
        <Link to={-1 as never}>
          <button className="px-3 py-1.5 rounded-full bg-bg-surface2 border border-border-default text-text-secondary text-sm">← Back</button>
        </Link>
        <span className="font-semibold text-sm text-text-primary flex-1">Event Checkout</span>
        {lockExpiresAt && (
          <CountdownRing totalSeconds={totalSecs} remainingSeconds={remaining} size={44} strokeWidth={4} />
        )}
      </header>

      <div className="max-w-[1100px] mx-auto px-4 md:px-6 pt-6 grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-6">
        {/* ── LEFT PANEL ── */}
        <div className="space-y-4">
          {/* Event details card */}
          <div className="p-5 rounded-xl bg-bg-surface border border-border-default">
            <div className="flex items-start gap-4">
              {/* Poster */}
              <div className="flex-shrink-0 w-16 h-16 rounded-xl overflow-hidden bg-bg-surface2 border border-border-default">
                {ctx?.posterUrl
                  ? <img src={TMDB_POSTER(ctx.posterUrl)} alt={ctx.eventTitle} className="w-full h-full object-cover" />
                  : <div className="w-full h-full flex items-center justify-center text-2xl">🎪</div>
                }
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <p className="font-display font-bold text-lg leading-tight">
                  {ctx?.eventTitle ?? 'Event Booking'}
                </p>
                {ctx?.venueName && (
                  <p className="text-sm text-text-secondary font-sans mt-1">
                    📍 {ctx.venueName}{ctx.cityName ? `, ${ctx.cityName}` : ''}
                  </p>
                )}
                {ctx?.eventDate && (
                  <p className="text-sm text-text-muted font-sans mt-0.5">
                    📅 {new Date(ctx.eventDate).toLocaleDateString('en-IN', {
                      weekday: 'short', day: '2-digit', month: 'short', year: 'numeric',
                    })}
                    {' · '}
                    {new Date(ctx.eventDate).toLocaleTimeString('en-IN', {
                      hour: '2-digit', minute: '2-digit', hour12: true,
                    })}
                  </p>
                )}
              </div>
            </div>

            {/* Tier + quantity */}
            {ctx && (
              <div className="mt-4 flex items-center gap-3 pt-4 border-t border-border-default">
                <span className="px-3 py-1 rounded-full bg-accent-indigo/15 text-accent-indigo text-xs font-semibold font-sans">
                  {ctx.tierName}
                </span>
                <span className="text-sm text-text-secondary font-sans">
                  {ctx.quantity} ticket{ctx.quantity !== 1 ? 's' : ''}
                  {ctx.unitPrice > 0 && ` · ${formatCurrency(ctx.unitPrice)}/ticket`}
                </span>
              </div>
            )}

            <div className="flex items-center justify-between py-2.5 mt-3 border-t border-border-default">
              <span className="text-sm text-text-muted font-sans">Ticket Amount</span>
              <span className="font-semibold text-sm text-text-primary font-sans">
                {formatCurrency(ticketAmount)}
              </span>
            </div>
          </div>

          {/* Contact details */}
          <div className="p-5 rounded-xl bg-bg-surface border border-border-default">
            <h3 className="font-semibold text-sm mb-1 font-sans">Contact Details</h3>
            <p className="text-xs text-text-muted font-sans mb-4">Booking confirmation will be sent here</p>

            <div className="space-y-3">
              <div>
                <label className="block text-xs text-text-muted font-sans mb-1">Mobile number</label>
                <input
                  type="tel"
                  value={mobile}
                  onChange={(e) => setMobile(e.target.value.replace(/\D/g, '').slice(0, 10))}
                  placeholder="10-digit mobile"
                  className="w-full px-3 py-2.5 rounded-lg bg-bg-base border border-border-default text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-1 focus:ring-accent-indigo font-sans"
                />
              </div>
              <div>
                <label className="block text-xs text-text-muted font-sans mb-1">Email address</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your@email.com"
                  className="w-full px-3 py-2.5 rounded-lg bg-bg-base border border-border-default text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-1 focus:ring-accent-indigo font-sans"
                />
              </div>
            </div>
          </div>
        </div>

        {/* ── RIGHT PANEL ── */}
        <OrderSummaryPanel
          breakdown={localBreakdown}
          ticketQty={ticketQty}
          coupon={appliedCoupon}
          couponInput={couponInput}
          couponError={couponError}
          couponLoading={validateCoupon.isPending}
          agreedToTerms={agreedToTerms}
          payLoading={false}
          onCouponChange={setCouponInput}
          onApplyCoupon={() => void handleApplyCoupon()}
          onRemoveCoupon={handleRemoveCoupon}
          onTermsChange={setAgreedToTerms}
          onPay={handlePay}
        />
      </div>

      {showPaymentModal && orderResponse && (
        <MockPaymentModal
          providerOrderId={orderResponse.providerOrderId}
          amount={orderResponse.amount}
          onSuccess={handlePaymentSuccess}
          onClose={() => setShowPaymentModal(false)}
        />
      )}

      {isVerifying && (
        <div className="fixed inset-0 z-[9999] bg-bg-base/95 backdrop-blur-sm flex flex-col items-center justify-center gap-6">
          <div className="font-display font-bold text-2xl text-text-primary">
            Book<span className="text-accent-crimson">Karoo</span>
          </div>
          <div className="w-12 h-12 rounded-full border-4 border-accent-crimson/20 border-t-accent-crimson animate-spin" />
          <div className="text-center">
            <p className="font-semibold text-text-primary font-sans">Verifying your payment...</p>
            <p className="text-sm text-text-muted font-sans mt-1">Please do not close this window</p>
          </div>
        </div>
      )}
    </div>
  );
}
