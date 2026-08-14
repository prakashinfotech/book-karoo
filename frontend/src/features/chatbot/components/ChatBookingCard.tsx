import type { ChatbotBookingCard } from '../types';

interface Props {
  card: ChatbotBookingCard;
}

export function ChatBookingCard({ card }: Props) {
  return (
    <div className="flex gap-3 bg-white border border-gray-200 rounded-xl p-3 min-w-[260px] max-w-[280px] flex-shrink-0 snap-start shadow-sm">
      {card.posterUrl && (
        <img
          src={card.posterUrl}
          alt={card.title}
          className="w-12 h-16 object-cover rounded-lg flex-shrink-0"
        />
      )}
      <div className="flex flex-col gap-1 min-w-0">
        <p className="text-[#2B3148] font-semibold text-sm leading-tight line-clamp-2">
          {card.title}
        </p>
        <p className="text-[#6C7480] text-xs">
          {card.showDate} · {card.showTime}
        </p>
        <p className="text-[#6C7480] text-xs line-clamp-1">{card.venueName}</p>
        <p className="text-[#6C7480] text-xs">
          {card.ticketQty} ticket{card.ticketQty !== 1 ? 's' : ''} · ₹{card.amountPaid.toLocaleString('en-IN')}
        </p>
        <p className="text-xs text-[#9097A6] font-mono">{card.bookingRef}</p>
        <a
          href="/profile/bookings"
          className="mt-auto inline-block bg-[#2B3148] text-white text-xs font-semibold px-3 py-1 rounded-full text-center hover:bg-[#1a1f30] transition-colors"
        >
          View Booking
        </a>
      </div>
    </div>
  );
}
