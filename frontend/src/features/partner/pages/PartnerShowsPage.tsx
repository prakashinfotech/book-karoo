import { useState, useEffect, useRef } from 'react';
import { Search, X, Plus, AlertTriangle } from 'lucide-react';
import { PartnerLayout } from '../components/PartnerLayout';
import { usePartnerShows, useCancelPartnerShow, usePartnerVenues } from '../api/usePartner';
import { PartnerShowFormModal } from '../components/PartnerShowFormModal';
import { Modal } from '@/shared/components/ui/Modal';
import { AdminTable, type Column } from '@/features/admin/components/AdminTable';
import type { PartnerShowResponse } from '../types';

const STATUS_CLASSES: Record<string, string> = {
  Scheduled: 'bg-semantic-success/15 text-semantic-success',
  Cancelled:  'bg-accent-crimson/15 text-accent-crimson',
  Completed:  'bg-bg-surface3 text-text-muted',
};

const defaultFromDate = () => new Date().toISOString().split('T')[0];
const defaultToDate   = () => {
  const d = new Date();
  d.setDate(d.getDate() + 7);
  return d.toISOString().split('T')[0];
};

// ── Cancel Modal ─────────────────────────────────────────────────────────────

interface CancelModalProps {
  show:      PartnerShowResponse;
  isLoading: boolean;
  onClose:   () => void;
  onConfirm: () => void;
}

function CancelShowModal({ show, isLoading, onClose, onConfirm }: CancelModalProps) {
  return (
    <Modal open onClose={onClose} maxWidth="max-w-sm">
      <div className="flex flex-col gap-4">
        <div className="flex items-center gap-2 text-semantic-warning">
          <AlertTriangle size={20} />
          <h3 className="font-display font-bold text-lg">Cancel Show?</h3>
        </div>

        <div>
          <p className="font-semibold text-text-primary text-[15px]">
            {show.movieTitle ?? show.eventTitle}
          </p>
          <p className="text-text-muted text-sm mt-0.5">
            {show.showDate} · {show.showTime} · {show.venueName}
          </p>
        </div>

        {show.bookedSeats > 0 ? (
          <div className="rounded-lg border border-semantic-warning/30 bg-semantic-warning/10 p-3 space-y-1">
            <p className="text-sm font-medium text-semantic-warning">
              ⚠️ This will cancel {show.bookedSeats} confirmed booking(s)
            </p>
            <p className="text-xs text-text-muted">Customers will be notified by email</p>
            <p className="text-xs text-text-muted">Refunds will be processed automatically</p>
          </div>
        ) : (
          <p className="text-sm text-text-muted">No active bookings for this show.</p>
        )}

        <div className="flex flex-col gap-2">
          <button
            onClick={onClose}
            className="w-full px-4 py-2 rounded-lg border border-border-default text-text-secondary hover:bg-bg-surface2 transition-colors text-sm"
          >
            Keep Show
          </button>
          <button
            onClick={onConfirm}
            disabled={isLoading}
            className="w-full px-4 py-2 rounded-lg text-white text-sm font-semibold disabled:opacity-60 hover:opacity-90 transition-opacity"
            style={{ background: '#E11D74' }}
          >
            {isLoading ? 'Cancelling…' : 'Cancel Show'}
          </button>
        </div>
      </div>
    </Modal>
  );
}

// ── Page ─────────────────────────────────────────────────────────────────────

