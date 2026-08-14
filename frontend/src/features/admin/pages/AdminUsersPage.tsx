import { useState, useEffect, useRef } from 'react';
import { Search, X } from 'lucide-react';
import { AdminLayout } from '@/shared/components/layout/AdminLayout';
import { AdminTable, type Column } from '../components/AdminTable';
import { UserDetailDrawer } from '../components/UserDetailDrawer';
import { BookingDetailDrawer } from '../components/BookingDetailDrawer';
import { useAdminUsers, useBlockUser, useUnblockUser } from '../api/useAdmin';
import type { AdminUser, AdminUserFilters } from '../types';

function fmt(n: number) {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n);
}

function relativeDate(iso: string) {
  const days = Math.floor((Date.now() - new Date(iso).getTime()) / 86_400_000);
  if (days < 1)   return 'Today';
  if (days < 30)  return `${days}d ago`;
  const months = Math.floor(days / 30);
  if (months < 12) return `${months}mo ago`;
  return `${Math.floor(months / 12)}yr ago`;
}

export default function AdminUsersPage() {
  const [search,       setSearch]       = useState('');
  const [debouncedSearch, setDebounced] = useState('');
  const [role,         setRole]         = useState('');
  const [blockedFilter, setBlockedFilter] = useState('');
  const [cityId,       setCityId]       = useState('');
  const [page,         setPage]         = useState(1);
  const [selectedUserId,  setSelectedUserId]  = useState<string | null>(null);
  const [selectedBookingRef, setSelectedBookingRef] = useState<string | null>(null);

  const debounceRef = useRef<ReturnType<typeof setTimeout>>();
  useEffect(() => {
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => { setDebounced(search); setPage(1); }, 400);
    return () => clearTimeout(debounceRef.current);
  }, [search]);

  const isBlocked = blockedFilter === 'true' ? true : blockedFilter === 'false' ? false : undefined;

  const filters: AdminUserFilters = {
    search:    debouncedSearch || undefined,
    role:      role            || undefined,
    isBlocked: isBlocked,
    cityId:    cityId          || undefined,
  };

  const { data, isLoading } = useAdminUsers(filters, page);
  const users = data?.items ?? [];
  const blockUser   = useBlockUser();
  const unblockUser = useUnblockUser();

  const isDefaultFilter = !debouncedSearch && !role && !blockedFilter && !cityId;

  function clearFilters() {
    setSearch(''); setDebounced(''); setRole(''); setBlockedFilter(''); setCityId(''); setPage(1);
  }

  // Summary cards
  const active  = users.filter((u) => !u.isBlocked);
  const blocked = users.filter((u) => u.isBlocked);
  const admins  = users.filter((u) => u.role === 'Admin');

  const summaryItems = [
    { label: 'Total Users', value: String(data?.total ?? 0) },
    { label: 'Active',      value: String(active.length)    },
    { label: 'Blocked',     value: String(blocked.length)   },
    { label: 'Admins',      value: String(admins.length)    },
  ];

  const columns: Column<AdminUser>[] = [
    {
      key: 'user', header: 'User',
      render: (u) => (
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-accent-indigo to-accent-purple flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
            {u.name.charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0">
            <p className="text-[13px] font-semibold text-text-primary line-clamp-1">{u.name}</p>
            <p className="text-[11px] text-text-muted truncate max-w-[180px]">{u.email}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'mobile', header: 'Mobile',
      render: (u) => <span className="font-mono text-[13px] text-text-primary">{u.mobile}</span>,
    },
    {
      key: 'city', header: 'City',
      render: (u) => <span className="text-[13px] text-text-secondary">{u.cityName ?? '—'}</span>,
    },
    {
      key: 'role', header: 'Role',
      render: (u) => (
        <span className={`inline-block text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${
          u.role === 'Admin' ? 'bg-accent-crimson/15 text-accent-crimson' : 'bg-bg-surface2 text-text-muted'
        }`}>
          {u.role}
        </span>
      ),
    },
    {
      key: 'status', header: 'Status',
      render: (u) => (
        <div className="flex items-center gap-1.5">
          <span className={`w-2 h-2 rounded-full ${u.isBlocked ? 'bg-accent-crimson' : 'bg-semantic-success'}`} />
          <span className={`text-[13px] ${u.isBlocked ? 'text-accent-crimson font-bold' : 'text-text-secondary'}`}>
            {u.isBlocked ? 'Blocked' : 'Active'}
          </span>
        </div>
      ),
    },
    {
      key: 'bookings', header: 'Bookings',
      render: (u) => (
        <div>
          <p className="text-[13px] text-text-primary">{u.totalBookings} booking{u.totalBookings !== 1 ? 's' : ''}</p>
          <p className="text-[11px] text-text-muted">{fmt(u.totalSpent)}</p>
        </div>
      ),
    },
    {
      key: 'joined', header: 'Joined',
      render: (u) => <span className="text-[12px] text-text-muted">{relativeDate(u.createdAt)}</span>,
    },
    {
      key: 'actions', header: 'Actions',
      render: (u) => (
        <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
          <button
            onClick={() => setSelectedUserId(u.id)}
            className="px-2 py-1 rounded-lg border border-border-default text-text-secondary text-[11px] hover:border-accent-indigo hover:text-accent-indigo transition-colors"
          >
            View
          </button>
          {!u.isBlocked ? (
            <button
              onClick={() => blockUser.mutate(u.id)}
              disabled={blockUser.isPending}
              title="Block user"
              className="px-2 py-1 rounded-lg border border-border-default text-text-muted text-[11px] hover:border-accent-crimson hover:text-accent-crimson transition-colors disabled:opacity-40"
            >
              🚫
            </button>
          ) : (
            <button
              onClick={() => unblockUser.mutate(u.id)}
              disabled={unblockUser.isPending}
              title="Unblock user"
              className="px-2 py-1 rounded-lg border border-semantic-success/30 text-semantic-success text-[11px] hover:bg-semantic-success/10 transition-colors disabled:opacity-40"
            >
              ✅
            </button>
          )}
        </div>
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
              Users
              {data && <span className="ml-2 text-base font-normal text-text-muted">({data.total})</span>}
            </h1>
            <p className="text-text-muted text-sm font-sans">Manage registered users and their access.</p>
          </div>
        </div>

        {/* Filter bar */}
        <div className="flex flex-wrap gap-3 mb-5">
          <div className="relative flex-1 min-w-48">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search name, email or mobile…"
              className="w-full pl-8 pr-8 py-2 rounded-lg bg-bg-surface2 border border-border-default text-text-primary text-sm focus:outline-none focus:border-accent-indigo"
            />
            {search && (
              <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary">
                <X size={12} />
              </button>
            )}
          </div>

          <select
            value={role}
            onChange={(e) => { setRole(e.target.value); setPage(1); }}
            className="px-3 py-2 rounded-lg bg-bg-surface2 border border-border-default text-text-primary text-sm focus:outline-none focus:border-accent-indigo"
          >
            <option value="">All Roles</option>
            <option value="User">Users</option>
            <option value="Admin">Admins</option>
          </select>

          <select
            value={blockedFilter}
            onChange={(e) => { setBlockedFilter(e.target.value); setPage(1); }}
            className="px-3 py-2 rounded-lg bg-bg-surface2 border border-border-default text-text-primary text-sm focus:outline-none focus:border-accent-indigo"
          >
            <option value="">All Status</option>
            <option value="false">Active</option>
            <option value="true">Blocked</option>
          </select>

          {!isDefaultFilter && (
            <button
              onClick={clearFilters}
              className="text-sm text-accent-indigo hover:underline flex items-center gap-1 whitespace-nowrap"
            >
              <X size={12} /> Clear filters
            </button>
          )}
        </div>

        {/* Summary cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
          {summaryItems.map(({ label, value }) => (
            <div key={label} className="rounded-xl border border-border-default bg-bg-surface p-3">
              <p className="text-[11px] text-text-muted uppercase tracking-wider mb-1">{label}</p>
              <p className="text-lg font-bold text-text-primary font-display">{isLoading ? '…' : value}</p>
            </div>
          ))}
        </div>

        <AdminTable
          columns={columns}
          data={users}
          isLoading={isLoading}
          emptyMessage="No users found."
          onRowClick={(u) => setSelectedUserId(u.id)}
        />

        {/* Pagination */}
        {data && data.totalPages > 1 && (
          <div className="flex items-center justify-between mt-4">
            <p className="text-sm text-text-muted">{data.total} users</p>
            <div className="flex gap-2">
              <button disabled={page <= 1} onClick={() => setPage((p) => p - 1)} className="px-3 py-1 rounded-lg border border-border-default text-sm text-text-secondary disabled:opacity-40">← Prev</button>
              <span className="px-3 py-1 text-sm text-text-primary">Page {page} / {data.totalPages}</span>
              <button disabled={page >= data.totalPages} onClick={() => setPage((p) => p + 1)} className="px-3 py-1 rounded-lg border border-border-default text-sm text-text-secondary disabled:opacity-40">Next →</button>
            </div>
          </div>
        )}
      </div>

      <UserDetailDrawer
        userId={selectedUserId}
        onClose={() => setSelectedUserId(null)}
        onOpenBooking={(ref) => {
          setSelectedUserId(null);
          setSelectedBookingRef(ref);
        }}
      />

      <BookingDetailDrawer
        bookingRef={selectedBookingRef}
        onClose={() => setSelectedBookingRef(null)}
      />
    </AdminLayout>
  );
}
