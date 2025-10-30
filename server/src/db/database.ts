import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import { Movie, Winner } from '../types';

export class MovieDatabase {
  private db: Database.Database;

  constructor(dbPath: string = './data/movies.db') {
    // Ensure data directory exists
    const dir = path.dirname(dbPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    this.db = new Database(dbPath);
    this.initializeSchema();
  }

  private initializeSchema(): void {
    // Create movies table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS movies (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        year TEXT NOT NULL,
        poster TEXT NOT NULL,
        votes INTEGER NOT NULL DEFAULT 0,
        addedAt INTEGER NOT NULL,
        status TEXT NOT NULL DEFAULT 'active' CHECK(status IN ('active', 'winner'))
      )
    `);

    // Create winners table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS winners (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        movieId TEXT NOT NULL,
        title TEXT NOT NULL,
        year TEXT NOT NULL,
        poster TEXT NOT NULL,
        finalVotes INTEGER NOT NULL,
        wonAt INTEGER NOT NULL
      )
    `);

    // Create indexes for better query performance
    this.db.exec(`
      CREATE INDEX IF NOT EXISTS idx_movies_status ON movies(status);
      CREATE INDEX IF NOT EXISTS idx_movies_votes ON movies(votes DESC);
      CREATE INDEX IF NOT EXISTS idx_winners_wonAt ON winners(wonAt DESC);
    `);
  }

  // Movie operations
  addMovie(movie: Omit<Movie, 'votes' | 'addedAt' | 'status'>): Movie {
    const stmt = this.db.prepare(`
      INSERT INTO movies (id, title, year, poster, votes, addedAt, status)
      VALUES (?, ?, ?, ?, 0, ?, 'active')
    `);

    const addedAt = Date.now();
    stmt.run(movie.id, movie.title, movie.year, movie.poster, addedAt);

    return {
      ...movie,
      votes: 0,
      addedAt,
      status: 'active'
    };
  }

  getMovieById(id: string): Movie | undefined {
    const stmt = this.db.prepare('SELECT * FROM movies WHERE id = ?');
    return stmt.get(id) as Movie | undefined;
  }

  getAllActiveMovies(): Movie[] {
    const stmt = this.db.prepare(`
      SELECT * FROM movies
      WHERE status = 'active'
      ORDER BY votes DESC, addedAt ASC
    `);
    return stmt.all() as Movie[];
  }

  incrementVote(id: string): Movie | null {
    const movie = this.getMovieById(id);
    if (!movie || movie.status !== 'active') {
      return null;
    }

    const newVotes = movie.votes + 1;

    // Check if movie reached winning threshold
    if (newVotes >= 10) {
      return this.declareWinner(id);
    }

    const stmt = this.db.prepare('UPDATE movies SET votes = ? WHERE id = ?');
    stmt.run(newVotes, id);

    return { ...movie, votes: newVotes };
  }

  private declareWinner(id: string): Movie {
    const movie = this.getMovieById(id);
    if (!movie) {
      throw new Error('Movie not found');
    }

    // Update movie status
    const updateStmt = this.db.prepare(`
      UPDATE movies SET status = 'winner', votes = votes + 1 WHERE id = ?
    `);
    updateStmt.run(id);

    // Add to winners table
    const insertStmt = this.db.prepare(`
      INSERT INTO winners (movieId, title, year, poster, finalVotes, wonAt)
      VALUES (?, ?, ?, ?, ?, ?)
    `);
    insertStmt.run(
      movie.id,
      movie.title,
      movie.year,
      movie.poster,
      movie.votes + 1,
      Date.now()
    );

    return { ...movie, votes: movie.votes + 1, status: 'winner' };
  }

  // Winner operations
  getAllWinners(): Winner[] {
    const stmt = this.db.prepare('SELECT * FROM winners ORDER BY wonAt DESC');
    return stmt.all() as Winner[];
  }

  // Utility methods
  clearAllMovies(): void {
    this.db.exec('DELETE FROM movies');
  }

  clearAllWinners(): void {
    this.db.exec('DELETE FROM winners');
  }

  close(): void {
    this.db.close();
  }

  // For testing: get raw database instance
  getDatabase(): Database.Database {
    return this.db;
  }
}

// Singleton instance
let dbInstance: MovieDatabase | null = null;

export function getDb(dbPath?: string): MovieDatabase {
  if (!dbInstance) {
    dbInstance = new MovieDatabase(dbPath);
  }
  return dbInstance;
}

export function closeDb(): void {
  if (dbInstance) {
    dbInstance.close();
    dbInstance = null;
  }
}
