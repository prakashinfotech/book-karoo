import { AlertTriangle } from 'lucide-react';
import { Modal } from '@/shared/components/ui/Modal';
import { Button } from '@/shared/components/ui/Button';
import { formatCurrency } from '@/shared/lib/utils';
import type { BookingListItem } from '@/features/booking/types';

interface CancelConfirmModalProps {
  booking:   BookingListItem;
  isPending: boolean;
  onConfirm: () => void;
  onClose:   () => void;
}

export function CancelConfirmModal({ booking, isPending, onConfirm, onClose }: CancelConfirmModalProps) {
  // Use exact values from backend — no estimation needed
  const nonRefundable = booking.nonRefundableAmount;
  const ticketAmount  = booking.ticketAmount;
  const discount      = booking.discount;
  const refundAmount  = Math.max(0, ticketAmount - discount);

  const seatLabels = booking.seats.map(s => s.label).join(', ');

  return (
    <Modal
      open
      onClose={onClose}
      maxWidth="max-w-sm"
      title={
        <span className="flex items-center gap-2 text-semantic-error">
          <AlertTriangle size={18} />
          Cancel Booking?
        </span>
      }
    >
      {/* Booking summary */}
      <div className="p-3 rounded-lg bg-bg-surface2 border border-border-default mb-4">
        <p className="font-semibold text-sm text-text-primary font-sans line-clamp-1">{booking.title}</p>
        <p className="text-xs text-text-muted font-sans mt-0.5">
          {booking.showDate} · {booking.showTime}
        </p>
        <p className="text-xs text-text-muted font-sans">{booking.venueName}</p>
        {seatLabels && (
          <p className="text-xs font-mono text-text-muted mt-1">{seatLabels}</p>
        )}
      </div>

      {/* Refund breakdown */}
      <div className="space-y-2 mb-4">
        <div className="flex justify-between text-sm font-sans">
          <span className="text-text-secondary">Ticket amount</span>
          <span className="text-text-primary">{formatCurrency(ticketAmount)}</span>
        </div>
        {discount > 0 && (
          <div className="flex justify-between text-sm font-sans">
            <span className="text-text-secondary">Coupon discount</span>
            <span className="text-semantic-success">- {formatCurrency(discount)}</span>
          </div>
        )}
        <div className="flex justify-between text-sm font-sans">
          <span className="text-text-secondary">Convenience fee + GST (non-refundable)</span>
          <span className="text-semantic-error">- {formatCurrency(nonRefundable)}</span>
        </div>
        <div className="border-t border-border-default my-1" />
        <div className="flex justify-between font-sans">
          <span className="text-sm font-semibold text-text-primary">Estimated refund</span>
          <span className="text-base font-bold text-semantic-success">{formatCurrency(refundAmount)}</span>
        </div>
      </div>

      {/* Warning */}
      <div className="flex gap-2 p-3 rounded-lg bg-semantic-warning/08 border border-semantic-warning/25 mb-5">
        <AlertTriangle size={14} className="text-semantic-warning flex-shrink-0 mt-0.5" />
        <div className="text-xs text-text-secondary font-sans">
          <p>Refunds are processed in 7 business days.</p>
          <p className="mt-0.5 text-semantic-error">This action cannot be undone.</p>
        </div>
      </div>

      {/* Buttons */}
      <div className="flex flex-col gap-2">
        <Button
          variant="destructive"
          fullWidth
          loading={isPending}
          onClick={onConfirm}
        >
          {isPending ? 'Cancelling...' : 'Yes, Cancel Booking'}
        </Button>
        <Button variant="ghost" fullWidth onClick={onClose} disabled={isPending}>
          Keep Booking
        </Button>
      </div>
    </Modal>
  );
}
