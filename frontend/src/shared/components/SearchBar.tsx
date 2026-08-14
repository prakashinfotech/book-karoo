import { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, X, ArrowLeft } from 'lucide-react';
import { cn } from '@/shared/lib/utils';
import { ROUTES } from '@/shared/constants';
import { useDebounce } from '@/shared/hooks/useDebounce';
import { useRecentSearches } from '@/shared/hooks/useLocalStorage';
import { useCityStore } from '@/shared/store/cityStore';
import { useSearch } from '@/features/search/api/useSearch';
import { SearchDropdown } from '@/features/search/components/SearchDropdown';

interface SearchBarProps {
  className?: string;
}

export function SearchBar({ className }: SearchBarProps) {
  const [query, setQuery]         = useState('');
  const [isOpen, setIsOpen]       = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const navigate = useNavigate();
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const debouncedQuery = useDebounce(query, 300);
  const { selectedCity } = useCityStore();
  const { data, isLoading } = useSearch(debouncedQuery, selectedCity?.id ?? null);
  const { searches: recentSearches, add: addRecentSearch, clear } = useRecentSearches();

  const close = useCallback(() => {
    setIsOpen(false);
    setMobileOpen(false);
  }, []);

  useEffect(() => {
    if (mobileOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [mobileOpen]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const q = query.trim();
    if (!q) return;
    addRecentSearch(q);
    close();
    setQuery('');
    navigate(`${ROUTES.SEARCH}?q=${encodeURIComponent(q)}`);
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Escape') {
      setQuery('');
      setIsOpen(false);
      inputRef.current?.blur();
    }
  }

  function handleSelectResult(q: string) {
    addRecentSearch(q);
  }

  const dropdownNode = (
    <div className="absolute left-0 right-0 top-full mt-1.5 z-50 bg-bg-surface border border-border-default rounded-xl shadow-[0_8px_32px_rgba(0,0,0,0.35)] overflow-hidden min-w-[360px] max-h-[480px] overflow-y-auto">
      <SearchDropdown
        query={debouncedQuery}
        data={data}
        isLoading={isLoading}
        recentSearches={recentSearches}
        onSelectResult={handleSelectResult}
        onClearRecent={clear}
        onClose={close}
      />
    </div>
  );

  return (
    <>
      {/* Desktop search bar (md+) */}
      <div
        ref={containerRef}
        className={cn('relative hidden md:block', className)}
      >
        <form
          onSubmit={handleSubmit}
          className={cn(
            'flex items-center gap-2 px-4 py-2 rounded-full bg-bg-surface border font-sans text-sm transition-all duration-[220ms]',
            isOpen
              ? 'border-accent-indigo ring-2 ring-accent-indigo/15'
              : 'border-border-default hover:border-border-strong'
          )}
        >
          <Search size={15} className="text-text-muted flex-shrink-0" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => { setQuery(e.target.value); setIsOpen(true); }}
            onFocus={() => setIsOpen(true)}
            onKeyDown={handleKeyDown}
            placeholder="Search movies, events"
            className="flex-1 bg-transparent outline-none text-text-primary placeholder:text-text-muted w-52 lg:w-72"
          />
          {query && (
            <button
              type="button"
              onClick={() => { setQuery(''); inputRef.current?.focus(); }}
              className="text-text-muted hover:text-text-secondary"
            >
              <X size={14} />
            </button>
          )}
        </form>

        {isOpen && dropdownNode}
      </div>

      {/* Mobile: icon button to open overlay */}
      <button
        className="md:hidden text-text-secondary hover:text-text-primary"
        onClick={() => setMobileOpen(true)}
        aria-label="Search"
      >
        <Search size={20} />
      </button>

      {/* Mobile full-screen overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 bg-bg-base flex flex-col">
          {/* Top bar */}
          <div className="flex items-center gap-3 px-4 py-3 border-b border-border-default">
            <button
              onClick={() => { setMobileOpen(false); setQuery(''); }}
              className="text-text-secondary hover:text-text-primary flex-shrink-0"
            >
              <ArrowLeft size={20} />
            </button>
            <form onSubmit={handleSubmit} className="flex-1 flex items-center gap-2">
              <input
                ref={inputRef}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Search movies, events"
                className="flex-1 bg-transparent outline-none text-text-primary placeholder:text-text-muted font-sans text-sm"
                autoFocus
              />
            </form>
            {query && (
              <button
                type="button"
                onClick={() => setQuery('')}
                className="text-text-muted hover:text-text-secondary flex-shrink-0"
              >
                <X size={16} />
              </button>
            )}
          </div>

          {/* Results area */}
          <div className="flex-1 overflow-y-auto">
            <SearchDropdown
              query={debouncedQuery}
              data={data}
              isLoading={isLoading}
              recentSearches={recentSearches}
              onSelectResult={handleSelectResult}
              onClearRecent={clear}
              onClose={close}
            />
          </div>
        </div>
      )}
    </>
  );
}
