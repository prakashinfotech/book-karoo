import { useQuery } from '@tanstack/react-query';
import { api } from '@/shared/lib/api';
import type { Movie } from '@/shared/types';
import type { HomeData } from '@/features/events/types';
import { STALE } from '@/shared/lib/queryClient';

export function useNowShowing(cityId?: string) {
  return useQuery({
    queryKey: ['movies', 'now-showing', cityId],
    queryFn: () =>
      api.get<{ items: Movie[]; total: number }>(
        `/api/movies?category=NowShowing&pageSize=10${cityId ? `&cityId=${cityId}` : ''}`
      ).then((r) => r.data),
    staleTime: STALE.MOVIES,
  });
}

export function useComingSoon() {
  return useQuery({
    queryKey: ['movies', 'coming-soon'],
    queryFn: () =>
      api.get<{ items: Movie[]; total: number }>('/api/movies?category=ComingSoon&pageSize=6').then((r) => r.data),
    staleTime: STALE.MOVIES,
  });
}

export function useHomeData(cityId: string | null) {
  return useQuery<HomeData>({
    queryKey: ['home', cityId],
    queryFn: () =>
      api.get<HomeData>('/api/home', {
        params: cityId ? { cityId } : {},
      }).then((r) => r.data),
    staleTime: 5 * 60 * 1000,
  });
}
