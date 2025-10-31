import { useEffect, useCallback, useRef } from 'react';
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
  // Use refs to store latest callbacks without causing re-renders
  const callbacksRef = useRef(callbacks);

  // Update ref whenever callbacks change
  useEffect(() => {
    callbacksRef.current = callbacks;
  }, [callbacks]);

  useEffect(() => {
    // Connect to WebSocket server (only once)
    const socket = wsService.connect();

    // Create stable wrapper functions that use the latest callbacks from ref
    const handleMoviesInitial = (movies: Movie[]) => {
      callbacksRef.current.onMoviesInitial?.(movies);
    };
    const handleMovieAdded = (movie: Movie) => {
      callbacksRef.current.onMovieAdded?.(movie);
    };
    const handleMovieVoted = (movie: Movie) => {
      callbacksRef.current.onMovieVoted?.(movie);
    };
    const handleMovieWinner = (winner: Winner) => {
      callbacksRef.current.onMovieWinner?.(winner);
    };
    const handleWinnersUpdated = (winners: Winner[]) => {
      callbacksRef.current.onWinnersUpdated?.(winners);
    };

    // Set up event listeners with stable wrapper functions
    socket.on('movies:initial', handleMoviesInitial);
    socket.on('movie:added', handleMovieAdded);
    socket.on('movie:voted', handleMovieVoted);
    socket.on('movie:winner', handleMovieWinner);
    socket.on('winners:updated', handleWinnersUpdated);

    // Cleanup on unmount - remove the stable wrapper functions only
    // Do NOT disconnect the socket to avoid reconnections in React StrictMode
    return () => {
      socket.off('movies:initial', handleMoviesInitial);
      socket.off('movie:added', handleMovieAdded);
      socket.off('movie:voted', handleMovieVoted);
      socket.off('movie:winner', handleMovieWinner);
      socket.off('winners:updated', handleWinnersUpdated);
    };
  }, []); // Empty dependency array - only run once on mount

  const isConnected = useCallback(() => wsService.isConnected(), []);

  return {
    isConnected,
  };
};
