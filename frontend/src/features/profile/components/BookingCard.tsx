import { useNavigate } from 'react-router-dom';
import { Download, Eye } from 'lucide-react';
import { Button } from '@/shared/components/ui/Button';
import { TMDB_POSTER } from '@/shared/constants';
import { formatCurrency } from '@/shared/lib/utils';
import { downloadInvoicePdf } from '@/features/booking/api/useBooking';
import type { BookingListItem } from '@/features/booking/types';

const STATUS_STYLE: Record<string, { label: string; className: string }> = {
  Confirmed: { label: 'CONFIRMED', className: 'bg-semantic-success/12 text-[#6EE7B7] border border-semantic-success/28' },
  Completed: { label: 'COMPLETED', className: 'bg-bg-surface3 text-text-muted border border-border-default' },
  Cancelled: { label: 'CANCELLED', className: 'bg-accent-crimson/12 text-[#FF6770] border border-accent-crimson/25' },
  Refunded:  { label: 'REFUNDED',  className: 'bg-semantic-warning/12 text-[#FCD34D] border border-semantic-warning/28' },
  Pending:   { label: 'PENDING',   className: 'bg-bg-surface3 text-text-muted border border-border-default' },
};

interface BookingCardProps {
  booking:  BookingListItem;
  onCancel: (booking: BookingListItem) => void;
}

export function BookingCard({ booking, onCancel }: BookingCardProps) {
  const navigate = useNavigate();
  const style = STATUS_STYLE[booking.status] ?? STATUS_STYLE.Pending;

  const seatsByCategory = booking.seats.reduce<Record<string, string[]>>((acc, s) => {
    const cat = s.category || 'GENERAL';
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(s.label);
    return acc;
  }, {});

  function handleDownloadInvoice() {
    void downloadInvoicePdf(booking.bookingRef);
  }

  return (
    <div className="p-5 rounded-xl bg-bg-surface border border-border-default hover:border-border-strong transition-colors">
      <div className="flex gap-4 items-start">
        {/* Poster */}
        <div className="w-16 flex-shrink-0 aspect-[2/3] rounded-lg overflow-hidden bg-bg-surface2">
          {booking.posterUrl ? (
            <img
              src={TMDB_POSTER(booking.posterUrl, 'w185')}
              alt={booking.title}
              className="w-full h-full object-cover"
              loading="lazy"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-accent-indigo/40 to-accent-purple/40 flex items-center justify-center text-2xl font-display font-bold text-white">
              {booking.title.charAt(0)}
            </div>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {/* Title + status */}
          <div className="flex items-start justify-between gap-2 mb-1.5">
            <p className="font-display font-semibold text-base text-text-primary leading-snug line-clamp-1">
              {booking.title}
            </p>
            <span className={`flex-shrink-0 px-2.5 py-0.5 rounded-full text-[11px] font-semibold font-sans ${style.className}`}>
              {style.label}
            </span>
          </div>

          {/* Badges row */}
          <div className="flex items-center gap-1.5 mb-2 flex-wrap">
            {booking.certificate && (
              <span className="text-[10px] font-sans font-semibold px-1.5 py-0.5 rounded border border-border-default text-text-muted">
                {booking.certificate}
              </span>
            )}
            {booking.format && (
              <span className="text-[10px] font-sans font-semibold px-1.5 py-0.5 rounded bg-accent-indigo/12 text-[#A5B4FC]">
                {booking.format}
              </span>
            )}
            {booking.language && (
              <span className="text-[10px] font-sans text-text-muted">
                {booking.language}
              </span>
            )}
          </div>

          {/* Date + time */}
          <p className="text-sm text-text-secondary font-sans mb-0.5">
            {booking.showDate} · {booking.showTime}
          </p>

          {/* Venue + screen */}
          <p className="text-sm text-text-muted font-sans line-clamp-1 mb-1.5">
            {booking.venueName} · {booking.screenName}
          </p>

          {/* Seats / Tier info */}
          {booking.seats.length > 0
            ? Object.entries(seatsByCategory).map(([cat, labels]) => (
                <p key={cat} className="text-xs text-text-muted font-mono">
                  {cat.toUpperCase()} — {labels.join(', ')}
                </p>
              ))
            : booking.ticketQty > 0 && (
                <p className="text-xs text-text-muted font-sans">
                  {booking.screenName !== 'Screen' ? `${booking.screenName} · ` : ''}
                  {booking.ticketQty} ticket{booking.ticketQty !== 1 ? 's' : ''}
                </p>
              )
          }

          {/* Booking ref + amount row */}
          <div className="flex items-center justify-between mt-2 flex-wrap gap-2">
            <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-bg-surface2 text-text-muted border border-border-default">
              {booking.bookingRef}
            </span>
            <div className="text-right">
              <span className="font-display font-semibold text-base text-text-primary">
                {formatCurrency(booking.amountPaid)}
              </span>
              {booking.discount > 0 && (
                <span className="ml-2 text-[11px] text-semantic-success font-sans">
                  Saved {formatCurrency(booking.discount)}
                </span>
              )}
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex gap-2 mt-3 flex-wrap">
            <Button
              variant="primary"
              size="sm"
              onClick={() => navigate(`/booking/confirmed?ref=${booking.bookingRef}`)}
            >
              <Eye size={13} /> View Ticket
            </Button>

            <Button
              variant="ghost"
              size="sm"
              onClick={handleDownloadInvoice}
              title="Download GST Invoice"
            >
              <Download size={13} /> Invoice
            </Button>

            {booking.canCancel && (
              <Button
                variant="destructive"
                size="sm"
                onClick={() => onCancel(booking)}
              >
                Cancel Booking
              </Button>
            )}
          </div>

          {/* Refund info for cancelled */}
          {booking.status === 'Cancelled' && (
            <p className="text-[11px] text-text-muted font-sans mt-2">
              Refund processed · 7 business days
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
