import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { PublicLayout } from '@/shared/components/layout/PublicLayout';
import { Skeleton } from '@/shared/components/ui/Skeleton';
import { Chip } from '@/shared/components/ui/Chip';
import { useCityStore } from '@/shared/store/cityStore';
import { EventCard } from '../components/EventCard';
import { useEvents } from '../api/useEvents';
import { cn } from '@/shared/lib/utils'; // used by grid opacity

interface Tab { key: string | null; label: string; emoji: string }

const TABS: Tab[] = [
  { key: null,         label: 'All',        emoji: '🎪' },
  { key: 'live_event', label: 'Concerts',   emoji: '🎵' },
  { key: 'comedy',     label: 'Comedy',     emoji: '😂' },
  { key: 'activity',   label: 'Activities', emoji: '⚡' },
];

interface EventsPageProps {
  defaultType?: string;
  title?:       string;
  noCityFilter?: boolean;
  fixedType?:   string;  // locks the type filter and hides the tab bar
}

export default function EventsPage({ defaultType, title, noCityFilter, fixedType }: EventsPageProps) {
  const [searchParams, setSearchParams] = useSearchParams();
  const { selectedCity } = useCityStore();
  const cityId   = selectedCity?.id ?? null;
  const cityName = selectedCity?.name ?? '';

  const typeParam = searchParams.get('type') ?? defaultType ?? null;
  const pageParam = Math.max(1, Number(searchParams.get('page') ?? '1'));

  const [activeType, setActiveType] = useState<string | null>(typeParam);
  const [page, setPage] = useState(pageParam);

  // When fixedType is provided, always use it regardless of tab/URL state
  const resolvedType = fixedType ?? activeType;

  function selectTab(key: string | null) {
    setActiveType(key);
    setPage(1);
    setSearchParams(key ? { type: key } : {}, { replace: true });
  }

  function goPage(p: number) {
    setPage(p);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  // Sports/Plays pages pass noCityFilter so touring events without a venue show everywhere.
  // On /events, city always filters — All tab and type-specific tabs both respect selected city.
  const effectiveCityId = noCityFilter ? null : cityId;

  const { data, isLoading, isFetching } = useEvents(resolvedType, effectiveCityId, page);
  const events     = data?.items ?? [];
  const total      = data?.total ?? 0;
  const totalPages = data?.totalPages ?? 0;

  const headingTitle = title
    ?? TABS.find((t) => t.key === resolvedType)?.label
    ?? 'Events';

  return (
    <PublicLayout>
      <Helmet><title>Events &amp; Shows | BookKaroo</title></Helmet>
      {/* Sticky filter bar — hidden when fixedType locks the page to a single type */}
      {!fixedType && (
        <div className="sticky top-[105px] z-30 bg-bg-surface/95 backdrop-blur-md border-b border-border-default">
          <div className="max-w-[1280px] mx-auto px-4 sm:px-6 py-3 overflow-x-auto scrollbar-none">
            <div className="flex gap-1.5 flex-nowrap">
              {TABS.map((t) => (
                <Chip
                  key={t.label}
                  active={resolvedType === t.key}
                  onToggle={() => selectTab(t.key)}
                >
                  {t.emoji} {t.label}
                </Chip>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Content */}
      <div className="max-w-[1280px] mx-auto px-4 sm:px-6 py-8">
        <div className="mb-6">
          <p className="text-[11px] font-semibold text-text-muted tracking-widest uppercase font-sans mb-1">
            {headingTitle}{cityName && !noCityFilter ? ` · ${cityName}` : ''}
          </p>
          <h1 className="font-display font-semibold text-3xl md:text-4xl tracking-tight">
            {headingTitle === 'All' ? 'Events & Shows' : headingTitle}
          </h1>
          {!isLoading && (
            <p className="text-text-secondary text-sm mt-2 font-sans">
              {total} event{total === 1 ? '' : 's'}
              {cityName && !noCityFilter ? ` in ${cityName}` : ''}
            </p>
          )}
        </div>

        {isLoading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {Array.from({ length: 10 }, (_, i) => (
              <div key={i} className="space-y-2">
                <Skeleton className="aspect-[3/4] rounded-lg" />
                <Skeleton height={14} width="80%" />
                <Skeleton height={11} width="55%" />
              </div>
            ))}
          </div>
        ) : events.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <span className="text-5xl mb-4">🎪</span>
            <h3 className="font-display text-xl text-text-secondary mb-2">
              No {headingTitle === 'All' ? 'events' : headingTitle.toLowerCase()} right now
            </h3>
            <p className="text-text-muted text-sm font-sans">
              {cityName && !noCityFilter ? `Try changing your city or c` : 'C'}heck back soon — events are added regularly.
            </p>
          </div>
        ) : (
          <div className={cn(
            'grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 transition-opacity duration-200',
            isFetching ? 'opacity-60' : 'opacity-100',
          )}>
            {events.map((e) => <EventCard key={e.id} event={e} />)}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-center gap-2 mt-10">
            <PaginationBtn label="←" disabled={page === 1} onClick={() => goPage(page - 1)} />
            {buildPageRange(page, totalPages).map((p, i) =>
              p === '…' ? (
                <span key={`e${i}`} className="w-9 h-9 flex items-center justify-center text-text-muted text-sm">…</span>
              ) : (
                <PaginationBtn key={p} label={String(p)} active={p === page} onClick={() => goPage(p as number)} />
              )
            )}
            <PaginationBtn label="→" disabled={page === totalPages} onClick={() => goPage(page + 1)} />
          </div>
        )}
      </div>
    </PublicLayout>
  );
}

function PaginationBtn({ label, active, disabled, onClick }: {
  label: string; active?: boolean; disabled?: boolean; onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={cn(
        'w-9 h-9 rounded-md text-sm font-sans transition-colors',
        active
          ? 'bg-gradient-to-r from-accent-indigo to-accent-purple text-white'
          : disabled
          ? 'text-text-muted cursor-default bg-bg-surface'
          : 'bg-bg-surface text-text-secondary hover:text-text-primary border border-border-default',
      )}
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
