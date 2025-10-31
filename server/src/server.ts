import express, { Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { getDb } from './db/database';
import { OMDbService } from './services/omdb';

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
      return res.status(409).json({
        success: false,
        error: 'Movie already exists',
        data: existingMovie
      });
    }

    const movie = db.addMovie({ id, title, year, poster });
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

    res.json({
      success: true,
      data: movie,
      isWinner: movie.status === 'winner'
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

// 404 handler
app.use((req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    error: 'Route not found'
  });
});

// Start server only if not in test mode

const server = DB_ENV === 'test' 
  ? undefined
  : app.listen(PORT, () => {
      console.log(`🚀 Server running on http://localhost:${PORT}`);
      console.log(`📊 Database: ${DB_PATH}`);
      console.log(`📍 API Endpoints:`);
      console.log(`   GET  /api/search?q=<query>`);
      console.log(`   GET  /api/movies`);
      console.log(`   POST /api/movies`);
      console.log(`   POST /api/movies/:id/vote`);
      console.log(`   GET  /api/winners`);
    });

// Graceful shutdown
if (server) {
  process.on('SIGTERM', () => {
    console.log('SIGTERM signal received: closing HTTP server');
    server.close(() => {
      console.log('HTTP server closed');
    });
  });
}

export { app, db, server };
