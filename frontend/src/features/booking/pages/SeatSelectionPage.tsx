import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { cn, formatCurrency } from '@/shared/lib/utils';
import { CountdownRing } from '@/shared/components/ui/CountdownRing';
import { Skeleton } from '@/shared/components/ui/Skeleton';
import { useSeatStore } from '../store/seatStore';
import { useShowSeats, useLockSeats, useReleaseSeats } from '../api/useBooking';
import { SeatGrid } from '../components/SeatGrid';
import { SeatBottomBar } from '../components/SeatBottomBar';
import { useShowRealtime } from '@/shared/hooks/useSupabaseRealtime';
import { ROUTES } from '@/shared/constants';
import { toast } from '@/shared/components/ui/Toast';
import { usePublicSettings, parseNum } from '@/shared/lib/usePublicSettings';
import { useAuthStore } from '@/features/auth/store/authStore';
import type { SeatState } from '@/shared/types';
import type { SeatCategory, ScreenLayout } from '../types';

// ── Fallback layout when API returns no layout JSON ───────────────────────────

const FALLBACK_LAYOUT: ScreenLayout = {
  rows: 12,
  cols: 18,
  aisleAfterCols: [5, 11],
  blockedSeats: [],
  categories: [
    { name: 'Recliner',  rows: ['A', 'B'],                         price: 650, color: '#FFD700' },
    { name: 'Executive', rows: ['C', 'D', 'E', 'F'],               price: 420, color: '#4169E1' },
    { name: 'Normal',    rows: ['G', 'H', 'I', 'J', 'K', 'L'],    price: 260, color: '#A1A1AA' },
  ],
};

