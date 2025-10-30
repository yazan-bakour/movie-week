import express, { Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { getDb } from './db/database';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;
const DB_PATH = process.env.DATABASE_PATH;

// Initialize database
const db = getDb(DB_PATH);

// Middleware
app.use(cors());
app.use(express.json());

// Health check endpoint
app.get('/health', (req: Request, res: Response) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
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
let server: any;
if (process.env.NODE_ENV !== 'test') {
  server = app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
    console.log(`📊 Database: ${DB_PATH}`);
    console.log(`📍 API Endpoints:`);
    console.log(`   GET  /api/movies`);
    console.log(`   POST /api/movies`);
    console.log(`   POST /api/movies/:id/vote`);
    console.log(`   GET  /api/winners`);
  });

  // Graceful shutdown
  process.on('SIGTERM', () => {
    console.log('SIGTERM signal received: closing HTTP server');
    server.close(() => {
      console.log('HTTP server closed');
    });
  });
}

export { app, db, server };
