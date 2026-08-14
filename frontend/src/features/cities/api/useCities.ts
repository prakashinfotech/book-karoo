import { useQuery, useMutation } from '@tanstack/react-query';
import { api } from '@/shared/lib/api';
import type { City } from '@/shared/types';

export function useCities() {
  return useQuery<City[]>({
    queryKey: ['cities'],
    queryFn: () => api.get<City[]>('/api/cities').then((r) => r.data),
    staleTime: Infinity,
  });
}

export function useDetectCity() {
  return useMutation({
    mutationFn: (): Promise<City | null> =>
      api.get<City | null>('/api/cities/detect').then((r) => r.data ?? null),
  });
}
