import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { PublicLayout } from '@/shared/components/layout/PublicLayout';
import { GlassCard } from '@/shared/components/ui/Card';
import { Skeleton } from '@/shared/components/ui/Skeleton';
import { useAuthStore } from '@/features/auth/store/authStore';
import { useMyBookings, useCancelBooking } from '@/features/booking/api/useBooking';
import { BookingCard } from '../components/BookingCard';
import { CancelConfirmModal } from '../components/CancelConfirmModal';
import { toast } from '@/shared/components/ui/Toast';
import { ROUTES } from '@/shared/constants';
import { formatCurrency } from '@/shared/lib/utils';
import type { BookingListItem } from '@/features/booking/types';

type Tab = 'upcoming' | 'past';

export default function MyBookingsPage() {
  const { user } = useAuthStore();
  const [tab, setTab]   = useState<Tab>('upcoming');
  const [page, setPage] = useState(1);
  const [cancellingBooking, setCancellingBooking] = useState<BookingListItem | null>(null);

  const { data: upcomingData, isLoading: upcomingCountLoading } = useMyBookings('upcoming', 1);
  const { data: pastData,     isLoading: pastCountLoading     } = useMyBookings('past', 1);
  const { data: currentData, isLoading: currentLoading } = useMyBookings(tab, page);

  const { mutate: cancelBooking, isPending: cancelling } = useCancelBooking();

  const upcomingCount  = upcomingData?.total ?? 0;
  const pastCount      = pastData?.total     ?? 0;
  const totalBookings  = upcomingCount + pastCount;
  const totalSpent     = [
    ...(upcomingData?.items ?? []),
    ...(pastData?.items ?? []),
  ].reduce((sum, b) => sum + b.amountPaid, 0);

  const isLoading  = currentLoading;
  const items      = currentData?.items ?? [];
  const totalPages = currentData?.totalPages ?? 1;

  function handleCancelConfirm() {
    if (!cancellingBooking) return;
    cancelBooking(cancellingBooking.bookingRef, {
      onSuccess: (res) => {
        toast(res.message, 'success');
        setCancellingBooking(null);
      },
      onError: (err) => {
        const msg = (err as { message?: string }).message ?? 'Cancellation failed.';
        toast(msg, 'error');
      },
    });
  }

  return (
    <PublicLayout>
      <Helmet><title>My Bookings | BookKaroo</title></Helmet>
      {/* Profile header */}
      <div className="bg-gradient-to-b from-bg-surface2 to-bg-base border-b border-border-default">
        <div className="max-w-3xl mx-auto px-6 py-8">
          <div className="flex items-center gap-5 mb-6">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-accent-indigo to-accent-purple flex items-center justify-center text-white font-display font-bold text-2xl flex-shrink-0 border-[3px] border-border-strong">
              {user?.name?.charAt(0).toUpperCase() ?? 'U'}
            </div>
            <div>
              <h1 className="font-display font-semibold text-xl text-text-primary">{user?.name}</h1>
              <p className="text-sm text-text-muted font-sans">{user?.email}</p>
            </div>
            <div className="ml-auto">
              <Link to={ROUTES.PROFILE}>
                <button className="px-4 py-2 rounded-full bg-bg-surface border border-border-default text-sm text-text-secondary hover:text-text-primary transition-colors font-sans">
                  Edit Profile
                </button>
              </Link>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: 'Total Bookings', value: String(totalBookings) },
              { label: 'Upcoming',       value: String(upcomingCount) },
              { label: 'Total Spent',    value: formatCurrency(totalSpent) },
            ].map(({ label, value }) => (
              <GlassCard key={label} style={{ padding: '14px 18px' }}>
                <div className="font-display font-bold text-xl text-accent-crimson">{value}</div>
                <div className="text-[10px] text-text-muted uppercase tracking-wider mt-0.5 font-sans">{label}</div>
              </GlassCard>
            ))}
          </div>
        </div>
      </div>

      {/* Tabs + content */}
      <div className="max-w-3xl mx-auto px-6 py-6">
        {/* Tabs */}
        <div className="flex gap-1 border-b border-border-default mb-6">
          {(['upcoming', 'past'] as const).map((t) => {
            const count = t === 'upcoming' ? upcomingCount : pastCount;
            const isCountLoading = t === 'upcoming' ? upcomingCountLoading : pastCountLoading;
            return (
              <button
                key={t}
                onClick={() => { setTab(t); setPage(1); }}
                className={`relative px-4 py-3 text-sm font-medium font-sans capitalize transition-colors ${
                  tab === t ? 'text-accent-crimson' : 'text-text-muted hover:text-text-secondary'
                }`}
              >
                {t}
                <span className="ml-2 text-[11px] font-mono px-1.5 py-0.5 rounded-full bg-bg-surface2 text-text-muted">
                  {isCountLoading ? '…' : count}
                </span>
                {tab === t && (
                  <span className="absolute bottom-0 left-2 right-2 h-0.5 bg-accent-crimson rounded-full" />
                )}
              </button>
            );
          })}
        </div>

        {/* Booking list */}
        {isLoading ? (
          <div className="space-y-4">
            {Array.from({ length: 3 }, (_, i) => (
              <Skeleton key={i} height={150} className="rounded-xl" />
            ))}
          </div>
        ) : items.length === 0 ? (
          <div className="flex flex-col items-center py-20 text-center">
            <span className="text-5xl mb-4">{tab === 'upcoming' ? '🎟' : '📽'}</span>
            <p className="text-text-secondary font-sans font-medium">
              {tab === 'upcoming' ? 'No upcoming bookings' : 'No past bookings'}
            </p>
            <p className="text-sm text-text-muted font-sans mt-1">
              {tab === 'upcoming'
                ? 'Book a movie or event to see it here'
                : 'Your booking history will appear here'}
            </p>
            {tab === 'upcoming' && (
              <Link to={ROUTES.MOVIES} className="mt-5">
                <button className="px-6 py-2.5 rounded-full bg-gradient-to-r from-accent-indigo to-accent-purple text-white text-sm font-semibold font-sans">
                  Explore Movies →
                </button>
              </Link>
            )}
          </div>
        ) : (
          <>
            <div className="space-y-4">
              {items.map((b) => (
                <BookingCard
                  key={b.id}
                  booking={b}
                  onCancel={setCancellingBooking}
                />
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex justify-center gap-1.5 mt-8">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                  <button
                    key={p}
                    onClick={() => setPage(p)}
                    className={`w-8 h-8 rounded-full text-sm font-sans font-medium transition-colors ${
                      p === page
                        ? 'bg-accent-crimson text-white'
                        : 'bg-bg-surface border border-border-default text-text-secondary hover:text-text-primary'
                    }`}
                  >
                    {p}
                  </button>
                ))}
              </div>
            )}
          </>
        )}
      </div>

      {/* Cancel confirmation modal */}
      {cancellingBooking && (
        <CancelConfirmModal
          booking={cancellingBooking}
          isPending={cancelling}
          onConfirm={handleCancelConfirm}
          onClose={() => !cancelling && setCancellingBooking(null)}
        />
      )}
    </PublicLayout>
  );
}
