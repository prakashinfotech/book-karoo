import { useState, useCallback } from 'react';
import { Pencil, Trash2, Search, X } from 'lucide-react';
import { AdminLayout } from '@/shared/components/layout/AdminLayout';
import { TMDB_POSTER } from '@/shared/constants';
import { cn } from '@/shared/lib/utils';
import { AdminTable, type Column } from '../components/AdminTable';
import { MovieFormModal } from '../components/MovieFormModal';
import { DeleteConfirmModal } from '../components/DeleteConfirmModal';
import {
  useAdminMovies, useAdminMovie, useDeleteMovie, useImportPopular,
} from '../api/useAdmin';
import type { AdminMovieResponse, AdminMovieFilters, AdminMovieDetailResponse } from '../types';

const STATUS_STYLE: Record<string, string> = {
  Draft:     'bg-bg-surface3 text-text-muted',
  Published: 'bg-semantic-success/15 text-semantic-success',
  Archived:  'bg-bg-surface3 text-text-muted border border-border-default',
};
const CATEGORY_LABEL: Record<string, string> = {
  NowShowing: 'Now Showing', ComingSoon: 'Coming Soon',
  Exclusive: 'Exclusive', Premiere: 'Premiere',
};

const STATUS_TABS  = ['All', 'Draft', 'Published', 'Archived'];
const CATEGORY_TABS = ['All', 'NowShowing', 'ComingSoon', 'Exclusive', 'Premiere'];

function useDebouncedValue(value: string, delay: number) {
  const [debounced, setDebounced] = useState(value);
  const [timer, setTimer] = useState<ReturnType<typeof setTimeout> | null>(null);
  const update = useCallback((v: string) => {
    if (timer) clearTimeout(timer);
    setTimer(setTimeout(() => setDebounced(v), delay));
  }, [delay, timer]);
  return [debounced, update] as const;
}

