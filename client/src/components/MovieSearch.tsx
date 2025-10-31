import { useState, useEffect } from 'react';
import { searchMovies } from '../services/api';
import type { SearchResult } from '../types';

interface MovieSearchProps {
  onSelectMovie?: (movie: SearchResult) => void;
}

export const MovieSearch = ({ onSelectMovie }: MovieSearchProps) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [totalResults, setTotalResults] = useState(0);

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

  return (
    <div style={{ marginBottom: '2rem' }}>
      <div style={{ marginBottom: '0.2rem' }}>
        <h2 style={{textAlign: 'left'}}>Search Movies</h2>
        <input
          type="text"
          placeholder="Type to search movies..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          style={{
            width: '100%',
            padding: '0.75rem',
            fontSize: '1rem',
            border: '2px solid #ccc',
            borderRadius: '4px',
          }}
        />
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

      {/* Display results as JSON */}
        <div>
          <h3 style={{textAlign: 'left',}}>Search Results (JSON):</h3>
          <pre
            style={{
              backgroundColor: 'rgba(245, 245, 245, 0.11)',
              padding: '1rem',
              borderRadius: '4px',
              overflow: 'auto',
              maxHeight: '400px',
              fontSize: '0.85rem',
              textAlign: 'left',
              width: '100%',
            }}
          >
            {results.length > 0 ? JSON.stringify(results, null, 2) : 'No results to display.'}
          </pre>
        </div>
    </div>
  );
};
