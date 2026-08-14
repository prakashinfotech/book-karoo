import { useState, useMemo, useEffect } from 'react';
import { X, Search, MapPin, Navigation } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { cn } from '@/shared/lib/utils';
import { useCityStore } from '@/shared/store/cityStore';
import { useCities, useDetectCity } from '@/features/cities/api/useCities';
import { useDebounce } from '@/shared/hooks/useDebounce';
import type { City } from '@/shared/types';

const POPULAR_SLUGS = ['mumbai', 'delhi-ncr', 'bangalore', 'hyderabad', 'ahmedabad', 'chennai'];

interface CityModalProps {
  open: boolean;
  onClose: () => void;
}

export function CityModal({ open, onClose }: CityModalProps) {
  const queryClient = useQueryClient();
  const { selectedCity, setCity } = useCityStore();
  const { data: cities = [], isLoading } = useCities();
  const { mutate: detect, isPending: isDetecting, data: detectedCity, reset: resetDetect } = useDetectCity();
  const [searchQuery, setSearchQuery] = useState('');
  const debouncedQuery = useDebounce(searchQuery, 300);

  // Reset detect state and search when modal reopens
  useEffect(() => {
    if (open) {
      setSearchQuery('');
      resetDetect();
    }
  }, [open, resetDetect]);

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [open, onClose]);

  function handleSelect(city: City) {
    setCity(city);
    queryClient.invalidateQueries({ queryKey: ['movies'] });
    queryClient.invalidateQueries({ queryKey: ['events'] });
    queryClient.invalidateQueries({ queryKey: ['shows'] });
    onClose();
  }

  const popularCities = useMemo(
    () => POPULAR_SLUGS.map((slug) => cities.find((c) => c.slug === slug)).filter((c): c is City => !!c),
    [cities]
  );

  const filteredCities = useMemo(() => {
    if (!debouncedQuery.trim()) return cities;
    const q = debouncedQuery.toLowerCase();
    return cities.filter((c) => c.name.toLowerCase().includes(q) || c.state.toLowerCase().includes(q));
  }, [cities, debouncedQuery]);

  const isSearching = debouncedQuery.trim().length > 0;

  if (!open) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden
      />

      {/* Modal */}
      <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center sm:p-4 pointer-events-none">
        <div
          className="pointer-events-auto w-full max-w-lg bg-bg-surface border border-border-default shadow-2xl rounded-t-2xl sm:rounded-2xl flex flex-col max-h-[90vh] sm:max-h-[80vh]"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Drag handle (mobile) */}
          <div className="sm:hidden flex justify-center pt-3 pb-1">
            <div className="w-10 h-1 rounded-full bg-border-strong" />
          </div>

          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-border-default flex-shrink-0">
            <h2 className="font-semibold text-lg text-text-primary font-sans">Select your city</h2>
            <button
              onClick={onClose}
              className="p-1.5 rounded-full hover:bg-bg-surface2 text-text-muted hover:text-text-primary transition-colors"
              aria-label="Close"
            >
              <X size={18} />
            </button>
          </div>

          {/* Scrollable content */}
          <div className="flex-1 overflow-y-auto">
            {/* Auto-detect strip */}
            <div className="px-5 pt-4 pb-3 border-b border-border-default">
              {isDetecting ? (
                <div className="flex items-center gap-2.5 text-sm text-text-muted font-sans">
                  <div className="w-4 h-4 border-2 border-accent-indigo/30 border-t-accent-indigo rounded-full animate-spin flex-shrink-0" />
                  Detecting your location…
                </div>
              ) : detectedCity ? (
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm font-sans">
                    <MapPin size={15} className="text-accent-crimson flex-shrink-0" />
                    <span className="text-text-muted">Detected:</span>
                    <span className="text-text-primary font-medium">{detectedCity.name}</span>
                    <span className="text-text-muted text-xs">{detectedCity.state}</span>
                  </div>
                  <button
                    onClick={() => handleSelect(detectedCity)}
                    className="text-xs font-semibold font-sans text-accent-indigo hover:underline ml-3 flex-shrink-0"
                  >
                    Use {detectedCity.name} →
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => detect()}
                  className="flex items-center gap-2 text-sm font-sans text-text-secondary hover:text-text-primary transition-colors group"
                >
                  <Navigation
                    size={15}
                    className="text-accent-indigo group-hover:text-accent-indigo/80 flex-shrink-0"
                  />
                  Detect my location
                </button>
              )}
            </div>

            {/* Search */}
            <div className="px-5 py-3 border-b border-border-default">
              <div className="relative">
                <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none" />
                <input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search cities…"
                  autoFocus
                  className="w-full pl-9 pr-9 py-2.5 bg-bg-base border border-border-default rounded-lg text-sm font-sans text-text-primary placeholder:text-text-muted outline-none focus:border-accent-indigo focus:ring-2 focus:ring-accent-indigo/15 transition-all"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary"
                  >
                    <X size={14} />
                  </button>
                )}
              </div>
            </div>

            {isLoading ? (
              <div className="flex items-center justify-center py-12 text-text-muted text-sm font-sans">
                Loading cities…
              </div>
            ) : filteredCities.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-text-muted text-sm font-sans gap-1">
                <MapPin size={28} className="text-border-strong mb-1" />
                No cities match "{debouncedQuery}"
              </div>
            ) : (
              <>
                {/* Popular cities (only when not searching) */}
                {!isSearching && popularCities.length > 0 && (
                  <div className="px-5 pt-4 pb-2">
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-text-muted font-sans mb-3">
                      Popular Cities
                    </p>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {popularCities.map((city) => (
                        <button
                          key={city.id}
                          onClick={() => handleSelect(city)}
                          className={cn(
                            'flex flex-col items-start p-3 rounded-xl border text-left transition-colors duration-150',
                            selectedCity?.id === city.id
                              ? 'border-accent-crimson/40 bg-accent-crimson/8 text-accent-crimson'
                              : 'border-border-default hover:border-accent-indigo/40 hover:bg-bg-surface2 text-text-secondary hover:text-text-primary'
                          )}
                        >
                          <span className="font-semibold text-sm font-sans leading-tight">{city.name}</span>
                          <span className="text-xs text-text-muted font-sans mt-0.5">{city.state}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* All cities list */}
                <div className="px-5 pt-3 pb-2">
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-text-muted font-sans mb-1">
                    {isSearching ? 'Results' : 'All Cities'}
                  </p>
                </div>
                <div className="pb-4">
                  {filteredCities.map((city) => (
                    <button
                      key={city.id}
                      onClick={() => handleSelect(city)}
                      className={cn(
                        'w-full flex items-center justify-between px-5 py-3 border-l-2 transition-colors duration-150 text-left',
                        selectedCity?.id === city.id
                          ? 'border-l-accent-crimson bg-accent-crimson/6 text-text-primary'
                          : 'border-l-transparent hover:bg-bg-surface2 text-text-secondary hover:text-text-primary'
                      )}
                    >
                      <span className="text-sm font-sans font-medium">{city.name}</span>
                      <span className="text-xs text-text-muted font-sans">{city.state}</span>
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
