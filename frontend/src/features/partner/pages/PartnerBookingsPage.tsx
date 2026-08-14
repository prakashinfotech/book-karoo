import { useState, useEffect, useRef } from 'react';
import { Search, X } from 'lucide-react';
import { PartnerLayout } from '../components/PartnerLayout';
import { usePartnerBookings, usePartnerVenues } from '../api/usePartner';
import { PartnerBookingDetailDrawer } from '../components/PartnerBookingDetailDrawer';
import { AdminTable, type Column } from '@/features/admin/components/AdminTable';
import type { PartnerBookingListItem } from '../types';

const STATUS_CLASSES: Record<string, string> = {
  Confirmed: 'bg-semantic-success/15 text-semantic-success',
  Cancelled: 'bg-accent-crimson/15 text-accent-crimson',
  Pending:   'bg-amber-500/15 text-amber-400',
  Refunded:  'bg-accent-indigo/15 text-accent-indigo',
};

function fmt(n: number) {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n);
}

const thirtyDaysAgo = () => {
  const d = new Date();
  d.setDate(d.getDate() - 30);
  return d.toISOString().split('T')[0];
};
const today = () => new Date().toISOString().split('T')[0];

export default function PartnerBookingsPage() {
  const [venueId,  setVenueId]  = useState('');
  const [status,   setStatus]   = useState('');
  const [fromDate, setFromDate] = useState(thirtyDaysAgo());
  const [toDate,   setToDate]   = useState(today());
  const [page,     setPage]     = useState(1);
  const [search,   setSearch]   = useState('');
  const [debouncedSearch, setDebounced] = useState('');
  const [selectedRef, setSelectedRef] = useState<string | null>(null);

  const debounceRef = useRef<ReturnType<typeof setTimeout>>();
  useEffect(() => {
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => { setDebounced(search); setPage(1); }, 400);
    return () => clearTimeout(debounceRef.current);
  }, [search]);

  const { data: venues } = usePartnerVenues();
  const { data, isLoading } = usePartnerBookings({
    search:   debouncedSearch || undefined,
    venueId:  venueId         || undefined,
    status:   status          || undefined,
    fromDate: fromDate        || undefined,
    toDate:   toDate          || undefined,
    page,
    pageSize: 15,
  });

  const bookings = data?.items ?? [];

  const columns: Column<PartnerBookingListItem>[] = [
    {
      key: 'ref', header: 'Booking Ref',
      render: (b) => (
        <p className="font-mono text-[12px] text-accent-indigo font-semibold">{b.bookingRef}</p>
      ),
    },
    {
      key: 'customer', header: 'Customer',
      render: (b) => (
        <p className="text-[13px] font-semibold text-text-primary">{b.userName}</p>
      ),
    },
    {
      key: 'show', header: 'Show',
      render: (b) => (
        <div>
          <p className="text-[13px] text-text-primary line-clamp-1">{b.movieOrEventTitle}</p>
          <p className="text-[11px] text-text-muted">{b.venueName} · {b.screenName}</p>
          <p className="text-[11px] text-text-muted">
            {new Date(b.showDatetime).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}
          </p>
        </div>
      ),
    },
    {
      key: 'tickets', header: 'Tickets',
      render: (b) => (
        <p className="text-[13px] text-text-primary">{b.ticketQty} seat{b.ticketQty !== 1 ? 's' : ''}</p>
      ),
    },
    {
      key: 'amount', header: 'Amount',
      render: (b) => (
        <p className="text-[13px] font-semibold text-text-primary tabular-nums">{fmt(b.amountPaid)}</p>
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
      key: 'booked', header: 'Booked',
      render: (b) => (
        <p className="text-[11px] text-text-muted">{new Date(b.createdAt).toLocaleDateString('en-IN')}</p>
      ),
    },
  ];

  return (
    <PartnerLayout>
      <div className="max-w-[1280px] mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-5">
        <header>
          <h1 className="text-2xl font-display font-bold text-text-primary">
            Bookings
            {data && <span className="ml-2 text-base font-normal text-text-muted">({data.total})</span>}
          </h1>
          <p className="text-sm text-text-secondary mt-1">Click any row to view booking details.</p>
        </header>

        {/* Summary cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: 'Total Results', value: String(data?.total ?? 0) },
            { label: 'Confirmed',     value: String(data?.confirmedCount ?? 0) },
            { label: 'Revenue',       value: fmt(data?.totalRevenue ?? 0) },
            { label: 'Cancelled',     value: String(data?.cancelledCount ?? 0) },
          ].map(({ label, value }) => (
            <div key={label} className="rounded-xl border border-border-default bg-bg-surface p-3">
              <p className="text-[11px] text-text-muted uppercase tracking-wider mb-1">{label}</p>
              <p className="text-lg font-bold text-text-primary font-display">{isLoading ? '…' : value}</p>
              <p className="text-[10px] text-text-muted">(filtered)</p>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div className="space-y-3">
          <div className="flex flex-wrap gap-3">
            <div className="relative flex-1 min-w-48">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search booking ref, customer…"
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
              <option value="Pending">Pending</option>
              <option value="Confirmed">Confirmed</option>
              <option value="Cancelled">Cancelled</option>
              <option value="Refunded">Refunded</option>
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
          </div>
        </div>

        <AdminTable
          columns={columns}
          data={bookings}
          isLoading={isLoading}
          emptyMessage="No bookings found for the selected filters."
          onRowClick={(b) => setSelectedRef(b.bookingRef)}
        />

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

      {selectedRef && (
        <PartnerBookingDetailDrawer
          bookingRef={selectedRef}
          onClose={() => setSelectedRef(null)}
        />
      )}
    </PartnerLayout>
  );
}