export default function PartnerShowsPage() {
  const initFrom = defaultFromDate();
  const initTo   = defaultToDate();

  const [venueId,  setVenueId]  = useState('');
  const [status,   setStatus]   = useState('');
  const [fromDate, setFromDate] = useState(initFrom);
  const [toDate,   setToDate]   = useState(initTo);
  const [page,     setPage]     = useState(1);
  const [search,   setSearch]   = useState('');
  const [debouncedSearch, setDebounced] = useState('');
  const [showCreate,     setShowCreate]     = useState(false);
  const [cancellingShow, setCancellingShow] = useState<PartnerShowResponse | null>(null);

  const debounceRef = useRef<ReturnType<typeof setTimeout>>();
  useEffect(() => {
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => { setDebounced(search); setPage(1); }, 400);
    return () => clearTimeout(debounceRef.current);
  }, [search]);

  const { data: venues } = usePartnerVenues();
  const { data, isLoading } = usePartnerShows({
    venueId:  venueId          || undefined,
    status:   status           || undefined,
    fromDate: fromDate         || undefined,
    toDate:   toDate           || undefined,
    search:   debouncedSearch  || undefined,
    page,
    pageSize: 15,
  });
  const cancelShow = useCancelPartnerShow();

  const shows = data?.items ?? [];

  const isFiltered = !!search || !!venueId || !!status || fromDate !== initFrom || toDate !== initTo;

  function clearFilters() {
    setSearch(''); setDebounced('');
    setVenueId(''); setStatus('');
    setFromDate(initFrom); setToDate(initTo);
    setPage(1);
  }

  const columns: Column<PartnerShowResponse>[] = [
    {
      key: 'show', header: 'Title',
      render: (s) => (
        <div>
          <p className="text-[13px] font-semibold text-text-primary line-clamp-1">
            {s.movieTitle ?? s.eventTitle ?? '—'}
          </p>
          <p className="text-[11px] text-text-muted">{s.format}{s.language ? ` · ${s.language}` : ''}</p>
        </div>
      ),
    },
    {
      key: 'venue', header: 'Venue / Screen',
      render: (s) => (
        <div>
          <p className="text-[13px] text-text-primary">{s.venueName}</p>
          <p className="text-[11px] text-text-muted">{s.screenName}</p>
        </div>
      ),
    },
    {
      key: 'datetime', header: 'Date & Time',
      render: (s) => (
        <div>
          <p className="text-[13px] text-text-primary">{s.showDate}</p>
          <p className="text-[11px] text-text-muted">{s.showTime}</p>
        </div>
      ),
    },
    {
      key: 'bookings', header: 'Bookings',
      render: (s) => (
        <span className="text-[13px] text-text-primary">{s.bookedSeats}</span>
      ),
    },
    {
      key: 'status', header: 'Status',
      render: (s) => (
        <span className={`inline-block text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${STATUS_CLASSES[s.status] ?? 'bg-bg-surface2 text-text-muted'}`}>
          {s.status}
        </span>
      ),
    },
    {
      key: 'actions', header: 'Actions',
      render: (s) => (
        s.status === 'Scheduled' ? (
          <button
            onClick={(e) => { e.stopPropagation(); setCancellingShow(s); }}
            className="px-2 py-1 rounded-lg border border-semantic-error/40 text-semantic-error text-[11px] hover:bg-semantic-error/08 transition-colors"
          >
            Cancel Show
          </button>
        ) : (
          <span className="text-[11px] text-text-muted">—</span>
        )
      ),
    },
  ];

  return (
    <PartnerLayout>
      <div className="max-w-[1280px] mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-5">
        <header className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h1 className="text-2xl font-display font-bold text-text-primary">Shows</h1>
            <p className="text-sm text-text-secondary mt-1">View and manage shows for your venues.</p>
          </div>
          <button
            onClick={() => setShowCreate(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-[13px] font-semibold border border-accent-crimson/40 text-accent-crimson bg-accent-crimson/08 hover:bg-accent-crimson/15 transition-colors"
          >
            <Plus size={14} /> Create Show
          </button>
        </header>

        <div className="space-y-3">
          <div className="flex flex-wrap gap-3">
            <div className="relative flex-1 min-w-48">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search title, venue, screen…"
                className="w-full pl-8 pr-8 py-2 rounded-lg bg-bg-surface2 border border-border-default text-text-primary text-sm focus:outline-none focus:border-accent-indigo"
              />
              {search && (
                <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary">
                  <X size={12} />
                </button>
              )}
            </div>

            <select
              value={venueId}
              onChange={(e) => { setVenueId(e.target.value); setPage(1); }}
              className="px-3 py-2 rounded-lg bg-bg-surface2 border border-border-default text-text-primary text-sm focus:outline-none focus:border-accent-indigo [color-scheme:light]"
            >
              <option value="">All Venues</option>
              {venues?.map((v) => <option key={v.id} value={v.id}>{v.name}</option>)}
            </select>

            <select
              value={status}
              onChange={(e) => { setStatus(e.target.value); setPage(1); }}
              className="px-3 py-2 rounded-lg bg-bg-surface2 border border-border-default text-text-primary text-sm focus:outline-none focus:border-accent-indigo [color-scheme:light]"
            >
              <option value="">All Statuses</option>
              <option value="Scheduled">Scheduled</option>
              <option value="Cancelled">Cancelled</option>
              <option value="Completed">Completed</option>
            </select>
          </div>

          <div className="flex flex-wrap gap-3 items-center">
            <div className="flex items-center gap-2">
              <label className="text-sm text-text-muted whitespace-nowrap">From</label>
              <input
                type="date"
                value={fromDate}
                onChange={(e) => { setFromDate(e.target.value); setPage(1); }}
                className="px-2 py-2 rounded-lg bg-bg-surface2 border border-border-default text-text-primary text-sm focus:outline-none focus:border-accent-indigo [color-scheme:light]"
              />
            </div>
            <div className="flex items-center gap-2">
              <label className="text-sm text-text-muted whitespace-nowrap">To</label>
              <input
                type="date"
                value={toDate}
                onChange={(e) => { setToDate(e.target.value); setPage(1); }}
                className="px-2 py-2 rounded-lg bg-bg-surface2 border border-border-default text-text-primary text-sm focus:outline-none focus:border-accent-indigo [color-scheme:light]"
              />
            </div>

            {isFiltered && (
              <button
                onClick={clearFilters}
                className="flex items-center gap-1 text-sm text-accent-indigo hover:underline whitespace-nowrap"
              >
                <X size={12} /> Clear filters
              </button>
            )}
          </div>
        </div>

        <AdminTable
          columns={columns}
          data={shows}
          isLoading={isLoading}
          emptyMessage="No shows found for the selected filters."
        />

        {data && data.totalPages > 1 && (
          <div className="flex items-center justify-between mt-4">
            <p className="text-sm text-text-muted">{data.total} shows</p>
            <div className="flex gap-2">
              <button disabled={page <= 1} onClick={() => setPage((p) => p - 1)} className="px-3 py-1 rounded-lg border border-border-default text-sm text-text-secondary disabled:opacity-40">← Prev</button>
              <span className="px-3 py-1 text-sm text-text-primary">Page {page} / {data.totalPages}</span>
              <button disabled={page >= data.totalPages} onClick={() => setPage((p) => p + 1)} className="px-3 py-1 rounded-lg border border-border-default text-sm text-text-secondary disabled:opacity-40">Next →</button>
            </div>
          </div>
        )}
      </div>

      {showCreate && (
        <PartnerShowFormModal
          onClose={() => setShowCreate(false)}
          onSuccess={() => setShowCreate(false)}
        />
      )}

      {cancellingShow && (
        <CancelShowModal
          show={cancellingShow}
          isLoading={cancelShow.isPending}
          onClose={() => setCancellingShow(null)}
          onConfirm={() => cancelShow.mutate(cancellingShow.id, { onSuccess: () => setCancellingShow(null) })}
        />
      )}
    </PartnerLayout>
  );
}