export default function AdminMoviesPage() {
  const [search, setSearch]     = useState('');
  const [debouncedSearch, updateSearch] = useDebouncedValue('', 400);
  const [statusTab, setStatusTab]       = useState('All');
  const [categoryTab, setCategoryTab]   = useState('All');
  const [page, setPage]                 = useState(1);
  const [showCreate, setShowCreate]     = useState(false);
  const [editId, setEditId]             = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<AdminMovieResponse | null>(null);

  const filters: AdminMovieFilters = {
    search:   debouncedSearch || undefined,
    status:   statusTab   !== 'All' ? statusTab   : undefined,
    category: categoryTab !== 'All' ? categoryTab : undefined,
  };

  const { data, isLoading }           = useAdminMovies(filters, page);
  const { data: editMovie, isLoading: editLoading } = useAdminMovie(editId);
  const deleteMutation                = useDeleteMovie();
  const importMutation                = useImportPopular();

  const movies     = data?.items     ?? [];
  const total      = data?.total     ?? 0;
  const totalPages = data?.totalPages ?? 1;

  const columns: Column<AdminMovieResponse>[] = [
    {
      key: 'movie', header: 'Movie',
      render: (m) => (
        <div className="flex items-center gap-3">
          {m.posterUrl ? (
            <img src={m.posterUrl.startsWith('/') ? TMDB_POSTER(m.posterUrl, 'w92') : m.posterUrl}
              alt="" className="w-9 h-14 object-cover rounded flex-shrink-0" />
          ) : (
            <div className="w-9 h-14 bg-bg-surface3 rounded flex-shrink-0 flex items-center justify-center text-text-muted text-xs">?</div>
          )}
          <div>
            <p className="font-medium text-text-primary leading-tight">{m.title}</p>
            {m.certificate && (
              <span className="text-[10px] text-text-muted border border-border-default rounded px-1">{m.certificate}</span>
            )}
          </div>
        </div>
      ),
    },
    {
      key: 'status', header: 'Status', width: '110px',
      render: (m) => (
        <span className={cn('inline-flex px-2 py-0.5 rounded-full text-[11px] font-semibold', STATUS_STYLE[m.status] ?? 'bg-bg-surface3 text-text-muted')}>
          {m.status}
        </span>
      ),
    },
    {
      key: 'category', header: 'Category', width: '130px',
      render: (m) => <span className="text-text-secondary">{CATEGORY_LABEL[m.category] ?? m.category}</span>,
    },
    {
      key: 'languages', header: 'Languages', width: '140px',
      render: (m) => {
        const langs = m.languages ?? [];
        return <span className="text-text-secondary text-xs">{langs.slice(0, 2).join(', ')}{langs.length > 2 ? ` +${langs.length - 2}` : ''}</span>;
      },
    },
    {
      key: 'rating', header: 'Rating', width: '80px',
      render: (m) => m.imdbRating
        ? <span className="text-amber-400 font-semibold">★ {m.imdbRating}</span>
        : <span className="text-text-muted">—</span>,
    },
    {
      key: 'actions', header: 'Actions', width: '90px',
      render: (m) => (
        <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
          <button onClick={() => setEditId(m.id)} title="Edit"
            className="text-accent-indigo hover:opacity-70 transition-opacity">
            <Pencil size={14} />
          </button>
          <button onClick={() => setDeleteTarget(m)} title="Delete"
            className="text-semantic-error hover:opacity-70 transition-opacity">
            <Trash2 size={14} />
          </button>
        </div>
      ),
    },
  ];

  function handleRefresh() {
    setPage(1);
  }

  return (
    <AdminLayout>
      <div className="p-6 md:p-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
          <div>
            <h1 className="font-display font-bold text-2xl tracking-tight text-text-primary">Movies</h1>
            <p className="text-text-muted text-sm font-sans">
              {total > 0 ? `${total} movies in catalogue` : 'Manage your movie catalogue'}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => importMutation.mutate()}
              disabled={importMutation.isPending}
              className="px-4 py-2 rounded-full border border-accent-indigo text-accent-indigo text-sm font-semibold font-sans hover:bg-accent-indigo/08 disabled:opacity-60 transition-colors"
            >
              {importMutation.isPending ? 'Importing…' : 'Import Popular'}
            </button>
            <button onClick={() => setShowCreate(true)}
              className="px-4 py-2 rounded-full bg-accent-crimson text-white text-sm font-semibold font-sans hover:opacity-90 transition-opacity">
              + Add Movie
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3 mb-5">
          {/* Search */}
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none" />
            <input
              value={search}
              onChange={(e) => { setSearch(e.target.value); updateSearch(e.target.value); setPage(1); }}
              placeholder="Search movies…"
              className="pl-8 pr-8 py-2 rounded-lg bg-bg-surface border border-border-default text-sm font-sans text-text-primary focus:outline-none focus:border-accent-indigo w-52"
            />
            {search && (
              <button onClick={() => { setSearch(''); updateSearch(''); setPage(1); }}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary">
                <X size={14} />
              </button>
            )}
          </div>

          {/* Status dropdown */}
          <div className="flex items-center gap-2">
            <label className="text-[11px] font-semibold text-text-muted uppercase tracking-wider whitespace-nowrap font-sans">
              Status
            </label>
            <select
              value={statusTab}
              onChange={(e) => { setStatusTab(e.target.value); setPage(1); }}
              className="px-3 py-2 rounded-lg bg-bg-surface border border-border-default text-sm font-sans text-text-primary focus:outline-none focus:border-accent-indigo cursor-pointer [color-scheme:dark]"
            >
              {STATUS_TABS.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>

          {/* Category dropdown */}
          <div className="flex items-center gap-2">
            <label className="text-[11px] font-semibold text-text-muted uppercase tracking-wider whitespace-nowrap font-sans">
              Category
            </label>
            <select
              value={categoryTab}
              onChange={(e) => { setCategoryTab(e.target.value); setPage(1); }}
              className="px-3 py-2 rounded-lg bg-bg-surface border border-border-default text-sm font-sans text-text-primary focus:outline-none focus:border-accent-indigo cursor-pointer [color-scheme:dark]"
            >
              {CATEGORY_TABS.map((t) => (
                <option key={t} value={t}>{CATEGORY_LABEL[t] ?? t}</option>
              ))}
            </select>
          </div>

          {/* Clear filters */}
          {(statusTab !== 'All' || categoryTab !== 'All' || search) && (
            <button
              onClick={() => { setStatusTab('All'); setCategoryTab('All'); setSearch(''); updateSearch(''); setPage(1); }}
              className="text-xs text-accent-indigo font-semibold font-sans hover:underline"
            >
              Clear filters
            </button>
          )}
        </div>

        {/* Table */}
        <AdminTable columns={columns} data={movies} isLoading={isLoading} emptyMessage="No movies found." />

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between mt-4 text-sm font-sans">
            <span className="text-text-muted">Page {page} of {totalPages} · {total} total</span>
            <div className="flex gap-2">
              <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page <= 1}
                className="px-3 py-1.5 rounded-lg border border-border-default text-text-secondary hover:bg-bg-surface2 disabled:opacity-40 transition-colors">
                Prev
              </button>
              <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page >= totalPages}
                className="px-3 py-1.5 rounded-lg border border-border-default text-text-secondary hover:bg-bg-surface2 disabled:opacity-40 transition-colors">
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Create modal */}
      {showCreate && (
        <MovieFormModal mode="create" onClose={() => setShowCreate(false)} onSuccess={handleRefresh} />
      )}

      {/* Edit modal */}
      {editId && !editLoading && editMovie && (
        <MovieFormModal mode="edit" movie={editMovie as AdminMovieDetailResponse}
          onClose={() => setEditId(null)} onSuccess={handleRefresh} />
      )}

      {/* Delete modal */}
      {deleteTarget && (
        <DeleteConfirmModal
          itemName={deleteTarget.title}
          isLoading={deleteMutation.isPending}
          onClose={() => setDeleteTarget(null)}
          onConfirm={async () => {
            await deleteMutation.mutateAsync(deleteTarget.id);
            setDeleteTarget(null);
          }}
        />
      )}
    </AdminLayout>
  );
}
