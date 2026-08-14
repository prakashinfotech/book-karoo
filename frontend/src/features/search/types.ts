export interface SearchMovieResult {
  id:          string;
  title:       string;
  slug:        string;
  posterUrl:   string | null;
  certificate: string | null;
  category:    string;
  imdbRating:  number | null;
  type:        'movie';
}

export interface SearchEventResult {
  id:        string;
  title:     string;
  slug:      string;
  posterUrl: string | null;
  eventType: string;
  eventDate: string | null;
  type:      'event';
}

export interface SearchVenueResult {
  id:       string;
  name:     string;
  slug:     string;
  chain:    string | null;
  cityName: string;
  type:     'venue';
}

export interface SearchCityResult {
  id:        string;
  name:      string;
  slug:      string;
  state:     string;
  stateCode: string;
  type:      'city';
}

export interface SearchResponse {
  movies:       SearchMovieResult[];
  events:       SearchEventResult[];
  venues:       SearchVenueResult[];
  cities:       SearchCityResult[];
  query:        string;
  totalResults: number;
}

export type AnySearchResult =
  | SearchMovieResult
  | SearchEventResult
  | SearchVenueResult
  | SearchCityResult;
