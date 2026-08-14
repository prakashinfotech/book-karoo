import { cn } from '@/shared/lib/utils';
import type { ShowtimeVenueGroup, ShowtimeItem } from '../types';

interface Props {
  venue:          ShowtimeVenueGroup;
  selectedShowId: string | null;
  onSelectShow:   (showId: string) => void;
  selectedDate:   string; // ISO yyyy-MM-dd
}

// Returns true if the show time on the given date is already in the past.
function isShowPast(isoDate: string, time: string): boolean {
  try {
    const [timePart, meridiem] = time.trim().split(' ');
    const [hStr, mStr] = timePart.split(':');
    let h = parseInt(hStr, 10);
    const m = parseInt(mStr, 10);
    if (meridiem?.toUpperCase() === 'PM' && h !== 12) h += 12;
    if (meridiem?.toUpperCase() === 'AM' && h === 12) h = 0;
    const showDt = new Date(isoDate);
    showDt.setHours(h, m, 0, 0);
    return showDt < new Date();
  } catch {
    return false;
  }
}

const AMENITY_ICONS: Record<string, string> = {
  Parking:           '🅿',
  'Food Court':      '🍿',
  'M-Ticket':        '📱',
  'Wheelchair Access': '♿',
  Accessible:        '♿',
  Recliner:          '🛋',
  'Dolby Atmos':     '🎵',
  Dolby:             '🔊',
  IMAX:              '🎬',
  '4DX':             '🌀',
};

const AVAIL_CLASSES: Record<ShowtimeItem['availability'], string> = {
  green:    'bg-emerald-500/10 border-emerald-500/40 text-emerald-400',
  orange:   'bg-amber-500/10  border-amber-500/40  text-amber-400',
  red:      'bg-rose-500/10   border-rose-500/40   text-rose-400',
  sold_out: 'bg-bg-surface3  border-border-default text-text-muted cursor-not-allowed opacity-50',
};

export function ShowtimeVenueCard({ venue, selectedShowId, onSelectShow, selectedDate }: Props) {
  const lowestPrice = venue.shows.length
    ? Math.min(...venue.shows.map((s) => s.lowestPrice))
    : 0;

  return (
    <div className="p-5 rounded-xl bg-bg-surface border border-border-default hover:border-border-strong transition-colors duration-150 mb-3">
      {/* Venue header */}
      <div className="flex items-start justify-between gap-3 mb-4">
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-accent-indigo to-accent-purple flex items-center justify-center text-sm flex-shrink-0">
            🎬
          </div>
          <div>
            <h3 className="font-semibold text-text-primary text-base leading-snug">{venue.venueName}</h3>
            <div className="flex gap-2 items-center text-xs text-text-muted font-sans mt-0.5 flex-wrap">
              {venue.venueArea && <span>{venue.venueArea}</span>}
              {venue.distance  && <><span>·</span><span className="font-medium text-text-secondary">{venue.distance}</span></>}
              <span>·</span>
              <span>from <strong className="text-emerald-400">₹{lowestPrice}</strong></span>
            </div>

            {/* Amenity pills */}
            {venue.amenities.length > 0 && (
              <div className="flex gap-1.5 flex-wrap mt-2">
                {venue.amenities.map((a) => (
                  <span
                    key={a}
                    className="text-[10px] px-2 py-0.5 rounded-full bg-bg-surface2 border border-border-default text-text-secondary font-sans"
                  >
                    {AMENITY_ICONS[a] ?? '·'} {a}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Time chips */}
      <div className="flex flex-wrap gap-2">
        {venue.shows.map((show) => {
          const isSold     = show.availability === 'sold_out';
          const isPast     = isShowPast(selectedDate, show.time);
          const isDisabled = isSold || isPast;
          const isSelected = show.showId === selectedShowId;
          return (
            <button
              key={show.showId}
              disabled={isDisabled}
              onClick={() => !isDisabled && onSelectShow(show.showId)}
              title={isPast ? 'This show has already started' : undefined}
              className={cn(
                'flex flex-col gap-0.5 text-left px-3.5 py-2 rounded-lg border-2 transition-all duration-150',
                isSelected
                  ? 'border-accent-crimson bg-accent-crimson/10 text-accent-crimson shadow-[0_0_0_2px_rgba(225, 29, 116,0.25)] scale-105'
                  : isPast
                    ? 'bg-bg-surface3 border-border-default text-text-muted cursor-not-allowed opacity-40'
                    : [AVAIL_CLASSES[show.availability], !isSold && 'hover:scale-105'],
              )}
            >
              <span className={cn('font-bold text-sm font-mono', isDisabled && 'line-through')}>
                {show.time}
              </span>
              <span className={cn('text-[10px]', isSelected ? 'opacity-90 font-semibold' : 'opacity-70')}>
                {isPast ? 'Show ended' : `${show.format} · ${show.language}`}
              </span>
              {isSelected && (
                <span className="text-[9px] font-bold uppercase tracking-wider mt-0.5 text-accent-crimson">
                  Selected ✓
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
