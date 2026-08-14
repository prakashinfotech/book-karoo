export interface PriceTier {
  name:     string;
  price:    number;
  capacity: number;
  color:    string;
}

export interface Artist {
  name: string;
  type: string;
}

export interface OrganizerInfo {
  name:     string;
  contact?: string;
  stadium?: string;
}

export type EventKind =
  | 'LiveEvent'
  | 'Play'
  | 'Sport'
  | 'Activity'
  | 'Comedy'
  | 'Ipl';

export interface EventListItem {
  id:             string;
  title:          string;
  slug:           string;
  type:           EventKind;
  posterUrl:      string | null;
  backdropUrl:    string | null;
  eventDate:      string | null;
  eventDateLabel: string;
  eventTimeLabel: string;
  language:       string | null;
  ageRestriction: number;
  durationMin:    number | null;
  venueName:      string;
  cityName:       string;
  priceTiers:     PriceTier[];
  lowestPrice:    number;
  artists:        Artist[];
  status:         string;
}

export interface EventDetail extends EventListItem {
  description:    string | null;
  organizer:      OrganizerInfo | null;
  venueAddress:   string | null;
  venueAmenities: string[];
  venueLatitude:  number | null;
  venueLongitude: number | null;
  allPriceTiers:  PriceTier[];
}

export interface EventListResponse {
  items:      EventListItem[];
  total:      number;
  page:       number;
  pageSize:   number;
  totalPages: number;
}

export interface HomeData {
  nowShowing:  import('@/shared/types').Movie[];
  comingSoon:  import('@/shared/types').Movie[];
  liveEvents:  EventListItem[];
  plays:       EventListItem[];
  comedy:      EventListItem[];
  iplMatches:  EventListItem[];
  banners:     BannerItem[];
}

export interface BannerItem {
  id:       string;
  title:    string;
  imageUrl: string | null;
  linkUrl:  string | null;
  position: number;
}

export interface TierAvailability {
  tierName:        string;
  capacity:        number;
  booked:          number;
  locked:          number;
  available:       number;
  availabilityPct: number;
  color:           string;
}

export interface EventAvailabilityResponse {
  tiers: TierAvailability[];
}

export interface CreateEventOrderRequest {
  eventId:        string;
  tierName:       string;
  quantity:       number;
  couponCode?:    string;
  idempotencyKey: string;
}
