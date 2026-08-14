export interface PartnerVenueAccess {
  venueId: string;
  venueName: string;
  cityName: string;
  grantedAt: string;
}

export interface PartnerDashboard {
  partnerName: string;
  venueNames: string[];
  todayBookings: number;
  todayRevenue: number;
  weekRevenue: number;
  monthRevenue: number;
  totalBookingsAllTime: number;
  upcomingShows: number;
  bookingsPerDay: Array<{ date: string; count: number }>;
  revenuePerVenue: Array<{ venueName: string; revenue: number }>;
  recentBookings: RecentPartnerBooking[];
  occupancyRate: number;
}

export interface RecentPartnerBooking {
  bookingRef: string;
  movieOrEventTitle: string;
  venueName: string;
  amountPaid: number;
  status: string;
  createdAt: string;
}

export interface PartnerVenueListItem {
  id: string;
  name: string;
  address: string;
  cityName: string;
  isActive: boolean;
  contactPhone: string | null;
  contactEmail: string | null;
  screenCount: number;
}

export interface PartnerScreenInfo {
  id: string;
  name: string;
  totalSeats: number;
  layout: string | null;
}

export interface PartnerVenueDetail {
  id: string;
  name: string;
  slug: string;
  address: string;
  cityId: string;
  cityName: string;
  chain: string | null;
  amenities: string | null;
  isActive: boolean;
  contactPhone: string | null;
  contactEmail: string | null;
  screens: PartnerScreenInfo[];
}

export interface PartnerShowResponse {
  id: string;
  venueId: string;
  venueName: string;
  screenId: string;
  screenName: string;
  movieId: string | null;
  movieTitle: string | null;
  eventId: string | null;
  eventTitle: string | null;
  showDate: string;
  showTime: string;
  format: string | null;
  language: string | null;
  status: string;
  bookedSeats: number;
}

export interface PartnerBookingListItem {
  bookingRef: string;
  userId: string;
  userName: string;
  movieOrEventTitle: string;
  venueName: string;
  screenName: string;
  showDatetime: string;
  ticketQty: number;
  amountPaid: number;
  status: string;
  createdAt: string;
}

export interface PartnerBookingDetail {
  bookingRef: string;
  userId: string;
  userName: string;
  userEmail: string;
  movieOrEventTitle: string;
  venueName: string;
  screenName: string;
  showDatetime: string;
  ticketQty: number;
  seats: string[];
  ticketAmount: number;
  convenienceFee: number;
  discount: number;
  amountPaid: number;
  status: string;
  createdAt: string;
  cancelledAt: string | null;
}

export interface PartnerReportResponse {
  totalBookings: number;
  totalRevenue: number;
  bookingsPerDay: Array<{ date: string; count: number }>;
  revenuePerVenue: Array<{ venueName: string; revenue: number }>;
  recentBookings: RecentPartnerBooking[];
}

export interface PartnerReviewResponse {
  id: string;
  rating: number;
  title: string | null;
  body: string | null;
  userName: string;
  isVerifiedBooking: boolean;
  movieTitle: string;
  moviePosterUrl: string | null;
  thumbsUp: number;
  thumbsDown: number;
  status: string;
  createdAt: string;
  venueName: string;
}

export interface AdminPartnerResponse {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  userMobile: string | null;
  businessName: string;
  contactPerson: string;
  contactPhone: string;
  contactEmail: string;
  gstNumber: string | null;
  panNumber: string | null;
  notes: string | null;
  isActive: boolean;
  venueAccess: Array<{
    venueId: string;
    venueName: string;
    cityName: string;
    grantedAt: string;
    contactPhone: string | null;
    contactEmail: string | null;
  }>;
  createdAt: string;
}

export interface CreatePartnerResponse {
  partner: AdminPartnerResponse;
  tempPassword: string;
}

// ── LYS Partner types ─────────────────────────────────────────────────────────

export interface LysPriceTier {
  name: string;
  price: number;
  capacity: number;
  color?: string;
}

export interface LysArtist {
  name: string;
  type: string;
}

export interface LysPartnerEvent {
  id: string;
  title: string;
  slug: string;
  type: string;
  status: string;
  organizerName: string;
  organizerEmail: string;
  venueDisplay: string;
  eventDateLabel: string;
  eventTimeLabel: string;
  description: string | null;
  language: string;
  ageRestriction: number;
  durationMin: number | null;
  lowestPrice: number;
  tierCount: number;
  priceTiers: LysPriceTier[];
  artists: LysArtist[];
  posterUrl: string | null;
  backdropUrl: string | null;
  submittedAt: string | null;
  partnerAction: 'approved' | 'rejected' | null;
  partnerReviewNotes: string | null;
  partnerReviewedAt: string | null;
}

export interface LysPartnerEventPage {
  items: LysPartnerEvent[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}
