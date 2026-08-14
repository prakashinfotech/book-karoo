import type { ChatbotShowCard } from '../types';

const availabilityLabel: Record<ChatbotShowCard['availability'], string> = {
  green:    'Available',
  orange:   'Filling Fast',
  red:      'Almost Full',
  sold_out: 'Sold Out',
};

const availabilityClass: Record<ChatbotShowCard['availability'], string> = {
  green:    'text-green-600',
  orange:   'text-amber-600',
  red:      'text-red-600',
  sold_out: 'text-gray-400 line-through',
};

interface Props {
  card: ChatbotShowCard;
}

export function ChatShowCard({ card }: Props) {
  const showtimesUrl = `/movies/${card.movieSlug}/showtimes`;

  return (
    <div className="flex gap-3 bg-white border border-gray-200 rounded-xl p-3 min-w-[260px] max-w-[280px] flex-shrink-0 snap-start shadow-sm">
      {card.posterUrl && (
        <img
          src={card.posterUrl}
          alt={card.movieTitle}
          className="w-14 h-20 object-cover rounded-lg flex-shrink-0"
        />
      )}
      <div className="flex flex-col gap-1 min-w-0">
        <p className="text-[#2B3148] font-semibold text-sm leading-tight line-clamp-2">
          {card.movieTitle}
        </p>
        <p className="text-[#6C7480] text-xs">
          {card.format} · {card.language}
        </p>
        <p className="text-[#2B3148] text-xs font-medium">
          {card.showTime} · {card.showDate}
        </p>
        <p className="text-[#6C7480] text-xs line-clamp-1">
          {card.venueName}
        </p>
        <p className={`text-xs font-medium ${availabilityClass[card.availability]}`}>
          {availabilityLabel[card.availability]}
        </p>
        <a
          href={showtimesUrl}
          className="mt-auto inline-block bg-accent-crimson text-white text-xs font-semibold px-3 py-1 rounded-full text-center hover:opacity-90 transition-opacity"
        >
          Book Tickets
        </a>
      </div>
    </div>
  );
}
