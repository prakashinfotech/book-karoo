import { Link } from 'react-router-dom';
import {
  Ticket, IndianRupee, TrendingUp, Users,
} from 'lucide-react';
import { AdminLayout } from '@/shared/components/layout/AdminLayout';
import { TMDB_POSTER } from '@/shared/constants';
import { useDashboard } from '../api/useAdmin';
import { KpiCard, formatIndianCurrency } from '../components/KpiCard';
import { SimpleBarChart } from '../components/SimpleBarChart';
import { HorizontalBarChart } from '../components/HorizontalBarChart';
import { RecentBookingsTable } from '../components/RecentBookingsTable';
import { ActivityLog } from '../components/ActivityLog';
import { useAuthStore } from '@/features/auth/store/authStore';

const CRIMSON = '#E11D48';
const INDIGO  = '#6366F1';
const SUCCESS = '#22C55E';
const PURPLE  = '#A855F7';

function todayLabel(): string {
  return new Date().toLocaleDateString('en-IN', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  });
}

export default function AdminDashboardPage() {
  const { data, isLoading } = useDashboard();
  const { user } = useAuthStore();

  return (
    <AdminLayout>
      <div className="p-6 md:p-8 max-w-[1440px]">
        {/* Page header */}
        <div className="mb-8">
          <p className="text-[11px] font-semibold text-text-muted tracking-widest uppercase font-sans mb-1">
            {todayLabel()}
          </p>
          <h1 className="font-display font-bold text-2xl md:text-3xl tracking-tight text-text-primary">
            Dashboard
          </h1>
          {user && (
            <p className="text-text-muted text-sm font-sans mt-1">
              Welcome back, {user.name}
            </p>
          )}
        </div>

        {/* KPI Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <KpiCard
            title="Today's Bookings"
            value={data?.todayBookings ?? 0}
            icon={Ticket}
            iconColor={CRIMSON}
            trend={{ value: 12, label: 'vs yesterday', positive: true }}
            isLoading={isLoading}
          />
          <KpiCard
            title="Revenue Today"
            value={isLoading ? '—' : formatIndianCurrency(data?.todayRevenue ?? 0)}
            icon={IndianRupee}
            iconColor={SUCCESS}
            trend={{ value: 8, label: 'vs yesterday', positive: true }}
            isLoading={isLoading}
          />
          <KpiCard
            title="This Month"
            value={isLoading ? '—' : formatIndianCurrency(data?.monthRevenue ?? 0)}
            icon={TrendingUp}
            iconColor={INDIGO}
            subtitle={isLoading ? undefined : `Week: ${formatIndianCurrency(data?.weekRevenue ?? 0)}`}
            isLoading={isLoading}
          />
          <KpiCard
            title="Total Users"
            value={data?.totalUsers ?? 0}
            icon={Users}
            iconColor={PURPLE}
            subtitle={isLoading ? undefined : `+${data?.newUsersToday ?? 0} today`}
            isLoading={isLoading}
          />
        </div>

        {/* Top Movie */}
        {!isLoading && data?.topMovie && (
          <div className="p-4 rounded-xl bg-bg-surface border border-border-default flex items-center gap-4 mb-8">
            {data.topMovie.posterUrl && (
              <img
                src={data.topMovie.posterUrl.startsWith('/')
                  ? TMDB_POSTER(data.topMovie.posterUrl, 'w92')
                  : data.topMovie.posterUrl}
                alt=""
                className="w-12 h-[72px] object-cover rounded flex-shrink-0"
              />
            )}
            <div className="flex-1 min-w-0">
              <p className="text-[11px] font-semibold tracking-widest uppercase font-sans text-amber-400 mb-0.5">
                Top Performing This Week
              </p>
              <h3 className="font-display font-bold text-xl text-text-primary truncate">
                {data.topMovie.title}
              </h3>
              <p className="text-text-muted text-sm font-sans">
                {data.topMovie.bookingCount} bookings this week
              </p>
            </div>
            <Link
              to={`/admin/movies`}
              className="text-sm text-accent-indigo font-semibold font-sans hover:underline flex-shrink-0"
            >
              View Movie →
            </Link>
          </div>
        )}

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <div className="p-5 rounded-xl bg-bg-surface border border-border-default">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-[14px] font-semibold text-text-primary font-sans">
                Bookings — Last 7 Days
              </h3>
              <Link to="/admin/bookings" className="text-[12px] text-accent-indigo font-sans hover:underline">
                View all →
              </Link>
            </div>
            <SimpleBarChart
              data={(data?.bookingsPerDay ?? [
                { date: 'Sun', count: 0 }, { date: 'Mon', count: 0 },
                { date: 'Tue', count: 0 }, { date: 'Wed', count: 0 },
                { date: 'Thu', count: 0 }, { date: 'Fri', count: 0 },
                { date: 'Sat', count: 0 },
              ]).map((d) => ({ label: d.date, value: d.count }))}
              color={CRIMSON}
              height={160}
            />
          </div>

          <div className="p-5 rounded-xl bg-bg-surface border border-border-default">
            <h3 className="text-[14px] font-semibold text-text-primary font-sans mb-5">
              Revenue by City
            </h3>
            <HorizontalBarChart
              data={(data?.revenuePerCity ?? []).map((c) => ({
                label: c.cityName,
                value: c.revenue,
              }))}
              color={INDIGO}
              formatValue={formatIndianCurrency}
            />
            {!isLoading && (data?.revenuePerCity?.length ?? 0) === 0 && (
              <p className="text-text-muted text-sm font-sans text-center py-4">No booking revenue yet</p>
            )}
          </div>
        </div>

        {/* Bottom Row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 p-5 rounded-xl bg-bg-surface border border-border-default">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-[14px] font-semibold text-text-primary font-sans">
                Recent Bookings
              </h3>
              <Link to="/admin/bookings" className="text-[12px] text-accent-indigo font-sans hover:underline">
                View all →
              </Link>
            </div>
            <RecentBookingsTable
              bookings={data?.recentBookings ?? []}
              isLoading={isLoading}
            />
          </div>

          <div className="p-5 rounded-xl bg-bg-surface border border-border-default">
            <h3 className="text-[14px] font-semibold text-text-primary font-sans mb-5">
              Recent Activity
            </h3>
            <ActivityLog
              activities={data?.recentActivity ?? []}
              isLoading={isLoading}
            />
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
