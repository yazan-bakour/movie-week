import { useState } from 'react';
import { MovieCard } from './MovieCard';
import { clearAllMovies } from '../services/api';
import { getErrorMessage } from '../utils/errorHandlers';
import type { Movie } from '../types';
import medalIcon from '../assets/medal.svg';
import trashIcon from '../assets/trash.svg';
import styles from './MovieList.module.css';

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
      alert(getErrorMessage(err, 'Failed to clear movies'));
    } finally {
      setIsClearing(false);
    }
  };

  if (movies.length === 0) {
    return (
      <div className="empty-state">
        <p className="text-muted text-italic">
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
      <div className={styles.header}>
        <div className={styles.headerInfo}>
          <h2 className={styles.title}>
            Current Standings ({movies.length} {movies.length === 1 ? 'movie' : 'movies'})
          </h2>
          <p className={styles.subtitle}>
            First movie to reach 10 votes wins!
          </p>
        </div>

        {/* Clear All Button */}
        <button
          onClick={handleClearAll}
          disabled={isClearing}
          className={styles.clearButton}
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
      <div className="grid grid-auto-fill-250 gap-1-5">
        {movies.map((movie) => (
          <div key={movie.id} className={styles.movieItem}>
            {/* Leader Badge */}
            {movie.id === leaderId && movie.votes > 0 && (
              <div className="badge badge-leader" title="Current Leader">
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
