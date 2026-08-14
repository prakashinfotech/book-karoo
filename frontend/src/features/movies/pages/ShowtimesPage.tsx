import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { cn } from '@/shared/lib/utils';
import { PublicLayout } from '@/shared/components/layout/PublicLayout';
import { Badge } from '@/shared/components/ui/Badge';
import { Skeleton } from '@/shared/components/ui/Skeleton';
import { useMovieDetail, useShowtimes } from '../api/useMovies';
import { ShowtimeVenueCard } from '../components/ShowtimeVenueCard';
import { useCityStore } from '@/shared/store/cityStore';
import { ROUTES, TMDB_POSTER } from '@/shared/constants';

// ── Date strip helpers ────────────────────────────────────────────────────────

function buildDates() {
  const base = new Date();
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(base);
    d.setDate(base.getDate() + i);
    const days   = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
    const months = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
    return {
      label:   days[d.getDay()],
      day:     d.getDate(),
      month:   months[d.getMonth()],
      isoDate: d.toISOString().split('T')[0],
    };
  });
}

const DATES = buildDates();

const AVAIL_LEGEND = [
  { color: '#10B981', label: 'Available'    },
  { color: '#F59E0B', label: 'Filling Fast' },
  { color: '#F43F5E', label: 'Almost Full'  },
  { color: '#71717A', label: 'Sold Out'     },
] as const;

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ShowtimesPage() {
  const { slug = '' }      = useParams();
  const { selectedCity }   = useCityStore();
  const cityId             = selectedCity?.id ?? '';

  const [dateIdx,         setDateIdx]         = useState(0);
  const [selectedShowId,  setSelectedShowId]  = useState<string | null>(null);

  const { data: movie, isLoading: movieLoading } = useMovieDetail(slug);
  const { data, isLoading: showsLoading } = useShowtimes(
    movie?.id ?? '',
    cityId,
    DATES[dateIdx].isoDate
  );

  const venues = data?.venues ?? [];

  const posterUrl = movie?.posterUrl ? TMDB_POSTER(movie.posterUrl) : null;

  function handleSelectShow(showId: string) {
    setSelectedShowId(showId);
  }

  return (
    <PublicLayout>
      <div className="max-w-[1280px] mx-auto px-4 sm:px-6 pb-24 lg:pb-20">

        {/* Movie mini-header */}
        <header className="flex gap-4 items-center py-6 mb-2">
          <div className="w-14 aspect-[2/3] rounded-lg overflow-hidden bg-bg-surface2 flex-shrink-0">
            {posterUrl
              ? <img src={posterUrl} alt={movie?.title} className="w-full h-full object-cover" />
              : <div className="w-full h-full bg-gradient-to-br from-bg-surface2 to-bg-surface3" />}
          </div>
          <div>
            <p className="text-[11px] font-semibold text-text-muted tracking-widest uppercase font-sans mb-1">Showtimes</p>
            {movieLoading
              ? <Skeleton height={32} width={240} />
              : <h1 className="font-display font-bold text-2xl md:text-3xl tracking-tight">{movie?.title}</h1>}
            <div className="flex gap-2 mt-2 flex-wrap">
              {movie?.imdbRating && <Badge color="warning">⭐ {movie.imdbRating}</Badge>}
              {movie?.genres?.slice(0, 2).map((g) => <Badge key={g}>{g}</Badge>)}
              {movie?.certificate && <Badge>{movie.certificate}</Badge>}
            </div>
          </div>
        </header>

        {/* Date strip (sticky) — top-16 on mobile (no category strip), top-[105px] on desktop */}
        <div className="sticky top-16 md:top-[105px] z-20 -mx-4 sm:-mx-6 px-4 sm:px-6 pb-3 bg-bg-surface/95 backdrop-blur-md border-b border-border-default mb-6">
          <div className="flex gap-2 overflow-x-auto pt-3 pb-1 [scrollbar-width:none]">
            {DATES.map((d, i) => (
              <button
                key={d.isoDate}
                onClick={() => { setDateIdx(i); setSelectedShowId(null); }}
                style={dateIdx === i ? { background: 'rgb(235, 78, 98)' } : undefined}
                className={cn(
                  'flex-shrink-0 w-[68px] py-2.5 rounded-lg text-center transition-all duration-150 font-sans',
                  dateIdx === i
                    ? 'text-white'
                    : 'bg-bg-surface border border-border-default text-text-secondary hover:border-accent-crimson/50 hover:text-text-primary'
                )}
              >
                <div className={cn('text-[10px] font-semibold tracking-wider', dateIdx === i ? 'text-white' : 'text-text-muted')}>{d.label}</div>
                <div className={cn('font-display font-bold text-[22px] leading-tight', dateIdx === i ? 'text-white' : 'text-text-primary')}>{d.day}</div>
                <div className={cn('text-[10px] font-medium tracking-wide', dateIdx === i ? 'text-white' : 'text-text-muted')}>{d.month}</div>
              </button>
            ))}
          </div>
        </div>

        {/* No city selected */}
        {!cityId && (
          <div className="rounded-xl bg-bg-surface border border-border-default p-8 text-center mb-6">
            <p className="text-text-secondary font-sans mb-3">Select a city to see showtimes near you.</p>
          </div>
        )}

        {/* Legend */}
        {cityId && (
          <div className="flex gap-4 flex-wrap mb-5 p-4 rounded-xl bg-bg-surface border border-border-default text-xs font-sans">
            {AVAIL_LEGEND.map(({ color, label }) => (
              <span key={label} className="flex items-center gap-1.5 text-text-secondary">
                <span className="w-2.5 h-2.5 rounded-sm inline-block" style={{ background: color }} />
                {label}
              </span>
            ))}
          </div>
        )}

        {/* Mobile sticky CTA */}
        {selectedShowId && (
          <div className="fixed bottom-0 left-0 right-0 z-50 p-4 bg-bg-surface/95 backdrop-blur-md border-t border-border-default lg:hidden">
            <Link to={ROUTES.SEAT_SELECTION(selectedShowId)}>
              <button className="w-full py-3.5 rounded-full bg-gradient-to-r from-accent-crimson-light to-accent-crimson text-white font-semibold text-base font-sans shadow-[0_10px_40px_-10px_rgba(225, 29, 116,0.55)]">
                Choose Seats →
              </button>
            </Link>
          </div>
        )}

        {/* Content + sidebar */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-6">
          <div>
            {showsLoading ? (
              Array.from({ length: 3 }, (_, i) => <Skeleton key={i} height={180} className="rounded-xl mb-3" />)
            ) : venues.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-center rounded-xl bg-bg-surface border border-border-default">
                <span className="text-4xl mb-3">🎭</span>
                <p className="text-text-secondary font-sans">
                  {cityId
                    ? `No shows on ${DATES[dateIdx].label} in ${selectedCity?.name ?? 'this city'}.`
                    : 'Select a city to see showtimes.'}
                </p>
                <p className="text-text-muted text-sm mt-1 font-sans">Try another date or change your city.</p>
              </div>
            ) : (
              <>
                <p className="text-xs text-text-muted font-sans mb-4">
                  {venues.length} cinema{venues.length === 1 ? '' : 's'} showing this film
                  {selectedCity?.name ? ` in ${selectedCity.name}` : ''}
                </p>
                {venues.map((vg) => (
                  <ShowtimeVenueCard
                    key={vg.venueId}
                    venue={vg}
                    selectedShowId={selectedShowId}
                    onSelectShow={handleSelectShow}
                    selectedDate={DATES[dateIdx].isoDate}
                  />
                ))}

                {/* Mobile: inline Choose Seats panel (shown after selecting a show) */}
                {selectedShowId && (
                  <div className="lg:hidden mt-4 p-4 rounded-xl border-2 border-accent-crimson/25 bg-accent-crimson/5">
                    <p className="text-sm font-semibold text-text-primary font-sans mb-3">🎟 Show selected — ready to pick seats?</p>
                    <Link to={ROUTES.SEAT_SELECTION(selectedShowId)}>
                      <button className="w-full py-3.5 rounded-full bg-gradient-to-r from-accent-crimson-light to-accent-crimson text-white font-semibold text-base font-sans shadow-[0_10px_40px_-10px_rgba(225, 29, 116,0.45)]">
                        Choose Seats →
                      </button>
                    </Link>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Sticky sidebar */}
          <aside className="hidden lg:block">
            <div className="sticky top-28 p-5 rounded-xl bg-bg-surface border border-border-default">
              <h4 className="font-semibold text-sm mb-4 font-sans">Your selection</h4>
              {!selectedShowId ? (
                <p className="text-text-muted text-sm text-center py-6 font-sans">Tap a showtime to continue.</p>
              ) : (
                <div className="space-y-3">
                  <p className="text-sm text-text-secondary font-sans">Show selected ✓</p>
                  <Link to={ROUTES.SEAT_SELECTION(selectedShowId)}>
                    <button className="w-full py-3 rounded-full bg-gradient-to-r from-accent-crimson-light to-accent-crimson text-white font-semibold text-sm font-sans shadow-[0_10px_40px_-10px_rgba(225, 29, 116,0.55)]">
                      Choose Seats →
                    </button>
                  </Link>
                </div>
              )}
            </div>

            <div className="mt-4 p-5 rounded-xl bg-bg-surface border border-border-default">
              <h4 className="font-semibold text-xs text-text-muted uppercase tracking-wider mb-3 font-sans">Why BookKaroo</h4>
              <ul className="text-sm text-text-muted font-sans space-y-2">
                <li>✓ Reserved seats · No queue</li>
                <li>✓ Free reschedule (4h before)</li>
                <li>✓ Instant M-Tickets</li>
                <li>✓ IMAX & Dolby certified</li>
              </ul>
            </div>
          </aside>
        </div>
      </div>
    </PublicLayout>
  );
}
