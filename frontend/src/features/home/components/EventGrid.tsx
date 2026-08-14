import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ROUTES } from '@/shared/constants';
import { Skeleton } from '@/shared/components/ui/Skeleton';
import { cn } from '@/shared/lib/utils';

interface EventData {
  id: string;
  title: string;
  subtitle: string;
  type: string;
  emoji: string;
  gradient: string;
  price: string;
  date: string;
  href: string;
}

// Seed data used as fallback while API loads
const FALLBACK_EVENTS: EventData[] = [
  {
    id: 'e1', title: 'Amit Trivedi Live', subtitle: 'Sabarmati Riverfront, Ahmedabad',
    type: 'Concert', emoji: '🎵', gradient: 'linear-gradient(135deg, #1a0a2e, #4c1d95)',
    price: '₹999 onwards', date: 'Sat, 17 May', href: ROUTES.EVENTS,
  },
  {
    id: 'e2', title: 'Zakir Khan: Sunata Hai Kya', subtitle: 'Tagore Hall, Ahmedabad',
    type: 'Comedy', emoji: '🎤', gradient: 'linear-gradient(135deg, #0a2a1a, #064e3b)',
    price: '₹699 onwards', date: 'Sun, 18 May', href: ROUTES.EVENTS,
  },
  {
    id: 'e3', title: 'Broadway Nights: Chicago', subtitle: 'Natarani Amphitheatre',
    type: 'Theatre', emoji: '🎭', gradient: 'linear-gradient(135deg, #3a0a2a, #831843)',
    price: '₹1,200 onwards', date: 'Fri, 23 May', href: ROUTES.PLAYS,
  },
];

function EventCard({ evt }: { evt: EventData }) {
  const [hovered, setHovered] = useState(false);
  return (
    <Link
      to={evt.href}
      className={cn('block rounded-xl overflow-hidden bg-bg-surface border transition-all duration-[220ms]', hovered ? 'border-border-strong -translate-y-1' : 'border-border-default')}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div className="aspect-[4/3] relative flex items-center justify-center" style={{ background: evt.gradient }}>
        <span className="text-5xl">{evt.emoji}</span>
        <div className="absolute top-3 left-3 px-2.5 py-1 rounded-full bg-accent-indigo/85 text-white text-[11px] font-semibold font-sans">
          {evt.type}
        </div>
      </div>
      <div className="p-4">
        <h4 className="font-semibold text-base text-text-primary">{evt.title}</h4>
        <p className="text-xs text-text-muted mt-1">{evt.subtitle}</p>
        <div className="flex justify-between mt-3 text-xs font-sans">
          <span className="text-text-secondary">{evt.date}</span>
          <span className="text-semantic-success font-semibold">{evt.price}</span>
        </div>
      </div>
    </Link>
  );
}

interface EventGridProps {
  isLoading?: boolean;
}

export function EventGrid({ isLoading }: EventGridProps) {
  return (
    <section className="mb-16">
      <div className="flex items-end justify-between mb-5">
        <h2 className="font-display font-semibold text-2xl md:text-3xl text-text-primary tracking-tight">
          Live Events & Concerts
        </h2>
        <Link to={ROUTES.EVENTS} className="text-sm font-medium text-text-secondary hover:text-text-primary transition-colors font-sans">
          All events →
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {isLoading
          ? Array.from({ length: 3 }, (_, i) => (
              <div key={i} className="rounded-xl overflow-hidden">
                <Skeleton className="aspect-[4/3] rounded-none" />
                <div className="p-4 space-y-2">
                  <Skeleton height={16} width="80%" />
                  <Skeleton height={12} width="55%" />
                </div>
              </div>
            ))
          : FALLBACK_EVENTS.map((evt) => <EventCard key={evt.id} evt={evt} />)
        }
      </div>
    </section>
  );
}
