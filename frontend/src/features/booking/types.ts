export type { Booking, BookingSeat, Payment, SeatCell, SeatRow, PricingBreakdown } from '@/shared/types';
export type { SeatState } from '@/shared/types';

// ── Screen layout (from /api/shows/{showId}/seats) ────────────────────────────

export interface SeatCategory {
  name:           string;
  rows:           string[];
  price:          number;
  color:          string;
}

export interface ScreenLayout {
  rows:           number;
  cols:           number;
  categories:     SeatCategory[];
  blockedSeats:   string[];
  aisleAfterCols: number[];
}

export interface ShowInfo {
  movieTitle:  string;
  posterUrl?:  string | null;
  format:      string;
  language:    string;
  showDate:    string;
  showTime:    string;
  venueName:   string;
  screenName:  string;
}

export interface ShowSeatsData {
  showId:       string;
  screenLayout: ScreenLayout | null;
  bookedSeats:  string[];
  lockedSeats:  string[];
  show?:        ShowInfo;
}

// ── Seat lock API ─────────────────────────────────────────────────────────────

export interface LockSeatsRequest {
  showId: string;
  seats:  string[];
}

export interface SeatLockResponse {
  lockId:      string;
  expiresAt:   string;
  lockedSeats: string[];
}

// ── Checkout / Payment ────────────────────────────────────────────────────────

export interface CreateOrderRequest {
  showId:         string;
  seats:          string[];
  idempotencyKey: string;
  couponCode?:    string;
}

export interface CreateOrderResponse {
  orderId:         string;
  bookingRef:      string;
  providerOrderId: string;
  provider:        string;
  amount:          number;
  currency:        string;
  breakdown:       import('@/shared/types').PricingBreakdown;
  razorpayKeyId?:  string;
}

export interface ValidateCouponRequest {
  code:         string;
  showId:       string;
  userId?:      string;
  ticketAmount: number;
}

export interface CouponValidation {
  valid:       boolean;
  couponId:    string;
  code:        string;
  discount:    number;
  description: string;
}

// ── Booking detail ────────────────────────────────────────────────────────────

export interface BookingSeatItem {
  label:    string;
  category: string;
  price:    number;
}

export interface BookingMovieInfo {
  title:       string;
  slug:        string;
  posterUrl:   string | null;
  certificate: string | null;
  format:      string | null;
  language:    string | null;
}

export interface BookingShowInfo {
  date:       string;
  time:       string;
  venueName:  string;
  screenName: string;
  city:       string;
}

export interface BookingPaymentInfo {
  method:             string | null;
  capturedAt:         string | null;
  providerPaymentId:  string | null;
}

export interface BookingDetailResponse {
  bookingRef:    string;
  status:        string;
  createdAt:     string;
  movie:         BookingMovieInfo;
  show:          BookingShowInfo;
  seats:         BookingSeatItem[];
  pricing:       import('@/shared/types').PricingBreakdown;
  payment:       BookingPaymentInfo;
  qrUrl:         string | null;
  invoiceUrl:    string | null;
  invoiceNumber: string | null;
  bookingId:     string;
}

export interface BookingListItem {
  id:              string;
  bookingRef:      string;
  status:          string;
  title:           string;
  slug:            string;
  posterUrl:       string | null;
  certificate:     string | null;
  format:          string | null;
  language:        string | null;
  showDate:        string;
  showTime:        string;
  showDatetime:    string;
  venueName:       string;
  venueAddress:    string;
  screenName:      string;
  seats:           BookingSeatItem[];
  ticketQty:           number;
  ticketAmount:        number;
  amountPaid:          number;
  discount:            number;
  nonRefundableAmount: number;
  paymentMethod:   string | null;
  invoiceUrl:      string | null;
  qrUrl:           string | null;
  canCancel:       boolean;
  minutesUntilShow: number;
  createdAt:       string;
}

export interface PaginatedBookings {
  items:      BookingListItem[];
  total:      number;
  page:       number;
  pageSize:   number;
  totalPages: number;
}

export interface MockCaptureRequest {
  providerOrderId: string;
  simulateFailure: boolean;
}

export interface CancelResponse {
  bookingRef:   string;
  refundAmount: number;
  refundId:     string;
  message:      string;
}
