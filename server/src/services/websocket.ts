import { Server as HttpServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import type { Movie, Winner } from '../types';

class WebSocketService {
  private io: SocketIOServer | null = null;

  /**
   * Initialize the WebSocket server
   */
  initialize(httpServer: HttpServer): void {
    this.io = new SocketIOServer(httpServer, {
      cors: {
        origin: '*', // Configure this properly in production
        methods: ['GET', 'POST']
      }
    });

    this.io.on('connection', (socket) => {
      console.log(`🔌 Client connected: ${socket.id}`);

      // Handle client requesting current movies list
      socket.on('movies:get', () => {
        // This will be handled by sending movies:initial event
        // The actual data will be sent from the route handler
      });

      socket.on('disconnect', () => {
        console.log(`🔌 Client disconnected: ${socket.id}`);
      });
    });
  }

  /**
   * Get the Socket.IO server instance
   */
  getIO(): SocketIOServer | null {
    return this.io;
  }

  /**
   * Broadcast initial movies list to a specific client (on connection)
   */
  sendInitialMovies(movies: Movie[]): void {
    if (!this.io) {
      console.warn('WebSocket not initialized');
      return;
    }
    this.io.emit('movies:initial', movies);
  }

  /**
   * Broadcast when a new movie is added
   */
  broadcastMovieAdded(movie: Movie): void {
    if (!this.io) {
      console.warn('WebSocket not initialized');
      return;
    }
    this.io.emit('movie:added', movie);
    console.log(`📡 Broadcast: movie:added - ${movie.title}`);
  }

  /**
   * Broadcast when a movie receives a vote
   */
  broadcastMovieVoted(movie: Movie): void {
    if (!this.io) {
      console.warn('WebSocket not initialized');
      return;
    }
    this.io.emit('movie:voted', movie);
    console.log(`📡 Broadcast: movie:voted - ${movie.title} (${movie.votes} votes)`);
  }

  /**
   * Broadcast when a movie becomes a winner
   */
  broadcastMovieWinner(winner: Winner): void {
    if (!this.io) {
      console.warn('WebSocket not initialized');
      return;
    }
    this.io.emit('movie:winner', winner);
    console.log(`📡 Broadcast: movie:winner - ${winner.title}`);
  }

  /**
   * Broadcast updated winners list
   */
  broadcastWinnersUpdated(winners: Winner[]): void {
    if (!this.io) {
      console.warn('WebSocket not initialized');
      return;
    }
    this.io.emit('winners:updated', winners);
    console.log(`📡 Broadcast: winners:updated - ${winners.length} winners`);
  }

  /**
   * Check if WebSocket is initialized
   */
  isInitialized(): boolean {
    return this.io !== null;
  }
}

// Export singleton instance
export const wsService = new WebSocketService();
