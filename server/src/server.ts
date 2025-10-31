import express, { Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { createServer, Server } from 'http';
import { getDb } from './db/database';
import { wsService } from './services/websocket';
import searchRoutes from './routes/search';
import moviesRoutes from './routes/movies';
import winnersRoutes from './routes/winners';

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

// Mount routes
app.use('/api/search', searchRoutes);
app.use('/api/movies', moviesRoutes);
app.use('/api/winners', winnersRoutes);

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
