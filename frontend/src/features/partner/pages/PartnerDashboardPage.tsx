import { Link } from 'react-router-dom';
import { PartnerLayout } from '../components/PartnerLayout';
import { usePartnerDashboard } from '../api/usePartner';
import { usePartnerLysPendingCount } from '../api/usePartnerLys';
import { Skeleton } from '@/shared/components/ui/Skeleton';

function formatINR(n: number) {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n);
}

export default function PartnerDashboardPage() {
  const { data, isLoading, isError, refetch } = usePartnerDashboard();
  const { data: pendingLys } = usePartnerLysPendingCount();

  return (
    <PartnerLayout>
      <div className="max-w-[1280px] mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6">
        <header>
          <h1 className="text-2xl font-display font-bold text-text-primary">
            {data?.partnerName ? `${data.partnerName} Dashboard` : 'Partner Dashboard'}
          </h1>
          {data?.venueNames?.length ? (
            <p className="text-sm text-text-secondary mt-1">
              {data.venueNames.length} venue{data.venueNames.length === 1 ? '' : 's'} under management
            </p>
          ) : null}
        </header>

        {isLoading && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {Array.from({ length: 4 }, (_, i) => <Skeleton key={i} height={100} />)}
          </div>
        )}

        {isError && (
          <div className="rounded-md border border-semantic-error/30 bg-semantic-error/08 p-4 text-sm text-semantic-error flex items-center justify-between">
            <span>Failed to load dashboard.</span>
            <button onClick={() => refetch()} className="underline hover:opacity-80">Retry</button>
          </div>
        )}

        {(pendingLys ?? 0) > 0 && (
          <Link
            to="/partner/lys"
            className="flex items-center gap-3 rounded-lg border border-accent-crimson/40 bg-accent-crimson/08 px-4 py-3 text-sm text-accent-crimson hover:bg-accent-crimson/12 transition-colors"
          >
            <span className="min-w-[28px] h-7 flex items-center justify-center rounded-full bg-accent-crimson text-white text-xs font-bold">
              {pendingLys}
            </span>
            <span>
              <strong>{pendingLys} event submission{pendingLys === 1 ? '' : 's'}</strong> at your venue{pendingLys === 1 ? '' : 's'} awaiting your approval
            </span>
            <span className="ml-auto underline">Review now →</span>
          </Link>
        )}

        {data && (
          <>
            <section className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <KpiCard label="Today's Bookings" value={data.todayBookings.toString()} />
              <KpiCard label="Today's Revenue" value={formatINR(data.todayRevenue)} />
              <KpiCard label="This Week" value={formatINR(data.weekRevenue)} />
              <KpiCard label="This Month" value={formatINR(data.monthRevenue)} />
            </section>

            <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <KpiCard label="Total Bookings" value={data.totalBookingsAllTime.toString()} />
              <KpiCard label="Upcoming Shows (7d)" value={data.upcomingShows.toString()} />
              <KpiCard label="Avg Occupancy" value={`${data.occupancyRate.toFixed(1)}%`} />
            </section>

            <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card title="Bookings — Last 7 Days">
                <ul className="space-y-1.5 text-sm">
                  {data.bookingsPerDay.map(d => (
                    <li key={d.date} className="flex items-center gap-3">
                      <span className="w-16 text-text-muted">{d.date}</span>
                      <div className="flex-1 bg-bg-surface2 rounded-sm h-3 overflow-hidden">
                        <div
                          className="h-full bg-accent-indigo"
                          style={{ width: `${Math.min(100, d.count * 10)}%` }}
                        />
                      </div>
                      <span className="w-8 text-right tabular-nums text-text-secondary">{d.count}</span>
                    </li>
                  ))}
                </ul>
              </Card>

              <Card title="Revenue by Venue">
                <ul className="space-y-1.5 text-sm">
                  {data.revenuePerVenue.map(v => (
                    <li key={v.venueName} className="flex items-center justify-between">
                      <span className="text-text-secondary truncate">{v.venueName}</span>
                      <span className="tabular-nums text-text-primary">{formatINR(v.revenue)}</span>
                    </li>
                  ))}
                  {data.revenuePerVenue.length === 0 && (
                    <li className="text-text-muted">No venue revenue yet.</li>
                  )}
                </ul>
              </Card>
            </section>

            <section>
              <Card title="Recent Bookings">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-left text-text-muted border-b border-border-default">
                        <th className="py-2 pr-3 font-medium">Booking Ref</th>
                        <th className="py-2 pr-3 font-medium">Title</th>
                        <th className="py-2 pr-3 font-medium">Venue</th>
                        <th className="py-2 pr-3 font-medium text-right">Amount</th>
                        <th className="py-2 pr-3 font-medium">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.recentBookings.map(b => (
                        <tr key={b.bookingRef} className="border-b border-border-default/60">
                          <td className="py-2 pr-3 font-mono text-xs">{b.bookingRef}</td>
                          <td className="py-2 pr-3">{b.movieOrEventTitle}</td>
                          <td className="py-2 pr-3 text-text-secondary">{b.venueName}</td>
                          <td className="py-2 pr-3 text-right tabular-nums">{formatINR(b.amountPaid)}</td>
                          <td className="py-2 pr-3 text-text-secondary">{b.status}</td>
                        </tr>
                      ))}
                      {data.recentBookings.length === 0 && (
                        <tr>
                          <td colSpan={5} className="py-6 text-center text-text-muted">No recent bookings.</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </Card>
            </section>
          </>
        )}
      </div>
    </PartnerLayout>
  );
}

function KpiCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-border-default bg-bg-base p-4">
      <p className="text-xs text-text-muted uppercase tracking-wide">{label}</p>
      <p className="text-2xl font-display font-bold text-text-primary mt-1 tabular-nums">{value}</p>
    </div>
  );
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-border-default bg-bg-base p-4">
      <h3 className="text-sm font-semibold text-text-primary mb-3">{title}</h3>
      {children}
    </div>
  );
}
