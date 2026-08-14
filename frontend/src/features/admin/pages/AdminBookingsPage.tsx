import { useState, useEffect, useRef } from 'react';
import { Search, X } from 'lucide-react';
import { AdminLayout } from '@/shared/components/layout/AdminLayout';
import { AdminTable, type Column } from '../components/AdminTable';
import { BookingDetailDrawer } from '../components/BookingDetailDrawer';
import { useAdminBookings } from '../api/useAdmin';
import type { AdminBooking, AdminBookingFilters } from '../types';

const STATUS_CLASSES: Record<string, string> = {
  Confirmed: 'bg-semantic-success/15 text-semantic-success',
  Cancelled: 'bg-accent-crimson/15 text-accent-crimson',
  Pending:   'bg-amber-500/15 text-amber-400',
  Refunded:  'bg-accent-indigo/15 text-accent-indigo',
};

function fmt(n: number) {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n);
}

function relativeTime(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 1)    return 'Just now';
  if (mins < 60)   return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24)    return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 30)   return `${days}d ago`;
  return new Date(iso).toLocaleDateString('en-IN');
}

const thirtyDaysAgo = () => {
  const d = new Date();
  d.setDate(d.getDate() - 30);
  return d.toISOString().split('T')[0];
};
const today = () => new Date().toISOString().split('T')[0];

