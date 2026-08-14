import { useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { PublicLayout } from '@/shared/components/layout/PublicLayout';
import { MovieCard } from '../components/MovieCard';
import { Chip } from '@/shared/components/ui/Chip';
import { Skeleton } from '@/shared/components/ui/Skeleton';
import { useMovies, type MovieFilters } from '../api/useMovies';
import { LANGUAGES, GENRES, FORMATS } from '@/shared/constants';
import { useCityStore } from '@/shared/store/cityStore';

// ─── Constants ────────────────────────────────────────────────────────────────

const CATEGORIES = [
  { label: 'Now Showing', value: 'NowShowing' },
  { label: 'Coming Soon', value: 'ComingSoon' },
  { label: 'Exclusive',   value: 'Exclusive'  },
  { label: 'Premieres',   value: 'Premiere'   },
] as const;

const SORTS = [
  { label: 'Popularity',    value: ''        },
  { label: 'Rating',        value: 'rating'  },
  { label: 'Release Date',  value: 'release' },
  { label: 'A–Z',           value: 'az'      },
] as const;

const PAGE_SIZE = 20;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function toggle(arr: string[], val: string): string[] {
  return arr.includes(val) ? arr.filter((v) => v !== val) : [...arr, val];
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function MoviesPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { selectedCity } = useCityStore();
  const cityId    = selectedCity?.id;
  const cityLabel = selectedCity?.name ?? '';

  // Read all filters from URL
  const category  = searchParams.get('category') ?? 'NowShowing';
  const sort      = (searchParams.get('sort') ?? '') as MovieFilters['sort'];
  const page      = Math.max(1, Number(searchParams.get('page') ?? '1'));
  const languages = searchParams.getAll('languages');
  const genres    = searchParams.getAll('genres');
  const formats   = searchParams.getAll('formats');

  // Reset to page 1 when city changes
  useEffect(() => {
    if (cityId) {
      setSearchParams((prev) => {
        const next = new URLSearchParams(prev);
        next.set('page', '1');
        return next;
      }, { replace: true });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cityId]);

  function update(key: string, value: string | string[] | null) {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      next.delete(key);
      next.set('page', '1');
      if (Array.isArray(value)) {
        value.forEach((v) => next.append(key, v));
      } else if (value) {
        next.set(key, value);
      }
      return next;
    }, { replace: true });
  }

  function clearAll() {
    setSearchParams({ category, page: '1' }, { replace: true });
  }

  const filters: MovieFilters = {
    category,
    sort,
    page,
    pageSize: PAGE_SIZE,
    cityId,
    languages: languages.length > 0 ? languages : undefined,
    genres:    genres.length    > 0 ? genres    : undefined,
    formats:   formats.length   > 0 ? formats   : undefined,
  };

  const { data, isLoading, isFetching } = useMovies(filters);

  const movies     = data?.items     ?? [];
  const total      = data?.total     ?? 0;
  const totalPages = data?.totalPages ?? 0;
  const coming     = category === 'ComingSoon';

  const activeFilters: { label: string; key: string; value: string }[] = [
    ...languages.map((l) => ({ label: l,   key: 'languages', value: l   })),
    ...genres.map((g)    => ({ label: g,   key: 'genres',    value: g   })),
    ...formats.map((f)   => ({ label: f,   key: 'formats',   value: f   })),
  ];

  function removeFilter(key: string, value: string) {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      const values = next.getAll(key).filter((v) => v !== value);
      next.delete(key);
      values.forEach((v) => next.append(key, v));
      next.set('page', '1');
      return next;
    }, { replace: true });
  }

  return (
    <PublicLayout>
      <Helmet><title>Movies | BookKaroo</title></Helmet>
      {/* ── Sticky filter bar ─────────────────────────────────────────────── */}
      <div className="sticky top-[105px] z-30 bg-bg-surface/95 backdrop-blur-md border-b border-border-default">
        <div className="max-w-[1280px] mx-auto px-4 sm:px-6 py-3 space-y-2">

          {/* Category tabs */}
          <div className="flex gap-1.5 flex-wrap">
            {CATEGORIES.map((c) => (
              <Chip
                key={c.value}
                active={category === c.value}
                onToggle={() => update('category', c.value)}
              >
                {c.label}
              </Chip>
            ))}
          </div>

          {/* Language / Genre / Format filter rows */}
          {([
            { label: 'Language', opts: LANGUAGES as readonly string[], key: 'languages', values: languages },
            { label: 'Format',   opts: FORMATS   as readonly string[], key: 'formats',   values: formats   },
            { label: 'Genre',    opts: GENRES     as readonly string[], key: 'genres',    values: genres    },
          ] as const).map(({ label, opts, key, values }) => (
            <div key={label} className="flex items-center gap-2 overflow-x-auto scrollbar-none pb-0.5">
              <span className="text-[10px] font-semibold text-text-muted tracking-wider uppercase shrink-0 w-16 font-sans">
                {label}
              </span>
              <div className="flex gap-1.5 flex-nowrap">
                {opts.map((o) => (
                  <Chip
                    key={o}
                    active={values.includes(o)}
                    onToggle={() => update(key, toggle(values, o))}
                  >
                    {o}
                  </Chip>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Content ───────────────────────────────────────────────────────── */}
      <div className="max-w-[1280px] mx-auto px-4 sm:px-6 py-8">

        {/* Header */}
        <div className="mb-6">
          <p className="text-[11px] font-semibold text-text-muted tracking-widest uppercase font-sans mb-1">
            Movies{cityLabel ? ` · ${cityLabel}` : ''}
          </p>
          <h1 className="font-display font-semibold text-3xl md:text-4xl tracking-tight">
            What's on this week
          </h1>
          <p className="text-text-secondary text-sm mt-2 font-sans">
            {isLoading
              ? 'Loading…'
              : `${total} film${total === 1 ? '' : 's'}${cityLabel ? ` in ${cityLabel}` : ''}`}
          </p>
        </div>

        {/* Toolbar: active filters + sort */}
        <div className="flex items-start justify-between gap-4 mb-5 flex-wrap">
          <div className="flex gap-2 flex-wrap items-center">
            {activeFilters.map((f) => (
              <button
                key={`${f.key}-${f.value}`}
                onClick={() => removeFilter(f.key, f.value)}
                className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-sans bg-accent-purple/14 text-[#C4A0FF] border border-accent-purple/28 hover:bg-accent-purple/22 transition-colors"
              >
                {f.label} ✕
              </button>
            ))}
            {activeFilters.length > 0 && (
              <button onClick={clearAll} className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-sans bg-bg-surface2 border border-border-default text-text-secondary hover:text-text-primary hover:border-border-strong transition-colors">
                ✕ Clear all
              </button>
            )}
          </div>

          <SortDropdown
            value={sort ?? ''}
            onChange={(v) => update('sort', v || null)}
          />
        </div>

        {/* Grid */}
        {isLoading ? (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-5">
            {Array.from({ length: 10 }, (_, i) => (
              <div key={i} className="space-y-2">
                <Skeleton className="aspect-[2/3] rounded-lg" />
                <Skeleton width="80%" height={14} />
                <Skeleton width="55%" height={11} />
              </div>
            ))}
          </div>
        ) : movies.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <span className="text-5xl mb-4">🎬</span>
            <h3 className="font-display text-xl text-text-secondary mb-2">No movies match your filters</h3>
            <p className="text-text-muted text-sm font-sans mb-6">
              Try removing some filters to see more results.
            </p>
            <button
              onClick={clearAll}
              className="px-6 py-2.5 rounded-full bg-gradient-to-r from-accent-indigo to-accent-purple text-white text-sm font-semibold font-sans"
            >
              Clear all filters
            </button>
          </div>
        ) : (
          <div className={`grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-5 transition-opacity duration-200 ${isFetching ? 'opacity-60' : 'opacity-100'}`}>
            {movies.map((m) => <MovieCard key={m.id} movie={m} coming={coming} />)}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-center gap-2 mt-10 flex-wrap">
            {/* Prev */}
            <PaginationBtn
              label="←"
              disabled={page === 1}
              onClick={() => { update('page', String(page - 1)); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
            />
            {/* Page numbers (show at most 7) */}
            {buildPageRange(page, totalPages).map((p, i) =>
              p === '…' ? (
                <span key={`ellipsis-${i}`} className="w-9 h-9 flex items-center justify-center text-text-muted text-sm font-sans">…</span>
              ) : (
                <PaginationBtn
                  key={p}
                  label={String(p)}
                  active={p === page}
                  onClick={() => { update('page', String(p)); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                />
              )
            )}
            {/* Next */}
            <PaginationBtn
              label="→"
              disabled={page === totalPages}
              onClick={() => { update('page', String(page + 1)); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
            />
          </div>
        )}
      </div>
    </PublicLayout>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function SortDropdown({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const activeLabel = SORTS.find((s) => s.value === value)?.label ?? 'Popularity';

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    if (open) document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, [open]);

  return (
    <div ref={ref} className="relative shrink-0">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-bg-surface2 border border-border-strong text-sm font-sans text-text-primary hover:border-accent-indigo/60 transition-colors"
      >
        <span className="text-text-muted">↕</span>
        <span className="font-semibold">{activeLabel}</span>
        <span className={`text-text-muted text-xs transition-transform duration-150 ${open ? 'rotate-180' : ''}`}>▾</span>
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-1.5 w-40 rounded-xl bg-bg-surface border border-border-strong shadow-[0_8px_32px_rgba(0,0,0,0.5)] z-50 overflow-hidden py-1">
          {SORTS.map((s) => (
            <button
              key={s.value}
              onClick={() => { onChange(s.value); setOpen(false); }}
              className={`w-full text-left px-4 py-2.5 text-sm font-sans transition-colors ${
                s.value === value
                  ? 'text-accent-indigo bg-accent-indigo/10 font-semibold'
                  : 'text-text-secondary hover:text-text-primary hover:bg-bg-surface2'
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

interface PBtnProps { label: string; active?: boolean; disabled?: boolean; onClick: () => void }
function PaginationBtn({ label, active, disabled, onClick }: PBtnProps) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`w-9 h-9 rounded-md text-sm font-sans transition-colors ${
        active
          ? 'bg-gradient-to-r from-accent-indigo to-accent-purple text-white'
          : disabled
          ? 'text-text-muted cursor-default bg-bg-surface'
          : 'bg-bg-surface text-text-secondary hover:text-text-primary border border-border-default'
      }`}
    >
      {label}
    </button>
  );
}

function buildPageRange(current: number, total: number): (number | '…')[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  const pages: (number | '…')[] = [1];
  if (current > 3) pages.push('…');
  for (let p = Math.max(2, current - 1); p <= Math.min(total - 1, current + 1); p++) pages.push(p);
  if (current < total - 2) pages.push('…');
  pages.push(total);
  return pages;
}
