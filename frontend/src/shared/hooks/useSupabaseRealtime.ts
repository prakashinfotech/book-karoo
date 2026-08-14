import { useEffect, useRef, useCallback } from 'react';
import { supabase } from '@/shared/lib/supabase';
import type { RealtimeChannel } from '@supabase/realtime-js';

/**
 * Real-time seat state for a show.
 *
 * Two mechanisms run in parallel:
 *
 * 1. Supabase BROADCAST — the acting user sends an explicit channel message
 *    the instant they select or deselect a seat. This gives all other users
 *    sub-100 ms updates completely independent of the database change pipeline
 *    (no REPLICA IDENTITY, no WAL lag, no filter column-name ambiguity).
 *
 * 2. postgres_changes (INSERT / DELETE) — kept as a persistence safety net so
 *    that a user who joins mid-session (or after a reconnect) still gets the
 *    current state from the database rather than missing events.
 *
 * Returns a `broadcast` function the page must call on every select/deselect.
 */
export function useShowRealtime(
  showId:          string | null,
  onSeatLocked:    (seats: string[]) => void,
  onSeatUnlocked:  (seats: string[]) => void,
): (action: 'lock' | 'unlock', seats: string[]) => void {

  const channelRef = useRef<RealtimeChannel | null>(null);

  useEffect(() => {
    if (!showId) return;

    const channel = supabase
      .channel(`show-${showId}`, {
        config: {
          broadcast: {
            // self: false → the broadcasting tab does NOT receive its own
            // broadcast messages (it handles state locally via optimistic update)
            self: false,
          },
        },
      })

      // ── Broadcast listeners (instant, < 100 ms) ───────────────────────
      .on('broadcast', { event: 'seat_locked' }, ({ payload }) => {
        const seats = (payload as { seats?: string[] }).seats;
        if (seats?.length) onSeatLocked(seats);
      })
      .on('broadcast', { event: 'seat_unlocked' }, ({ payload }) => {
        const seats = (payload as { seats?: string[] }).seats;
        if (seats?.length) onSeatUnlocked(seats);
      })

      // ── postgres_changes (persistence / reconnect safety net) ─────────
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'SeatLocks' },
        (payload) => {
          const row = payload.new as { ShowId?: string; SeatLabel?: string };
          if (row.ShowId === showId && row.SeatLabel) onSeatLocked([row.SeatLabel]);
        }
      )
      .on(
        'postgres_changes',
        { event: 'DELETE', schema: 'public', table: 'SeatLocks' },
        (payload) => {
          const row = payload.old as { ShowId?: string; SeatLabel?: string };
          if (row.ShowId === showId && row.SeatLabel) onSeatUnlocked([row.SeatLabel]);
        }
      )
      .subscribe();

    channelRef.current = channel;
    return () => {
      void supabase.removeChannel(channel);
      channelRef.current = null;
    };
  }, [showId]);

  // Stable broadcast function — the page calls this on every select / deselect
  return useCallback((action: 'lock' | 'unlock', seats: string[]) => {
    const ch = channelRef.current;
    if (!ch || !seats.length) return;
    void ch.send({
      type:    'broadcast',
      event:   action === 'lock' ? 'seat_locked' : 'seat_unlocked',
      payload: { seats },
    });
  }, []);
}
