import { useState } from 'react';
import { voteForMovie, deleteMovie } from '../services/api';
import type { Movie } from '../types';
import arrowUpIcon from '../assets/arrow-up-wide-narrow.svg';
import closeIcon from '../assets/circle-x.svg';

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
      setError(err instanceof Error ? err.message : 'Failed to vote');
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
      setError(err instanceof Error ? err.message : 'Failed to delete movie');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div
      style={{
        border: '1px solid rgba(255, 255, 255, 0.1)',
        borderRadius: '8px',
        padding: '1rem',
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        display: 'flex',
        flexDirection: 'column',
        gap: '0.75rem',
        position: 'relative',
        opacity: isDeleting ? 0.5 : 1,
      }}
    >
      {/* Delete Button */}
      <button
        onClick={handleDelete}
        disabled={isDeleting || isVoting}
        style={{
          position: 'absolute',
          top: '-5px',
          right: '-3px',
          border: 'none',
          borderRadius: '50%',
          width: '32px',
          height: '32px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: isDeleting || isVoting ? 'not-allowed' : 'pointer',
          zIndex: 10,
          padding: 0,
        }}
        title="Remove movie"
      >
        <img
          src={closeIcon}
          alt="Delete"
          style={{ width: '40x', height: '35px' }}
        />
      </button>
      {/* Movie Poster */}
      {movie.poster && movie.poster !== 'N/A' ? (
        <img
          src={movie.poster}
          alt={movie.title}
          style={{
            width: '100%',
            height: '300px',
            objectFit: 'cover',
            borderRadius: '4px',
          }}
        />
      ) : (
        <div
          style={{
            width: '100%',
            height: '300px',
            backgroundColor: 'rgba(255, 255, 255, 0.1)',
            borderRadius: '4px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#666',
          }}
        >
          No Poster
        </div>
      )}

      {/* Movie Info */}
      <div style={{ textAlign: 'left' }}>
        <h3 style={{ margin: '0 0 0.25rem 0', fontSize: '1.1rem' }}>
          {movie.title}
        </h3>
        <p style={{ color: '#888', fontSize: '0.9rem', margin: '0 0 0.5rem 0' }}>
          {movie.year}
        </p>

        {/* Votes Display */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            marginBottom: '0.75rem',
          }}
        >
          <img src={arrowUpIcon} alt="Votes" style={{ width: '1.5rem', height: '1.5rem' }} />
          <span style={{ fontSize: '1.25rem', fontWeight: 'bold' }}>
            {movie.votes}
          </span>
          <span style={{ color: '#888', fontSize: '0.9rem' }}>
            {movie.votes === 1 ? 'vote' : 'votes'}
          </span>
        </div>

        {/* Vote Button */}
        <button
          onClick={handleVote}
          disabled={isVoting}
          style={{
            width: '100%',
            padding: '0.75rem',
            fontSize: '1rem',
            opacity: isVoting ? 0.5 : 1,
            cursor: isVoting ? 'not-allowed' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.5rem',
          }}
        >
          {isVoting ? (
            'Voting...'
          ) : (
            <>
              <img src={arrowUpIcon} alt="Upvote" style={{ width: '1rem', height: '1rem' }} />
              Upvote
            </>
          )}
        </button>

        {/* Error Message */}
        {error && (
          <p style={{ color: 'red', fontSize: '0.85rem', marginTop: '0.5rem' }}>
            {error}
          </p>
        )}
      </div>
    </div>
  );
};
