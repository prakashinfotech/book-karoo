import { useState, useCallback } from 'react';
import { AdminLayout } from '@/shared/components/layout/AdminLayout';
import { ReportChart } from '../components/ReportChart';
import {
  useBookingReport, useUserReport, exportReport,
  type BookingReportParams, type UserReportParams,
} from '../api/useAdmin';
import type { ReportRow } from '../types';

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatCurrency(v: number) {
  return `₹${v.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function today() { return new Date().toISOString().split('T')[0]; }
function daysAgo(n: number) {
  const d = new Date(); d.setDate(d.getDate() - n);
  return d.toISOString().split('T')[0];
}
function startOfMonth() {
  const d = new Date(); d.setDate(1);
  return d.toISOString().split('T')[0];
}

const GROUP_BY_OPTIONS = ['day', 'week', 'month', 'movie', 'venue', 'city'] as const;

// ── Skeleton ──────────────────────────────────────────────────────────────────

function CardSkeleton() {
  return <div className="h-24 rounded-xl bg-bg-surface2 animate-pulse" />;
}

// ── KPI Card ──────────────────────────────────────────────────────────────────

interface KpiProps { label: string; value: string; color?: string }
function KpiCard({ label, value, color = 'text-text-primary' }: KpiProps) {
  return (
    <div className="p-4 rounded-xl bg-bg-surface border border-border-default">
      <div className={`font-display font-bold text-xl ${color}`}>{value}</div>
      <div className="text-xs text-text-muted font-sans mt-1 uppercase tracking-wider">{label}</div>
    </div>
  );
}

// ── Booking Table ─────────────────────────────────────────────────────────────

function BookingDataTable({ rows, groupBy }: { rows: ReportRow[]; groupBy: string }) {
  const totals = {
    totalBookings:        rows.reduce((s, r) => s + r.totalBookings, 0),
    confirmedBookings:    rows.reduce((s, r) => s + r.confirmedBookings, 0),
    cancelledBookings:    rows.reduce((s, r) => s + r.cancelledBookings, 0),
    revenue:              rows.reduce((s, r) => s + r.revenue, 0),
    gstCollected:         rows.reduce((s, r) => s + r.gstCollected, 0),
    discount:             rows.reduce((s, r) => s + r.discount, 0),
    convenienceFeeRevenue: rows.reduce((s, r) => s + r.convenienceFeeRevenue, 0),
  };

  const tdCls = 'px-3 py-2.5 text-sm font-sans text-text-secondary';
  const thCls = 'px-3 py-2 text-[10px] font-semibold text-text-muted uppercase tracking-wider text-right first:text-left';

  return (
    <div className="overflow-x-auto rounded-xl border border-border-default">
      <table className="w-full text-sm">
        <thead className="bg-bg-surface2 border-b border-border-default">
          <tr>
            <th className={thCls + ' text-left'}>Period</th>
            <th className={thCls}>Total</th>
            <th className={thCls}>Confirmed</th>
            <th className={thCls}>Cancelled</th>
            <th className={thCls}>Revenue</th>
            {groupBy === 'day' || groupBy === 'week' || groupBy === 'month' ? (
              <>
                <th className={thCls}>GST</th>
                <th className={thCls}>Discount</th>
              </>
            ) : (
              <th className={thCls}>Conv. Fee</th>
            )}
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 && (
            <tr>
              <td colSpan={7} className="px-4 py-16 text-center text-text-muted text-sm font-sans">
                No data for selected period
              </td>
            </tr>
          )}
          {rows.map((r, i) => (
            <tr key={i} className="border-b border-border-default hover:bg-bg-surface2/50 transition-colors">
              <td className={tdCls + ' font-medium text-text-primary'}>{r.period}</td>
              <td className={tdCls + ' text-right'}>{r.totalBookings.toLocaleString()}</td>
              <td className={tdCls + ' text-right text-semantic-success'}>{r.confirmedBookings.toLocaleString()}</td>
              <td className={tdCls + ' text-right text-semantic-error'}>{r.cancelledBookings.toLocaleString()}</td>
              <td className={tdCls + ' text-right font-mono'}>{formatCurrency(r.revenue)}</td>
              {groupBy === 'day' || groupBy === 'week' || groupBy === 'month' ? (
                <>
                  <td className={tdCls + ' text-right font-mono'}>{formatCurrency(r.gstCollected)}</td>
                  <td className={tdCls + ' text-right font-mono'}>{formatCurrency(r.discount)}</td>
                </>
              ) : (
                <td className={tdCls + ' text-right font-mono'}>{formatCurrency(r.convenienceFeeRevenue)}</td>
              )}
            </tr>
          ))}
        </tbody>
        {rows.length > 0 && (
          <tfoot className="bg-bg-surface2 border-t-2 border-border-default font-semibold">
            <tr>
              <td className={tdCls + ' text-text-primary'}>Total</td>
              <td className={tdCls + ' text-right'}>{totals.totalBookings.toLocaleString()}</td>
              <td className={tdCls + ' text-right text-semantic-success'}>{totals.confirmedBookings.toLocaleString()}</td>
              <td className={tdCls + ' text-right text-semantic-error'}>{totals.cancelledBookings.toLocaleString()}</td>
              <td className={tdCls + ' text-right font-mono'}>{formatCurrency(totals.revenue)}</td>
              {groupBy === 'day' || groupBy === 'week' || groupBy === 'month' ? (
                <>
                  <td className={tdCls + ' text-right font-mono'}>{formatCurrency(totals.gstCollected)}</td>
                  <td className={tdCls + ' text-right font-mono'}>{formatCurrency(totals.discount)}</td>
                </>
              ) : (
                <td className={tdCls + ' text-right font-mono'}>{formatCurrency(totals.convenienceFeeRevenue)}</td>
              )}
            </tr>
          </tfoot>
        )}
      </table>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

type ActiveTab = 'bookings' | 'users';

export default function AdminReportsPage() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('bookings');
  const [exporting, setExporting] = useState(false);

  const [bookingFilters, setBookingFilters] = useState<BookingReportParams>({
    fromDate: daysAgo(30),
    toDate:   today(),
    groupBy:  'day',
  });

  const [userFilters, setUserFilters] = useState<UserReportParams>({
    fromDate: daysAgo(30),
    toDate:   today(),
    groupBy:  'day',
  });

  const { data: bookingReport, isLoading: bookingLoading } = useBookingReport(bookingFilters);
  const { data: userReport,    isLoading: userLoading }    = useUserReport(userFilters);

  const handleExport = useCallback(async () => {
    setExporting(true);
    try {
      const params = activeTab === 'bookings' ? { ...bookingFilters } : { ...userFilters };
      await exportReport(activeTab, params as Record<string, string | undefined>);
    } finally {
      setExporting(false);
    }
  }, [activeTab, bookingFilters, userFilters]);

  const setQuickDate = (tab: ActiveTab, preset: 'last7' | 'last30' | 'thisMonth') => {
    const range = preset === 'last7'    ? { fromDate: daysAgo(7),  toDate: today() }
                : preset === 'thisMonth' ? { fromDate: startOfMonth(), toDate: today() }
                :                          { fromDate: daysAgo(30), toDate: today() };
    if (tab === 'bookings') setBookingFilters((p) => ({ ...p, ...range }));
    else                    setUserFilters((p)    => ({ ...p, ...range }));
  };

  const INPUT = 'px-3 py-1.5 rounded-lg bg-bg-surface2 border border-border-default text-text-primary text-sm font-sans focus:outline-none focus:border-accent-indigo transition-colors';

  return (
    <AdminLayout>
      <div className="p-6 max-w-7xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="font-display font-bold text-2xl tracking-tight">Reports</h1>
            <p className="text-text-muted text-sm font-sans mt-1">Platform analytics and performance overview.</p>
          </div>
          <button
            onClick={handleExport}
            disabled={exporting}
            className="flex items-center gap-2 px-4 py-2 rounded-full border border-border-default text-sm font-semibold font-sans hover:bg-bg-surface2 transition-colors disabled:opacity-50"
          >
            {exporting ? 'Exporting…' : '⬇ Export CSV'}
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mb-6 border-b border-border-default">
          {(['bookings', 'users'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 text-sm font-semibold font-sans capitalize border-b-2 transition-colors -mb-px ${
                activeTab === tab
                  ? 'border-accent-crimson text-text-primary'
                  : 'border-transparent text-text-muted hover:text-text-primary'
              }`}
            >
              {tab === 'bookings' ? '📊 Booking Reports' : '👥 User Reports'}
            </button>
          ))}
        </div>

        {/* ── BOOKING REPORTS ── */}
        {activeTab === 'bookings' && (
          <div className="space-y-6">
            {/* Filters */}
            <div className="p-4 rounded-xl bg-bg-surface border border-border-default space-y-3">
              <div className="flex flex-wrap items-center gap-3">
                <div className="flex items-center gap-2">
                  <label className="text-xs text-text-muted font-sans">From</label>
                  <input type="date" value={bookingFilters.fromDate}
                    onChange={(e) => setBookingFilters((p) => ({ ...p, fromDate: e.target.value }))}
                    className={INPUT} />
                </div>
                <div className="flex items-center gap-2">
                  <label className="text-xs text-text-muted font-sans">To</label>
                  <input type="date" value={bookingFilters.toDate}
                    onChange={(e) => setBookingFilters((p) => ({ ...p, toDate: e.target.value }))}
                    className={INPUT} />
                </div>
                <div className="flex gap-1.5">
                  {([
                    { key: 'last7',     label: 'Last 7 days'  },
                    { key: 'last30',    label: 'Last 30 days' },
                    { key: 'thisMonth', label: 'This month'   },
                  ] as const).map(({ key, label }) => (
                    <button
                      key={key}
                      onClick={() => setQuickDate('bookings', key)}
                      className="px-3 py-1.5 rounded-full text-xs font-semibold font-sans bg-bg-surface2 border border-border-default hover:bg-accent-indigo/20 hover:border-accent-indigo hover:text-accent-indigo transition-colors"
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <div className="flex items-center gap-2">
                  <label className="text-xs text-text-muted font-sans">Group By</label>
                  <div className="flex gap-1">
                    {GROUP_BY_OPTIONS.map((g) => (
                      <button key={g} onClick={() => setBookingFilters((p) => ({ ...p, groupBy: g }))}
                        className={`px-2.5 py-1 rounded-full text-xs font-semibold font-sans border transition-colors capitalize ${
                          bookingFilters.groupBy === g
                            ? 'bg-accent-crimson text-white border-accent-crimson'
                            : 'border-border-default hover:bg-bg-surface2'
                        }`}>
                        {g}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Summary Cards */}
            {bookingLoading ? (
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {Array.from({ length: 8 }).map((_, i) => <CardSkeleton key={i} />)}
              </div>
            ) : bookingReport && (
              <>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  <KpiCard label="Total Revenue" value={formatCurrency(bookingReport.summary.totalRevenue)} color="text-accent-crimson" />
                  <KpiCard label="Confirmed Bookings" value={bookingReport.summary.confirmedBookings.toLocaleString()} color="text-semantic-success" />
                  <KpiCard label="GST Collected" value={formatCurrency(bookingReport.summary.gstCollected)} color="text-accent-indigo" />
                  <KpiCard label="Total Discount" value={formatCurrency(bookingReport.summary.totalDiscount)} color="text-semantic-warning" />
                </div>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  <KpiCard label="Net Revenue" value={formatCurrency(bookingReport.summary.netRevenue)} color="text-semantic-success" />
                  <KpiCard label="Conv. Fee Revenue" value={formatCurrency(bookingReport.summary.convenienceFeeRevenue)} color="text-accent-indigo" />
                  <KpiCard label="Cancelled Bookings" value={bookingReport.summary.cancelledBookings.toLocaleString()} color="text-accent-crimson" />
                  <KpiCard
                    label="Cancellation Rate"
                    value={bookingReport.summary.totalBookings > 0
                      ? `${((bookingReport.summary.cancelledBookings / bookingReport.summary.totalBookings) * 100).toFixed(1)}%`
                      : '0%'}
                    color="text-text-muted"
                  />
                </div>

                {/* Chart */}
                <div className="p-5 rounded-xl bg-bg-surface border border-border-default">
                  <h2 className="text-sm font-semibold text-text-primary mb-4 capitalize">
                    Revenue &amp; Bookings — {bookingFilters.groupBy}
                  </h2>
                  <ReportChart
                    data={bookingReport.rows.map((r) => ({
                      label:          r.period,
                      value:          r.revenue,
                      secondaryValue: r.confirmedBookings,
                    }))}
                    primaryLabel="Revenue (₹)"
                    secondaryLabel="Bookings"
                    formatValue={formatCurrency}
                    height={200}
                  />
                </div>

                {/* Table */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <h2 className="text-sm font-semibold text-text-primary">Detailed Breakdown</h2>
                    <span className="text-xs text-text-muted font-sans">{bookingReport.rows.length} row(s)</span>
                  </div>
                  <BookingDataTable rows={bookingReport.rows} groupBy={bookingFilters.groupBy} />
                  <p className="text-xs text-text-muted font-sans mt-2">
                    💡 Use Export CSV to download the full dataset
                  </p>
                </div>
              </>
            )}
          </div>
        )}

        {/* ── USER REPORTS ── */}
        {activeTab === 'users' && (
          <div className="space-y-6">
            {/* Filters */}
            <div className="p-4 rounded-xl bg-bg-surface border border-border-default space-y-3">
              <div className="flex flex-wrap items-center gap-3">
                <div className="flex items-center gap-2">
                  <label className="text-xs text-text-muted font-sans">From</label>
                  <input type="date" value={userFilters.fromDate}
                    onChange={(e) => setUserFilters((p) => ({ ...p, fromDate: e.target.value }))}
                    className={INPUT} />
                </div>
                <div className="flex items-center gap-2">
                  <label className="text-xs text-text-muted font-sans">To</label>
                  <input type="date" value={userFilters.toDate}
                    onChange={(e) => setUserFilters((p) => ({ ...p, toDate: e.target.value }))}
                    className={INPUT} />
                </div>
                <div className="flex gap-1.5">
                  {([
                    { key: 'last7',     label: 'Last 7 days'  },
                    { key: 'last30',    label: 'Last 30 days' },
                    { key: 'thisMonth', label: 'This month'   },
                  ] as const).map(({ key, label }) => (
                    <button
                      key={key}
                      onClick={() => setQuickDate('users', key)}
                      className="px-3 py-1.5 rounded-full text-xs font-semibold font-sans bg-bg-surface2 border border-border-default hover:bg-accent-indigo/20 hover:border-accent-indigo hover:text-accent-indigo transition-colors"
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <label className="text-xs text-text-muted font-sans">Group By</label>
                <div className="flex gap-1">
                  {(['day', 'week', 'month'] as const).map((g) => (
                    <button key={g} onClick={() => setUserFilters((p) => ({ ...p, groupBy: g }))}
                      className={`px-2.5 py-1 rounded-full text-xs font-semibold font-sans border transition-colors capitalize ${
                        userFilters.groupBy === g
                          ? 'bg-accent-indigo text-white border-accent-indigo'
                          : 'border-border-default hover:bg-bg-surface2'
                      }`}>
                      {g}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {userLoading ? (
              <div className="grid grid-cols-2 gap-4">
                <CardSkeleton />
                <CardSkeleton />
              </div>
            ) : userReport && (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <KpiCard label="New Users" value={userReport.totalNewUsers.toLocaleString()} color="text-accent-indigo" />
                  <KpiCard
                    label="Verified"
                    value={`${userReport.verifiedUsers.toLocaleString()} (${
                      userReport.totalNewUsers > 0
                        ? ((userReport.verifiedUsers / userReport.totalNewUsers) * 100).toFixed(1)
                        : 0
                    }%)`}
                    color="text-semantic-success"
                  />
                </div>

                <div className="p-5 rounded-xl bg-bg-surface border border-border-default">
                  <h2 className="text-sm font-semibold text-text-primary mb-4">User Acquisition</h2>
                  <ReportChart
                    data={userReport.rows.map((r) => ({
                      label:          r.period,
                      value:          r.newUsers,
                      secondaryValue: r.verifiedUsers,
                    }))}
                    primaryColor="#4F46E5"
                    secondaryColor="#22C55E"
                    primaryLabel="New Users"
                    secondaryLabel="Verified"
                    height={200}
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <h2 className="text-sm font-semibold text-text-primary">Detailed Breakdown</h2>
                    <span className="text-xs text-text-muted font-sans">{userReport.rows.length} row(s)</span>
                  </div>
                  <div className="overflow-x-auto rounded-xl border border-border-default">
                    <table className="w-full text-sm">
                      <thead className="bg-bg-surface2 border-b border-border-default">
                        <tr>
                          <th className="px-3 py-2 text-left text-[10px] font-semibold text-text-muted uppercase tracking-wider">Period</th>
                          <th className="px-3 py-2 text-right text-[10px] font-semibold text-text-muted uppercase tracking-wider">New Users</th>
                          <th className="px-3 py-2 text-right text-[10px] font-semibold text-text-muted uppercase tracking-wider">Verified</th>
                          <th className="px-3 py-2 text-right text-[10px] font-semibold text-text-muted uppercase tracking-wider">Rate (%)</th>
                        </tr>
                      </thead>
                      <tbody>
                        {userReport.rows.map((r, i) => (
                          <tr key={i} className="border-b border-border-default hover:bg-bg-surface2/50 transition-colors">
                            <td className="px-3 py-2.5 font-medium text-text-primary font-sans">{r.period}</td>
                            <td className="px-3 py-2.5 text-right font-sans text-text-secondary">{r.newUsers}</td>
                            <td className="px-3 py-2.5 text-right font-sans text-semantic-success">{r.verifiedUsers}</td>
                            <td className="px-3 py-2.5 text-right font-sans text-text-muted">
                              {r.newUsers > 0 ? ((r.verifiedUsers / r.newUsers) * 100).toFixed(1) : '0.0'}%
                            </td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot className="bg-bg-surface2 border-t-2 border-border-default font-semibold">
                        <tr>
                          <td className="px-3 py-2.5 font-sans text-text-primary">Total</td>
                          <td className="px-3 py-2.5 text-right font-sans">{userReport.totalNewUsers}</td>
                          <td className="px-3 py-2.5 text-right font-sans text-semantic-success">{userReport.verifiedUsers}</td>
                          <td className="px-3 py-2.5 text-right font-sans text-text-muted">
                            {userReport.totalNewUsers > 0
                              ? ((userReport.verifiedUsers / userReport.totalNewUsers) * 100).toFixed(1)
                              : '0.0'}%
                          </td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                  <p className="text-xs text-text-muted font-sans mt-2">
                    💡 Use Export CSV to download the full dataset
                  </p>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
