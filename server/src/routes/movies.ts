import { Router, Request, Response } from 'express';
import { getDb } from '../db/database';
import { wsService } from '../services/websocket';
import { asyncHandler } from '../middleware/errorHandler';
import {
  sendSuccess,
  sendBadRequest,
  sendNotFound,
  sendConflict,
} from '../utils/apiResponse';
import { validateMovieInput } from '../utils/validators';
import { handleWinnerBroadcast } from '../utils/movieHelpers';

const router = Router();
const db = getDb();

// Get all active movies
router.get('/', asyncHandler(async (req: Request, res: Response) => {
  const movies = db.getAllActiveMovies();

  // Optionally broadcast initial movies to all connected clients
  // This helps keep all clients in sync
  if (wsService.isInitialized()) {
    wsService.sendInitialMovies(movies);
  }

  sendSuccess(res, movies, { count: movies.length });
}));

// Add a movie
router.post('/', asyncHandler(async (req: Request, res: Response) => {
  const { id, title, year, poster } = req.body;

  // Validate input
  const validation = validateMovieInput({ id, title, year, poster });
  if (!validation.isValid) {
    return sendBadRequest(res, validation.error!);
  }

  // Check if movie already exists
  const existingMovie = db.getMovieById(id);
  if (existingMovie) {
    if (existingMovie.status === 'active') {
      // If movie exists and is active, increment its vote count
      console.log(`🔄 Movie already exists, incrementing vote: ${existingMovie.title}`);
      const updatedMovie = db.incrementVote(id);

      if (!updatedMovie) {
        return sendNotFound(res, 'Failed to vote for existing movie');
      }

      // Handle winner broadcast
      handleWinnerBroadcast(updatedMovie);

      return res.json({
        success: true,
        data: updatedMovie,
        isWinner: updatedMovie.status === 'winner',
        message: 'Movie already existed, vote incremented',
      });
    } else if (existingMovie.status === 'winner') {
      // Movie is a past winner - cannot be re-added
      console.log(`🏆 Movie is a past winner, cannot be re-added: ${existingMovie.title}`);
      return sendConflict(res, 'This movie has already won and cannot be added again');
    }
  }

  const movie = db.addMovie({ id, title, year, poster });

  // Broadcast movie added event via WebSocket
  wsService.broadcastMovieAdded(movie);

  sendSuccess(res, movie, { statusCode: 201 });
}));

// Vote for a movie
router.post('/:id/vote', asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const movie = db.incrementVote(id);

  if (!movie) {
    return sendNotFound(res, 'Movie not found or already won');
  }

  // Handle winner broadcast
  handleWinnerBroadcast(movie);

  res.json({
    success: true,
    data: movie,
    isWinner: movie.status === 'winner',
  });
}));

// Delete a specific movie
router.delete('/:id', asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  console.log(`🗑️  DELETE request for movie: ${id}`);

  const deleted = db.deleteMovie(id);

  if (!deleted) {
    console.log(`❌ Movie not found: ${id}`);
    return sendNotFound(res, 'Movie not found or already completed');
  }

  console.log(`✅ Movie deleted: ${id}`);

  // Broadcast updated movie list via WebSocket
  const movies = db.getAllActiveMovies();
  wsService.sendInitialMovies(movies);

  sendSuccess(res, undefined, { message: 'Movie deleted successfully' });
}));

// Clear all active movies
router.delete('/', asyncHandler(async (req: Request, res: Response) => {
  console.log('🗑️  DELETE request to clear all movies');
  db.clearAllMovies();
  console.log('✅ All active movies cleared');

  // Broadcast empty movie list via WebSocket
  wsService.sendInitialMovies([]);

  sendSuccess(res, undefined, { message: 'All active movies cleared' });
}));

export default router;
