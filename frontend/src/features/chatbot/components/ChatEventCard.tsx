import type { ChatbotEventCard } from '../types';

interface Props {
  card: ChatbotEventCard;
}

export function ChatEventCard({ card }: Props) {
  return (
    <div className="flex flex-col gap-2 bg-white border border-gray-200 rounded-xl p-3 min-w-[220px] max-w-[240px] flex-shrink-0 snap-start shadow-sm">
      {card.posterUrl && (
        <img
          src={card.posterUrl}
          alt={card.title}
          className="w-full h-28 object-cover rounded-lg"
        />
      )}
      <div className="flex flex-col gap-1">
        <p className="text-[#2B3148] font-semibold text-sm leading-tight line-clamp-2">
          {card.title}
        </p>
        <p className="text-accent-indigo text-xs font-medium capitalize">
          {card.type.replace('_', ' ')}
        </p>
        {card.eventDateLabel && (
          <p className="text-[#6C7480] text-xs">
            {card.eventDateLabel}
            {card.eventTimeLabel && ` · ${card.eventTimeLabel}`}
          </p>
        )}
        {card.venueName && (
          <p className="text-[#6C7480] text-xs line-clamp-1">{card.venueName}</p>
        )}
        <a
          href={`/events/${card.slug}`}
          className="mt-1 inline-block bg-accent-indigo text-white text-xs font-semibold px-3 py-1 rounded-full text-center hover:opacity-90 transition-opacity"
        >
          View Event
        </a>
      </div>
    </div>
  );
}
