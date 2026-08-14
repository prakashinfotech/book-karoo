import { Link } from 'react-router-dom';
import type { Movie } from '@/shared/types';
import { MovieCard } from '@/features/movies/components/MovieCard';
import { Skeleton } from '@/shared/components/ui/Skeleton';

interface MovieRailProps {
  title: string;
  eyebrow?: string;
  movies?: Movie[];
  isLoading?: boolean;
  seeAllHref?: string;
  seeAllLabel?: string;
  coming?: boolean;
}

export function MovieRail({ title, eyebrow, movies, isLoading, seeAllHref, seeAllLabel = 'See all →', coming }: MovieRailProps) {
  return (
    <section className="mb-16">
      {/* Header */}
      <div className="flex items-end justify-between mb-5">
        <div>
          {eyebrow && <p className="text-[11px] font-semibold text-text-muted tracking-widest uppercase font-sans mb-1">{eyebrow}</p>}
          <h2 className="font-display font-semibold text-2xl md:text-3xl text-text-primary tracking-tight">{title}</h2>
        </div>
        {seeAllHref && (
          <Link to={seeAllHref} className="text-sm font-medium text-text-secondary hover:text-text-primary transition-colors font-sans">
            {seeAllLabel}
          </Link>
        )}
      </div>

      {/* Rail */}
      <div className="grid grid-flow-col auto-cols-[160px] md:auto-cols-[190px] gap-4 overflow-x-auto pb-2 scroll-smooth [scrollbar-width:thin]">
        {isLoading
          ? Array.from({ length: 6 }, (_, i) => (
              <div key={i} className="space-y-2">
                <Skeleton className="aspect-[2/3] rounded-lg" />
                <Skeleton width="80%" height={14} />
                <Skeleton width="55%" height={11} />
              </div>
            ))
          : movies?.map((m) => (
              <MovieCard key={m.id} movie={m} coming={coming} />
            ))}
      </div>
    </section>
  );
}
