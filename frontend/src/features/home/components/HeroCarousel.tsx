import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/shared/lib/utils';
import type { Movie } from '@/shared/types';
import { ROUTES, TMDB_BACKDROP } from '@/shared/constants';
import { Skeleton } from '@/shared/components/ui/Skeleton';

interface HeroCarouselProps {
  movies: Movie[];
  isLoading?: boolean;
}

export function HeroCarousel({ movies, isLoading }: HeroCarouselProps) {
  const [active, setActive] = useState(0);

  const go = useCallback((idx: number) => {
    setActive(idx);
  }, []);

  useEffect(() => {
    if (!movies.length) return;
    const id = setInterval(() => go((active + 1) % movies.length), 4500);
    return () => clearInterval(id);
  }, [active, go, movies.length]);

  if (isLoading) {
    return (
      <div className="mx-4 my-3">
        <Skeleton className="w-full h-[360px] md:h-[420px] rounded-xl" />
      </div>
    );
  }

  if (!movies.length) return null;

  const movie = movies[active];
  const backdropUrl = movie.backdropUrl ? TMDB_BACKDROP(movie.backdropUrl) : null;

  const goPrev = () => go((active - 1 + movies.length) % movies.length);
  const goNext = () => go((active + 1) % movies.length);

  return (
    /* ── Outer wrapper adds horizontal margin + rounded corners ────── */
    <div className="mx-4 md:mx-6 my-3">
      <section
        className="relative overflow-hidden rounded-xl h-[360px] md:h-[420px] bg-[#1a1a2e] select-none"
      >

        {/* ── Backdrop image — key=active triggers slide animation on change */}
        {backdropUrl ? (
          <img
            key={active}
            src={backdropUrl}
            alt={movie.title}
            className="absolute inset-0 w-full h-full object-cover"
            style={{ animation: 'slideInRight 0.45s ease-out forwards' }}
            loading="eager"
            onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-[#1a1a2e] to-[#2d1b4e] flex items-center justify-center">
            <span className="text-7xl opacity-30">🎬</span>
          </div>
        )}

        {/* ── Strong bottom gradient — ensures text is always readable ─ */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: 'linear-gradient(to top, rgba(0,0,0,0.92) 0%, rgba(0,0,0,0.65) 35%, rgba(0,0,0,0.20) 65%, transparent 100%)',
          }}
        />

        {/* ── Movie info — bottom-left, slides in with the image ──────── */}
        <div
          key={`info-${active}`}
          className="absolute bottom-0 left-0 right-0 px-5 md:px-8 pb-8"
          style={{ animation: 'slideInRight 0.5s ease-out forwards' }}
        >
          <div className="max-w-xl">
            {/* Meta line */}
            {(movie.certificate || movie.durationMin || movie.languages?.[0]) && (
              <p className="text-xs font-medium text-white/70 mb-2 tracking-wider uppercase">
                {[
                  movie.certificate,
                  movie.durationMin
                    ? `${Math.floor(movie.durationMin / 60)}h ${movie.durationMin % 60}m`
                    : null,
                  movie.languages?.[0],
                ].filter(Boolean).join('  ·  ')}
              </p>
            )}

            {/* Title — text-shadow for readability over any image */}
            <h2
              className="font-display font-bold text-2xl md:text-3xl text-white leading-tight mb-4 line-clamp-2"
              style={{ textShadow: '0 2px 8px rgba(0,0,0,0.6)' }}
            >
              {movie.title}
            </h2>

            <Link to={ROUTES.SHOWTIMES(movie.slug)}>
              <button
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  height: '40px',
                  padding: '0 20px',
                  borderRadius: '9999px',
                  background: '#E11D74',
                  color: '#FFFFFF',
                  fontSize: '14px',
                  fontWeight: 700,
                  border: 'none',
                  cursor: 'pointer',
                  boxShadow: '0 4px 14px rgba(225, 29, 116,0.45)',
                  transition: 'background 150ms ease',
                  letterSpacing: '0.01em',
                }}
                onMouseEnter={e => (e.currentTarget.style.background = '#B0165D')}
                onMouseLeave={e => (e.currentTarget.style.background = '#E11D74')}
              >
                🎟 Book Tickets
              </button>
            </Link>
          </div>
        </div>

        {/* ── LEFT arrow ─────────────────────────────────────────────── */}
        <button
          onClick={goPrev}
          aria-label="Previous slide"
          className={cn(
            'absolute left-3 top-1/2 -translate-y-1/2 z-10',
            'w-9 h-9 rounded-full',
            'bg-white/90 hover:bg-white',
            'shadow-md hover:shadow-lg',
            'flex items-center justify-center',
            'text-[#2B3148] hover:text-accent-crimson',
            'transition-all duration-150 hover:scale-110',
          )}
        >
          <ChevronLeft size={20} strokeWidth={2.5} />
        </button>

        {/* ── RIGHT arrow ────────────────────────────────────────────── */}
        <button
          onClick={goNext}
          aria-label="Next slide"
          className={cn(
            'absolute right-3 top-1/2 -translate-y-1/2 z-10',
            'w-9 h-9 rounded-full',
            'bg-white/90 hover:bg-white',
            'shadow-md hover:shadow-lg',
            'flex items-center justify-center',
            'text-[#2B3148] hover:text-accent-crimson',
            'transition-all duration-150 hover:scale-110',
          )}
        >
          <ChevronRight size={20} strokeWidth={2.5} />
        </button>

        {/* ── Dots — bottom center ───────────────────────────────────── */}
        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-1.5 z-10">
          {movies.map((_, i) => (
            <button
              key={i}
              onClick={() => go(i)}
              aria-label={`Go to slide ${i + 1}`}
              className={cn(
                'h-1.5 rounded-full transition-all duration-300',
                i === active
                  ? 'w-6 bg-white'
                  : 'w-1.5 bg-white/45 hover:bg-white/75'
              )}
            />
          ))}
        </div>

      </section>
    </div>
  );
}
