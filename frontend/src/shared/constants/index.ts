export const ROUTES = {
  HOME: '/',
  MOVIES: '/movies',
  MOVIE_DETAIL: (slug: string) => `/movies/${slug}`,
  SHOWTIMES: (slug: string) => `/movies/${slug}/showtimes`,
  EVENTS: '/events',
  EVENT_DETAIL: (slug: string) => `/events/${slug}`,
  SPORTS: '/sports',
  PLAYS: '/plays',
  ACTIVITIES: '/activities',
  IPL: '/ipl',
  SEARCH: '/search',
  LOGIN: '/login',
  SIGNUP: '/signup',
  FORGOT_PASSWORD: '/forgot-password',
  RESET_PASSWORD: '/reset-password',
  HELP: '/help',
  SEAT_SELECTION: (showId: string) => `/booking/${showId}/seats`,
  CHECKOUT: '/booking/checkout',
  CONFIRMATION: '/booking/confirmed',
  PROFILE: '/profile',
  MY_BOOKINGS: '/profile/bookings',
  ADMIN: '/admin',
  ADMIN_MOVIES: '/admin/movies',
  ADMIN_EVENTS: '/admin/events',
  ADMIN_VENUES: '/admin/venues',
  ADMIN_SHOWS: '/admin/shows',
  ADMIN_BOOKINGS: '/admin/bookings',
  ADMIN_USERS: '/admin/users',
  ADMIN_REPORTS: '/admin/reports',
  ADMIN_CMS: '/admin/cms',
  ADMIN_SETTINGS: '/admin/settings',
} as const;

export const LANGUAGES = [
  'Hindi', 'English', 'Tamil', 'Telugu', 'Malayalam',
  'Kannada', 'Marathi', 'Bengali', 'Punjabi', 'Gujarati',
] as const;

export const GENRES = [
  'Action', 'Comedy', 'Drama', 'Romance', 'Thriller',
  'Horror', 'Sci-Fi', 'Animation', 'Documentary', 'Biography', 'Musical',
] as const;

export const FORMATS = ['2D', '3D', 'IMAX', '4DX', 'Dolby Cinema'] as const;

export const CATEGORIES = ['Now Showing', 'Coming Soon', 'Exclusive', 'Premieres'] as const;

export const CITIES = [
  { name: 'Mumbai', slug: 'mumbai', state: 'Maharashtra', stateCode: '27' },
  { name: 'Delhi-NCR', slug: 'delhi-ncr', state: 'Delhi', stateCode: '07' },
  { name: 'Bangalore', slug: 'bangalore', state: 'Karnataka', stateCode: '29' },
  { name: 'Hyderabad', slug: 'hyderabad', state: 'Telangana', stateCode: '36' },
  { name: 'Ahmedabad', slug: 'ahmedabad', state: 'Gujarat', stateCode: '24' },
  { name: 'Chennai', slug: 'chennai', state: 'Tamil Nadu', stateCode: '33' },
  { name: 'Pune', slug: 'pune', state: 'Maharashtra', stateCode: '27' },
  { name: 'Kolkata', slug: 'kolkata', state: 'West Bengal', stateCode: '19' },
  { name: 'Jaipur', slug: 'jaipur', state: 'Rajasthan', stateCode: '08' },
  { name: 'Lucknow', slug: 'lucknow', state: 'Uttar Pradesh', stateCode: '09' },
  { name: 'Chandigarh', slug: 'chandigarh', state: 'Chandigarh', stateCode: '04' },
  { name: 'Kochi', slug: 'kochi', state: 'Kerala', stateCode: '32' },
  { name: 'Goa', slug: 'goa', state: 'Goa', stateCode: '30' },
  { name: 'Indore', slug: 'indore', state: 'Madhya Pradesh', stateCode: '23' },
  { name: 'Bhopal', slug: 'bhopal', state: 'Madhya Pradesh', stateCode: '23' },
  { name: 'Nagpur', slug: 'nagpur', state: 'Maharashtra', stateCode: '27' },
  { name: 'Surat', slug: 'surat', state: 'Gujarat', stateCode: '24' },
  { name: 'Vadodara', slug: 'vadodara', state: 'Gujarat', stateCode: '24' },
  { name: 'Coimbatore', slug: 'coimbatore', state: 'Tamil Nadu', stateCode: '33' },
  { name: 'Mysore', slug: 'mysore', state: 'Karnataka', stateCode: '29' },
  { name: 'Visakhapatnam', slug: 'visakhapatnam', state: 'Andhra Pradesh', stateCode: '37' },
  { name: 'Bhubaneswar', slug: 'bhubaneswar', state: 'Odisha', stateCode: '21' },
  { name: 'Guwahati', slug: 'guwahati', state: 'Assam', stateCode: '18' },
  { name: 'Patna', slug: 'patna', state: 'Bihar', stateCode: '10' },
  { name: 'Thiruvananthapuram', slug: 'thiruvananthapuram', state: 'Kerala', stateCode: '32' },
] as const;

export const TMDB_IMAGE_BASE = 'https://image.tmdb.org/t/p';
// Valid TMDB poster sizes: w92 w154 w185 w342 w500 w780 original  (w300 is NOT valid)
export const TMDB_POSTER = (path: string, size = 'w342') =>
  path.startsWith('http') ? path : `${TMDB_IMAGE_BASE}/${size}${path}`;
// Valid TMDB backdrop sizes: w300 w780 w1280 original
export const TMDB_BACKDROP = (path: string, size = 'w1280') =>
  path.startsWith('http') ? path : `${TMDB_IMAGE_BASE}/${size}${path}`;
