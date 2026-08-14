import { cn } from '@/shared/lib/utils';
import type { SeatCategory } from '../types';

interface Props {
  selectedSeats:    string[];
  getCategory:      (label: string) => SeatCategory | undefined;
  onPay:            () => void;
  onDeselect:       (label: string) => void;
  convFeePerTicket: number;
  gstRate:          number;
}

export function SeatBottomBar({ selectedSeats, getCategory, onPay, onDeselect, convFeePerTicket, gstRate }: Props) {
  if (selectedSeats.length === 0) {
    return (
      <div className="fixed bottom-0 left-0 right-0 z-50 p-4 bg-bg-surface/95 backdrop-blur-md border-t border-border-default lg:hidden">
        <p className="text-center text-text-muted text-sm font-sans">Select seats to continue</p>
      </div>
    );
  }

  const ticketTotal = selectedSeats.reduce((sum, label) => sum + (getCategory(label)?.price ?? 0), 0);
  const convFee     = selectedSeats.length * convFeePerTicket;
  const gst         = Math.round(convFee * gstRate);
  const grand       = ticketTotal + convFee + gst;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 p-4 bg-bg-surface/95 backdrop-blur-md border-t border-border-default lg:hidden">
      {/* Seat chips */}
      <div className="flex flex-wrap gap-1.5 mb-3">
        {selectedSeats.map((label) => (
          <span
            key={label}
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-accent-crimson/20 border border-accent-crimson/40 text-[11px] font-semibold font-mono text-accent-crimson"
          >
            {label}
            <button
              onClick={() => onDeselect(label)}
              className="ml-0.5 hover:text-white"
              aria-label={`Remove seat ${label}`}
            >
              ×
            </button>
          </span>
        ))}
      </div>

      <div className="flex items-end justify-between gap-3">
        <div>
          <p className="text-[11px] text-text-muted font-sans">
            {selectedSeats.length} seat{selectedSeats.length !== 1 ? 's' : ''} selected
          </p>
          <p className="text-xl font-bold text-text-primary font-display">₹{grand}</p>
          <p className="text-[10px] text-text-muted font-sans">incl. ₹{convFee + gst} fees & GST</p>
        </div>

        <button
          onClick={onPay}
          className={cn(
            'px-6 py-3 rounded-xl font-semibold text-sm font-sans transition-all',
            'bg-gradient-to-r from-accent-crimson-light to-accent-crimson text-white',
            'shadow-[0_10px_40px_-10px_rgba(225, 29, 116,0.55)] hover:-translate-y-0.5'
          )}
        >
          Pay Now →
        </button>
      </div>
    </div>
  );
}
