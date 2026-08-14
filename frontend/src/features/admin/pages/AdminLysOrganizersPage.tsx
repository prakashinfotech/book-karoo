import { useState } from 'react';
import { CheckCircle, Clock, Search, X, AlertTriangle } from 'lucide-react';
import { AdminLayout } from '@/shared/components/layout/AdminLayout';
import { Skeleton } from '@/shared/components/ui/Skeleton';
import type { AdminLysOrganizer } from '@/features/lys/types';
import {
  useAdminLysOrganizers,
  useVerifyOrganizer,
  useUnverifyOrganizer,
  useDeactivateOrganizer,
} from '@/features/lys/api/useLys';

const FILTER_TABS = [
  { label: 'All',          value: 'all' },
  { label: 'Unverified',   value: 'unverified' },
  { label: 'Verified',     value: 'verified' },
  { label: 'Deactivated',  value: 'deactivated' },
];

// ── Row ───────────────────────────────────────────────────────────────────────

function OrganizerRow({ org }: { org: AdminLysOrganizer }) {
  const verify     = useVerifyOrganizer();
  const unverify   = useUnverifyOrganizer();
  const deactivate = useDeactivateOrganizer();

  return (
    <tr className="border-b border-border-default hover:bg-bg-surface2 transition-colors">
      <td className="px-4 py-3">
        <p className="text-text-primary text-sm font-semibold">{org.name}</p>
        <p className="text-text-muted text-xs">{org.email}</p>
      </td>
      <td className="px-4 py-3 text-sm text-text-secondary font-mono">{org.panNumber}</td>
      <td className="px-4 py-3 text-sm text-text-muted">{org.phone}</td>
      <td className="px-4 py-3">
        {org.isVerified ? (
          <span className="inline-flex items-center gap-1 text-xs text-green-400 bg-green-500/10 px-2 py-0.5 rounded-full">
            <CheckCircle size={10} /> Verified
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 text-xs text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full">
            <Clock size={10} /> Pending
          </span>
        )}
      </td>
      <td className="px-4 py-3">
        {org.isActive ? (
          <span className="text-xs text-green-400">Active</span>
        ) : (
          <span className="text-xs text-semantic-error">Deactivated</span>
        )}
      </td>
      <td className="px-4 py-3 text-sm text-text-secondary">
        {org.eventCount} ({org.publishedEventCount} live)
      </td>
      <td className="px-4 py-3 text-xs text-text-muted">
        {new Date(org.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
      </td>
      <td className="px-4 py-3">
        <div className="flex gap-1.5">
          {!org.isVerified && org.isActive && (
            <button
              onClick={() => verify.mutate(org.id)}
              disabled={verify.isPending}
              className="text-xs px-2.5 py-1 bg-green-500/10 border border-green-500/25 rounded-lg text-green-400 hover:opacity-90 disabled:opacity-50"
            >
              Verify
            </button>
          )}
          {org.isVerified && org.isActive && (
            <button
              onClick={() => {
                if (confirm(`Remove verification from ${org.name}?`)) unverify.mutate(org.id);
              }}
              disabled={unverify.isPending}
              className="text-xs px-2.5 py-1 bg-amber-500/10 border border-amber-500/25 rounded-lg text-amber-400 hover:opacity-90 disabled:opacity-50"
            >
              Unverify
            </button>
          )}
          {org.isActive && (
            <button
              onClick={() => {
                if (confirm(`Deactivate organizer "${org.name}"? They will no longer be able to submit events.`)) {
                  deactivate.mutate(org.id);
                }
              }}
              disabled={deactivate.isPending}
              className="text-xs px-2.5 py-1 bg-semantic-error/10 border border-semantic-error/25 rounded-lg text-semantic-error hover:opacity-90 disabled:opacity-50"
            >
              Deactivate
            </button>
          )}
        </div>
      </td>
    </tr>
  );
}

function TableSkeleton() {
  return (
    <>{Array.from({ length: 5 }, (_, i) => (
      <tr key={i} className="border-b border-border-default">
        {Array.from({ length: 8 }, (__, j) => (
          <td key={j} className="px-4 py-3"><Skeleton height={14} className="w-full" /></td>
        ))}
      </tr>
    ))}</>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export function AdminLysOrganizersPage() {
  const [filterTab, setFilterTab] = useState('all');
  const [search, setSearch]       = useState('');
  const [page, setPage]           = useState(1);

  const filters: Record<string, unknown> = {};
  if (filterTab === 'verified')    filters.isVerified = true;
  if (filterTab === 'unverified')  filters.isVerified = false;
  if (filterTab === 'deactivated') filters.isActive   = false;
  if (search) filters.search = search;

  const { data, isLoading } = useAdminLysOrganizers(filters, page);

  return (
    <AdminLayout>
      <div className="p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="font-display font-bold text-2xl text-text-primary">LYS Organizers</h1>
            <p className="text-text-muted text-sm mt-1">
              Verify organizers before their events can be approved.
            </p>
          </div>
          {data && <p className="text-text-muted text-sm">{data.total} organizers</p>}
        </div>

        {/* Unverified warning */}
        {data && data.items.some((o) => !o.isVerified && o.isActive) && (
          <div className="flex items-start gap-3 p-4 mb-5 rounded-xl bg-amber-500/10 border border-amber-500/25">
            <AlertTriangle size={16} className="text-amber-400 flex-shrink-0 mt-0.5" />
            <p className="text-amber-300 text-sm">
              Some organizers are pending verification. Events from unverified organizers cannot be approved.
            </p>
          </div>
        )}

        {/* Filters */}
        <div className="flex flex-wrap gap-3 mb-5">
          <div className="flex gap-1">
            {FILTER_TABS.map((t) => (
              <button
                key={t.value}
                onClick={() => { setFilterTab(t.value); setPage(1); }}
                className={`text-xs font-semibold px-3 py-1.5 rounded-full transition-colors ${
                  filterTab === t.value
                    ? 'bg-accent-indigo text-white'
                    : 'bg-bg-surface2 text-text-muted border border-border-default hover:text-text-primary'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          <div className="relative flex-1 min-w-[200px] max-w-xs">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
            <input
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              placeholder="Search by name, email, or PAN…"
              className="w-full pl-9 pr-8 py-2 bg-bg-surface2 border border-border-default rounded-lg text-sm text-text-primary focus:outline-none focus:border-accent-indigo"
            />
            {search && (
              <button onClick={() => setSearch('')} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-text-muted">
                <X size={13} />
              </button>
            )}
          </div>
        </div>

        {/* Table */}
        <div className="bg-bg-surface border border-border-default rounded-xl overflow-x-auto">
          <table className="w-full min-w-[900px]">
            <thead>
              <tr className="border-b border-border-default bg-bg-surface2">
                <th className="px-4 py-3 text-left text-xs text-text-muted font-semibold">Organizer</th>
                <th className="px-4 py-3 text-left text-xs text-text-muted font-semibold">PAN</th>
                <th className="px-4 py-3 text-left text-xs text-text-muted font-semibold">Phone</th>
                <th className="px-4 py-3 text-left text-xs text-text-muted font-semibold">Verification</th>
                <th className="px-4 py-3 text-left text-xs text-text-muted font-semibold">Status</th>
                <th className="px-4 py-3 text-left text-xs text-text-muted font-semibold">Events</th>
                <th className="px-4 py-3 text-left text-xs text-text-muted font-semibold">Registered</th>
                <th className="px-4 py-3 text-left text-xs text-text-muted font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <TableSkeleton />
              ) : !data?.items.length ? (
                <tr>
                  <td colSpan={8} className="px-4 py-16 text-center">
                    <p className="text-3xl mb-3">
                      {filterTab === 'unverified' ? '✅' : '🎭'}
                    </p>
                    <p className="text-text-secondary font-semibold">No organizers found</p>
                    <p className="text-text-muted text-sm mt-1">
                      {filterTab === 'unverified'
                        ? 'All organizers are verified.'
                        : 'No organizers match the current filter.'}
                    </p>
                  </td>
                </tr>
              ) : (
                data.items.map((org) => <OrganizerRow key={org.id} org={org} />)
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {data && data.totalPages > 1 && (
          <div className="flex items-center justify-between mt-4 text-sm text-text-muted">
            <span>Page {page} of {data.totalPages}</span>
            <div className="flex gap-2">
              <button
                disabled={page === 1}
                onClick={() => setPage(page - 1)}
                className="px-3 py-1.5 border border-border-default rounded-lg disabled:opacity-40"
              >
                Previous
              </button>
              <button
                disabled={page === data.totalPages}
                onClick={() => setPage(page + 1)}
                className="px-3 py-1.5 border border-border-default rounded-lg disabled:opacity-40"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
