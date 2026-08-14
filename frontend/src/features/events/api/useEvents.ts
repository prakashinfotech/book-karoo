import { useMutation, useQuery } from '@tanstack/react-query';
import { api } from '@/shared/lib/api';
import type { CreateOrderResponse } from '@/features/booking/types';
import type { ApiError } from '@/shared/types';
import type {
  EventDetail,
  EventListItem,
  EventListResponse,
  HomeData,
  EventAvailabilityResponse,
  CreateEventOrderRequest,
} from '../types';

export function useEvents(
  type:   string | null = null,
  cityId: string | null = null,
  page    = 1,
) {
  return useQuery<EventListResponse>({
    queryKey: ['events', type, cityId, page],
    queryFn: () =>
      api.get<EventListResponse>('/api/events', {
        params: { ...(type ? { type } : {}), ...(cityId ? { cityId } : {}), page, pageSize: 20 },
      }).then((r) => r.data),
    staleTime: 2 * 60 * 1000,
  });
}

export function useEventDetail(slug: string) {
  return useQuery<EventDetail>({
    queryKey: ['event', slug],
    queryFn: () => api.get<EventDetail>(`/api/events/${slug}`).then((r) => r.data),
    staleTime: 10 * 60 * 1000,
    enabled: !!slug,
  });
}

export function useUpcomingEvents(
  type:   string,
  cityId: string | null = null,
  count   = 6,
) {
  return useQuery<EventListItem[]>({
    queryKey: ['events-upcoming', type, cityId, count],
    queryFn: () =>
      api.get<EventListItem[]>(`/api/events/upcoming/${type}`, {
        params: { ...(cityId ? { cityId } : {}), count },
      }).then((r) => r.data),
    staleTime: 5 * 60 * 1000,
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

export function useRemindMeEvent(eventId: string) {
  return useMutation({
    mutationFn: () => api.post(`/api/events/${eventId}/remind-me`),
  });
}

export function useEventAvailability(eventId: string) {
  return useQuery<EventAvailabilityResponse>({
    queryKey: ['event-availability', eventId],
    queryFn: () =>
      api.get<EventAvailabilityResponse>(`/api/events/${eventId}/availability`)
        .then((r) => r.data),
    staleTime: 30 * 1000,
    refetchInterval: 60 * 1000,
    enabled: !!eventId,
  });
}

export function useCreateEventOrder() {
  return useMutation<CreateOrderResponse, ApiError, CreateEventOrderRequest>({
    mutationFn: (data) =>
      api.post<CreateOrderResponse>('/api/events/order', data, {
        headers: { 'Idempotency-Key': data.idempotencyKey },
      }).then((r) => r.data),
  });
}
