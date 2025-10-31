import express, { Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { createServer, Server } from 'http';
import { getDb } from './db/database';
import { OMDbService } from './services/omdb';
import { wsService } from './services/websocket';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;
const DB_PATH = process.env.DATABASE_PATH;
const DB_ENV = process.env.NODE_ENV;

// Initialize database
const db = getDb(DB_PATH);

// Middleware
app.use(cors());
app.use(express.json());

// Health check endpoint
app.get('/health', (req: Request, res: Response) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Search movies via OMDb API
app.get('/api/search', async (req: Request, res: Response) => {
  try {
    const { q, page } = req.query;

    if (!q || typeof q !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'Query parameter "q" is required'
      });
    }

    const pageNumber = page ? Number.parseInt(page as string, 10) : 1;
    if (Number.isNaN(pageNumber) || pageNumber < 1) {
      return res.status(400).json({
        success: false,
        error: 'Invalid page number'
      });
    }

    const { results, totalResults } = await OMDbService.searchMovies(q, pageNumber);

    res.json({
      success: true,
      query: q,
      page: pageNumber,
      totalResults,
      results: results.map(movie => ({
        id: movie.imdbID,
        title: movie.Title,
        year: movie.Year,
        poster: movie.Poster === 'N/A' ? null : movie.Poster,
        type: movie.Type
      }))
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to search movies'
    });
  }
});

// Get all active movies
app.get('/api/movies', (req: Request, res: Response) => {
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
app.post('/api/movies', (req: Request, res: Response) => {
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
app.post('/api/movies/:id/vote', (req: Request, res: Response) => {
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

// Get all winners
app.get('/api/winners', (req: Request, res: Response) => {
  try {
    const winners = db.getAllWinners();
    res.json({
      success: true,
      count: winners.length,
      data: winners
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Delete a specific movie
app.delete('/api/movies/:id', (req: Request, res: Response) => {
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
app.delete('/api/movies', (req: Request, res: Response) => {
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

// 404 handler
app.use((req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    error: 'Route not found'
  });
});

// Create HTTP server and initialize WebSocket
const httpServer = createServer(app);

const server: Server | undefined = DB_ENV === 'test' ? undefined : (() => {
  // Initialize WebSocket service
  wsService.initialize(httpServer);

  return httpServer.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
    console.log(`🔌 WebSocket server initialized`);
    console.log(`📊 Database: ${DB_PATH}`);
    console.log(`📍 API Endpoints:`);
    console.log(`   GET    /api/search?q=<query>`);
    console.log(`   GET    /api/movies`);
    console.log(`   POST   /api/movies`);
    console.log(`   DELETE /api/movies`);
    console.log(`   POST   /api/movies/:id/vote`);
    console.log(`   DELETE /api/movies/:id`);
    console.log(`   GET    /api/winners`);
    console.log(`📡 WebSocket Events:`);
    console.log(`   movies:initial - Initial movies list on connection`);
    console.log(`   movie:added - New movie added`);
    console.log(`   movie:voted - Movie received a vote`);
    console.log(`   movie:winner - Movie reached 10 votes`);
    console.log(`   winners:updated - Winners list updated`);
    console.log(`   winners:updated - Winners list updated`);
  });
})();

if (server) {
  // Graceful shutdown
  process.on('SIGTERM', () => {
    console.log('SIGTERM signal received: closing HTTP server');
    server?.close(() => {
      console.log('HTTP server closed');
    });
  });
}
export { app, db, httpServer, server };