export default function SeatSelectionPage() {
  const { showId = '' }  = useParams();
  const navigate          = useNavigate();

  const {
    selectedSeats,
    lockExpiresAt,
    setShowId,
    selectSeat,
    deselectSeat,
    clearSeats,
    setLock,
  } = useSeatStore();

  // ── Settings (conv fee + seat limit from DB) ───────────────────────────────
  const { data: publicSettings } = usePublicSettings();
  const CONV_FEE    = parseNum(publicSettings?.convenience_fee_per_ticket, 59);
  const MAX_SEATS   = parseNum(publicSettings?.max_seats_per_booking, 10);
  const GST_RATE    = parseNum(publicSettings?.gst_rate, 0.18);
  const { user }    = useAuthStore();
  const isIntraState = user?.stateCode === (publicSettings?.company_state_code ?? '24');

  // ── API ────────────────────────────────────────────────────────────────────
  const { data, isLoading } = useShowSeats(showId);
  const lockMutation         = useLockSeats();
  const releaseMutation      = useReleaseSeats();

  // ── Local realtime locked seats (on top of what API returned) ─────────────
  const [realtimeLocked, setRealtimeLocked] = useState<string[]>([]);

  // Reset if navigating to a different show
  useEffect(() => {
    setShowId(showId);
    setRealtimeLocked([]);
  }, [showId]);

  // ── Realtime ───────────────────────────────────────────────────────────────
  const onSeatLocked = useCallback((seats: string[]) => {
    setRealtimeLocked((prev) => {
      const next = [...prev];
      for (const s of seats) if (!next.includes(s)) next.push(s);
      return next;
    });
  }, []);

  const onSeatUnlocked = useCallback((seats: string[]) => {
    setRealtimeLocked((prev) => prev.filter((s) => !seats.includes(s)));
  }, []);

  const broadcastSeat = useShowRealtime(showId, onSeatLocked, onSeatUnlocked);

  // ── Lock expiry ────────────────────────────────────────────────────────────
  const lockTotalSeconds = parseNum(publicSettings?.seat_lock_minutes, 8) * 60;
  const [remaining, setRemaining] = useState<number>(lockTotalSeconds);
  const expiredRef = useRef(false);

  useEffect(() => {
    expiredRef.current = false;
    if (!lockExpiresAt) {
      setRemaining(lockTotalSeconds);
      return;
    }
    const tick = () => {
      const diff = Math.max(0, Math.floor((new Date(lockExpiresAt).getTime() - Date.now()) / 1000));
      setRemaining(diff);
      if (diff === 0 && !expiredRef.current) {
        expiredRef.current = true;
        toast('Your seat hold expired. Please reselect.', 'error');
        // Release locks on backend immediately so seats become available on refresh
        void releaseMutation.mutateAsync(showId).catch(() => {});
        clearSeats(showId);
      }
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [lockExpiresAt, showId]);

  // ── Derived state ──────────────────────────────────────────────────────────
  const layout     = data?.screenLayout ?? FALLBACK_LAYOUT;
  const bookedSeats = data?.bookedSeats ?? [];
  const lockedSeats = [
    ...(data?.lockedSeats ?? []),
    ...realtimeLocked,
  ].filter((s) => !selectedSeats.includes(s));

  function getCategoryForSeat(label: string): SeatCategory | undefined {
    const rowLetter = label.replace(/\d+/g, '');
    return layout.categories.find((c) => c.rows.includes(rowLetter));
  }

  const ticketTotal = selectedSeats.reduce((sum, l) => sum + (getCategoryForSeat(l)?.price ?? 0), 0);
  const convFee     = selectedSeats.length * CONV_FEE;
  const gst         = Math.round(convFee * GST_RATE);
  const grand       = ticketTotal + convFee + gst;

  // ── Seat click ─────────────────────────────────────────────────────────────
  async function handleSeatClick(label: string, state: SeatState) {
    if (state === 'booked' || state === 'locked') return;

    if (state === 'selected') {
      deselectSeat(label);

      // ── Optimistic update: remove from realtimeLocked immediately ──────
      // The Supabase DELETE event arrives ~100–500 ms after the DB write.
      // Without this, the seat briefly appears as "Held" to the deselecting
      // user because it's still in realtimeLocked but no longer in selectedSeats.
      setRealtimeLocked((prev) => prev.filter((s) => s !== label));

      // ── Broadcast the unlock instantly to all other users ──────────────
      broadcastSeat('unlock', [label]);

      const remaining = selectedSeats.filter((s) => s !== label);
      if (remaining.length === 0) {
        await releaseMutation.mutateAsync(showId);
      } else {
        try {
          const result = await lockMutation.mutateAsync({ showId, seats: remaining });
          setLock(result.lockId, result.expiresAt);
        } catch {
          // Non-fatal: ghost lock will expire naturally
        }
      }
      return;
    }

    if (selectedSeats.length >= MAX_SEATS) {
      toast(`Maximum ${MAX_SEATS} seats allowed.`, 'error');
      return;
    }

    const newSeats = [...selectedSeats, label];
    selectSeat(label, MAX_SEATS);

    // Broadcast immediately so other users see the seat lock without waiting
    // for the DB write → Supabase WAL → postgres_changes pipeline (~200-500 ms)
    broadcastSeat('lock', [label]);

    try {
      const result = await lockMutation.mutateAsync({ showId, seats: newSeats });
      setLock(result.lockId, result.expiresAt);
    } catch (err: unknown) {
      deselectSeat(label);
      // Undo the optimistic broadcast on failure
      broadcastSeat('unlock', [label]);
      const msg = (err as { message?: string })?.message ?? 'Could not lock seat. Try another.';
      toast(msg, 'error');
    }
  }

  // ── Quick pick ─────────────────────────────────────────────────────────────
  async function pickBest(n: number) {
    clearSeats(showId);
    const picked: string[] = [];

    for (const cat of layout.categories) {
      if (picked.length >= n) break;
      for (const rowLetter of cat.rows) {
        if (picked.length >= n) break;
        const consecutive: string[] = [];
        for (let col = 1; col <= layout.cols; col++) {
          const label = `${rowLetter}${col}`;
          if (
            bookedSeats.includes(label) ||
            lockedSeats.includes(label) ||
            layout.blockedSeats.includes(label)
          ) {
            consecutive.length = 0;
            continue;
          }
          consecutive.push(label);
          if (consecutive.length === n) {
            picked.push(...consecutive);
            break;
          }
        }
      }
    }

    if (picked.length < n) {
      toast('Not enough adjacent seats available.', 'error');
      return;
    }

    for (const s of picked) selectSeat(s, MAX_SEATS);
    broadcastSeat('lock', picked);

    try {
      const result = await lockMutation.mutateAsync({ showId, seats: picked });
      setLock(result.lockId, result.expiresAt);
    } catch (err: unknown) {
      clearSeats(showId);
      broadcastSeat('unlock', picked);
      const msg = (err as { message?: string })?.message ?? 'Could not lock those seats. Try again.';
      toast(msg, 'error');
    }
  }

  // ── Render ─────────────────────────────────────────────────────────────────
  const showInfo = data?.show;

  return (
    <div className="min-h-screen flex flex-col bg-bg-base text-text-primary font-sans">
      {/* Sticky header */}
      <header className="sticky top-0 z-40 h-16 flex items-center justify-between gap-4 px-4 md:px-6 bg-bg-surface/90 backdrop-blur-md border-b border-border-default">
        <div className="flex items-center gap-3">
          <Link to={-1 as never}>
            <button className="px-3 py-1.5 rounded-full bg-bg-surface2 border border-border-default text-text-secondary text-sm hover:text-text-primary transition-colors">
              ← Back
            </button>
          </Link>
          <div className="hidden sm:block">
            <p className="text-[10px] text-text-muted uppercase tracking-wider">Seat Selection</p>
            {showInfo
              ? <p className="font-semibold text-sm text-text-primary">{showInfo.movieTitle} · {showInfo.format} · {showInfo.language}</p>
              : <p className="font-semibold text-sm text-text-primary">Show ID: {showId.slice(0, 8)}…</p>
            }
          </div>
        </div>

        {lockExpiresAt && (
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-bg-surface border border-border-strong">
            <CountdownRing totalSeconds={lockTotalSeconds} remainingSeconds={remaining} size={44} strokeWidth={4} />
            <div className="text-[10px] text-text-muted uppercase tracking-wider hidden sm:block">Hold expires</div>
          </div>
        )}
      </header>

      <main className="flex-1 max-w-[1280px] mx-auto px-4 md:px-6 py-6 w-full pb-36 lg:pb-6">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6">
          {/* Seat grid */}
          <section className="p-4 md:p-8 rounded-xl bg-[radial-gradient(80%_60%_at_50%_0%,rgba(99,102,241,0.14),transparent_60%)] bg-bg-surface border border-border-default">
            {/* Quick pick */}
            <div className="flex items-center gap-2 mb-6 flex-wrap">
              <span className="text-xs text-text-muted">Quick pick:</span>
              {Array.from({ length: MAX_SEATS }, (_, i) => i + 1).map((n) => (
                <button
                  key={n}
                  onClick={() => void pickBest(n)}
                  className={cn(
                    'w-7 h-7 rounded-md text-xs font-semibold transition-all',
                    selectedSeats.length === n
                      ? 'bg-gradient-to-br from-accent-indigo to-accent-purple text-white'
                      : 'bg-bg-surface2 border border-border-default text-text-secondary hover:text-text-primary'
                  )}
                >
                  {n}
                </button>
              ))}
            </div>

            {isLoading
              ? <Skeleton height={400} className="rounded-xl" />
              : (
                <SeatGrid
                  layout={layout}
                  bookedSeats={bookedSeats}
                  lockedSeats={lockedSeats}
                  selectedSeats={selectedSeats}
                  onSeatClick={(label, state) => void handleSeatClick(label, state)}
                />
              )
            }
          </section>

          {/* Desktop sidebar */}
          <aside className="hidden lg:block sticky top-20 self-start">
            <div className="p-5 rounded-xl bg-bg-surface border border-border-default">
              <h4 className="font-semibold text-sm mb-4">Selected Seats</h4>

              {/* Seat chips */}
              <div className="flex flex-wrap gap-1.5 min-h-[32px] mb-4">
                {selectedSeats.length === 0
                  ? <p className="text-xs text-text-muted">Tap seats to select</p>
                  : selectedSeats.map((label) => (
                    <span key={label} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-accent-indigo/14 text-[#A5B4FC] border border-accent-indigo/28 text-[11px] font-semibold font-mono">
                      {label}
                      <button
                        onClick={() => void handleSeatClick(label, 'selected')}
                        className="text-[#A5B4FC] hover:text-white ml-0.5"
                        aria-label={`Remove seat ${label}`}
                      >
                        ×
                      </button>
                    </span>
                  ))
                }
              </div>

              {/* Price breakdown */}
              {selectedSeats.length > 0 && (
                <div className="text-sm font-sans p-3 rounded-lg bg-bg-base border border-border-default mb-4 space-y-3">
                  {/* Ticket Amount */}
                  <div>
                    <div className="flex justify-between font-semibold text-text-primary text-[11px] uppercase tracking-wider">
                      <span>Ticket Amount</span>
                      <span>₹{ticketTotal}</span>
                    </div>
                    <p className="text-[11px] text-text-muted mt-0.5">
                      {selectedSeats.length} ticket{selectedSeats.length !== 1 ? 's' : ''}
                    </p>
                  </div>
                  {/* Convenience Fees */}
                  <div>
                    <div className="flex justify-between font-semibold text-text-primary text-[11px] uppercase tracking-wider">
                      <span>Convenience Fees</span>
                      <span>₹{convFee + gst}</span>
                    </div>
                    <div className="mt-1 space-y-0.5">
                      <div className="flex justify-between text-[11px] text-text-muted">
                        <span>Base Amount</span>
                        <span>₹{convFee}</span>
                      </div>
                      <div className="flex justify-between text-[11px] text-text-muted">
                        <span>
                          {isIntraState
                            ? `CGST @ 9% + SGST @ 9%`
                            : `Integrated GST (IGST) @ ${Math.round(GST_RATE * 100)}%`}
                        </span>
                        <span>₹{gst}</span>
                      </div>
                    </div>
                  </div>
                  {/* Total */}
                  <div className="flex justify-between border-t border-border-default pt-2 font-semibold text-base text-text-primary">
                    <span>Total</span>
                    <span className="font-display text-xl">{formatCurrency(grand)}</span>
                  </div>
                </div>
              )}

              <button
                disabled={selectedSeats.length === 0}
                onClick={() => navigate(ROUTES.CHECKOUT)}
                className={cn(
                  'w-full py-3.5 rounded-full font-semibold text-base transition-all',
                  selectedSeats.length > 0
                    ? 'bg-gradient-to-r from-accent-crimson-light to-accent-crimson text-white shadow-[0_10px_40px_-10px_rgba(225, 29, 116,0.55)] hover:-translate-y-0.5'
                    : 'bg-bg-surface3 text-text-muted cursor-not-allowed'
                )}
              >
                {selectedSeats.length > 0 ? `Pay Now · ${formatCurrency(grand)} →` : 'Select seats'}
              </button>

              <p className="text-[10px] text-text-muted text-center mt-3 leading-relaxed">
                Free reschedule up to 4h before show. Convenience fee non-refundable.
              </p>
            </div>

            {/* Countdown on desktop */}
            {lockExpiresAt && (
              <div className="mt-4 p-4 rounded-xl bg-bg-surface border border-border-default flex items-center gap-3">
                <CountdownRing totalSeconds={lockTotalSeconds} remainingSeconds={remaining} size={56} strokeWidth={5} />
                <div>
                  <p className="text-xs font-semibold text-text-primary">Seats held for</p>
                  <p className="text-[11px] text-text-muted">Hold expires in {Math.floor(remaining / 60)}m {remaining % 60}s</p>
                </div>
              </div>
            )}
          </aside>
        </div>
      </main>

      {/* Mobile bottom bar */}
      <SeatBottomBar
        selectedSeats={selectedSeats}
        getCategory={getCategoryForSeat}
        onPay={() => navigate(ROUTES.CHECKOUT)}
        onDeselect={(label) => void handleSeatClick(label, 'selected')}
        convFeePerTicket={CONV_FEE}
        gstRate={GST_RATE}
      />
    </div>
  );
}
