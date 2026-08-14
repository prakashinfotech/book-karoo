import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { api } from '@/shared/lib/api';
import type { SearchResponse } from '../types';

export function useSearch(query: string, cityId: string | null = null) {
  return useQuery<SearchResponse>({
    queryKey:        ['search', query, cityId],
    queryFn:         () =>
      api.get<SearchResponse>('/api/search', {
        params: { q: query, ...(cityId ? { cityId } : {}) },
      }).then((r) => r.data),
    enabled:         query.length >= 2,
    staleTime:       30_000,
    placeholderData: keepPreviousData,
  });
}
