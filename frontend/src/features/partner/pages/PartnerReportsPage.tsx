import { useState } from 'react';
import { Download, X } from 'lucide-react';
import { PartnerLayout } from '../components/PartnerLayout';
import { usePartnerReport } from '../api/usePartner';
import { SimpleBarChart } from '@/features/admin/components/SimpleBarChart';
import { HorizontalBarChart } from '@/features/admin/components/HorizontalBarChart';
import { Skeleton } from '@/shared/components/ui/Skeleton';
import type { PartnerReportResponse } from '../types';

function fmt(n: number) {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n);
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-border-default bg-bg-base p-5">
      <h3 className="text-sm font-semibold text-text-primary mb-4">{title}</h3>
      {children}
    </div>
  );
}

function defaultFromDate() {
  const d = new Date();
  d.setDate(d.getDate() - 30);
  return d.toISOString().split('T')[0];
}
function defaultToDate() {
  return new Date().toISOString().split('T')[0];
}

function exportToCsv(data: PartnerReportResponse, fromDate: string, toDate: string) {
  const rows: string[][] = [];
  rows.push(['BookKaroo Partner Report']);
  rows.push([`Date Range: ${fromDate} to ${toDate}`]);
  rows.push([]);

  rows.push(['Summary']);
  rows.push(['Metric', 'Value']);
  rows.push(['Total Bookings', String(data.totalBookings)]);
  rows.push(['Total Revenue', fmt(data.totalRevenue)]);
  rows.push([]);

  rows.push(['Daily Bookings']);
  rows.push(['Date', 'Bookings']);
  data.bookingsPerDay.forEach((d) => rows.push([d.date, String(d.count)]));
  rows.push([]);

  rows.push(['Revenue by Venue']);
  rows.push(['Venue', 'Revenue']);
  data.revenuePerVenue.forEach((v) => rows.push([v.venueName, fmt(v.revenue)]));
  rows.push([]);

  rows.push(['Recent Bookings']);
  rows.push(['Ref', 'Title', 'Venue', 'Amount Paid', 'Status', 'Date']);
  data.recentBookings.forEach((b) =>
    rows.push([
      b.bookingRef, b.movieOrEventTitle, b.venueName,
      fmt(b.amountPaid), b.status,
      new Date(b.createdAt).toLocaleDateString('en-IN'),
    ])
  );

  const csv = rows
    .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(','))
    .join('\n');

  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `partner-report-${fromDate}-to-${toDate}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export default function PartnerReportsPage() {
  const initFrom = defaultFromDate();
  const initTo   = defaultToDate();
  const [fromDate, setFromDate] = useState(initFrom);
  const [toDate,   setToDate]   = useState(initTo);

  const { data, isLoading, isError, refetch } = usePartnerReport(fromDate, toDate);

  const isFiltered = fromDate !== initFrom || toDate !== initTo;

  return (
    <PartnerLayout>
      <div className="max-w-[1280px] mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6">
        <header className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-2xl font-display font-bold text-text-primary">Reports</h1>
            <p className="text-sm text-text-secondary mt-1">Revenue and booking performance for your venues.</p>
          </div>
          {data && (
            <button
              onClick={() => exportToCsv(data, fromDate, toDate)}
              className="flex items-center gap-2 px-4 py-2 rounded-lg border border-border-default text-text-secondary text-sm hover:text-text-primary hover:border-border-strong transition-colors"
            >
              <Download size={14} /> Export CSV
            </button>
          )}
        </header>

        {/* Date filter row */}
        <div className="flex flex-wrap gap-3 items-center">
          <div className="flex items-center gap-2">
            <label className="text-sm text-text-muted whitespace-nowrap">From</label>
            <input
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              className="px-2 py-2 rounded-lg bg-bg-surface2 border border-border-default text-text-primary text-sm focus:outline-none focus:border-accent-indigo [color-scheme:light]"
            />
          </div>
          <div className="flex items-center gap-2">
            <label className="text-sm text-text-muted whitespace-nowrap">To</label>
            <input
              type="date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              className="px-2 py-2 rounded-lg bg-bg-surface2 border border-border-default text-text-primary text-sm focus:outline-none focus:border-accent-indigo [color-scheme:light]"
            />
          </div>
          {isFiltered && (
            <button
              onClick={() => { setFromDate(initFrom); setToDate(initTo); }}
              className="flex items-center gap-1 text-sm text-accent-indigo hover:underline whitespace-nowrap"
            >
              <X size={12} /> Reset dates
            </button>
          )}
        </div>

        {isLoading && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {Array.from({ length: 4 }, (_, i) => <Skeleton key={i} height={220} />)}
          </div>
        )}

        {isError && (
          <div className="rounded-md border border-semantic-error/30 bg-semantic-error/08 p-4 text-sm text-semantic-error flex items-center justify-between">
            <span>Failed to load report data.</span>
            <button onClick={() => refetch()} className="underline hover:opacity-80">Retry</button>
          </div>
        )}

        {data && (
          <>
            {/* KPI summary */}
            <div className="grid grid-cols-2 md:grid-cols-2 gap-4">
              {[
                { label: 'Total Bookings', value: data.totalBookings.toString() },
                { label: 'Total Revenue',  value: fmt(data.totalRevenue)        },
              ].map(({ label, value }) => (
                <div key={label} className="rounded-xl border border-border-default bg-bg-base p-4">
                  <p className="text-xs text-text-muted uppercase tracking-wide">{label}</p>
                  <p className="text-2xl font-display font-bold text-text-primary mt-1 tabular-nums">{value}</p>
                  <p className="text-[10px] text-text-muted mt-0.5">In selected date range</p>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card title="Daily Bookings">
                {data.bookingsPerDay.some((d) => d.count > 0) ? (
                  <SimpleBarChart
                    data={data.bookingsPerDay.slice(-30).map((d) => ({ label: d.date.slice(4), value: d.count }))}
                    color="#6366F1"
                    height={180}
                    showValues
                  />
                ) : (
                  <p className="text-sm text-text-muted text-center py-8">No booking data for this period.</p>
                )}
              </Card>

              <Card title="Revenue by Venue">
                {data.revenuePerVenue.some((v) => v.revenue > 0) ? (
                  <HorizontalBarChart
                    data={data.revenuePerVenue.map((v) => ({ label: v.venueName, value: v.revenue }))}
                    color="#6366F1"
                    formatValue={fmt}
                  />
                ) : (
                  <p className="text-sm text-text-muted text-center py-8">No venue revenue for this period.</p>
                )}
              </Card>
            </div>

            {/* Recent bookings in range */}
            {data.recentBookings.length > 0 && (
              <Card title="Recent Bookings in Period">
                <div className="space-y-2 max-h-72 overflow-y-auto">
                  {data.recentBookings.map((b) => (
                    <div key={b.bookingRef} className="flex items-center justify-between py-2 border-b border-border-default/50 last:border-0">
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-mono text-accent-indigo font-semibold">{b.bookingRef}</p>
                        <p className="text-xs text-text-secondary truncate">{b.movieOrEventTitle} · {b.venueName}</p>
                      </div>
                      <div className="flex-shrink-0 text-right ml-4">
                        <p className="text-xs font-semibold text-text-primary">{fmt(b.amountPaid)}</p>
                        <p className="text-[10px] text-text-muted">{new Date(b.createdAt).toLocaleDateString('en-IN')}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            )}
          </>
        )}
      </div>
    </PartnerLayout>
  );
}
