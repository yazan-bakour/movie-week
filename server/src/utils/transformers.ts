/**
 * OMDb API movie response structure
 */
export interface OMDbMovie {
  imdbID: string;
  Title: string;
  Year: string;
  Poster: string;
  Type: string;
}

/**
 * Transformed search result
 */
export interface SearchResult {
  id: string;
  title: string;
  year: string;
  poster: string | null;
  type: string;
}

/**
 * Transform OMDb movie data to our format
 */
export const transformOMDbMovie = (movie: OMDbMovie): SearchResult => {
  return {
    id: movie.imdbID,
    title: movie.Title,
    year: movie.Year,
    poster: movie.Poster === 'N/A' ? null : movie.Poster,
    type: movie.Type,
  };
};

/**
 * Transform multiple OMDb movies
 */
export const transformOMDbMovies = (movies: OMDbMovie[]): SearchResult[] => {
  return movies.map(transformOMDbMovie);
};