export default function AdminBookingsPage() {
  const [search,       setSearch]       = useState('');
  const [debouncedSearch, setDebounced] = useState('');
  const [status,       setStatus]       = useState('');
  const [cityId,       setCityId]       = useState('');
  const [fromDate,     setFromDate]     = useState(thirtyDaysAgo());
  const [toDate,       setToDate]       = useState(today());
  const [page,         setPage]         = useState(1);
  const [selectedRef,  setSelectedRef]  = useState<string | null>(null);

  const debounceRef = useRef<ReturnType<typeof setTimeout>>();
  useEffect(() => {
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => { setDebounced(search); setPage(1); }, 400);
    return () => clearTimeout(debounceRef.current);
  }, [search]);

  const filters: AdminBookingFilters = {
    search:   debouncedSearch || undefined,
    status:   status          || undefined,
    cityId:   cityId          || undefined,
    fromDate: fromDate        || undefined,
    toDate:   toDate          || undefined,
  };

  const { data, isLoading } = useAdminBookings(filters, page);
  const bookings = data?.items ?? [];

  const isDefaultFilter = !debouncedSearch && !status && !cityId && fromDate === thirtyDaysAgo() && toDate === today();

  function clearFilters() {
    setSearch(''); setDebounced(''); setStatus(''); setCityId('');
    setFromDate(thirtyDaysAgo()); setToDate(today()); setPage(1);
  }

  // Summary cards
  const confirmed = bookings.filter((b) => b.status === 'Confirmed');
  const cancelled = bookings.filter((b) => b.status === 'Cancelled');
  const revenue   = confirmed.reduce((s, b) => s + b.amountPaid, 0);

  const summaryItems = [
    { label: 'Total Results', value: String(data?.total ?? 0) },
    { label: 'Confirmed',     value: String(confirmed.length) },
    { label: 'Revenue',       value: fmt(revenue)             },
    { label: 'Cancelled',     value: String(cancelled.length) },
  ];

  const columns: Column<AdminBooking>[] = [
    {
      key: 'booking', header: 'Booking',
      render: (b) => (
        <div>
          <p className="font-mono text-[12px] text-accent-indigo font-semibold">{b.bookingRef}</p>
          <p className="text-[11px] text-text-muted">{relativeTime(b.createdAt)}</p>
        </div>
      ),
    },
    {
      key: 'customer', header: 'Customer',
      render: (b) => (
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-full bg-gradient-to-br from-accent-indigo to-accent-purple flex items-center justify-center text-white text-[10px] font-bold flex-shrink-0">
            {b.userName.charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0">
            <p className="text-[13px] font-semibold text-text-primary line-clamp-1">{b.userName}</p>
            <p className="text-[11px] text-text-muted truncate max-w-[160px]">{b.userEmail}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'movie', header: 'Movie / Event', width: '180px',
      render: (b) => (
        <div className="flex items-center gap-2">
          {b.posterUrl && (
            <img
              src={b.posterUrl.startsWith('http') ? b.posterUrl : `https://image.tmdb.org/t/p/w92${b.posterUrl}`}
              alt="" className="w-8 h-12 object-cover rounded-sm flex-shrink-0"
            />
          )}
          <div className="min-w-0">
            <p className="text-[13px] font-semibold text-text-primary line-clamp-1 max-w-[140px]">
              {b.movieTitle ?? b.eventTitle ?? '—'}
            </p>
            <p className="text-[11px] text-text-muted">{b.showDateLabel}</p>
            <p className="text-[11px] text-text-muted">{b.showTimeLabel}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'venue', header: 'Venue',
      render: (b) => (
        <div>
          <p className="text-[13px] text-text-primary line-clamp-1">{b.venueName}</p>
          <p className="text-[11px] text-text-muted">{b.cityName}</p>
        </div>
      ),
    },
    {
      key: 'seats', header: 'Seats',
      render: (b) => (
        <div>
          <p className="text-[13px] font-semibold text-text-primary">{b.ticketQty} seat{b.ticketQty !== 1 ? 's' : ''}</p>
          {b.seatsSummary && (
            <p className="text-[11px] text-text-muted line-clamp-1 max-w-[128px]">{b.seatsSummary}</p>
          )}
        </div>
      ),
    },
    {
      key: 'amount', header: 'Amount',
      render: (b) => (
        <div className="text-right">
          <p className="text-[13px] font-semibold text-text-primary">{fmt(b.amountPaid)}</p>
          {b.discount > 0 && <p className="text-[10px] text-semantic-success">saved {fmt(b.discount)}</p>}
        </div>
      ),
    },
    {
      key: 'status', header: 'Status',
      render: (b) => (
        <span className={`inline-block text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${STATUS_CLASSES[b.status] ?? 'bg-bg-surface2 text-text-muted'}`}>
          {b.status}
        </span>
      ),
    },
    {
      key: 'actions', header: 'Actions',
      render: (b) => (
        <button
          onClick={(e) => { e.stopPropagation(); setSelectedRef(b.bookingRef); }}
          className="px-2 py-1 rounded-lg border border-border-default text-text-secondary text-[11px] hover:border-accent-indigo hover:text-accent-indigo transition-colors"
        >
          View
        </button>
      ),
    },
  ];

  return (
    <AdminLayout>
      <div className="p-6 md:p-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="font-display font-bold text-2xl mb-1 tracking-tight">
              Bookings
              {data && <span className="ml-2 text-base font-normal text-text-muted">({data.total})</span>}
            </h1>
            <p className="text-text-muted text-sm font-sans">View and manage all ticket bookings.</p>
          </div>
        </div>

        {/* Filter bar */}
        <div className="space-y-3 mb-5">
          {/* Row 1 */}
          <div className="flex flex-wrap gap-3">
            <div className="relative flex-1 min-w-48">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search booking ref, name, email…"
                className="w-full pl-8 pr-8 py-2 rounded-lg bg-bg-surface2 border border-border-default text-text-primary text-sm focus:outline-none focus:border-accent-indigo"
              />
              {search && (
                <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary">
                  <X size={12} />
                </button>
              )}
            </div>
            <select
              value={status}
              onChange={(e) => { setStatus(e.target.value); setPage(1); }}
              className="px-3 py-2 rounded-lg bg-bg-surface2 border border-border-default text-text-primary text-sm focus:outline-none focus:border-accent-indigo [color-scheme:dark]"
            >
              <option value="">All Statuses</option>
              <option value="Pending">Pending</option>
              <option value="Confirmed">Confirmed</option>
              <option value="Cancelled">Cancelled</option>
              <option value="Refunded">Refunded</option>
            </select>
          </div>

          {/* Row 2 */}
          <div className="flex flex-wrap gap-3 items-center">
            <div className="flex items-center gap-2">
              <label className="text-sm text-text-muted whitespace-nowrap">From</label>
              <input
                type="date"
                value={fromDate}
                onChange={(e) => { setFromDate(e.target.value); setPage(1); }}
                className="px-2 py-2 rounded-lg bg-bg-surface2 border border-border-default text-text-primary text-sm focus:outline-none focus:border-accent-indigo"
              />
            </div>
            <div className="flex items-center gap-2">
              <label className="text-sm text-text-muted whitespace-nowrap">To</label>
              <input
                type="date"
                value={toDate}
                onChange={(e) => { setToDate(e.target.value); setPage(1); }}
                className="px-2 py-2 rounded-lg bg-bg-surface2 border border-border-default text-text-primary text-sm focus:outline-none focus:border-accent-indigo"
              />
            </div>
            {!isDefaultFilter && (
              <button
                onClick={clearFilters}
                className="text-sm text-accent-indigo hover:underline flex items-center gap-1 whitespace-nowrap"
              >
                <X size={12} /> Clear filters
              </button>
            )}
          </div>
        </div>

        {/* Summary cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
          {summaryItems.map(({ label, value }) => (
            <div key={label} className="rounded-xl border border-border-default bg-bg-surface p-3">
              <p className="text-[11px] text-text-muted uppercase tracking-wider mb-1">{label}</p>
              <p className="text-lg font-bold text-text-primary font-display">{isLoading ? '…' : value}</p>
              <p className="text-[10px] text-text-muted font-sans">(filtered)</p>
            </div>
          ))}
        </div>

        <AdminTable
          columns={columns}
          data={bookings}
          isLoading={isLoading}
          emptyMessage="No bookings found matching your filters."
          onRowClick={(b) => setSelectedRef(b.bookingRef)}
        />

        {/* Pagination */}
        {data && data.totalPages > 1 && (
          <div className="flex items-center justify-between mt-4">
            <p className="text-sm text-text-muted">{data.total} bookings</p>
            <div className="flex gap-2">
              <button disabled={page <= 1} onClick={() => setPage((p) => p - 1)} className="px-3 py-1 rounded-lg border border-border-default text-sm text-text-secondary disabled:opacity-40">← Prev</button>
              <span className="px-3 py-1 text-sm text-text-primary">Page {page} / {data.totalPages}</span>
              <button disabled={page >= data.totalPages} onClick={() => setPage((p) => p + 1)} className="px-3 py-1 rounded-lg border border-border-default text-sm text-text-secondary disabled:opacity-40">Next →</button>
            </div>
          </div>
        )}
      </div>

      <BookingDetailDrawer
        bookingRef={selectedRef}
        onClose={() => setSelectedRef(null)}
      />
    </AdminLayout>
  );
}
