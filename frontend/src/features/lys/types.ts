export interface LysOrganizer {
  id:          string;
  userId:      string;
  name:        string;
  email:       string;
  phone:       string;
  panNumber:   string;
  isVerified:  boolean;
  isActive:    boolean;
  verifiedAt:  string | null;
  createdAt:   string;
}

export interface LysPriceTier {
  name:     string;
  price:    number;
  capacity: number;
  color:    string;
}

export interface LysArtist {
  name: string;
  type: string;
  bio?: string;
}

export type LysEventStatus =
  | 'draft'
  | 'submitted'
  | 'rejected'
  | 'changes_requested'
  | 'published'
  | 'completed';

export interface LysEvent {
  id:                 string;
  organizerId:        string;
  title:              string;
  slug:               string;
  type:               string;
  description:        string;
  venueType:          'existing' | 'custom';
  venueId:            string | null;
  venueName:          string | null;
  cityName:           string | null;
  customVenueName:      string | null;
  customVenueAddress:   string | null;
  customVenueCity:      string | null;
  customVenueLatitude:  number | null;
  customVenueLongitude: number | null;
  eventDate:          string;
  eventDateLabel:     string;
  eventTimeLabel:     string;
  durationMin:        number | null;
  language:           string;
  ageRestriction:     number;
  artists:            LysArtist[];
  priceTiers:         LysPriceTier[];
  lowestPrice:        number;
  posterUrl:          string | null;
  backdropUrl:        string | null;
  status:             LysEventStatus;
  statusLabel:        string;
  statusColor:        string;
  submittedAt:        string | null;
  reviewedAt:         string | null;
  reviewNotes:        string | null;
  commissionRate:     number;
  publishedEventId:   string | null;
  createdAt:          string;
  updatedAt:          string;
}

export interface LysEventListItem {
  id:             string;
  title:          string;
  slug:           string;
  type:           string;
  eventDate:      string;
  eventDateLabel: string;
  status:         LysEventStatus;
  statusLabel:    string;
  posterUrl:      string | null;
  lowestPrice:    number;
  submittedAt:    string | null;
  reviewedAt:     string | null;
  reviewNotes:    string | null;
}

export const LYS_STATUS_CONFIG: Record<LysEventStatus, {
  label: string; color: string; bgColor: string; description: string;
}> = {
  draft:             { label: 'Draft',          color: '#999999', bgColor: '#2A2A2A',
                       description: 'Not submitted yet. Complete your event details and submit for review.' },
  submitted:         { label: 'Submitted',      color: '#818CF8', bgColor: '#1E1B4B',
                       description: 'Your event is waiting for BookKaroo team review.' },

  rejected:          { label: 'Rejected',       color: '#F87171', bgColor: '#2D0707',
                       description: 'Your event was not approved. See the reason below.' },
  changes_requested: { label: 'Changes Needed', color: '#FCD34D', bgColor: '#2D1B00',
                       description: 'The review team needs changes before approving.' },
  published:         { label: 'Live',           color: '#34D399', bgColor: '#022C1E',
                       description: 'Your event is live on BookKaroo. Tickets are on sale!' },
  completed:         { label: 'Completed',      color: '#6B7280', bgColor: '#1F2937',
                       description: 'This event has taken place.' },
};

export const LYS_EVENT_TYPES = [
  { value: 'live_event', label: '🎵 Concert / Live Event' },
  { value: 'play',       label: '🎭 Play / Theatre' },
  { value: 'comedy',     label: '🤣 Stand-Up Comedy' },
  { value: 'sport',      label: '🏟 Sports' },
  { value: 'activity',   label: '⚡ Activity / Workshop' },
  { value: 'other',      label: '🎪 Other' },
] as const;

export interface LysDuplicateWarning {
  id:             string;
  title:          string;
  eventDateLabel: string;
  status:         LysEventStatus;
}

export interface AdminLysEvent {
  id:                  string;
  title:               string;
  slug:                string;
  type:                string;
  status:              LysEventStatus;
  organizerName:       string;
  organizerEmail:      string;
  organizerPan:        string;
  isOrganizerVerified: boolean;
  venueType:           string;
  venueDisplay:        string;
  customVenueAddress:   string | null;
  customVenueLatitude:  number | null;
  customVenueLongitude: number | null;
  eventDateLabel:      string;
  eventTimeLabel:      string;
  description:         string | null;
  language:            string;
  ageRestriction:      number;
  durationMin:         number | null;
  commissionRate:      number;
  lowestPrice:         number;
  tierCount:           number;
  priceTiers:          LysPriceTier[];
  artists:             LysArtist[];
  posterUrl:           string | null;
  backdropUrl:         string | null;
  submittedAt:              string | null;
  reviewedAt:               string | null;
  reviewNotes:              string | null;
  requiresPartnerApproval:  boolean;
  assignedPartnerName:      string | null;
  partnerAction:            string | null;
  partnerReviewNotes:       string | null;
  partnerReviewedAt:        string | null;
}

export interface AdminLysOrganizer {
  id:                 string;
  userId:             string;
  name:               string;
  email:              string;
  phone:              string;
  panNumber:          string;
  isVerified:         boolean;
  isActive:           boolean;
  verifiedAt:         string | null;
  eventCount:         number;
  publishedEventCount: number;
  createdAt:          string;
}

export interface RegisterOrganizerForm {
  name:      string;
  email:     string;
  phone:     string;
  panNumber: string;
}

export interface CreateLysEventForm {
  title:              string;
  type:               string;
  description:        string;
  venueType:          'existing' | 'custom';
  venueId?:           string;
  customVenueName?:   string;
  customVenueAddress?:  string;
  customVenueCity?:     string;
  customVenueLatitude?: number;
  customVenueLongitude?: number;
  eventDate:            string;
  durationMin?:       number;
  language:           string;
  ageRestriction:     number;
  artistsJson?:       string;
  priceTiersJson:     string;
}
