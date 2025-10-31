import { useState, useEffect, useRef } from 'react';
import { searchMovies, addMovie } from '../services/api';
import { getErrorMessage } from '../utils/errorHandlers';
import { PosterImage } from './shared/PosterImage';
import type { SearchResult } from '../types';
import closeIcon from '../assets/circle-x.svg';
import styles from './MovieSearch.module.css';

interface MovieSearchProps {
  onMovieAdded?: () => void;
}

export const MovieSearch = ({ onMovieAdded }: MovieSearchProps) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [totalResults, setTotalResults] = useState(0);
  const [addingMovieId, setAddingMovieId] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Debounced search effect
  useEffect(() => {
    // Clear results if query is empty
    if (!query.trim()) {
      setResults([]);
      setError(null);
      setTotalResults(0);
      return;
    }

    // Set up debounce timer
    const debounceTimer = setTimeout(async () => {
      setIsLoading(true);
      setError(null);

      try {
        const response = await searchMovies(query);

        if (response.success) {
          setResults(response.results);
          setTotalResults(response.totalResults);
        } else {
          setError('Search failed');
          setResults([]);
        }
      } catch (err) {
        setError(getErrorMessage(err, 'Failed to search movies'));
        setResults([]);
      } finally {
        setIsLoading(false);
      }
    }, 500); // 500ms debounce delay

    // Cleanup function to clear timeout
    return () => clearTimeout(debounceTimer);
  }, [query]);

  const handleClearSearch = () => {
    setQuery('');
    setResults([]);
    setError(null);
    setTotalResults(0);
    inputRef.current?.focus();
  };

  const handleAddMovie = async (movie: SearchResult) => {
    if (!movie.poster || movie.poster === 'N/A') {
      setError('Cannot add movie without a poster');
      return;
    }

    setAddingMovieId(movie.id);
    setError(null);

    try {
      await addMovie({
        id: movie.id,
        title: movie.title,
        year: movie.year,
        poster: movie.poster,
      });

      // Clear search after adding (or voting if it already existed)
      handleClearSearch();

      if (onMovieAdded) {
        onMovieAdded();
      }
    } catch (err) {
      const errorMessage = getErrorMessage(err, 'Failed to add movie');
      if (errorMessage.includes('already won')) {
        setError('This movie has already won! Check the Past Winners section.');
      } else {
        setError(errorMessage);
      }
    } finally {
      setAddingMovieId(null);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.inputWrapper}>
        <h2 className={`${styles.title} text-left`}>Search Movies</h2>
        <div className={styles.searchContainer}>
          <input
            ref={inputRef}
            type="text"
            placeholder="Type to search movies..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className={`${styles.searchInput} ${query ? styles.withClearButton : ''}`}
          />
          {query && (
            <button
              onClick={handleClearSearch}
              className={`${styles.clearButton} btn-icon`}
              title="Clear search"
            >
              <img
                src={closeIcon}
                alt="Clear"
                className="icon-md"
              />
            </button>
          )}
        </div>
      </div>

      {/* Loading state */}
      {isLoading && (
        <div className={styles.loadingText}>
          Searching...
        </div>
      )}

      {/* Error state */}
      {error && (
        <div className="text-error mt-1">
          Error: {error}
        </div>
      )}

      {/* Results info */}
      {!isLoading && query && (
        <div className={`${styles.resultsInfo} text-left text-italic`}>
          {totalResults > 0
            ? `Found ${totalResults} results (showing ${results.length})`
            : 'No results found'}
        </div>
      )}

      {/* Display results as clickable cards */}
      {results.length > 0 && (
        <div>
          <h3 className={`${styles.resultsHeader} text-left mb-1`}>
            Click a movie to add it:
          </h3>
          <div className="grid grid-auto-fill gap-1">
            {results.map((movie) => (
              <button
                key={movie.id}
                onClick={() => handleAddMovie(movie)}
                disabled={addingMovieId === movie.id}
                className={styles.movieButton}
              >
                {/* Poster */}
                <PosterImage
                  src={movie.poster}
                  alt={movie.title}
                  height="220px"
                />

                {/* Movie Info */}
                <div className={styles.movieInfo}>
                  <h4 className={styles.movieTitle}>
                    {movie.title}
                  </h4>
                  <p className={styles.movieYear}>
                    {movie.year}
                  </p>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
