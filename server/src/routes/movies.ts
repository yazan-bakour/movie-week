import { Router, Request, Response } from 'express';
import { getDb } from '../db/database';
import { wsService } from '../services/websocket';

const router = Router();
const db = getDb();

// Get all active movies
router.get('/', (req: Request, res: Response) => {
  try {
    const movies = db.getAllActiveMovies();

    // Optionally broadcast initial movies to all connected clients
    // This helps keep all clients in sync
    if (wsService.isInitialized()) {
      wsService.sendInitialMovies(movies);
    }

    res.json({
      success: true,
      count: movies.length,
      data: movies
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Add a movie
router.post('/', (req: Request, res: Response) => {
  try {
    const { id, title, year, poster } = req.body;

    if (!id || !title || !year || !poster) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: id, title, year, poster'
      });
    }

    // Check if movie already exists
    const existingMovie = db.getMovieById(id);
    if (existingMovie) {
      if (existingMovie.status === 'active') {
        // If movie exists and is active, increment its vote count
        console.log(`🔄 Movie already exists, incrementing vote: ${existingMovie.title}`);
        const updatedMovie = db.incrementVote(id);

        if (!updatedMovie) {
          return res.status(404).json({
            success: false,
            error: 'Failed to vote for existing movie'
          });
        }

        // Check if movie became a winner
        const isWinner = updatedMovie.status === 'winner';

        if (isWinner) {
          // Get the latest winner entry and all winners
          const winners = db.getAllWinners();
          const latestWinner = winners[0];

          // Broadcast winner events
          if (latestWinner) {
            wsService.broadcastMovieWinner(latestWinner);
            wsService.broadcastWinnersUpdated(winners);
          }
        } else {
          // Broadcast regular vote event
          wsService.broadcastMovieVoted(updatedMovie);
        }

        return res.json({
          success: true,
          data: updatedMovie,
          isWinner,
          message: 'Movie already existed, vote incremented'
        });
      } else if (existingMovie.status === 'winner') {
        // Movie is a past winner - cannot be re-added
        console.log(`🏆 Movie is a past winner, cannot be re-added: ${existingMovie.title}`);
        return res.status(409).json({
          success: false,
          error: 'This movie has already won and cannot be added again'
        });
      }
    }

    const movie = db.addMovie({ id, title, year, poster });

    // Broadcast movie added event via WebSocket
    wsService.broadcastMovieAdded(movie);

    res.status(201).json({
      success: true,
      data: movie
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Vote for a movie
router.post('/:id/vote', (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const movie = db.incrementVote(id);

    if (!movie) {
      return res.status(404).json({
        success: false,
        error: 'Movie not found or already won'
      });
    }

    // Check if movie became a winner
    const isWinner = movie.status === 'winner';

    if (isWinner) {
      // Get the latest winner entry and all winners
      const winners = db.getAllWinners();
      const latestWinner = winners[0]; // Winners are sorted by wonAt DESC

      // Broadcast winner events
      if (latestWinner) {
        wsService.broadcastMovieWinner(latestWinner);
        wsService.broadcastWinnersUpdated(winners);
      }
    } else {
      // Broadcast regular vote event
      wsService.broadcastMovieVoted(movie);
    }

    res.json({
      success: true,
      data: movie,
      isWinner
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Delete a specific movie
router.delete('/:id', (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    console.log(`🗑️  DELETE request for movie: ${id}`);

    const deleted = db.deleteMovie(id);

    if (!deleted) {
      console.log(`❌ Movie not found: ${id}`);
      return res.status(404).json({
        success: false,
        error: 'Movie not found or already completed'
      });
    }

    console.log(`✅ Movie deleted: ${id}`);
    res.json({
      success: true,
      message: 'Movie deleted successfully'
    });
  } catch (error) {
    console.error(`❌ Error deleting movie ${req.params.id}:`, error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Clear all active movies
router.delete('/', (req: Request, res: Response) => {
  try {
    console.log('🗑️  DELETE request to clear all movies');
    db.clearAllMovies();
    console.log('✅ All active movies cleared');
    res.json({
      success: true,
      message: 'All active movies cleared'
    });
  } catch (error) {
    console.error('❌ Error clearing movies:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;
