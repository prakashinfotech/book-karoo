import { useEffect } from 'react';
import { supabase } from '@/shared/lib/supabase';

export function useEventRealtime(eventId: string, onCapacityChange: () => void) {
  useEffect(() => {
    if (!eventId) return;

    const channel = supabase
      .channel(`event-capacity-${eventId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'EventTicketLocks',
          filter: `event_id=eq.${eventId}`,
        },
        () => { onCapacityChange(); },
      )
      .subscribe();

    return () => { void supabase.removeChannel(channel); };
  }, [eventId, onCapacityChange]);
}
