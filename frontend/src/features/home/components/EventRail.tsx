import { Link } from 'react-router-dom';
import { Skeleton } from '@/shared/components/ui/Skeleton';
import { EventCard } from '@/features/events/components/EventCard';
import type { EventListItem } from '@/features/events/types';

interface EventRailProps {
  title:       string;
  eyebrow?:    string;
  events?:     EventListItem[];
  isLoading?:  boolean;
  seeAllHref?: string;
  seeAllLabel?: string;
}

export function EventRail({
  title, eyebrow, events, isLoading,
  seeAllHref, seeAllLabel = 'See all →',
}: EventRailProps) {
  if (!isLoading && (!events || events.length === 0)) return null;

  return (
    <section className="mb-16">
      <div className="flex items-end justify-between mb-5">
        <div>
          {eyebrow && (
            <p className="text-[11px] font-semibold text-text-muted tracking-widest uppercase font-sans mb-1">
              {eyebrow}
            </p>
          )}
          <h2 className="font-display font-semibold text-2xl md:text-3xl text-text-primary tracking-tight">
            {title}
          </h2>
        </div>
        {seeAllHref && (
          <Link
            to={seeAllHref}
            className="text-sm font-medium text-text-secondary hover:text-text-primary transition-colors font-sans"
          >
            {seeAllLabel}
          </Link>
        )}
      </div>

      <div className="grid grid-flow-col auto-cols-[160px] md:auto-cols-[185px] gap-4 overflow-x-auto pb-2 scroll-smooth [scrollbar-width:thin]">
        {isLoading
          ? Array.from({ length: 6 }, (_, i) => (
              <div key={i} className="space-y-2">
                <Skeleton className="aspect-[3/4] rounded-lg" />
                <Skeleton width="80%" height={14} />
                <Skeleton width="55%" height={11} />
              </div>
            ))
          : events?.map((e) => (
              <EventCard key={e.id} event={e} size="sm" />
            ))}
      </div>
    </section>
  );
}
