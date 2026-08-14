import { useState } from 'react';
import { ArrowLeft, Pencil, Trash2 } from 'lucide-react';
import { AdminLayout } from '@/shared/components/layout/AdminLayout';
import { AdminTable, type Column } from '../components/AdminTable';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/shared/lib/api';
import { useDebounce } from '@/shared/hooks/useDebounce';
import {
  useAdminVenuesPaged, useAdminVenueDetail,
  useDeleteVenue,
} from '../api/useAdmin';
import { VenueFormModal }   from '../components/VenueFormModal';
import { VenueScreensPanel } from '../components/VenueScreensPanel';
import { DeleteConfirmModal } from '../components/DeleteConfirmModal';
import type { AdminVenue, AdminVenueFilters } from '../types';

const CHAINS = ['PVR', 'INOX', 'Cinepolis', 'Rajhans', 'Carnival', 'Miraj', 'SPI'];

interface City { id: string; name: string; state: string; }

export default function AdminVenuesPage() {
  const [view, setView]               = useState<'list' | 'detail'>('list');
  const [selectedVenueId, setSelectedVenueId] = useState<string | null>(null);
  const [page, setPage]               = useState(1);
  const [searchInput, setSearchInput] = useState('');
  const search = useDebounce(searchInput, 400);
  const [cityId, setCityId]           = useState('');
  const [chain, setChain]             = useState('');
  const [showCreate, setShowCreate]   = useState(false);
  const [editingVenue, setEditingVenue]   = useState<AdminVenue | null>(null);
  const [deletingVenue, setDeletingVenue] = useState<AdminVenue | null>(null);

  const filters: AdminVenueFilters = {
    search: search || undefined,
    cityId: cityId || undefined,
    chain:  chain  || undefined,
  };

  const { data, isLoading } = useAdminVenuesPaged(filters, page);
  const { data: detail }    = useAdminVenueDetail(selectedVenueId);
  const deleteVenue         = useDeleteVenue();

  const { data: cities } = useQuery<City[]>({
    queryKey: ['cities'],
    queryFn: () => api.get<City[]>('/api/cities').then((r) => r.data),
    staleTime: 10 * 60_000,
  });

  const venues = data?.items ?? [];

  const openDetail = (venue: AdminVenue) => {
    setSelectedVenueId(venue.id);
    setView('detail');
  };

  const columns: Column<AdminVenue>[] = [
    {
      key: 'venue', header: 'Venue',
      render: (v) => (
        <div>
          <div className="flex items-center gap-2">
            <span className="font-medium text-text-primary text-[14px]">{v.name}</span>
            {v.chain && <span className="text-[11px] px-1.5 py-0.5 rounded-full bg-bg-surface3 text-text-muted">{v.chain}</span>}
          </div>
          <p className="text-[12px] text-text-muted mt-0.5 truncate max-w-xs">{v.address}</p>
        </div>
      ),
    },
    {
      key: 'city', header: 'City',
      render: (v) => (
        <div>
          <p className="text-[13px] text-text-primary">{v.cityName}</p>
          <p className="text-[11px] text-text-muted">{v.cityState}</p>
        </div>
      ),
    },
    {
      key: 'screens', header: 'Screens',
      render: (v) => (
        <span className={`text-[13px] px-2 py-0.5 rounded-full font-medium ${v.screenCount > 0 ? 'text-semantic-success' : 'text-text-muted'}`}>
          {v.screenCount} screen{v.screenCount !== 1 ? 's' : ''}
        </span>
      ),
    },
    {
      key: 'amenities', header: 'Amenities',
      render: (v) => {
        const shown = v.amenities.slice(0, 3);
        const extra = v.amenities.length - shown.length;
        return (
          <span className="text-[13px] text-text-secondary">
            {shown.join(', ')}{extra > 0 ? ` +${extra}` : ''}
          </span>
        );
      },
    },
    {
      key: 'status', header: 'Status',
      render: (v) => (
        <span className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full ${v.isActive ? 'bg-semantic-success/15 text-semantic-success' : 'bg-bg-surface3 text-text-muted'}`}>
          <span className={`w-1.5 h-1.5 rounded-full ${v.isActive ? 'bg-semantic-success' : 'bg-text-muted'}`} />
          {v.isActive ? 'Active' : 'Inactive'}
        </span>
      ),
    },
    {
      key: 'actions', header: 'Actions',
      render: (v) => (
        <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
          <button
            onClick={() => openDetail(v)}
            className="px-2.5 py-1 rounded-lg bg-accent-indigo/15 text-accent-indigo text-[12px] font-semibold hover:bg-accent-indigo/25 transition-colors"
          >
            Manage
          </button>
          <button onClick={() => setEditingVenue(v)} className="p-1.5 rounded-lg text-text-muted hover:text-accent-indigo transition-colors" aria-label="Edit">
            <Pencil size={13} />
          </button>
          <button onClick={() => setDeletingVenue(v)} className="p-1.5 rounded-lg text-text-muted hover:text-semantic-error transition-colors" aria-label="Delete">
            <Trash2 size={13} />
          </button>
        </div>
      ),
    },
  ];

  // ── Detail View ──────────────────────────────────────────────────────────────
  if (view === 'detail' && selectedVenueId) {
    return (
      <AdminLayout>
        <div className="p-6 md:p-8">
          <button
            onClick={() => { setView('list'); setSelectedVenueId(null); }}
            className="flex items-center gap-1.5 text-text-muted hover:text-text-primary transition-colors text-sm mb-6"
          >
            <ArrowLeft size={15} /> Back to Venues
          </button>

          {detail ? (
            <>
              {/* Venue info card */}
              <div className="rounded-xl border border-border-default bg-bg-surface p-5 mb-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h1 className="font-display font-bold text-2xl text-text-primary">{detail.name}</h1>
                      {detail.chain && <span className="text-sm px-2 py-0.5 rounded-full bg-bg-surface3 text-text-muted">{detail.chain}</span>}
                    </div>
                    <p className="text-text-muted text-sm mb-1">{detail.address}</p>
                    <p className="text-text-secondary text-sm">{detail.cityName}, {detail.cityState}</p>
                    {detail.contactPhone && <p className="text-text-muted text-sm mt-1">📞 {detail.contactPhone}</p>}
                    {detail.contactEmail && <p className="text-text-muted text-sm">✉️ {detail.contactEmail}</p>}
                    {detail.amenities.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mt-2">
                        {detail.amenities.map((a) => (
                          <span key={a} className="text-[11px] px-2 py-0.5 rounded-full bg-bg-surface2 text-text-secondary">{a}</span>
                        ))}
                      </div>
                    )}
                  </div>
                  <button
                    onClick={() => setEditingVenue(detail as unknown as AdminVenue)}
                    className="ml-4 px-3 py-1.5 rounded-lg border border-border-default text-text-secondary hover:bg-bg-surface2 transition-colors text-sm"
                  >
                    Edit Venue
                  </button>
                </div>
              </div>

              {/* Screens panel */}
              <VenueScreensPanel venueId={selectedVenueId} venueName={detail.name} />
            </>
          ) : (
            <div className="flex items-center justify-center h-64 text-text-muted">Loading venue…</div>
          )}
        </div>

        {editingVenue && (
          <VenueFormModal
            mode="edit"
            venue={editingVenue}
            onClose={() => setEditingVenue(null)}
            onSuccess={() => setEditingVenue(null)}
          />
        )}
      </AdminLayout>
    );
  }

  // ── List View ────────────────────────────────────────────────────────────────
  return (
    <AdminLayout>
      <div className="p-6 md:p-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="font-display font-bold text-2xl mb-1 tracking-tight">Venues</h1>
            <p className="text-text-muted text-sm font-sans">Manage theatres, stadiums, and event venues.</p>
          </div>
          <button
            onClick={() => setShowCreate(true)}
            className="px-4 py-2 rounded-lg bg-accent-crimson text-white text-sm font-semibold hover:opacity-90 transition-opacity"
          >
            + Add Venue
          </button>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-3 mb-5">
          <input
            value={searchInput}
            onChange={(e) => { setSearchInput(e.target.value); setPage(1); }}
            placeholder="Search venue or chain…"
            className="flex-1 min-w-48 px-3 py-2 rounded-lg bg-bg-surface2 border border-border-default text-text-primary text-sm focus:outline-none focus:border-accent-indigo"
          />
          <select
            value={cityId}
            onChange={(e) => { setCityId(e.target.value); setPage(1); }}
            className="px-3 py-2 rounded-lg bg-bg-surface2 border border-border-default text-text-primary text-sm focus:outline-none focus:border-accent-indigo"
          >
            <option value="">All Cities</option>
            {cities?.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          <select
            value={chain}
            onChange={(e) => { setChain(e.target.value); setPage(1); }}
            className="px-3 py-2 rounded-lg bg-bg-surface2 border border-border-default text-text-primary text-sm focus:outline-none focus:border-accent-indigo"
          >
            <option value="">All Chains</option>
            {CHAINS.map((c) => <option key={c} value={c}>{c}</option>)}
            <option value="other">Other</option>
          </select>
          {(search || cityId || chain) && (
            <button onClick={() => { setSearchInput(''); setCityId(''); setChain(''); setPage(1); }} className="px-3 py-1.5 rounded-lg text-sm font-sans border border-border-default bg-bg-surface text-text-secondary hover:text-text-primary hover:border-border-strong transition-colors">
              ✕ Clear filters
            </button>
          )}
        </div>

        <AdminTable
          columns={columns}
          data={venues}
          isLoading={isLoading}
          emptyMessage="No venues found. Add your first venue."
          onRowClick={openDetail}
        />

        {/* Pagination */}
        {data && data.totalPages > 1 && (
          <div className="flex items-center justify-between mt-4">
            <p className="text-sm text-text-muted">{data.total} venues</p>
            <div className="flex gap-2">
              <button disabled={page <= 1} onClick={() => setPage((p) => p - 1)} className="px-3 py-1 rounded-lg border border-border-default text-sm text-text-secondary disabled:opacity-40">← Prev</button>
              <span className="px-3 py-1 text-sm text-text-primary">Page {page} / {data.totalPages}</span>
              <button disabled={page >= data.totalPages} onClick={() => setPage((p) => p + 1)} className="px-3 py-1 rounded-lg border border-border-default text-sm text-text-secondary disabled:opacity-40">Next →</button>
            </div>
          </div>
        )}
      </div>

      {showCreate && (
        <VenueFormModal mode="create" onClose={() => setShowCreate(false)} onSuccess={() => setShowCreate(false)} />
      )}

      {editingVenue && (
        <VenueFormModal
          mode="edit"
          venue={editingVenue}
          onClose={() => setEditingVenue(null)}
          onSuccess={() => setEditingVenue(null)}
        />
      )}

      {deletingVenue && (
        <DeleteConfirmModal
          itemName={deletingVenue.name}
          isLoading={deleteVenue.isPending}
          onClose={() => setDeletingVenue(null)}
          onConfirm={() =>
            deleteVenue.mutate(deletingVenue.id, { onSuccess: () => setDeletingVenue(null) })
          }
        />
      )}
    </AdminLayout>
  );
}
