import { useState } from 'react';
import { X, AlertTriangle } from 'lucide-react';
import { Modal } from '@/shared/components/ui/Modal';
import { usePartnerBookingDetail, usePartnerCancelBooking } from '../api/usePartner';

function fmt(n: number) {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n);
}

const STATUS_CLASSES: Record<string, string> = {
  Confirmed: 'bg-semantic-success/15 text-semantic-success',
  Cancelled:  'bg-accent-crimson/15 text-accent-crimson',
  Pending:    'bg-amber-500/15 text-amber-400',
  Refunded:   'bg-accent-indigo/15 text-accent-indigo',
};

interface CancelConfirmProps {
  bookingRef: string;
  onClose: () => void;
  onDone: () => void;
}

function CancelConfirmModal({ bookingRef, onClose, onDone }: CancelConfirmProps) {
  const cancel = usePartnerCancelBooking();
  return (
    <Modal open onClose={onClose} maxWidth="max-w-sm">
      <div className="flex flex-col gap-4">
        <div className="flex items-center gap-2 text-semantic-warning">
          <AlertTriangle size={20} />
          <h3 className="font-display font-bold text-lg">Cancel Booking?</h3>
        </div>
        <p className="text-sm text-text-secondary">
          This will cancel booking <span className="font-mono font-semibold text-text-primary">{bookingRef}</span>.
          The customer will be notified and a refund will be processed automatically.
        </p>
        {cancel.isError && (
          <p className="text-xs text-semantic-error">Failed to cancel booking. Please try again.</p>
        )}
        <div className="flex flex-col gap-2">
          <button
            onClick={onClose}
            className="w-full px-4 py-2 rounded-lg border border-border-default text-text-secondary hover:bg-bg-surface2 transition-colors text-sm"
          >
            Keep Booking
          </button>
          <button
            onClick={() => cancel.mutate(bookingRef, { onSuccess: () => { onDone(); onClose(); } })}
            disabled={cancel.isPending}
            className="w-full px-4 py-2 rounded-lg text-white text-sm font-semibold disabled:opacity-60 hover:opacity-90 transition-opacity"
            style={{ background: '#E11D74' }}
          >
            {cancel.isPending ? 'Cancelling…' : 'Cancel Booking'}
          </button>
        </div>
      </div>
    </Modal>
  );
}

interface Props {
  bookingRef: string;
  onClose: () => void;
}

export function PartnerBookingDetailDrawer({ bookingRef, onClose }: Props) {
  const { data: booking, isLoading, isError, refetch } = usePartnerBookingDetail(bookingRef);
  const [showCancel, setShowCancel] = useState(false);

  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/30" onClick={onClose} />
      <aside className="fixed right-0 top-0 h-full w-full max-w-md z-50 bg-bg-base border-l border-border-default flex flex-col shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border-default flex-shrink-0">
          <div>
            <h2 className="font-display font-bold text-lg text-text-primary">Booking Detail</h2>
            <p className="text-xs font-mono text-accent-indigo mt-0.5">{bookingRef}</p>
          </div>
          <button onClick={onClose} className="text-text-muted hover:text-text-primary transition-colors" aria-label="Close">
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          {isLoading && (
            <div className="space-y-3">
              {Array.from({ length: 6 }, (_, i) => (
                <div key={i} className="h-10 rounded-lg bg-bg-surface2 animate-pulse" />
              ))}
            </div>
          )}

          {isError && (
            <div className="rounded-md border border-semantic-error/30 bg-semantic-error/08 p-4 text-sm text-semantic-error flex items-center justify-between">
              <span>Failed to load booking details.</span>
              <button onClick={() => refetch()} className="underline hover:opacity-80">Retry</button>
            </div>
          )}

          {booking && (
            <>
              {/* Status */}
              <div className="flex items-center justify-between">
                <span className={`text-[11px] px-2.5 py-1 rounded-full font-bold uppercase tracking-wider ${STATUS_CLASSES[booking.status] ?? 'bg-bg-surface2 text-text-muted'}`}>
                  {booking.status}
                </span>
                {booking.cancelledAt && (
                  <p className="text-xs text-text-muted">
                    Cancelled {new Date(booking.cancelledAt).toLocaleDateString('en-IN')}
                  </p>
                )}
              </div>

              {/* Show Info */}
              <section className="rounded-xl border border-border-default bg-bg-surface p-4 space-y-2">
                <h3 className="text-xs font-semibold text-text-muted uppercase tracking-wide mb-2">Show</h3>
                <p className="text-sm font-semibold text-text-primary">{booking.movieOrEventTitle}</p>
                <p className="text-xs text-text-secondary">{booking.venueName} · {booking.screenName}</p>
                <p className="text-xs text-text-muted">
                  {new Date(booking.showDatetime).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}
                </p>
              </section>

              {/* Customer Info */}
              <section className="rounded-xl border border-border-default bg-bg-surface p-4 space-y-1">
                <h3 className="text-xs font-semibold text-text-muted uppercase tracking-wide mb-2">Customer</h3>
                <p className="text-sm font-semibold text-text-primary">{booking.userName}</p>
                <p className="text-xs text-text-secondary">{booking.userEmail}</p>
              </section>

              {/* Seats */}
              <section className="rounded-xl border border-border-default bg-bg-surface p-4">
                <h3 className="text-xs font-semibold text-text-muted uppercase tracking-wide mb-2">
                  Seats ({booking.ticketQty})
                </h3>
                <div className="flex flex-wrap gap-1.5">
                  {booking.seats.map((seat) => (
                    <span key={seat} className="text-[11px] px-2 py-0.5 rounded bg-bg-surface2 border border-border-default font-mono text-text-primary">
                      {seat}
                    </span>
                  ))}
                </div>
              </section>

              {/* Pricing */}
              <section className="rounded-xl border border-border-default bg-bg-surface p-4 space-y-2">
                <h3 className="text-xs font-semibold text-text-muted uppercase tracking-wide mb-2">Pricing</h3>
                <div className="space-y-1.5 text-sm">
                  <div className="flex justify-between text-text-secondary">
                    <span>Ticket Amount</span>
                    <span>{fmt(booking.ticketAmount)}</span>
                  </div>
                  <div className="flex justify-between text-text-secondary">
                    <span>Convenience Fee</span>
                    <span>{fmt(booking.convenienceFee)}</span>
                  </div>
                  {booking.discount > 0 && (
                    <div className="flex justify-between text-semantic-success">
                      <span>Discount</span>
                      <span>-{fmt(booking.discount)}</span>
                    </div>
                  )}
                  <div className="flex justify-between font-bold text-text-primary border-t border-border-default pt-2 mt-1">
                    <span>Total Paid</span>
                    <span>{fmt(booking.amountPaid)}</span>
                  </div>
                </div>
              </section>

              {/* Timestamps */}
              <p className="text-xs text-text-muted text-center">
                Booked on {new Date(booking.createdAt).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}
              </p>
            </>
          )}
        </div>

        {/* Footer */}
        {booking && booking.status === 'Confirmed' && (
          <div className="px-5 py-4 border-t border-border-default flex-shrink-0">
            <button
              onClick={() => setShowCancel(true)}
              className="w-full px-4 py-2.5 rounded-lg border border-semantic-error/40 text-semantic-error text-sm font-semibold hover:bg-semantic-error/08 transition-colors"
            >
              Cancel Booking
            </button>
          </div>
        )}
      </aside>

      {showCancel && booking && (
        <CancelConfirmModal
          bookingRef={booking.bookingRef}
          onClose={() => setShowCancel(false)}
          onDone={() => refetch()}
        />
      )}
    </>
  );
}
