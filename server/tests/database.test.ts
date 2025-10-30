import { MovieDatabase } from '../src/db/database';
import fs from 'fs';
import path from 'path';

describe('MovieDatabase', () => {
  let db: MovieDatabase;
  const testDbPath = './tests/test.db';

  beforeEach(() => {
    // Remove test database if it exists
    if (fs.existsSync(testDbPath)) {
      fs.unlinkSync(testDbPath);
    }
    db = new MovieDatabase(testDbPath);
  });

  afterEach(() => {
    db.close();
    // Cleanup test database
    if (fs.existsSync(testDbPath)) {
      fs.unlinkSync(testDbPath);
    }
  });

  describe('Schema Initialization', () => {
    it('should create movies and winners tables', () => {
      const tables = db.getDatabase()
        .prepare("SELECT name FROM sqlite_master WHERE type='table'")
        .all() as { name: string }[];

      const tableNames = tables.map(t => t.name);
      expect(tableNames).toContain('movies');
      expect(tableNames).toContain('winners');
    });
  });

  describe('Movie Operations', () => {
    const sampleMovie = {
      id: 'tt0111161',
      title: 'The Shawshank Redemption',
      year: '1994',
      poster: 'https://example.com/poster.jpg'
    };

    it('should add a new movie', () => {
      const movie = db.addMovie(sampleMovie);

      expect(movie).toMatchObject({
        ...sampleMovie,
        votes: 0,
        status: 'active'
      });
      expect(movie.addedAt).toBeDefined();
      expect(typeof movie.addedAt).toBe('number');
    });

    it('should retrieve a movie by id', () => {
      db.addMovie(sampleMovie);
      const movie = db.getMovieById(sampleMovie.id);

      expect(movie).toBeDefined();
      expect(movie?.title).toBe(sampleMovie.title);
    });

    it('should return undefined for non-existent movie', () => {
      const movie = db.getMovieById('non-existent-id');
      expect(movie).toBeUndefined();
    });

    it('should get all active movies sorted by votes', () => {
      const movie1 = { id: 'tt1', title: 'Movie 1', year: '2020', poster: 'url1' };
      const movie2 = { id: 'tt2', title: 'Movie 2', year: '2021', poster: 'url2' };
      const movie3 = { id: 'tt3', title: 'Movie 3', year: '2022', poster: 'url3' };

      db.addMovie(movie1);
      db.addMovie(movie2);
      db.addMovie(movie3);

      // Vote for movies
      db.incrementVote('tt2'); // 1 vote
      db.incrementVote('tt2'); // 2 votes
      db.incrementVote('tt3'); // 1 vote

      const movies = db.getAllActiveMovies();

      expect(movies).toHaveLength(3);
      expect(movies[0].id).toBe('tt2'); // Most votes
      expect(movies[0].votes).toBe(2);
      expect(movies[1].id).toBe('tt3'); // Second most
      expect(movies[1].votes).toBe(1);
    });
  });

  describe('Voting Operations', () => {
    const sampleMovie = {
      id: 'tt0111161',
      title: 'The Shawshank Redemption',
      year: '1994',
      poster: 'https://example.com/poster.jpg'
    };

    it('should increment vote count', () => {
      db.addMovie(sampleMovie);
      const movie = db.incrementVote(sampleMovie.id);

      expect(movie).toBeDefined();
      expect(movie?.votes).toBe(1);
    });

    it('should return null for non-existent movie', () => {
      const movie = db.incrementVote('non-existent-id');
      expect(movie).toBeNull();
    });

    it('should declare winner when votes reach 10', () => {
      db.addMovie(sampleMovie);

      let movie;
      for (let i = 0; i < 10; i++) {
        movie = db.incrementVote(sampleMovie.id);
      }

      expect(movie?.votes).toBe(10);
      expect(movie?.status).toBe('winner');

      // Check if added to winners table
      const winners = db.getAllWinners();
      expect(winners).toHaveLength(1);
      expect(winners[0].movieId).toBe(sampleMovie.id);
      expect(winners[0].finalVotes).toBe(10);
    });

    it('should not allow voting on winner movies', () => {
      db.addMovie(sampleMovie);

      // Vote to 10 (winner)
      for (let i = 0; i < 10; i++) {
        db.incrementVote(sampleMovie.id);
      }

      // Try to vote again
      const result = db.incrementVote(sampleMovie.id);
      expect(result).toBeNull();
    });
  });

  describe('Winner Operations', () => {
    it('should get all winners sorted by wonAt', async () => {
      const movie1 = { id: 'tt1', title: 'Movie 1', year: '2020', poster: 'url1' };
      const movie2 = { id: 'tt2', title: 'Movie 2', year: '2021', poster: 'url2' };

      db.addMovie(movie1);
      db.addMovie(movie2);

      // Make movie1 a winner
      for (let i = 0; i < 10; i++) {
        db.incrementVote('tt1');
      }

      // Small delay to ensure different timestamps
      await new Promise(resolve => setTimeout(resolve, 10));

      // Make movie2 a winner
      for (let i = 0; i < 10; i++) {
        db.incrementVote('tt2');
      }

      const winners = db.getAllWinners();
      expect(winners).toHaveLength(2);
      // Most recent winner first
      expect(winners[0].movieId).toBe('tt2');
    });
  });

  describe('Utility Methods', () => {
    it('should clear all movies', () => {
      db.addMovie({ id: 'tt1', title: 'Movie 1', year: '2020', poster: 'url1' });
      db.addMovie({ id: 'tt2', title: 'Movie 2', year: '2021', poster: 'url2' });

      db.clearAllMovies();

      const movies = db.getAllActiveMovies();
      expect(movies).toHaveLength(0);
    });

    it('should clear all winners', () => {
      const movie = { id: 'tt1', title: 'Movie 1', year: '2020', poster: 'url1' };
      db.addMovie(movie);

      // Make it a winner
      for (let i = 0; i < 10; i++) {
        db.incrementVote('tt1');
      }

      db.clearAllWinners();

      const winners = db.getAllWinners();
      expect(winners).toHaveLength(0);
    });
  });
});
