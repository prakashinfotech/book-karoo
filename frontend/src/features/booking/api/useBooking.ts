import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/shared/lib/api';
import type {
  ShowSeatsData, SeatLockResponse,
  CreateOrderRequest, CreateOrderResponse,
  ValidateCouponRequest, CouponValidation,
  BookingDetailResponse, MockCaptureRequest,
  PaginatedBookings, CancelResponse,
} from '../types';
import type { ApiError } from '@/shared/types';

interface VerifyPaymentData {
  razorpayOrderId:   string;
  razorpayPaymentId: string;
  razorpaySignature: string;
}

export function useMyBookings(tab: 'upcoming' | 'past' = 'upcoming', page = 1) {
  return useQuery<PaginatedBookings>({
    queryKey: ['bookings', 'mine', tab, page],
    queryFn: () =>
      api.get<PaginatedBookings>('/api/bookings/me', { params: { tab, page, pageSize: 10 } })
        .then((r) => r.data),
    staleTime: 30 * 1000,
  });
}

export function useCancelBooking() {
  const qc = useQueryClient();
  return useMutation<CancelResponse, ApiError, string>({
    mutationFn: (ref: string) =>
      api.post<CancelResponse>(`/api/bookings/${ref}/cancel`).then((r) => r.data),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['bookings', 'mine'] });
      void qc.invalidateQueries({ queryKey: ['my-bookings'] });
      // Freed seats/counts should be immediately visible to other users
      void qc.invalidateQueries({ queryKey: ['show-seats'] });
      void qc.invalidateQueries({ queryKey: ['event-availability'] });
    },
  });
}

// ── Seats ─────────────────────────────────────────────────────────────────────

export function useShowSeats(showId: string) {
  return useQuery<ShowSeatsData>({
    queryKey: ['show-seats', showId],
    queryFn: () => api.get<ShowSeatsData>(`/api/shows/${showId}/seats`).then((r) => r.data),
    staleTime: 0,
    enabled: !!showId,
  });
}

// ── Seat locks ────────────────────────────────────────────────────────────────

export function useLockSeats() {
  return useMutation<SeatLockResponse, { message?: string }, { showId: string; seats: string[] }>({
    mutationFn: ({ showId, seats }) =>
      api.post<SeatLockResponse>('/api/seat-locks', { showId, seats }).then((r) => r.data),
  });
}

export function useReleaseSeats() {
  return useMutation<void, { message?: string }, string>({
    mutationFn: (showId: string) =>
      api.delete('/api/seat-locks', { params: { showId } }).then(() => undefined),
  });
}

// ── Checkout ──────────────────────────────────────────────────────────────────

export function useCreateOrder() {
  return useMutation<CreateOrderResponse, ApiError, CreateOrderRequest>({
    mutationFn: (data) =>
      api.post<CreateOrderResponse>('/api/payments/order', data, {
        headers: { 'Idempotency-Key': data.idempotencyKey },
      }).then((r) => r.data),
  });
}

export function useValidateCoupon() {
  return useMutation<CouponValidation, ApiError, ValidateCouponRequest>({
    mutationFn: (data) =>
      api.post<CouponValidation>('/api/coupons/validate', data).then((r) => r.data),
  });
}

export function useMockCapture() {
  return useMutation<BookingDetailResponse, ApiError, MockCaptureRequest>({
    mutationFn: (data) =>
      api.post<BookingDetailResponse>('/api/payments/mock-capture', data).then((r) => r.data),
  });
}

export function useVerifyPayment() {
  const queryClient = useQueryClient();
  return useMutation<BookingDetailResponse, ApiError, VerifyPaymentData>({
    mutationFn: (data) =>
      api.post<BookingDetailResponse>('/api/payments/verify', data).then((r) => r.data),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ['my-bookings'] }),
  });
}

export function useBookingDetail(ref: string) {
  return useQuery<BookingDetailResponse>({
    queryKey: ['booking', ref],
    queryFn:  () => api.get<BookingDetailResponse>(`/api/bookings/${ref}`).then((r) => r.data),
    enabled:  !!ref,
    staleTime: 5 * 60 * 1000,
  });
}

export async function downloadInvoicePdf(ref: string): Promise<void> {
  const response = await api.get(`/api/bookings/${ref}/invoice`, { responseType: 'blob' });
  const blob = new Blob([response.data as BlobPart], { type: 'application/pdf' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href     = url;
  a.download = `${ref}_GST_Invoice.pdf`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
