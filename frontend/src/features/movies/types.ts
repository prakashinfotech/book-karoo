export type { Movie, ShowtimeVenue, ShowtimeSlot } from '@/shared/types';

// ── Movie detail (richer than Movie list item) ─────────────────────────────────

export interface CastMember {
  name:  string;
  role:  string;
  photo: string | null;
}

export interface CrewMember {
  name: string;
  role: string;
}

export interface MovieDetail {
  id:                  string;
  title:               string;
  slug:                string;
  description:         string | null;
  durationMin:         number;
  languages:           string[];
  formats:             string[];
  genres:              string[];
  certificate:         string | null;
  releaseDate:         string | null;
  posterUrl:           string | null;
  backdropUrl:         string | null;
  trailerUrl:          string | null;
  imdbRating:          number | null;
  status:              string;
  category:            string;
  cast:                CastMember[];
  crew:                CrewMember[];
  averageRating:       number;
  ratingDistribution:  Record<number, number>;
  totalReviews:        number;
  related:             MovieDetail[];
  canReview:           boolean;
}

// ── Review ─────────────────────────────────────────────────────────────────────

export interface Review {
  id:                string;
  userId:            string;
  userName:          string;
  userAvatarInitial: string;
  rating:            number;
  title:             string | null;
  body:              string | null;
  thumbsUp:          number;
  thumbsDown:        number;
  isVerifiedBooking: boolean;
  createdAt:         string;
  status:            string;
}

export interface PaginatedReviews {
  items:      Review[];
  total:      number;
  page:       number;
  pageSize:   number;
  totalPages: number;
}

// ── Showtimes (city-aware, with availability) ──────────────────────────────────

export interface ShowtimeItem {
  showId:       string;
  time:         string;
  format:       string;
  language:     string;
  availability: 'green' | 'orange' | 'red' | 'sold_out';
  lowestPrice:  number;
}

export interface ShowtimeVenueGroup {
  venueId:   string;
  venueName: string;
  venueArea: string;
  distance:  string | null;
  amenities: string[];
  shows:     ShowtimeItem[];
}

export interface ShowtimesGrouped {
  venues: ShowtimeVenueGroup[];
}
