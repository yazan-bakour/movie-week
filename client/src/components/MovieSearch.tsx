import { useState, useEffect, useRef } from 'react';
import { searchMovies, addMovie } from '../services/api';
import type { SearchResult } from '../types';
import closeIcon from '../assets/circle-x.svg';

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
        setError(err instanceof Error ? err.message : 'Failed to search movies');
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
      const errorMessage = err instanceof Error ? err.message : 'Failed to add movie';
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
    <div style={{ marginBottom: '2rem' }}>
      <div style={{ marginBottom: '0.2rem' }}>
        <h2 style={{textAlign: 'left'}}>Search Movies</h2>
        <div style={{ position: 'relative' }}>
          <input
            ref={inputRef}
            type="text"
            placeholder="Type to search movies..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            style={{
              width: '100%',
              padding: '0.75rem',
              paddingRight: query ? '3rem' : '0.75rem',
              fontSize: '1rem',
              border: '2px solid #ccc',
              borderRadius: '4px',
              boxSizing: 'border-box',
            }}
          />
          {query && (
            <button
              onClick={handleClearSearch}
              style={{
                position: 'absolute',
                right: '0.5rem',
                top: '50%',
                transform: 'translateY(-50%)',
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                padding: '0.25rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                opacity: 0.6,
                transition: 'opacity 0.2s',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.opacity = '1')}
              onMouseLeave={(e) => (e.currentTarget.style.opacity = '0.6')}
              title="Clear search"
            >
              <img
                src={closeIcon}
                alt="Clear"
                style={{ width: '20px', height: '20px' }}
              />
            </button>
          )}
        </div>
      </div>

      {/* Loading state */}
      {isLoading && (
        <div style={{ color: '#666' }}>
          Searching...
        </div>
      )}

      {/* Error state */}
      {error && (
        <div style={{ color: 'red', marginTop: '1rem' }}>
          Error: {error}
        </div>
      )}

      {/* Results info */}
      {!isLoading && query && (
        <div style={{ marginBottom: '2rem', color: '#666', textAlign: 'left', fontStyle: 'italic' }}>
          {totalResults > 0
            ? `Found ${totalResults} results (showing ${results.length})`
            : 'No results found'}
        </div>
      )}

      {/* Display results as clickable cards */}
      {results.length > 0 && (
        <div>
          <h3 style={{ textAlign: 'left', marginBottom: '1rem' }}>
            Click a movie to add it:
          </h3>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))',
              gap: '1rem',
            }}
          >
            {results.map((movie) => (
              <button
                key={movie.id}
                onClick={() => handleAddMovie(movie)}
                disabled={addingMovieId === movie.id}
                style={{
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  borderRadius: '8px',
                  padding: '0',
                  backgroundColor: 'rgba(255, 255, 255, 0.05)',
                  cursor: addingMovieId === movie.id ? 'not-allowed' : 'pointer',
                  opacity: addingMovieId === movie.id ? 0.5 : 1,
                  transition: 'all 0.2s',
                  overflow: 'hidden',
                  textAlign: 'left',
                }}
                onMouseEnter={(e) => {
                  if (addingMovieId !== movie.id) {
                    e.currentTarget.style.transform = 'scale(1.05)';
                    e.currentTarget.style.borderColor = '#646cff';
                  }
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'scale(1)';
                  e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.2)';
                }}
              >
                {/* Poster */}
                {movie.poster && movie.poster !== 'N/A' ? (
                  <img
                    src={movie.poster}
                    alt={movie.title}
                    style={{
                      width: '100%',
                      height: '220px',
                      objectFit: 'cover',
                    }}
                  />
                ) : (
                  <div
                    style={{
                      width: '100%',
                      height: '220px',
                      backgroundColor: 'rgba(255, 255, 255, 0.1)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#666',
                      fontSize: '0.8rem',
                    }}
                  >
                    No Poster
                  </div>
                )}

                {/* Movie Info */}
                <div style={{ padding: '0.75rem' }}>
                  <h4
                    style={{
                      margin: '0 0 0.25rem 0',
                      fontSize: '0.9rem',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {movie.title}
                  </h4>
                  <p
                    style={{
                      margin: 0,
                      fontSize: '0.8rem',
                      color: '#888',
                    }}
                  >
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
