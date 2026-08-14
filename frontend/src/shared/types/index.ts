// ─── Enums ────────────────────────────────────────────────────────────────────

export type UserRole = 'User' | 'Admin' | 'Partner';
export type BookingStatus = 'Pending' | 'Confirmed' | 'Cancelled' | 'Refunded';
export type PaymentStatus = 'Created' | 'Captured' | 'Failed' | 'Refunded';
export type PaymentProvider = 'Mock' | 'Razorpay' | 'PayPal';
export type MovieStatus = 'Draft' | 'Published' | 'Archived';
export type MovieCategory = 'NowShowing' | 'ComingSoon' | 'Exclusive' | 'Premiere';
export type EventType = 'LiveEvent' | 'Play' | 'Sport' | 'Activity' | 'Comedy' | 'Ipl';
export type ShowStatus = 'Scheduled' | 'Cancelled' | 'Completed';
export type ReviewStatus = 'Published' | 'Hidden' | 'Reported';
export type CouponType = 'Flat' | 'Percent' | 'Bogo';
export type SeatCategory = 'recliner' | 'executive' | 'normal';
export type SeatState = 'available' | 'selected' | 'booked' | 'locked';

// ─── Core Entities ────────────────────────────────────────────────────────────

export interface User {
  id: string;
  email: string;
  mobile: string;
  name: string;
  role: UserRole;
  emailVerified: boolean;
  cityId?: string;
  stateCode?: string;
  profilePicUrl?: string;
  dob?: string;
  gender?: string;
  passwordChangedAt?: string;
  isPartner?: boolean;
  partnerVenueIds?: string[];
  partnerVenueNames?: string[];
}

export interface City {
  id: string;
  name: string;
  slug: string;
  state: string;
  stateCode: string;
  latitude: number;
  longitude: number;
}

export interface Venue {
  id: string;
  name: string;
  slug: string;
  chain?: string;
  address: string;
  cityId: string;
  stateCode?: string;
  latitude: number;
  longitude: number;
  amenities?: string;
  isActive: boolean;
}

export interface Screen {
  id: string;
  venueId: string;
  name: string;
  layout?: string;
  totalSeats: number;
  isActive: boolean;
}

export interface Movie {
  id: string;
  tmdbId?: number;
  title: string;
  slug: string;
  description?: string;
  durationMin: number;
  languages: string[];
  formats: string[];
  genres: string[];
  cast?: string;
  crew?: string;
  certificate?: string;
  releaseDate?: string;
  posterUrl?: string;
  backdropUrl?: string;
  trailerUrl?: string;
  imdbRating?: number;
  status: MovieStatus;
  category: MovieCategory;
}

export interface Event {
  id: string;
  title: string;
  slug: string;
  type: EventType;
  description?: string;
  venueId?: string;
  eventDate?: string;
  durationMin: number;
  language?: string;
  ageRestriction?: number;
  organizer?: string;
  artists?: string;
  posterUrl?: string;
  backdropUrl?: string;
  priceTiers?: string;
  status: MovieStatus;
}

export interface Show {
  id: string;
  screenId: string;
  venueId: string;
  movieId?: string;
  eventId?: string;
  showDate: string;
  showTime: string;
  showDatetime: string;
  format?: string;
  language?: string;
  priceOverrides?: string;
  status: ShowStatus;
}

export interface SeatLock {
  id: string;
  showId: string;
  seatLabel: string;
  userId?: string;
  sessionId?: string;
  createdAt: string;
  expiresAt: string;
}

export interface Booking {
  id: string;
  bookingRef: string;
  userId: string;
  showId: string;
  ticketQty: number;
  ticketAmount: number;
  convenienceFee: number;
  offerProcessingFee: number;
  taxableAmount: number;
  cgst: number;
  sgst: number;
  igst: number;
  discount: number;
  amountPaid: number;
  customerStateCode: string;
  couponId?: string;
  status: BookingStatus;
  invoiceNumber?: string;
  invoiceUrl?: string;
  qrUrl?: string;
  paymentMethodLabel?: string;
  cancelledAt?: string;
  createdAt: string;
}

export interface BookingSeat {
  id: string;
  bookingId: string;
  seatLabel: string;
  category: string;
  price: number;
  createdAt: string;
}

export interface Payment {
  id: string;
  bookingId: string;
  provider: PaymentProvider;
  providerOrderId?: string;
  providerPaymentId?: string;
  amount: number;
  currency: string;
  method?: string;
  status: PaymentStatus;
  idempotencyKey?: string;
  refundId?: string;
  refundAmount?: number;
  capturedAt?: string;
  createdAt: string;
}

export interface Review {
  id: string;
  userId: string;
  movieId?: string;
  eventId?: string;
  rating: number;
  title?: string;
  body?: string;
  thumbsUp: number;
  thumbsDown: number;
  isVerifiedBooking: boolean;
  status: ReviewStatus;
  createdAt: string;
}

export interface Coupon {
  id: string;
  code: string;
  description?: string;
  type: CouponType;
  value: number;
  maxDiscount?: number;
  minOrder: number;
  validFrom: string;
  validTo: string;
  isActive: boolean;
}

// ─── Composite / View types ───────────────────────────────────────────────────

export interface ShowtimeVenue {
  venue: Venue;
  amenities: string[];
  shows: ShowtimeSlot[];
  fromPrice: number;
}

export interface ShowtimeSlot {
  showId: string;
  time: string;
  format: string;
  language: string;
  availability: 'good' | 'fast' | 'low' | 'sold';
  seatsLeft: number;
  price: number;
}

export interface SeatCell {
  id: string;
  label: string;
  row: string;
  number: number;
  category: SeatCategory;
  state: SeatState;
  price: number;
}

export interface SeatRow {
  letter: string;
  category: SeatCategory;
  cells: SeatCell[];
}

// ─── Pricing ──────────────────────────────────────────────────────────────────

export interface PricingBreakdown {
  ticketAmount: number;
  convenienceFee: number;
  convenienceFeeGst: number;
  offerProcessingFee: number;
  offerProcessingFeeGst: number;
  taxableAmount: number;
  cgst: number;
  sgst: number;
  igst: number;
  discount: number;
  amountPaid: number;
  isIntraState: boolean;
}

// ─── API helpers ──────────────────────────────────────────────────────────────

export interface ApiError {
  message: string;
  statusCode: number;
  errors?: Record<string, string[]>;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}

// ─── Auth DTOs ────────────────────────────────────────────────────────────────

export interface AuthResponse {
  accessToken: string;
  user: User;
}

export interface SignupRequest {
  email: string;
  password: string;
  name: string;
  mobile: string;
  gender?: string;
  cityId?: string;
}

export interface LoginRequest {
  identifier: string;
  password: string;
}
