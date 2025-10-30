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

export interface MovieSearchResult {
  imdbID: string;
  Title: string;
  Year: string;
  Poster: string;
}
