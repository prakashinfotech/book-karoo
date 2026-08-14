import { RealtimeClient } from '@supabase/realtime-js';

const supabaseUrl    = import.meta.env.VITE_SUPABASE_URL    as string;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('[supabase] VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY not set — Realtime disabled.');
}

const wsUrl = supabaseUrl
  ? supabaseUrl.replace('https://', 'wss://').replace('http://', 'ws://')
  : 'wss://placeholder.supabase.co';

export const supabase = new RealtimeClient(`${wsUrl}/realtime/v1`, {
  timeout: 30_000,
  params:  { apikey: supabaseAnonKey ?? 'placeholder' },
});
