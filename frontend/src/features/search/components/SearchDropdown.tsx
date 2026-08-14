import { useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { Clock, MapPin, Building2 } from 'lucide-react';
import { Skeleton } from '@/shared/components/ui/Skeleton';
import { ROUTES } from '@/shared/constants';
import { getPosterUrl } from '@/shared/lib/imageUtils';
import { useCityStore } from '@/shared/store/cityStore';
import type { City } from '@/shared/types';
import type { SearchResponse, SearchCityResult } from '../types';

interface SearchDropdownProps {
  query:          string;
  data:           SearchResponse | undefined;
  isLoading:      boolean;
  recentSearches: string[];
  onSelectResult: (query: string) => void;
  onClearRecent:  () => void;
  onClose:        () => void;
}

export function SearchDropdown({
  query,
  data,
  isLoading,
  recentSearches,
  onSelectResult,
  onClearRecent,
  onClose,
}: SearchDropdownProps) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { setCity } = useCityStore();

  function handleMovieClick(slug: string) {
    onSelectResult(query);
    onClose();
    navigate(ROUTES.MOVIE_DETAIL(slug));
  }

  function handleEventClick(slug: string) {
    onSelectResult(query);
    onClose();
    navigate(ROUTES.EVENT_DETAIL(slug));
  }

  function handleVenueClick() {
    onSelectResult(query);
    onClose();
  }

  function handleCityClick(city: SearchCityResult) {
    const cityObj: City = {
      id: city.id, name: city.name, slug: city.slug,
      state: city.state, stateCode: city.stateCode,
      latitude: 0, longitude: 0,
    };
    setCity(cityObj);
    void queryClient.invalidateQueries({ queryKey: ['movies'] });
    void queryClient.invalidateQueries({ queryKey: ['events'] });
    void queryClient.invalidateQueries({ queryKey: ['shows'] });
    onClose();
  }

  function handleRecentClick(q: string) {
    onSelectResult(q);
  }

  if (query.length === 0) {
    return (
      <div className="py-2">
        {recentSearches.length > 0 ? (
          <>
            <div className="flex items-center justify-between px-4 py-2">
              <span className="text-[11px] uppercase tracking-wider text-text-muted font-sans font-semibold">
                Recent Searches
              </span>
              <button
                onClick={onClearRecent}
                className="text-[11px] text-accent-indigo hover:text-accent-indigo/80 font-sans"
              >
                Clear
              </button>
            </div>
            {recentSearches.map((q) => (
              <button
                key={q}
                onClick={() => handleRecentClick(q)}
                className="flex items-center gap-3 w-full px-4 py-2.5 hover:bg-bg-surface2 text-left transition-colors"
              >
                <Clock size={14} className="text-text-muted flex-shrink-0" />
                <span className="text-sm text-text-secondary font-sans">{q}</span>
              </button>
            ))}
          </>
        ) : (
          <div className="px-4 py-6 text-center">
            <p className="text-sm text-text-muted font-sans">
              Start typing to search movies, events, and venues
            </p>
          </div>
        )}
      </div>
    );
  }

  if (query.length < 2) {
    return (
      <div className="px-4 py-6 text-center">
        <p className="text-sm text-text-muted font-sans">Type at least 2 characters to search</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="p-3 space-y-2">
        {Array.from({ length: 3 }, (_, i) => (
          <div key={i} className="flex items-center gap-3 px-1">
            <Skeleton width={40} height={60} className="rounded flex-shrink-0" />
            <div className="flex-1 space-y-2">
              <Skeleton height={14} className="w-3/4" />
              <Skeleton height={12} className="w-1/2" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (!data || data.totalResults === 0) {
    return (
      <div className="px-4 py-8 text-center">
        <p className="text-3xl mb-3">🔍</p>
        <p className="text-sm font-semibold text-text-secondary font-sans">
          No results for &ldquo;{query}&rdquo;
        </p>
        <p className="text-xs text-text-muted font-sans mt-1">
          Try checking spelling or search for a different term
        </p>
      </div>
    );
  }

  return (
    <div className="py-2">
      {data.movies.length > 0 && (
        <section>
          <p className="px-4 py-2 text-[11px] uppercase tracking-wider text-text-muted font-sans font-semibold">
            Movies
          </p>
          {data.movies.map((m) => (
            <button
              key={m.id}
              onClick={() => handleMovieClick(m.slug)}
              className="flex items-center gap-3 w-full px-4 py-2.5 hover:bg-bg-surface2 text-left transition-colors"
            >
              <div className="w-10 h-[60px] rounded overflow-hidden bg-bg-surface2 flex-shrink-0">
                {m.posterUrl ? (
                  <img
                    src={getPosterUrl(m.posterUrl, 'w92')}
                    alt={m.title}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-accent-indigo/30 to-accent-purple/30 flex items-center justify-center text-lg">
                    🎬
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-text-primary font-display line-clamp-1">
                  {m.title}
                </p>
                <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                  {m.certificate && (
                    <span className="text-[10px] font-sans font-semibold px-1.5 py-0.5 rounded border border-border-default text-text-muted">
                      {m.certificate}
                    </span>
                  )}
                  <span
                    className={`text-[10px] font-sans font-semibold px-1.5 py-0.5 rounded ${
                      m.category === 'NowShowing'
                        ? 'bg-accent-crimson/12 text-[#FF6770]'
                        : 'bg-bg-surface3 text-text-muted'
                    }`}
                  >
                    {m.category === 'NowShowing' ? 'Now Showing' : 'Coming Soon'}
                  </span>
                </div>
              </div>
            </button>
          ))}
        </section>
      )}

      {data.events.length > 0 && (
        <section>
          <p className="px-4 py-2 text-[11px] uppercase tracking-wider text-text-muted font-sans font-semibold">
            Events &amp; Shows
          </p>
          {data.events.map((e) => (
            <button
              key={e.id}
              onClick={() => handleEventClick(e.slug)}
              className="flex items-center gap-3 w-full px-4 py-2.5 hover:bg-bg-surface2 text-left transition-colors"
            >
              <div className="w-10 h-10 rounded overflow-hidden bg-bg-surface2 flex-shrink-0">
                {e.posterUrl ? (
                  <img
                    src={getPosterUrl(e.posterUrl, 'w92')}
                    alt={e.title}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-accent-indigo/30 to-accent-purple/30 flex items-center justify-center text-lg">
                    🎭
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-text-primary font-display line-clamp-1">
                  {e.title}
                </p>
                <p className="text-xs text-text-muted font-sans mt-0.5">
                  {e.eventType}{e.eventDate ? ` · ${e.eventDate}` : ''}
                </p>
              </div>
            </button>
          ))}
        </section>
      )}

      {data.venues.length > 0 && (
        <section>
          <p className="px-4 py-2 text-[11px] uppercase tracking-wider text-text-muted font-sans font-semibold">
            Cinemas &amp; Venues
          </p>
          {data.venues.map((v) => (
            <button
              key={v.id}
              onClick={() => handleVenueClick()}
              className="flex items-center gap-3 w-full px-4 py-2.5 hover:bg-bg-surface2 text-left transition-colors"
            >
              <div className="w-10 h-10 rounded-full bg-bg-surface2 flex items-center justify-center flex-shrink-0">
                <Building2 size={18} className="text-text-muted" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-text-primary font-sans line-clamp-1">
                  {v.name}
                </p>
                <p className="text-xs text-text-muted font-sans">
                  {[v.chain, v.cityName].filter(Boolean).join(' · ')}
                </p>
              </div>
            </button>
          ))}
        </section>
      )}

      {data.cities.length > 0 && (
        <section>
          <p className="px-4 py-2 text-[11px] uppercase tracking-wider text-text-muted font-sans font-semibold">
            Cities
          </p>
          {data.cities.map((c) => (
            <button
              key={c.id}
              onClick={() => handleCityClick(c)}
              className="flex items-center gap-3 w-full px-4 py-2.5 hover:bg-bg-surface2 text-left transition-colors"
            >
              <MapPin size={16} className="text-accent-crimson flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-text-primary font-sans">
                  {c.name}
                </p>
                <p className="text-xs text-text-muted font-sans">{c.state}</p>
              </div>
            </button>
          ))}
        </section>
      )}

      {data.totalResults > 8 && (
        <div className="border-t border-border-default mt-1">
          <button
            onClick={() => {
              onSelectResult(query);
              onClose();
              navigate(`${ROUTES.SEARCH}?q=${encodeURIComponent(query)}`);
            }}
            className="flex items-center justify-center w-full px-4 py-3 text-sm text-accent-indigo hover:bg-bg-surface2 font-sans transition-colors"
          >
            See all results for &ldquo;{query}&rdquo; →
          </button>
        </div>
      )}
    </div>
  );
}
