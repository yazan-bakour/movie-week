import { useState } from 'react';
import { voteForMovie, deleteMovie } from '../services/api';
import { getErrorMessage } from '../utils/errorHandlers';
import { PosterImage } from './shared/PosterImage';
import type { Movie } from '../types';
import arrowUpIcon from '../assets/arrow-up-wide-narrow.svg';
import closeIcon from '../assets/circle-x.svg';
import styles from './MovieCard.module.css';

interface MovieCardProps {
  movie: Movie;
  onVoted?: (movie: Movie) => void;
  onDeleted?: () => void;
}

export const MovieCard = ({ movie, onVoted, onDeleted }: MovieCardProps) => {
  const [isVoting, setIsVoting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleVote = async () => {
    setIsVoting(true);
    setError(null);

    try {
      const { movie: updatedMovie } = await voteForMovie(movie.id);
      if (onVoted) {
        onVoted(updatedMovie);
      }
    } catch (err) {
      setError(getErrorMessage(err, 'Failed to vote'));
    } finally {
      setIsVoting(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm(`Remove "${movie.title}" from the list?`)) {
      return;
    }

    setIsDeleting(true);
    setError(null);

    try {
      await deleteMovie(movie.id);
      if (onDeleted) {
        onDeleted();
      }
    } catch (err) {
      setError(getErrorMessage(err, 'Failed to delete movie'));
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className={`card ${styles.card} ${isDeleting ? styles.deleting : ''}`}>
      {/* Delete Button */}
      <button
        onClick={handleDelete}
        disabled={isDeleting || isVoting}
        className="btn-icon btn-icon-round btn-delete"
        title="Remove movie"
      >
        <img
          src={closeIcon}
          alt="Delete"
          style={{ width: '40px', height: '35px' }}
        />
      </button>

      {/* Movie Poster */}
      <PosterImage
        src={movie.poster}
        alt={movie.title}
        height="300px"
      />

      {/* Movie Info */}
      <div className={styles.movieInfo}>
        <h3 className={styles.movieTitle}>
          {movie.title}
        </h3>
        <p className={styles.movieYear}>
          {movie.year}
        </p>

        {/* Votes Display */}
        <div className={styles.votesContainer}>
          <img src={arrowUpIcon} alt="Votes" className="icon-md" />
          <span className={styles.votesCount}>
            {movie.votes}
          </span>
          <span className={styles.votesLabel}>
            {movie.votes === 1 ? 'vote' : 'votes'}
          </span>
        </div>

        {/* Vote Button */}
        <button
          onClick={handleVote}
          disabled={isVoting}
          className={styles.voteButton}
        >
          {isVoting ? (
            'Voting...'
          ) : (
            <>
              <img src={arrowUpIcon} alt="Upvote" className="icon-sm" />
              Upvote
            </>
          )}
        </button>

        {/* Error Message */}
        {error && (
          <p className={styles.errorMessage}>
            {error}
          </p>
        )}
      </div>
    </div>
  );
};
