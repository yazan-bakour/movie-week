import { useEffect, useCallback } from 'react';
import { wsService } from '../services/websocket';
import type { Movie, Winner } from '../types';

interface UseWebSocketCallbacks {
  onMoviesInitial?: (movies: Movie[]) => void;
  onMovieAdded?: (movie: Movie) => void;
  onMovieVoted?: (movie: Movie) => void;
  onMovieWinner?: (winner: Winner) => void;
  onWinnersUpdated?: (winners: Winner[]) => void;
}

export const useWebSocket = (callbacks: UseWebSocketCallbacks) => {
  const {
    onMoviesInitial,
    onMovieAdded,
    onMovieVoted,
    onMovieWinner,
    onWinnersUpdated,
  } = callbacks;

  useEffect(() => {
    // Connect to WebSocket server
    wsService.connect();

    // Set up event listeners
    if (onMoviesInitial) {
      wsService.on('movies:initial', onMoviesInitial);
    }
    if (onMovieAdded) {
      wsService.on('movie:added', onMovieAdded);
    }
    if (onMovieVoted) {
      wsService.on('movie:voted', onMovieVoted);
    }
    if (onMovieWinner) {
      wsService.on('movie:winner', onMovieWinner);
    }
    if (onWinnersUpdated) {
      wsService.on('winners:updated', onWinnersUpdated);
    }

    // Cleanup on unmount
    return () => {
      if (onMoviesInitial) {
        wsService.off('movies:initial', onMoviesInitial);
      }
      if (onMovieAdded) {
        wsService.off('movie:added', onMovieAdded);
      }
      if (onMovieVoted) {
        wsService.off('movie:voted', onMovieVoted);
      }
      if (onMovieWinner) {
        wsService.off('movie:winner', onMovieWinner);
      }
      if (onWinnersUpdated) {
        wsService.off('winners:updated', onWinnersUpdated);
      }
    };
  }, [onMoviesInitial, onMovieAdded, onMovieVoted, onMovieWinner, onWinnersUpdated]);

  const isConnected = useCallback(() => wsService.isConnected(), []);

  return {
    isConnected,
  };
};
