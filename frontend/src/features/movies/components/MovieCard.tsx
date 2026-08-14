import { memo, useState } from 'react';
import { Link } from 'react-router-dom';
import { cn } from '@/shared/lib/utils';
import { getPosterUrl } from '@/shared/lib/imageUtils';
import type { Movie } from '@/shared/types';
import { ROUTES } from '@/shared/constants';

interface MovieCardProps {
  movie: Movie;
  coming?: boolean;
}

function MovieCardComponent({ movie, coming = false }: MovieCardProps) {
  const [hovered, setHovered] = useState(false);
  const posterUrl = getPosterUrl(movie.posterUrl, 'w185');

  return (
    <Link
      to={coming ? ROUTES.MOVIE_DETAIL(movie.slug) : ROUTES.MOVIE_DETAIL(movie.slug)}
      className="block"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Poster */}
      <div
        className={cn(
          'relative aspect-[2/3] rounded-lg overflow-hidden bg-bg-surface2 border transition-all duration-[220ms] isolate',
          hovered
            ? 'border-border-strong -translate-y-1 shadow-[0_8px_24px_rgba(0,0,0,0.4),0_0_0_1px_rgba(225, 29, 116,0.3)]'
            : 'border-border-default'
        )}
      >
        {posterUrl ? (
          <img
            src={posterUrl} alt={movie.title}
            className="w-full h-full object-cover"
            loading="lazy"
            decoding="async"
            onError={(e) => {
              // Hide broken image, reveal the fallback beneath it
              (e.target as HTMLImageElement).style.display = 'none';
            }}
          />
        ) : null}
        {/* Fallback always rendered behind the image */}
        <div className="absolute inset-0 bg-gradient-to-br from-bg-surface2 to-bg-surface3 flex flex-col items-center justify-center gap-2 -z-10">
          <span className="text-3xl">🎬</span>
          <span className="text-[10px] text-text-muted text-center px-2 font-sans leading-snug">{movie.title}</span>
        </div>

        {/* Rating badge */}
        {movie.imdbRating && (
          <div className="absolute top-2 right-2 px-2 py-0.5 rounded-full bg-black/70 backdrop-blur-sm text-[11px] font-semibold text-[#FCD34D] font-sans">
            ⭐ {movie.imdbRating}
          </div>
        )}

        {/* Coming soon badge */}
        {coming && movie.releaseDate && (
          <div className="absolute top-2 left-2 px-2 py-0.5 rounded-full bg-accent-indigo/85 backdrop-blur-sm text-[11px] font-semibold text-white font-sans">
            {new Date(movie.releaseDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
          </div>
        )}

        {/* Hover overlay */}
        <div
          className={cn(
            'absolute inset-0 bg-gradient-to-t from-bg-base/95 via-bg-base/40 to-transparent flex flex-col justify-end p-3 transition-opacity duration-[220ms]',
            hovered ? 'opacity-100' : 'opacity-0'
          )}
        >
          <button className="w-full py-2 rounded-full bg-gradient-to-r from-accent-crimson-light to-accent-crimson text-white text-xs font-semibold font-sans">
            {coming ? '🔔 Remind Me' : '🎟 Book Now'}
          </button>
        </div>
      </div>

      {/* Meta */}
      <div className="pt-2.5 space-y-0.5">
        <p className="font-display font-semibold text-sm text-text-primary leading-snug line-clamp-1">
          {movie.title}
        </p>
        <p className="text-xs text-text-muted font-sans line-clamp-1">
          {movie.genres?.slice(0, 2).join(' · ')}
        </p>
      </div>
    </Link>
  );
}

export const MovieCard = memo(MovieCardComponent);
