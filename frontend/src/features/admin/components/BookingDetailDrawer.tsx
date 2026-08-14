import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { X, FileText, QrCode } from 'lucide-react';
import { Skeleton } from '@/shared/components/ui/Skeleton';
import { useAdminBookingDetail, useAdminCancelBooking, useResendBookingEmail } from '../api/useAdmin';
import { RefundModal } from './RefundModal';

interface Props {
  bookingRef: string | null;
  onClose:    () => void;
}

const STATUS_CLASSES: Record<string, string> = {
  Confirmed: 'bg-semantic-success/15 text-semantic-success',
  Cancelled: 'bg-accent-crimson/15 text-accent-crimson',
  Pending:   'bg-amber-500/15 text-amber-400',
  Refunded:  'bg-accent-indigo/15 text-accent-indigo',
};

function fmt(n: number) {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 2 }).format(n);
}

export function BookingDetailDrawer({ bookingRef, onClose }: Props) {
  const { data: booking, isLoading } = useAdminBookingDetail(bookingRef);
  const cancelBooking = useAdminCancelBooking();
  const resendEmail   = useResendBookingEmail();

  const [confirmCancel, setConfirmCancel] = useState(false);
  const [showRefund,    setShowRefund]    = useState(false);

  const posterSrc = booking?.posterUrl
    ? (booking.posterUrl.startsWith('http') ? booking.posterUrl : `https://image.tmdb.org/t/p/w92${booking.posterUrl}`)
    : null;

  const estimatedRefund = booking
    ? Math.max(0, booking.amountPaid - booking.convenienceFee - booking.cgst - booking.sgst - booking.igst - booking.offerProcessingFee)
    : 0;

  const convFeeTotal = booking ? booking.convenienceFee + booking.cgst + booking.sgst + booking.igst : 0;
  const gstTotal     = booking ? booking.cgst + booking.sgst + booking.igst : 0;

  function handleConfirmCancel() {
    if (!booking) return;
    cancelBooking.mutate(booking.bookingRef, {
      onSuccess: () => setConfirmCancel(false),
    });
  }

  return (
    <AnimatePresence>
      {bookingRef && (
        <>
          <motion.div
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.div
            className="fixed top-0 right-0 h-screen w-full max-w-[420px] bg-bg-surface border-l border-border-default z-[60] flex flex-col"
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'tween', duration: 0.3, ease: 'easeOut' }}
          >
            {/* Header */}
            <div className="sticky top-0 bg-bg-surface border-b border-border-default px-6 py-4 flex items-center gap-3">
              <div>
                <p className="font-bold text-base text-text-primary font-sans">Booking Detail</p>
                {booking && (
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="font-mono text-[11px] bg-bg-surface2 px-2 py-0.5 rounded text-text-muted">
                      {booking.bookingRef}
                    </span>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${STATUS_CLASSES[booking.status] ?? ''}`}>
                      {booking.status}
                    </span>
                  </div>
                )}
              </div>
              <button onClick={onClose} className="ml-auto text-text-muted hover:text-text-primary">
                <X size={18} />
              </button>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto px-6 py-4 space-y-5">
              {isLoading ? (
                <div className="space-y-3">
                  {[160, 100, 120, 140].map((h, i) => <Skeleton key={i} height={h} className="rounded-xl" />)}
                </div>
              ) : !booking ? (
                <p className="text-text-muted text-sm text-center py-12">Booking not found.</p>
              ) : (
                <>
                  {/* Movie / Show */}
                  <section>
                    <p className="text-[11px] text-text-muted uppercase tracking-wider font-sans mb-2">Movie / Show</p>
                    <div className="flex gap-3">
                      {posterSrc
                        ? <img src={posterSrc} alt="" className="w-[56px] h-[84px] object-cover rounded-lg flex-shrink-0" />
                        : <div className="w-[56px] h-[84px] rounded-lg bg-bg-surface2 flex-shrink-0" />}
                      <div className="min-w-0">
                        <p className="font-bold text-base text-text-primary font-display leading-snug">
                          {booking.movieTitle ?? booking.eventTitle ?? '—'}
                        </p>
                        {(booking.format || booking.language) && (
                          <p className="text-[12px] text-text-muted mt-0.5 font-sans">
                            {[booking.format, booking.language].filter(Boolean).join(' · ')}
                          </p>
                        )}
                        <p className="text-[12px] text-text-secondary mt-1 font-sans">📅 {booking.showDateLabel}</p>
                        <p className="text-[12px] text-text-secondary font-sans">🕐 {booking.showTimeLabel}</p>
                        <p className="text-[12px] text-text-muted font-sans">📍 {booking.venueName}</p>
                        <p className="text-[11px] text-text-muted font-sans">{booking.screenName} · {booking.cityName}</p>
                      </div>
                    </div>
                  </section>

                  <hr className="border-border-default" />

                  {/* Customer */}
                  <section>
                    <p className="text-[11px] text-text-muted uppercase tracking-wider font-sans mb-2">Customer</p>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-accent-indigo to-accent-purple flex items-center justify-center text-white font-bold flex-shrink-0">
                        {booking.userName.charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <p className="font-bold text-[14px] text-text-primary">{booking.userName}</p>
                        <p className="text-[12px] text-text-muted truncate">{booking.userEmail}</p>
                        <p className="text-[12px] text-text-muted font-mono">{booking.userMobile}</p>
                      </div>
                    </div>
                  </section>

                  <hr className="border-border-default" />

                  {/* Seats */}
                  <section>
                    <p className="text-[11px] text-text-muted uppercase tracking-wider font-sans mb-2">Seats</p>
                    {booking.seatsSummary ? (
                      <div className="flex flex-wrap gap-1.5 mb-2">
                        {booking.seatsSummary.split(', ').map((s) => (
                          <span key={s} className="font-mono text-[11px] bg-bg-surface2 px-2 py-1 rounded text-text-primary">
                            {s}
                          </span>
                        ))}
                      </div>
                    ) : <p className="text-text-muted text-sm">No seat data</p>}
                    <p className="text-[12px] text-text-muted font-sans">
                      {booking.ticketQty} seat{booking.ticketQty !== 1 ? 's' : ''} · {fmt(booking.amountPaid)}
                    </p>
                  </section>

                  <hr className="border-border-default" />

                  {/* Pricing Breakdown */}
                  <section>
                    <p className="text-[11px] text-text-muted uppercase tracking-wider font-sans mb-2">Pricing Breakdown</p>
                    <div className="space-y-1.5 text-[13px] font-sans">
                      <Row label="Ticket Amount" value={fmt(booking.amountPaid - convFeeTotal + booking.discount)} />
                      <Row label="Convenience Fee" value={fmt(booking.convenienceFee)} />
                      <Row label={booking.igst > 0 ? 'GST (IGST)' : 'GST (CGST + SGST)'} value={fmt(gstTotal)} />
                      {booking.offerProcessingFee > 0 && <Row label="Offer Processing Fee" value={fmt(booking.offerProcessingFee)} />}
                      {booking.discount > 0 && (
                        <div className="flex justify-between text-semantic-success">
                          <span>Discount</span><span>-{fmt(booking.discount)}</span>
                        </div>
                      )}
                      <hr className="border-border-default my-1" />
                      <div className="flex justify-between font-bold text-[16px]">
                        <span className="text-text-primary">Amount Paid</span>
                        <span className="text-accent-crimson">{fmt(booking.amountPaid)}</span>
                      </div>
                    </div>
                  </section>

                  <hr className="border-border-default" />

                  {/* Payment */}
                  <section>
                    <p className="text-[11px] text-text-muted uppercase tracking-wider font-sans mb-2">Payment</p>
                    <div className="space-y-1 text-[13px] font-sans">
                      <Row label="Method" value={booking.paymentMethod ?? '—'} />
                      <div className="flex justify-between">
                        <span className="text-text-muted">Transaction ID</span>
                        <span className="font-mono text-[11px] text-text-secondary">{booking.providerPaymentId ?? '—'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-text-muted">Status</span>
                        <span className={`text-[11px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${STATUS_CLASSES[booking.paymentStatus] ?? 'bg-bg-surface2 text-text-muted'}`}>
                          {booking.paymentStatus}
                        </span>
                      </div>
                      {booking.refundAmount != null && (
                        <>
                          <Row label="Refund" value={fmt(booking.refundAmount)} />
                          <div className="flex justify-between">
                            <span className="text-text-muted">Refund ID</span>
                            <span className="font-mono text-[11px] text-text-secondary">{booking.refundId}</span>
                          </div>
                        </>
                      )}
                    </div>
                  </section>

                  {/* Documents */}
                  <section>
                    <p className="text-[11px] text-text-muted uppercase tracking-wider font-sans mb-2">Documents</p>
                    <div className="flex gap-2">
                      <button
                        disabled={!booking.invoiceUrl}
                        onClick={() => booking.invoiceUrl && window.open(booking.invoiceUrl, '_blank')}
                        className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-border-default text-[12px] text-text-secondary hover:text-text-primary disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                      >
                        <FileText size={13} /> Invoice
                      </button>
                      <button
                        disabled={!booking.qrUrl}
                        onClick={() => booking.qrUrl && window.open(booking.qrUrl, '_blank')}
                        className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-border-default text-[12px] text-text-secondary hover:text-text-primary disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                      >
                        <QrCode size={13} /> QR Code
                      </button>
                    </div>
                  </section>
                </>
              )}
            </div>

            {/* Footer */}
            {booking && (
              <div className="sticky bottom-0 bg-bg-surface border-t border-border-default px-6 py-4 space-y-2">
                {/* Cancel confirm inline */}
                {confirmCancel ? (
                  <div className="rounded-lg bg-accent-crimson/10 border border-accent-crimson/30 p-3 space-y-2">
                    <p className="text-[13px] text-accent-crimson font-semibold">
                      Are you sure? Estimated refund: {fmt(estimatedRefund)}
                    </p>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setConfirmCancel(false)}
                        className="flex-1 py-2 rounded-lg border border-border-default text-text-secondary text-[12px] hover:bg-bg-surface2 transition-colors"
                      >
                        Keep
                      </button>
                      <button
                        onClick={handleConfirmCancel}
                        disabled={cancelBooking.isPending}
                        className="flex-1 py-2 rounded-lg bg-accent-crimson text-white text-[12px] font-bold disabled:opacity-60"
                      >
                        {cancelBooking.isPending ? 'Cancelling…' : 'Confirm Cancel'}
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    {booking.status === 'Confirmed' && (
                      <button
                        onClick={() => setConfirmCancel(true)}
                        className="w-full py-2.5 rounded-lg border border-accent-crimson text-accent-crimson text-[13px] font-semibold hover:bg-accent-crimson/10 transition-colors"
                      >
                        Cancel Booking
                      </button>
                    )}
                    {(booking.status === 'Confirmed' || booking.status === 'Cancelled') && booking.refundAmount == null && (
                      <button
                        onClick={() => setShowRefund(true)}
                        className="w-full py-2.5 rounded-lg border border-semantic-warning text-semantic-warning text-[13px] font-semibold hover:bg-semantic-warning/10 transition-colors"
                      >
                        Process Refund
                      </button>
                    )}
                    <button
                      onClick={() => resendEmail.mutate(booking.bookingRef)}
                      disabled={resendEmail.isPending}
                      className="w-full py-2.5 rounded-lg border border-border-default text-text-secondary text-[13px] hover:bg-bg-surface2 transition-colors disabled:opacity-60"
                    >
                      {resendEmail.isPending ? 'Sending…' : 'Resend Email'}
                    </button>
                  </>
                )}
              </div>
            )}
          </motion.div>
        </>
      )}

      {showRefund && booking && (
        <RefundModal
          booking={booking}
          onClose={() => setShowRefund(false)}
          onSuccess={() => setShowRefund(false)}
        />
      )}
    </AnimatePresence>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between">
      <span className="text-text-muted">{label}</span>
      <span className="text-text-primary">{value}</span>
    </div>
  );
}
