import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/shared/lib/api';
import type {
  PartnerDashboard,
  PartnerVenueListItem,
  PartnerVenueDetail,
  PartnerScreenInfo,
  PartnerShowResponse,
  PartnerBookingListItem,
  PartnerBookingDetail,
  PartnerReportResponse,
  PartnerReviewResponse,
} from '../types';

export function usePartnerDashboard() {
  return useQuery({
    queryKey: ['partner', 'dashboard'],
    queryFn: async () => {
      const { data } = await api.get<PartnerDashboard>('/api/partner/dashboard');
      return data;
    },
  });
}

export function usePartnerVenues() {
  return useQuery({
    queryKey: ['partner', 'venues'],
    queryFn: async () => {
      const { data } = await api.get<PartnerVenueListItem[]>('/api/partner/venues');
      return data;
    },
  });
}

export function usePartnerVenueDetail(venueId: string | undefined) {
  return useQuery({
    queryKey: ['partner', 'venue', venueId],
    enabled: !!venueId,
    queryFn: async () => {
      const { data } = await api.get<PartnerVenueDetail>(`/api/partner/venues/${venueId}`);
      return data;
    },
  });
}

export function useUpdatePartnerVenue(venueId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: { contactPhone?: string; contactEmail?: string; amenities?: string }) => {
      const { data } = await api.patch<PartnerVenueDetail>(`/api/partner/venues/${venueId}`, payload);
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['partner', 'venue', venueId] });
      qc.invalidateQueries({ queryKey: ['partner', 'venues'] });
    },
  });
}

export function usePartnerReport(fromDate: string, toDate: string) {
  return useQuery({
    queryKey: ['partner', 'reports', fromDate, toDate],
    queryFn: async () => {
      const { data } = await api.get<PartnerReportResponse>('/api/partner/reports', {
        params: { fromDate, toDate },
      });
      return data;
    },
    enabled: !!fromDate && !!toDate,
  });
}

export interface PartnerShowsQuery {
  venueId?: string;
  screenId?: string;
  fromDate?: string;
  toDate?: string;
  status?: string;
  search?: string;
  page?: number;
  pageSize?: number;
}

export function usePartnerShows(query: PartnerShowsQuery) {
  return useQuery({
    queryKey: ['partner', 'shows', query],
    queryFn: async () => {
      const { data } = await api.get<{ items: PartnerShowResponse[]; total: number; page: number; pageSize: number; totalPages: number }>(
        '/api/partner/shows',
        { params: query }
      );
      return data;
    },
  });
}

export interface CreatePartnerShowPayload {
  venueId:  string;
  screenId: string;
  movieId?: string;
  eventId?: string;
  showDate: string;
  showTime: string;
  format:   string;
  language: string;
}

export function useCreatePartnerShow() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: CreatePartnerShowPayload) => {
      const { data } = await api.post<PartnerShowResponse>('/api/partner/shows', payload);
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['partner', 'shows'] }),
  });
}

export function useCancelPartnerShow() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (showId: string) => {
      await api.post(`/api/partner/shows/${showId}/cancel`);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['partner', 'shows'] }),
  });
}

export interface PartnerBookingsQuery {
  search?: string;
  status?: string;
  venueId?: string;
  fromDate?: string;
  toDate?: string;
  page?: number;
  pageSize?: number;
}

export function usePartnerBookings(query: PartnerBookingsQuery) {
  return useQuery({
    queryKey: ['partner', 'bookings', query],
    queryFn: async () => {
      const { data } = await api.get<{
        items: PartnerBookingListItem[];
        total: number;
        page: number;
        pageSize: number;
        totalPages: number;
        confirmedCount: number;
        cancelledCount: number;
        totalRevenue: number;
      }>('/api/partner/bookings', { params: query });
      return data;
    },
  });
}

export function usePartnerReviews(query: { venueId?: string; status?: string; sort?: string; page?: number; pageSize?: number }) {
  return useQuery({
    queryKey: ['partner', 'reviews', query],
    queryFn: async () => {
      const { data } = await api.get<{ items: PartnerReviewResponse[]; total: number; page: number; pageSize: number }>(
        '/api/partner/reviews',
        { params: query }
      );
      return data;
    },
  });
}

export function useHidePartnerReview() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (reviewId: string) => {
      await api.post(`/api/partner/reviews/${reviewId}/hide`);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['partner', 'reviews'] }),
  });
}

export function useRestorePartnerReview() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (reviewId: string) => {
      await api.post(`/api/partner/reviews/${reviewId}/restore`);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['partner', 'reviews'] }),
  });
}

// ── Booking detail + cancellation ────────────────────────────────────────────

export function usePartnerBookingDetail(bookingRef: string | null) {
  return useQuery({
    queryKey: ['partner', 'booking', bookingRef],
    enabled: !!bookingRef,
    queryFn: async () => {
      const { data } = await api.get<PartnerBookingDetail>(`/api/partner/bookings/${bookingRef}`);
      return data;
    },
  });
}

export function usePartnerCancelBooking() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (bookingRef: string) => {
      const { data } = await api.post<PartnerBookingDetail>(`/api/partner/bookings/${bookingRef}/cancel`);
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['partner', 'bookings'] });
      qc.invalidateQueries({ queryKey: ['partner', 'booking'] });
    },
  });
}

// ── Screen CRUD ───────────────────────────────────────────────────────────────

export interface CreateScreenPayload {
  name: string;
  totalSeats: number;
  layout?: string;
}

export interface UpdateScreenPayload {
  name?: string;
  totalSeats?: number;
  layout?: string;
}

export function useCreatePartnerScreen(venueId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: CreateScreenPayload) => {
      const { data } = await api.post<PartnerScreenInfo>(`/api/partner/venues/${venueId}/screens`, payload);
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['partner', 'venue', venueId] });
      qc.invalidateQueries({ queryKey: ['partner', 'venues'] });
    },
  });
}

export function useUpdatePartnerScreen(screenId: string, venueId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: UpdateScreenPayload) => {
      const { data } = await api.patch<PartnerScreenInfo>(`/api/partner/screens/${screenId}`, payload);
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['partner', 'venue', venueId] });
    },
  });
}

export function useDeletePartnerScreen(venueId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (screenId: string) => {
      await api.delete(`/api/partner/screens/${screenId}`);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['partner', 'venue', venueId] });
      qc.invalidateQueries({ queryKey: ['partner', 'venues'] });
    },
  });
}
