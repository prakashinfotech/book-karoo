import type { ChatMessage as ChatMsg } from '../types';
import { ChatShowCard } from './ChatShowCard';
import { ChatEventCard } from './ChatEventCard';
import { ChatBookingCard } from './ChatBookingCard';

function getLinkLabel(url: string): string {
  if (url.includes('/profile/bookings')) return 'View All Bookings';
  if (url.includes('/movies'))           return 'Browse Movies';
  if (url.includes('/events'))           return 'Browse Events';
  if (url.includes('/ipl'))              return 'View IPL Schedule';
  if (url.includes('/search'))           return 'See Search Results';
  return 'Go there';
}

interface Props {
  msg: ChatMsg;
}

export function ChatMessageBubble({ msg }: Props) {
  const isUser = msg.role === 'user';

  const hasCards =
    (msg.shows && msg.shows.length > 0) ||
    (msg.events && msg.events.length > 0) ||
    (msg.bookings && msg.bookings.length > 0);

  return (
    <div className={`flex flex-col gap-2 ${isUser ? 'items-end' : 'items-start'}`}>
      <div
        className={`max-w-[85%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap ${
          isUser
            ? 'bg-accent-crimson text-white rounded-br-sm'
            : 'bg-white text-[#2B3148] rounded-bl-sm shadow-sm border border-gray-100'
        }`}
      >
        {msg.content}
      </div>

      {!isUser && hasCards && (
        <div className="w-full overflow-x-auto pb-1 snap-x snap-mandatory">
          <div className="flex gap-3 px-1">
            {msg.shows?.map((card) => (
              <ChatShowCard key={card.showId} card={card} />
            ))}
            {msg.events?.map((card) => (
              <ChatEventCard key={card.eventId} card={card} />
            ))}
            {msg.bookings?.map((card) => (
              <ChatBookingCard key={card.bookingRef} card={card} />
            ))}
          </div>
        </div>
      )}

      {!isUser && msg.actionType === 'navigate' && msg.actionUrl && (
        <a
          href={msg.actionUrl}
          className="self-start inline-flex items-center gap-1.5 text-xs font-semibold text-accent-indigo border border-accent-indigo/30 rounded-full px-3 py-1 hover:bg-accent-indigo/5 transition-colors"
        >
          {getLinkLabel(msg.actionUrl)} →
        </a>
      )}
    </div>
  );
}

export function TypingIndicator() {
  return (
    <div className="flex items-start">
      <div className="bg-white border border-gray-100 shadow-sm px-4 py-3 rounded-2xl rounded-bl-sm flex gap-1.5 items-center">
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className="w-1.5 h-1.5 rounded-full bg-gray-400 animate-bounce"
            style={{ animationDelay: `${i * 150}ms` }}
          />
        ))}
      </div>
    </div>
  );
}
