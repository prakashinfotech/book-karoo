export interface ConversationTurn {
  role: 'user' | 'assistant';
  content: string;
}

export interface ChatbotMessageRequest {
  message: string;
  history: ConversationTurn[];
}

export interface ChatbotShowCard {
  showId: string;
  movieTitle: string;
  movieSlug: string;
  posterUrl: string;
  certificate: string;
  format: string;
  language: string;
  showDate: string;
  showTime: string;
  venueName: string;
  screenName: string;
  cityName: string;
  lowestPrice: number;
  availableSeats: number;
  availability: 'green' | 'orange' | 'red' | 'sold_out';
}

export interface ChatbotEventCard {
  eventId: string;
  title: string;
  slug: string;
  posterUrl: string;
  type: string;
  eventDateLabel: string;
  eventTimeLabel: string;
  venueName: string;
  cityName: string;
  lowestPrice: number;
}

export interface ChatbotBookingCard {
  bookingRef: string;
  title: string;
  posterUrl: string;
  showDate: string;
  showTime: string;
  venueName: string;
  status: string;
  ticketQty: number;
  amountPaid: number;
}

export interface ChatbotMessageResponse {
  message: string;
  intent: string;
  shows: ChatbotShowCard[] | null;
  events: ChatbotEventCard[] | null;
  bookings: ChatbotBookingCard[] | null;
  actionType: string | null;
  actionUrl: string | null;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  shows?: ChatbotShowCard[];
  events?: ChatbotEventCard[];
  bookings?: ChatbotBookingCard[];
  actionType?: string | null;
  actionUrl?: string | null;
  timestamp: number;
}
