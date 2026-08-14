import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { X } from 'lucide-react';
import { Skeleton } from '@/shared/components/ui/Skeleton';
import { useAdminUserDetail, useBlockUser, useUnblockUser, useAdminResetPassword } from '../api/useAdmin';
import { TempPasswordModal } from './TempPasswordModal';

interface Props {
  userId:        string | null;
  onClose:       () => void;
  onOpenBooking: (ref: string) => void;
}

function fmt(n: number) {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n);
}

function relativeDate(iso: string) {
  const d = new Date(iso);
  const diff = Date.now() - d.getTime();
  const days = Math.floor(diff / 86_400_000);
  if (days < 1)   return 'Today';
  if (days === 1) return 'Yesterday';
  if (days < 30)  return `${days} days ago`;
  const months = Math.floor(days / 30);
  if (months < 12) return `${months} month${months > 1 ? 's' : ''} ago`;
  const years = Math.floor(months / 12);
  return `${years} year${years > 1 ? 's' : ''} ago`;
}

const BOOKING_STATUS_CLASSES: Record<string, string> = {
  Confirmed: 'bg-semantic-success/15 text-semantic-success',
  Cancelled: 'bg-accent-crimson/15 text-accent-crimson',
  Pending:   'bg-amber-500/15 text-amber-400',
  Refunded:  'bg-accent-indigo/15 text-accent-indigo',
};

