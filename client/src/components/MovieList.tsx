import { useState } from 'react';
import { MovieCard } from './MovieCard';
import { clearAllMovies } from '../services/api';
import type { Movie } from '../types';
import medalIcon from '../assets/medal.svg';
import trashIcon from '../assets/trash.svg';

interface MovieListProps {
  movies: Movie[];
  onMovieVoted?: (movie: Movie) => void;
  onMoviesChanged?: () => void;
}

export const MovieList = ({ movies, onMovieVoted, onMoviesChanged }: MovieListProps) => {
  const [isClearing, setIsClearing] = useState(false);

  const handleClearAll = async () => {
    if (!confirm(`Remove all ${movies.length} movies from the list? This cannot be undone.`)) {
      return;
    }

    setIsClearing(true);
    try {
      await clearAllMovies();
      if (onMoviesChanged) {
        onMoviesChanged();
      }
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to clear movies');
    } finally {
      setIsClearing(false);
    }
  };

  if (movies.length === 0) {
    return (
      <div style={{ textAlign: 'left', padding: '2rem 0' }}>
        <p style={{ color: '#888', fontStyle: 'italic' }}>
          No active movies yet. Search and add a movie to get started!
        </p>
      </div>
    );
  }

  // Find the movie with the most votes
  const maxVotes = Math.max(...movies.map((m) => m.votes));
  const leaderId = movies.find((m) => m.votes === maxVotes)?.id;

  return (
    <div>
      <div style={{ marginBottom: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div style={{ textAlign: 'left' }}>
          <h2 style={{ margin: '0 0 0.5rem 0' }}>
            Current Standings ({movies.length} {movies.length === 1 ? 'movie' : 'movies'})
          </h2>
          <p style={{ color: '#888', fontSize: '0.9rem', margin: 0 }}>
            First movie to reach 10 votes wins!
          </p>
        </div>

        {/* Clear All Button */}
        <button
          onClick={handleClearAll}
          disabled={isClearing}
          style={{
            border: 'none',
            borderRadius: '8px',
            padding: '0.6rem 1rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            cursor: isClearing ? 'not-allowed' : 'pointer',
            opacity: isClearing ? 0.5 : 1,
            fontSize: '0.9rem',
            color: 'white',
          }}
          title="Remove all movies"
        >
          <img
            src={trashIcon}
            alt="Clear All"
            style={{ width: '18px', height: '18px' }}
          />
          {isClearing ? 'Clearing...' : 'Clear All'}
        </button>
      </div>

      {/* Movies Grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))',
          gap: '1.5rem',
        }}
      >
        {movies.map((movie) => (
          <div key={movie.id} style={{ position: 'relative' }}>
            {/* Leader Badge */}
            {movie.id === leaderId && movie.votes > 0 && (
              <div
                style={{
                  position: 'absolute',
                  top: '-10px',
                  left: '-10px',
                  backgroundColor: '#646cff',
                  color: 'white',
                  borderRadius: '50%',
                  width: '40px',
                  height: '40px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  zIndex: 10,
                  border: '2px solid #242424',
                }}
                title="Current Leader"
              >
                <img src={medalIcon} alt="Leader" style={{ width: '24px', height: '24px' }} />
              </div>
            )}
            <MovieCard
              movie={movie}
              onVoted={onMovieVoted}
              onDeleted={onMoviesChanged}
            />
          </div>
        ))}
      </div>
    </div>
  );
};
