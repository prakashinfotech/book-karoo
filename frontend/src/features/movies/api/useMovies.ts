import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/shared/lib/api';
import type { Movie, PaginatedResponse } from '@/shared/types';
import type { MovieDetail, PaginatedReviews, ShowtimesGrouped } from '../types';
import { STALE } from '@/shared/lib/queryClient';
import { toast } from '@/shared/components/ui/Toast';

// ── Movie list ────────────────────────────────────────────────────────────────

export interface MovieFilters {
  languages?: string[];
  genres?: string[];
  formats?: string[];
  category?: string;
  cityId?: string;
  sort?: 'rating' | 'release' | 'az' | '';
  page?: number;
  pageSize?: number;
}

export interface PaginatedMovies extends PaginatedResponse<Movie> {
  totalPages: number;
}

function buildParams(filters: MovieFilters): URLSearchParams {
  const p = new URLSearchParams();
  if (filters.category) p.set('category', filters.category);
  if (filters.sort)     p.set('sort', filters.sort);
  if (filters.cityId)   p.set('cityId', filters.cityId);
  if (filters.page)     p.set('page', String(filters.page));
  if (filters.pageSize) p.set('pageSize', String(filters.pageSize));
  filters.languages?.forEach((l) => p.append('languages', l));
  filters.genres?.forEach((g) => p.append('genres', g));
  filters.formats?.forEach((f) => p.append('formats', f));
  return p;
}

export function useMovies(filters: MovieFilters = {}) {
  return useQuery<PaginatedMovies>({
    queryKey: ['movies', 'list', filters],
    queryFn: () =>
      api.get<PaginatedMovies>(`/api/movies?${buildParams(filters)}`).then((r) => r.data),
    staleTime: STALE.MOVIES,
    placeholderData: (prev) => prev,
  });
}

// ── Movie detail ──────────────────────────────────────────────────────────────

export function useMovieDetail(slug: string) {
  return useQuery<MovieDetail>({
    queryKey: ['movie', slug],
    queryFn: () => api.get<MovieDetail>(`/api/movies/${slug}`).then((r) => r.data),
    staleTime: STALE.MOVIES,
    gcTime:    30 * 60 * 1000, // keep in memory 30 min — back-nav skips API waterfall
    enabled:   !!slug,
  });
}

// ── Showtimes (city-aware, availability-enriched) ─────────────────────────────

export function useShowtimes(movieId: string, cityId: string, date: string) {
  return useQuery<ShowtimesGrouped>({
    queryKey: ['showtimes', movieId, cityId, date],
    queryFn: () =>
      api.get<ShowtimesGrouped>(`/api/movies/${movieId}/showtimes`, {
        params: { cityId, date },
      }).then((r) => r.data),
    staleTime: 60 * 1000,
    enabled: !!movieId && !!cityId,
  });
}

// ── Reviews ───────────────────────────────────────────────────────────────────

export function useMovieReviews(movieId: string, sort: string, page: number) {
  return useQuery<PaginatedReviews>({
    queryKey: ['movie-reviews', movieId, sort, page],
    queryFn: () =>
      api.get<PaginatedReviews>(`/api/movies/${movieId}/reviews`, {
        params: { sort, page, pageSize: 10 },
      }).then((r) => r.data),
    staleTime: 2 * 60 * 1000,
    enabled: !!movieId,
  });
}

export function useCreateReview(movieId: string, slug: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { rating: number; title?: string; body?: string }) =>
      api.post(`/api/movies/${movieId}/reviews`, data).then((r) => r.data),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['movie', slug] });
      void qc.invalidateQueries({ queryKey: ['movie-reviews', movieId] });
      toast('Review submitted!', 'success');
    },
    onError: (err: { message?: string }) => {
      toast(err?.message ?? 'Could not submit review.', 'error');
    },
  });
}

export function useRemindMeStatus(movieId: string, enabled: boolean) {
  return useQuery<{ optedIn: boolean }>({
    queryKey: ['remind-me-status', movieId],
    queryFn:  () => api.get(`/api/movies/${movieId}/remind-me`).then((r) => r.data),
    enabled,
    staleTime: 5 * 60 * 1000,
  });
}

export function useRemindMe(movieId: string) {
  return useMutation({
    mutationFn: () => api.post(`/api/movies/${movieId}/remind-me`).then((r) => r.data),
    onSuccess: () => toast("We'll notify you when it releases!", 'success'),
    onError:   () => toast('Could not set reminder. Please try again.', 'error'),
  });
}
