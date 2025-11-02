import Database from 'better-sqlite3';
import path from 'node:path';
import fs from 'node:fs';
import { Movie, Winner } from '../types';

// Simple LRU Cache implementation
class LRUCache<K, V> {
  private readonly cache = new Map<K, V>();
  private readonly maxSize: number;

  constructor(maxSize: number = 100) {
    this.maxSize = maxSize;
  }

  get(key: K): V | undefined {
    if (!this.cache.has(key)) return undefined;
    // Move to end (most recently used)
    const value = this.cache.get(key)!;
    this.cache.delete(key);
    this.cache.set(key, value);
    return value;
  }

  set(key: K, value: V): void {
    // Delete if exists to refresh position
    this.cache.delete(key);
    this.cache.set(key, value);
    // Remove oldest if over limit
    if (this.cache.size > this.maxSize) {
      const firstKey = this.cache.keys().next().value;
      if (firstKey !== undefined) {
        this.cache.delete(firstKey);
      }
    }
  }

  delete(key: K): void {
    this.cache.delete(key);
  }

  clear(): void {
    this.cache.clear();
  }
}

export class MovieDatabase {
  private readonly db: Database.Database;

  // Prepared statement cache
  private readonly statements: {
    addMovie?: Database.Statement;
    getMovieById?: Database.Statement;
    getAllActiveMovies?: Database.Statement;
    updateVotes?: Database.Statement;
    updateMovieStatus?: Database.Statement;
    addWinner?: Database.Statement;
    getAllWinners?: Database.Statement;
    deleteMovie?: Database.Statement;
  } = {};

  // In-memory cache
  private activeMoviesCache: Movie[] | null = null;
  private winnersCache: Winner[] | null = null;
  private readonly movieByIdCache = new LRUCache<string, Movie | undefined>(50);

  constructor(dbPath: string = './data/movies.db') {
    // Ensure data directory exists
    const dir = path.dirname(dbPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    this.db = new Database(dbPath);

    // Enable WAL mode for better concurrency
    this.db.pragma('journal_mode = WAL');

    // Optimize for performance
    this.db.pragma('synchronous = NORMAL');
    this.db.pragma('cache_size = -64000'); // 64MB cache

    this.initializeSchema();
    this.prepareStatements();
  }

  private prepareStatements(): void {
    this.statements.addMovie = this.db.prepare(`
      INSERT INTO movies (id, title, year, poster, votes, addedAt, status)
      VALUES (?, ?, ?, ?, 0, ?, 'active')
    `);

    this.statements.getMovieById = this.db.prepare(
      'SELECT * FROM movies WHERE id = ?'
    );

    this.statements.getAllActiveMovies = this.db.prepare(`
      SELECT * FROM movies
      WHERE status = 'active'
      ORDER BY votes DESC, addedAt ASC
    `);

    this.statements.updateVotes = this.db.prepare(
      'UPDATE movies SET votes = ? WHERE id = ?'
    );

    this.statements.updateMovieStatus = this.db.prepare(`
      UPDATE movies SET status = 'winner', votes = votes + 1 WHERE id = ?
    `);

    this.statements.addWinner = this.db.prepare(`
      INSERT INTO winners (movieId, title, year, poster, finalVotes, wonAt)
      VALUES (?, ?, ?, ?, ?, ?)
    `);

    this.statements.getAllWinners = this.db.prepare(
      'SELECT * FROM winners ORDER BY wonAt DESC'
    );

    this.statements.deleteMovie = this.db.prepare(
      "DELETE FROM movies WHERE id = ? AND status = 'active'"
    );
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

  // Cache invalidation helper
  private invalidateCache(): void {
    this.activeMoviesCache = null;
    this.movieByIdCache.clear();
  }

  // Movie operations
  addMovie(movie: Omit<Movie, 'votes' | 'addedAt' | 'status'>): Movie {
    const addedAt = Date.now();
    this.statements.addMovie!.run(movie.id, movie.title, movie.year, movie.poster, addedAt);

    const newMovie: Movie = {
      ...movie,
      votes: 0,
      addedAt,
      status: 'active'
    };

    // Invalidate cache
    this.invalidateCache();

    return newMovie;
  }

  getMovieById(id: string): Movie | undefined {
    // Check cache first
    const cached = this.movieByIdCache.get(id);
    if (cached !== undefined) {
      return cached;
    }

    // Query database
    const movie = this.statements.getMovieById!.get(id) as Movie | undefined;

    // Cache the result (even if undefined)
    this.movieByIdCache.set(id, movie);

    return movie;
  }

  getAllActiveMovies(): Movie[] {
    // Return cached if available
    if (this.activeMoviesCache !== null) {
      return this.activeMoviesCache;
    }

    // Query database
    const movies = this.statements.getAllActiveMovies!.all() as Movie[];

    // Cache the result
    this.activeMoviesCache = movies;

    return movies;
  }

  incrementVote(id: string): Movie | null {
    const movie = this.getMovieById(id);
    if (movie?.status !== 'active') {
      return null;
    }

    const newVotes = movie.votes + 1;

    // Check if movie reached winning threshold
    if (newVotes >= 10) {
      return this.declareWinner(id);
    }

    this.statements.updateVotes!.run(newVotes, id);

    const updatedMovie = { ...movie, votes: newVotes };

    // Invalidate cache
    this.invalidateCache();

    return updatedMovie;
  }

  private declareWinner(id: string): Movie {
    const movie = this.getMovieById(id);
    if (!movie) {
      throw new Error('Movie not found');
    }

    // Update movie status
    this.statements.updateMovieStatus!.run(id);

    // Add to winners table
    this.statements.addWinner!.run(
      movie.id,
      movie.title,
      movie.year,
      movie.poster,
      movie.votes + 1,
      Date.now()
    );

    const winnerMovie = { ...movie, votes: movie.votes + 1, status: 'winner' as const };

    // Invalidate both caches
    this.invalidateCache();
    this.winnersCache = null;

    return winnerMovie;
  }

  // Winner operations
  getAllWinners(): Winner[] {
    // Return cached if available
    if (this.winnersCache !== null) {
      return this.winnersCache;
    }

    // Query database
    const winners = this.statements.getAllWinners!.all() as Winner[];

    // Cache the result
    this.winnersCache = winners;

    return winners;
  }

  deleteMovie(id: string): boolean {
    try {
      const result = this.statements.deleteMovie!.run(id);
      console.log(`🔍 Delete movie ${id}: ${result.changes} rows affected`);

      if (result.changes > 0) {
        // Invalidate cache
        this.invalidateCache();
      }

      return result.changes > 0;
    } catch (error) {
      console.error(`🔴 Database error in deleteMovie(${id}):`, error);
      throw error;
    }
  }

  // Utility methods
  clearAllMovies(): void {
    this.db.exec("DELETE FROM movies");

    // Invalidate cache
    this.invalidateCache();
  }

  clearAllWinners(): void {
    this.db.exec('DELETE FROM winners');

    // Invalidate winners cache
    this.winnersCache = null;
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
  dbInstance ??= new MovieDatabase(dbPath);
  return dbInstance;
}

export function closeDb(): void {
  if (dbInstance) {
    dbInstance.close();
    dbInstance = null;
  }
}
