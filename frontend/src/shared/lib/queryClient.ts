import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,      // 5 min default
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

// Per-route stale times (used when creating individual queries)
export const STALE = {
  CITIES:       Infinity,
  MOVIES:       5 * 60 * 1000,      // 5 min
  MOVIE_DETAIL: 10 * 60 * 1000,     // 10 min
  SHOWTIMES:    60 * 1000,          // 1 min
  SEATS:        0,                  // always fresh (Realtime handles it)
  HOME:         5 * 60 * 1000,      // 5 min
  ADMIN:        2 * 60 * 1000,      // 2 min
  SETTINGS:     5 * 60 * 1000,      // 5 min
} as const;
