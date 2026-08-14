import { useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { Building2, MapPin } from 'lucide-react';
import { PublicLayout } from '@/shared/components/layout/PublicLayout';
import { Skeleton } from '@/shared/components/ui/Skeleton';
import { MovieCard } from '@/features/movies/components/MovieCard';
import { ROUTES, TMDB_POSTER } from '@/shared/constants';
import { useCityStore } from '@/shared/store/cityStore';
import { useSearch } from '../api/useSearch';
import type { SearchCityResult } from '../types';
import type { Movie } from '@/shared/types';

type Tab = 'all' | 'movies' | 'events' | 'venues';

function toMovieShape(m: {
  id: string; title: string; slug: string; posterUrl: string | null;
  certificate: string | null; category: string; imdbRating: number | null;
}): Movie {
  return {
    id: m.id,
    title: m.title,
    slug: m.slug,
    posterUrl: m.posterUrl ?? null,
    certificate: m.certificate ?? null,
    category: m.category as Movie['category'],
    imdbRating: m.imdbRating ?? null,
    genres: [],
    languages: [],
    formats: [],
    status: 'published',
    durationMin: 0,
  } as unknown as Movie;
}

export default function SearchResultsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const query = searchParams.get('q') ?? '';
  const tabParam = (searchParams.get('type') ?? 'all') as Tab;
  const [tab, setTabState] = useState<Tab>(tabParam);

  const { selectedCity } = useCityStore();
  const { data, isLoading } = useSearch(query, selectedCity?.id ?? null);
  const navigate = useNavigate();

  function setTab(t: Tab) {
    setTabState(t);
    const params = new URLSearchParams(searchParams);
    params.set('type', t);
    setSearchParams(params, { replace: true });
  }

  const { setCity } = useCityStore();
  const queryClient = useQueryClient();

  function handleCityClick(city: SearchCityResult) {
    setCity({
      id: city.id, name: city.name, slug: city.slug,
      state: city.state, stateCode: city.stateCode,
      latitude: 0, longitude: 0,
    });
    void queryClient.invalidateQueries({ queryKey: ['movies'] });
    void queryClient.invalidateQueries({ queryKey: ['events'] });
    void queryClient.invalidateQueries({ queryKey: ['shows'] });
  }

  const tabs: { key: Tab; label: string; count: number }[] = [
    { key: 'all',    label: 'All',     count: data?.totalResults ?? 0 },
    { key: 'movies', label: 'Movies',  count: data?.movies.length ?? 0 },
    { key: 'events', label: 'Events',  count: data?.events.length ?? 0 },
    { key: 'venues', label: 'Venues',  count: data?.venues.length ?? 0 },
  ];

  const showMovies  = tab === 'all' || tab === 'movies';
  const showEvents  = tab === 'all' || tab === 'events';
  const showVenues  = tab === 'all' || tab === 'venues';

  function EmptyState({ type }: { type: string }) {
    return (
      <div className="flex flex-col items-center py-20 text-center">
        <p className="text-5xl mb-4">🔍</p>
        <p className="text-text-secondary font-sans font-medium text-base">
          No {type} found for &ldquo;{query}&rdquo;
        </p>
        <p className="text-sm text-text-muted font-sans mt-1">Try a different search term</p>
        <button
          onClick={() => navigate(ROUTES.SEARCH)}
          className="mt-5 px-6 py-2.5 rounded-full bg-gradient-to-r from-accent-indigo to-accent-purple text-white text-sm font-semibold font-sans"
        >
          New Search
        </button>
      </div>
    );
  }

  if (!query) {
    return (
      <PublicLayout>
        <div className="max-w-3xl mx-auto px-6 py-16 text-center">
          <p className="text-4xl mb-4">🎬</p>
          <p className="text-text-secondary font-sans">Enter a search term in the bar above</p>
        </div>
      </PublicLayout>
    );
  }

  return (
    <PublicLayout>
      {/* Header */}
      <div className="bg-gradient-to-b from-bg-surface2 to-bg-base border-b border-border-default">
        <div className="max-w-5xl mx-auto px-6 py-8">
          <h1 className="font-display font-bold text-2xl text-text-primary mb-1">
            Search results for &ldquo;{query}&rdquo;
          </h1>
          {!isLoading && data && (
            <p className="text-sm text-text-muted font-sans">
              {data.totalResults} result{data.totalResults !== 1 ? 's' : ''} found
            </p>
          )}
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-6">
        {/* Tabs */}
        <div className="flex gap-1 border-b border-border-default mb-6">
          {tabs.map(({ key, label, count }) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={`relative px-4 py-3 text-sm font-medium font-sans capitalize transition-colors ${
                tab === key ? 'text-accent-crimson' : 'text-text-muted hover:text-text-secondary'
              }`}
            >
              {label}
              {count > 0 && (
                <span className="ml-2 text-[11px] font-mono px-1.5 py-0.5 rounded-full bg-bg-surface2 text-text-muted">
                  {count}
                </span>
              )}
              {tab === key && (
                <span className="absolute bottom-0 left-2 right-2 h-0.5 bg-accent-crimson rounded-full" />
              )}
            </button>
          ))}
        </div>

        {isLoading ? (
          <div className="space-y-6">
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {Array.from({ length: 8 }, (_, i) => (
                <Skeleton key={i} className="aspect-[2/3] rounded-lg" />
              ))}
            </div>
          </div>
        ) : !data || data.totalResults === 0 ? (
          <EmptyState type="results" />
        ) : (
          <div className="space-y-10">
            {/* Movies section */}
            {showMovies && data.movies.length > 0 && (
              <section>
                {tab === 'all' && (
                  <h2 className="font-display font-semibold text-base text-text-primary mb-4">
                    Movies
                  </h2>
                )}
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                  {data.movies.map((m) => (
                    <MovieCard key={m.id} movie={toMovieShape(m)} />
                  ))}
                </div>
              </section>
            )}

            {showMovies && tab === 'movies' && data.movies.length === 0 && (
              <EmptyState type="movies" />
            )}

            {/* Events section */}
            {showEvents && data.events.length > 0 && (
              <section>
                {tab === 'all' && (
                  <h2 className="font-display font-semibold text-base text-text-primary mb-4">
                    Events &amp; Shows
                  </h2>
                )}
                <div className="space-y-3">
                  {data.events.map((e) => (
                    <Link
                      key={e.id}
                      to={ROUTES.EVENT_DETAIL(e.slug)}
                      className="flex items-center gap-4 p-4 rounded-xl bg-bg-surface border border-border-default hover:border-border-strong transition-colors"
                    >
                      <div className="w-16 h-16 rounded-lg overflow-hidden bg-bg-surface2 flex-shrink-0">
                        {e.posterUrl ? (
                          <img
                            src={TMDB_POSTER(e.posterUrl, 'w185')}
                            alt={e.title}
                            className="w-full h-full object-cover"
                            loading="lazy"
                          />
                        ) : (
                          <div className="w-full h-full bg-gradient-to-br from-accent-indigo/30 to-accent-purple/30 flex items-center justify-center text-2xl">
                            🎭
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-display font-semibold text-base text-text-primary line-clamp-1">
                          {e.title}
                        </p>
                        <p className="text-sm text-text-muted font-sans mt-0.5">
                          {e.eventType}{e.eventDate ? ` · ${e.eventDate}` : ''}
                        </p>
                      </div>
                    </Link>
                  ))}
                </div>
              </section>
            )}

            {showEvents && tab === 'events' && data.events.length === 0 && (
              <EmptyState type="events" />
            )}

            {/* Venues section */}
            {showVenues && data.venues.length > 0 && (
              <section>
                {tab === 'all' && (
                  <h2 className="font-display font-semibold text-base text-text-primary mb-4">
                    Cinemas &amp; Venues
                  </h2>
                )}
                <div className="space-y-3">
                  {data.venues.map((v) => (
                    <div
                      key={v.id}
                      className="flex items-center gap-4 p-4 rounded-xl bg-bg-surface border border-border-default"
                    >
                      <div className="w-12 h-12 rounded-full bg-bg-surface2 flex items-center justify-center flex-shrink-0">
                        <Building2 size={20} className="text-text-muted" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-sans font-semibold text-base text-text-primary line-clamp-1">
                          {v.name}
                        </p>
                        <p className="text-sm text-text-muted font-sans">
                          {[v.chain, v.cityName].filter(Boolean).join(' · ')}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {showVenues && tab === 'venues' && data.venues.length === 0 && (
              <EmptyState type="venues" />
            )}

            {/* Cities section (only in All tab) */}
            {tab === 'all' && data.cities.length > 0 && (
              <section>
                <h2 className="font-display font-semibold text-base text-text-primary mb-4">
                  Cities
                </h2>
                <div className="flex flex-wrap gap-2">
                  {data.cities.map((c) => (
                    <button
                      key={c.id}
                      onClick={() => handleCityClick(c)}
                      className="flex items-center gap-2 px-4 py-2 rounded-full bg-bg-surface border border-border-default hover:border-border-strong text-sm font-sans text-text-secondary hover:text-text-primary transition-colors"
                    >
                      <MapPin size={13} className="text-accent-crimson" />
                      {c.name}
                      <span className="text-text-muted text-xs">{c.state}</span>
                    </button>
                  ))}
                </div>
              </section>
            )}
          </div>
        )}
      </div>
    </PublicLayout>
  );
}
