import { io, Socket } from 'socket.io-client';
import type { Movie, Winner } from '../types';

const WS_URL = import.meta.env.VITE_WS_URL;

export interface WebSocketEvents {
  'movies:initial': (movies: Movie[]) => void;
  'movie:added': (movie: Movie) => void;
  'movie:voted': (movie: Movie) => void;
  'movie:winner': (winner: Winner) => void;
  'winners:updated': (winners: Winner[]) => void;
}

class WebSocketService {
  private socket: Socket | null = null;

  connect(): Socket {
    if (this.socket?.connected) {
      return this.socket;
    }

    this.socket = io(WS_URL, {
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5,
    });

    this.socket.on('connect', () => {
      console.log('🔌 Connected to WebSocket server');
    });

    this.socket.on('disconnect', () => {
      console.log('🔌 Disconnected from WebSocket server');
    });

    this.socket.on('connect_error', (error) => {
      console.error('❌ WebSocket connection error:', error);
    });

    return this.socket;
  }

  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  getSocket(): Socket | null {
    return this.socket;
  }

  isConnected(): boolean {
    return this.socket?.connected || false;
  }

  // Event listeners
  on<K extends keyof WebSocketEvents>(event: K, callback: WebSocketEvents[K]): void {
    if (this.socket) {
      this.socket.on(event as string, callback);
    }
  }

  off<K extends keyof WebSocketEvents>(event: K, callback?: WebSocketEvents[K]): void {
    if (this.socket) {
      this.socket.off(event as string, callback);
    }
  }
}

// Export singleton instance
export const wsService = new WebSocketService();
