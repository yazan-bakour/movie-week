export interface Movie {
  id: string;
  title: string;
  year: string;
  poster: string;
  votes: number;
  addedAt: number; // timestamp
  status: 'active' | 'winner';
}

export interface Winner {
  id: number;
  movieId: string;
  title: string;
  year: string;
  poster: string;
  finalVotes: number;
  wonAt: number; // timestamp
}

// OMDb API Response Types
export interface OMDbMovieSearchResult {
  imdbID: string;
  Title: string;
  Year: string;
  Poster: string;
  Type: string;
}

export interface OMDbSearchResponse {
  Search?: OMDbMovieSearchResult[];
  totalResults?: string;
  Response: string;
  Error?: string;
}
