import { cn } from '@/shared/lib/utils';
import type { PricingBreakdown } from '@/shared/types';
import type { CouponValidation } from '../types';

interface Props {
  breakdown:         PricingBreakdown;
  ticketQty:         number;
  coupon:            CouponValidation | null;
  couponInput:       string;
  couponError:       string | null;
  couponLoading:     boolean;
  agreedToTerms:     boolean;
  payLoading:        boolean;
  onCouponChange:    (v: string) => void;
  onApplyCoupon:     () => void;
  onRemoveCoupon:    () => void;
  onTermsChange:     (v: boolean) => void;
  onPay:             () => void;
}

const isDev = import.meta.env.DEV;

export function OrderSummaryPanel({
  breakdown, ticketQty, coupon, couponInput, couponError, couponLoading,
  agreedToTerms, payLoading, onCouponChange, onApplyCoupon,
  onRemoveCoupon, onTermsChange, onPay,
}: Props) {
  const gst = breakdown.cgst + breakdown.sgst + breakdown.igst;

  return (
    <div className="sticky top-24 space-y-4">
      <div className="p-5 rounded-xl bg-bg-surface border border-border-default">
        <p className="text-[11px] font-semibold text-text-muted uppercase tracking-widest mb-4 font-sans">
          Order Summary
        </p>

        {/* Line items */}
        <div className="space-y-3 text-sm font-sans">
          {/* Ticket Amount */}
          <div>
            <div className="flex justify-between font-semibold text-text-primary text-[11px] uppercase tracking-wider">
              <span>Ticket Amount</span>
              <span>₹{breakdown.ticketAmount}</span>
            </div>
            <p className="text-[11px] text-text-muted mt-0.5">
              Quantity: {ticketQty} ticket{ticketQty !== 1 ? 's' : ''}
            </p>
          </div>

          {/* Convenience Fees */}
          <div>
            <div className="flex justify-between font-semibold text-text-primary text-[11px] uppercase tracking-wider">
              <span>Convenience Fees</span>
              <span>₹{breakdown.convenienceFee + gst}</span>
            </div>
            <div className="mt-1 space-y-0.5">
              <div className="flex justify-between text-[11px] text-text-muted">
                <span>Base Amount</span>
                <span>₹{breakdown.convenienceFee}</span>
              </div>
              {breakdown.isIntraState ? (
                <>
                  <div className="flex justify-between text-[11px] text-text-muted">
                    <span>CGST @ 9%</span>
                    <span>₹{breakdown.cgst}</span>
                  </div>
                  <div className="flex justify-between text-[11px] text-text-muted">
                    <span>SGST @ 9%</span>
                    <span>₹{breakdown.sgst}</span>
                  </div>
                </>
              ) : (
                <div className="flex justify-between text-[11px] text-text-muted">
                  <span>Integrated GST (IGST) @ 18%</span>
                  <span>₹{breakdown.igst}</span>
                </div>
              )}
            </div>
          </div>

          {/* Offer Processing Fee (when coupon applied) */}
          {breakdown.offerProcessingFee > 0 && (
            <div>
              <div className="flex justify-between font-semibold text-text-primary text-[11px] uppercase tracking-wider">
                <span>Offer Processing Fee</span>
                <span>₹{breakdown.offerProcessingFee + breakdown.offerProcessingFeeGst}</span>
              </div>
              <div className="mt-1 space-y-0.5">
                <div className="flex justify-between text-[11px] text-text-muted">
                  <span>Base Amount</span>
                  <span>₹{breakdown.offerProcessingFee}</span>
                </div>
                <div className="flex justify-between text-[11px] text-text-muted">
                  <span>{breakdown.isIntraState ? 'CGST + SGST @ 18%' : 'IGST @ 18%'}</span>
                  <span>₹{breakdown.offerProcessingFeeGst}</span>
                </div>
              </div>
            </div>
          )}

          {breakdown.discount > 0 && (
            <div className="flex justify-between text-semantic-success font-semibold text-[11px] uppercase tracking-wider">
              <span>Discount ({coupon?.code})</span>
              <span>−₹{breakdown.discount}</span>
            </div>
          )}
        </div>

        <div className="my-4 border-t-2 border-border-default" />

        <div className="flex justify-between items-baseline">
          <span className="text-sm font-semibold text-text-secondary font-sans">Amount Payable</span>
          <span className="font-display font-black text-2xl text-accent-crimson">₹{breakdown.amountPaid}</span>
        </div>

        {/* Coupon section */}
        <div className="mt-5">
          {coupon ? (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-semantic-success/10 border border-semantic-success/30">
              <span className="text-semantic-success text-sm font-sans flex-1">
                ✓ {coupon.code} applied — ₹{coupon.discount} off!
              </span>
              <button
                onClick={onRemoveCoupon}
                className="px-2.5 py-1 rounded-full text-xs font-sans border border-border-default text-text-muted hover:border-semantic-error hover:text-semantic-error transition-colors"
              >
                ✕ Remove
              </button>
            </div>
          ) : (
            <div className="flex gap-2">
              <input
                value={couponInput}
                onChange={(e) => onCouponChange(e.target.value.toUpperCase())}
                onKeyDown={(e) => e.key === 'Enter' && onApplyCoupon()}
                placeholder="Enter coupon code"
                className={cn(
                  'flex-1 px-3 py-2 rounded-lg bg-bg-base border text-sm font-mono text-text-primary',
                  'placeholder:text-text-muted focus:outline-none focus:ring-1 focus:ring-accent-indigo',
                  couponError ? 'border-semantic-error' : 'border-border-default'
                )}
              />
              <button
                onClick={onApplyCoupon}
                disabled={!couponInput || couponLoading}
                className="px-4 py-2 rounded-lg bg-accent-indigo text-white text-sm font-semibold font-sans disabled:opacity-50 hover:opacity-90 transition-opacity"
              >
                {couponLoading ? '…' : 'Apply'}
              </button>
            </div>
          )}
          {couponError && (
            <p className="mt-1 text-xs text-semantic-error font-sans">{couponError}</p>
          )}
          {isDev && !coupon && (
            <p className="mt-2 text-[10px] text-text-muted font-sans">
              Test coupons: FIRSTBOOK · CHEAPTUE · MOVIE20
            </p>
          )}
        </div>

        {/* T&C */}
        <label className="flex items-start gap-2 mt-4 cursor-pointer">
          <input
            type="checkbox"
            checked={agreedToTerms}
            onChange={(e) => onTermsChange(e.target.checked)}
            className="mt-0.5 accent-accent-crimson flex-shrink-0"
          />
          <span className="text-xs text-text-muted font-sans leading-relaxed">
            I agree to the{' '}
            <span className="text-accent-indigo">Terms &amp; Conditions</span> and{' '}
            <span className="text-accent-indigo">Cancellation Policy</span>.
            Convenience fee is non-refundable.
          </span>
        </label>

        {/* Pay button */}
        <button
          onClick={onPay}
          disabled={!agreedToTerms || payLoading}
          className={cn(
            'w-full mt-4 py-4 rounded-xl font-semibold text-base font-sans transition-all',
            'bg-gradient-to-r from-accent-crimson-light to-accent-crimson text-white',
            'shadow-[0_10px_40px_-10px_rgba(225, 29, 116,0.55)]',
            agreedToTerms && !payLoading ? 'hover:-translate-y-0.5' : 'opacity-50 cursor-not-allowed'
          )}
        >
          {payLoading ? 'Processing…' : '🔒 Proceed to Pay'}
        </button>

        {/* Payment icons */}
        <div className="mt-3 text-center">
          <p className="text-xs text-text-muted font-sans">Visa · Mastercard · RuPay · UPI · NetBanking</p>
        </div>
      </div>
    </div>
  );
}
