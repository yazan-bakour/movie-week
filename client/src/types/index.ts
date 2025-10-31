export interface Movie {
  id: string;
  title: string;
  year: string;
  poster: string;
  votes: number;
  addedAt: number;
  status: 'active' | 'winner';
}

export interface Winner {
  id: number;
  movieId: string;
  title: string;
  year: string;
  poster: string;
  finalVotes: number;
  wonAt: number;
}

export interface SearchResult {
  id: string;
  title: string;
  year: string;
  poster: string | null;
  type: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  count?: number;
  error?: string;
}

export interface SearchApiResponse {
  success: boolean;
  query: string;
  page: number;
  totalResults: number;
  results: SearchResult[];
}