export function UserDetailDrawer({ userId, onClose, onOpenBooking }: Props) {
  const { data: user, isLoading } = useAdminUserDetail(userId);
  const blockUser    = useBlockUser();
  const unblockUser  = useUnblockUser();
  const resetPwd     = useAdminResetPassword();

  const [confirmBlock, setConfirmBlock] = useState(false);
  const [tempPwdData, setTempPwdData]   = useState<{ userName: string; tempPassword: string } | null>(null);

  function handleBlock() {
    if (!user) return;
    blockUser.mutate(user.id, { onSuccess: () => setConfirmBlock(false) });
  }

  function handleUnblock() {
    if (!user) return;
    unblockUser.mutate(user.id);
  }

  function handleResetPassword() {
    if (!user) return;
    resetPwd.mutate(user.id, {
      onSuccess: (data) => setTempPwdData({ userName: user.name, tempPassword: data.tempPassword }),
    });
  }

  return (
    <AnimatePresence>
      {userId && (
        <>
          <motion.div
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.div
            className="fixed top-0 right-0 h-screen w-full max-w-[420px] bg-bg-surface border-l border-border-default z-[60] flex flex-col"
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'tween', duration: 0.3, ease: 'easeOut' }}
          >
            {/* Header */}
            <div className="sticky top-0 bg-bg-surface border-b border-border-default px-6 py-4 flex items-center">
              <p className="font-bold text-base text-text-primary font-sans">User Profile</p>
              <button onClick={onClose} className="ml-auto text-text-muted hover:text-text-primary">
                <X size={18} />
              </button>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto px-6 py-4 space-y-5">
              {isLoading ? (
                <div className="space-y-3">
                  {[100, 80, 120, 200].map((h, i) => <Skeleton key={i} height={h} className="rounded-xl" />)}
                </div>
              ) : !user ? (
                <p className="text-text-muted text-sm text-center py-12">User not found.</p>
              ) : (
                <>
                  {/* Profile */}
                  <section>
                    <div className="flex items-start gap-3">
                      <div className="w-14 h-14 rounded-full bg-gradient-to-br from-accent-indigo to-accent-purple flex items-center justify-center text-white font-bold text-xl flex-shrink-0">
                        {user.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <p className="font-bold text-[18px] text-text-primary">{user.name}</p>
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <p className="text-[13px] text-text-muted truncate">{user.email}</p>
                          <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-bold uppercase ${
                            user.emailVerified ? 'bg-semantic-success/15 text-semantic-success' : 'bg-accent-crimson/15 text-accent-crimson'
                          }`}>
                            {user.emailVerified ? '✅ Verified' : '❌ Unverified'}
                          </span>
                        </div>
                        <p className="text-[12px] text-text-muted font-mono">{user.mobile}</p>
                        <div className="flex gap-1.5 mt-1 flex-wrap">
                          <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                            user.role === 'Admin' ? 'bg-accent-crimson/15 text-accent-crimson' : 'bg-bg-surface2 text-text-muted'
                          }`}>
                            {user.role}
                          </span>
                          {user.isBlocked && (
                            <span className="text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider bg-accent-crimson text-white">
                              🚫 BLOCKED
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-text-muted mt-1 font-sans">
                          Member since {relativeDate(user.createdAt)}
                        </p>
                      </div>
                    </div>
                  </section>

                  {/* Stats */}
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { label: 'Bookings',  value: String(user.totalBookings) },
                      { label: 'Spent',     value: fmt(user.totalSpent)       },
                      { label: 'City',      value: user.cityName ?? '—'       },
                    ].map(({ label, value }) => (
                      <div key={label} className="bg-bg-surface2 rounded-xl p-3 text-center border border-border-default">
                        <p className="font-bold text-[15px] text-text-primary font-display">{value}</p>
                        <p className="text-[9px] text-text-muted uppercase tracking-wider mt-0.5 font-sans">{label}</p>
                      </div>
                    ))}
                  </div>

                  <hr className="border-border-default" />

                  {/* Recent Bookings */}
                  <section>
                    <p className="text-[11px] text-text-muted uppercase tracking-wider font-sans mb-2 font-bold">
                      Recent Bookings
                    </p>
                    {user.recentBookings.length === 0 ? (
                      <p className="text-text-muted text-sm text-center py-4">No bookings yet</p>
                    ) : (
                      <div className="space-y-0.5">
                        {user.recentBookings.map((b) => (
                          <button
                            key={b.bookingRef}
                            onClick={() => { onClose(); onOpenBooking(b.bookingRef); }}
                            className="w-full flex items-center justify-between py-2.5 px-2 rounded-lg hover:bg-bg-surface2 transition-colors text-left"
                          >
                            <div className="min-w-0">
                              <p className="text-[13px] font-semibold text-text-primary line-clamp-1">
                                {b.movieTitle ?? b.eventTitle ?? '—'}
                              </p>
                              <p className="text-[11px] text-text-muted">{b.showDate} · {b.venueName}</p>
                            </div>
                            <div className="flex flex-col items-end gap-0.5 flex-shrink-0 ml-2">
                              <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-bold uppercase ${BOOKING_STATUS_CLASSES[b.status] ?? 'bg-bg-surface2 text-text-muted'}`}>
                                {b.status}
                              </span>
                              <span className="text-[11px] text-text-secondary font-sans">{fmt(b.amountPaid)}</span>
                            </div>
                          </button>
                        ))}
                      </div>
                    )}
                  </section>
                </>
              )}
            </div>

            {/* Footer */}
            {user && (
              <div className="sticky bottom-0 bg-bg-surface border-t border-border-default px-6 py-4 space-y-2">
                {/* Block/Unblock */}
                {!user.isBlocked ? (
                  confirmBlock ? (
                    <div className="rounded-lg bg-accent-crimson/10 border border-accent-crimson/30 p-3 space-y-2">
                      <p className="text-[13px] text-accent-crimson font-semibold">
                        Block {user.name}? They cannot login until unblocked.
                      </p>
                      <div className="flex gap-2">
                        <button
                          onClick={() => setConfirmBlock(false)}
                          className="flex-1 py-2 rounded-lg border border-border-default text-text-secondary text-[12px] hover:bg-bg-surface2 transition-colors"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={handleBlock}
                          disabled={blockUser.isPending}
                          className="flex-1 py-2 rounded-lg bg-accent-crimson text-white text-[12px] font-bold disabled:opacity-60"
                        >
                          {blockUser.isPending ? 'Blocking…' : 'Block User'}
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      onClick={() => setConfirmBlock(true)}
                      className="w-full py-2.5 rounded-lg border border-accent-crimson text-accent-crimson text-[13px] font-semibold hover:bg-accent-crimson/10 transition-colors"
                    >
                      🚫 Block User
                    </button>
                  )
                ) : (
                  <button
                    onClick={handleUnblock}
                    disabled={unblockUser.isPending}
                    className="w-full py-2.5 rounded-lg border border-semantic-success text-semantic-success text-[13px] font-semibold hover:bg-semantic-success/10 transition-colors disabled:opacity-60"
                  >
                    {unblockUser.isPending ? 'Unblocking…' : '✅ Unblock User'}
                  </button>
                )}

                <button
                  onClick={handleResetPassword}
                  disabled={resetPwd.isPending}
                  className="w-full py-2.5 rounded-lg border border-semantic-warning text-semantic-warning text-[13px] font-semibold hover:bg-semantic-warning/10 transition-colors disabled:opacity-60"
                >
                  {resetPwd.isPending ? 'Resetting…' : '🔑 Reset Password'}
                </button>
              </div>
            )}
          </motion.div>
        </>
      )}

      {tempPwdData && (
        <TempPasswordModal
          userName={tempPwdData.userName}
          tempPassword={tempPwdData.tempPassword}
          onClose={() => setTempPwdData(null)}
        />
      )}
    </AnimatePresence>
  );
}
