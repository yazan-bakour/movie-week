import request from 'supertest';
import { app, db } from '../src/server';
import fs from 'fs';

describe('API Endpoints', () => {
  const testDbPath = './data/test-api.db';

  beforeEach(() => {
    // Clear database before each test
    try {
      db.clearAllMovies();
      db.clearAllWinners();
    } catch (error) {
      // Handle potential database clearing issues
      console.log('Database clearing error:', error);
    }
  });

  afterAll(() => {
    // Close database and cleanup
    db.close();
    if (fs.existsSync(testDbPath)) {
      fs.unlinkSync(testDbPath);
    }
  });

  describe('GET /health', () => {
    it('should return health status', async () => {
      const response = await request(app).get('/health');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('status', 'ok');
      expect(response.body).toHaveProperty('timestamp');
    });
  });

  describe('GET /api/movies', () => {
    it('should return empty array when no movies exist', async () => {
      const response = await request(app).get('/api/movies');

      expect(response.status).toBe(200);
      expect(response.body).toMatchObject({
        success: true,
        count: 0,
        data: []
      });
    });

    it('should return all active movies', async () => {
      // Add test movies directly to database using unique IDs
      db.addMovie({
        id: 'tt7777777',
        title: 'Test Movie 1',
        year: '2020',
        poster: 'url1'
      });
      db.addMovie({
        id: 'tt8888888',
        title: 'Test Movie 2',
        year: '2021',
        poster: 'url2'
      });

      const response = await request(app).get('/api/movies');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.count).toBe(2);
      expect(response.body.data).toHaveLength(2);
    });
  });

  describe('POST /api/movies', () => {
    const validMovie = {
      id: 'tt1111111',
      title: 'Test Movie for Adding',
      year: '2024',
      poster: 'https://example.com/test-poster.jpg'
    };

    it('should add a new movie', async () => {
      const response = await request(app)
        .post('/api/movies')
        .send(validMovie);

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toMatchObject({
        ...validMovie,
        votes: 0,
        status: 'active'
      });
    });

    it('should return 400 for missing fields', async () => {
      const response = await request(app)
        .post('/api/movies')
        .send({ id: 'tt1', title: 'Test' }); // Missing year and poster

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('Missing required fields');
    });

    it('should increment vote when adding duplicate active movie', async () => {
      // Add movie first
      const firstResponse = await request(app).post('/api/movies').send(validMovie);
      expect(firstResponse.status).toBe(201);
      expect(firstResponse.body.data.votes).toBe(0);

      // Try to add again - should increment vote instead of error
      const response = await request(app)
        .post('/api/movies')
        .send(validMovie);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.votes).toBe(1);
      expect(response.body.message).toContain('Movie already existed, vote incremented');
    });

    it('should return 409 when trying to add past winner', async () => {
      // Use a different movie to avoid conflicts
      const winnerMovie = {
        id: 'tt0133093',
        title: 'The Matrix',
        year: '1999',
        poster: 'https://example.com/matrix.jpg'
      };

      // Add movie and make it a winner
      await request(app).post('/api/movies').send(winnerMovie);
      
      // Vote 10 times to make it a winner
      for (let i = 0; i < 10; i++) {
        await request(app).post('/api/movies/tt0133093/vote');
      }

      // Try to add the same movie again - should get conflict error
      const response = await request(app)
        .post('/api/movies')
        .send(winnerMovie);

      expect(response.status).toBe(409);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('already won and cannot be added again');
    });
  });

  describe('POST /api/movies/:id/vote', () => {
    const voteTestMovie = {
      id: 'tt9999999',
      title: 'Vote Test Movie',
      year: '2020',
      poster: 'url1'
    };

    beforeEach(async () => {
      // Add a test movie before each vote test
      await request(app).post('/api/movies').send(voteTestMovie);
    });

    it('should increment vote count', async () => {
      const response = await request(app)
        .post('/api/movies/tt9999999/vote');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.votes).toBe(1);
      expect(response.body.isWinner).toBe(false);
    });

    it('should return 404 for non-existent movie', async () => {
      const response = await request(app)
        .post('/api/movies/non-existent/vote');

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
    });

    it('should declare winner at 10 votes', async () => {
      // Vote 9 times (movie already has 0 votes from beforeEach)
      for (let i = 0; i < 9; i++) {
        await request(app).post('/api/movies/tt9999999/vote');
      }

      // 10th vote should make it a winner
      const response = await request(app)
        .post('/api/movies/tt9999999/vote');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.votes).toBe(10);
      expect(response.body.data.status).toBe('winner');
      expect(response.body.isWinner).toBe(true);
    });

    it('should not allow voting on winners', async () => {
      // Make it a winner first
      for (let i = 0; i < 10; i++) {
        await request(app).post('/api/movies/tt9999999/vote');
      }

      // Try to vote again
      const response = await request(app)
        .post('/api/movies/tt9999999/vote');

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/winners', () => {
    it('should return empty array when no winners exist', async () => {
      const response = await request(app).get('/api/winners');

      expect(response.status).toBe(200);
      expect(response.body).toMatchObject({
        success: true,
        count: 0,
        data: []
      });
    });

    it('should return all winners', async () => {
      // Add and vote for two movies to make them winners using unique IDs
      await request(app).post('/api/movies').send({
        id: 'tt5555555',
        title: 'Winner 1',
        year: '2020',
        poster: 'url1'
      });

      await request(app).post('/api/movies').send({
        id: 'tt6666666',
        title: 'Winner 2',
        year: '2021',
        poster: 'url2'
      });

      // Make both winners
      for (let i = 0; i < 10; i++) {
        await request(app).post('/api/movies/tt5555555/vote');
      }
      for (let i = 0; i < 10; i++) {
        await request(app).post('/api/movies/tt6666666/vote');
      }

      const response = await request(app).get('/api/winners');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.count).toBe(2);
      expect(response.body.data).toHaveLength(2);
    });
  });

  describe('GET /api/search', () => {
    it('should search for movies', async () => {
      const response = await request(app)
        .get('/api/search')
        .query({ q: 'Matrix' });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body).toHaveProperty('query', 'Matrix');
      expect(response.body).toHaveProperty('results');
      expect(Array.isArray(response.body.results)).toBe(true);
    });

    it('should return 400 when query parameter is missing', async () => {
      const response = await request(app).get('/api/search');

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('required');
    });

    it('should handle pagination', async () => {
      const response = await request(app)
        .get('/api/search')
        .query({ q: 'Star Wars', page: 2 });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.page).toBe(2);
    });

    it('should return 400 for invalid page number', async () => {
      const response = await request(app)
        .get('/api/search')
        .query({ q: 'Matrix', page: 'invalid' });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it('should return empty results for non-existent movie', async () => {
      const response = await request(app)
        .get('/api/search')
        .query({ q: 'xyzabc123nonexistent' });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.results).toHaveLength(0);
      expect(response.body.totalResults).toBe(0);
    });
  });

  describe('404 Handler', () => {
    it('should return 404 for unknown routes', async () => {
      const response = await request(app).get('/unknown-route');

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('not found');
    });
  });
});
