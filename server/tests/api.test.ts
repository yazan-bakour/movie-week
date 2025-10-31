import request from 'supertest';
import { app, db } from '../src/server';
import fs from 'fs';

describe('API Endpoints', () => {
  const testDbPath = './data/test-api.db';

  beforeEach(() => {
    // Clear database before each test
    db.clearAllMovies();
    db.clearAllWinners();
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
      // Add test movies directly to database
      db.addMovie({
        id: 'tt1',
        title: 'Test Movie 1',
        year: '2020',
        poster: 'url1'
      });
      db.addMovie({
        id: 'tt2',
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
      id: 'tt0111161',
      title: 'The Shawshank Redemption',
      year: '1994',
      poster: 'https://example.com/poster.jpg'
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

    it('should return 409 for duplicate movie', async () => {
      // Add movie first
      await request(app).post('/api/movies').send(validMovie);

      // Try to add again
      const response = await request(app)
        .post('/api/movies')
        .send(validMovie);

      expect(response.status).toBe(409);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('already exists');
    });
  });

  describe('POST /api/movies/:id/vote', () => {
    beforeEach(async () => {
      // Add a test movie before each vote test
      await request(app).post('/api/movies').send({
        id: 'tt1',
        title: 'Test Movie',
        year: '2020',
        poster: 'url1'
      });
    });

    it('should increment vote count', async () => {
      const response = await request(app)
        .post('/api/movies/tt1/vote');

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
      // Vote 9 times
      for (let i = 0; i < 9; i++) {
        await request(app).post('/api/movies/tt1/vote');
      }

      // 10th vote should make it a winner
      const response = await request(app)
        .post('/api/movies/tt1/vote');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.votes).toBe(10);
      expect(response.body.data.status).toBe('winner');
      expect(response.body.isWinner).toBe(true);
    });

    it('should not allow voting on winners', async () => {
      // Vote to make winner
      for (let i = 0; i < 10; i++) {
        await request(app).post('/api/movies/tt1/vote');
      }

      // Try to vote again
      const response = await request(app)
        .post('/api/movies/tt1/vote');

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
      // Add and vote for two movies to make them winners
      await request(app).post('/api/movies').send({
        id: 'tt1',
        title: 'Winner 1',
        year: '2020',
        poster: 'url1'
      });

      await request(app).post('/api/movies').send({
        id: 'tt2',
        title: 'Winner 2',
        year: '2021',
        poster: 'url2'
      });

      // Make both winners
      for (let i = 0; i < 10; i++) {
        await request(app).post('/api/movies/tt1/vote');
      }
      for (let i = 0; i < 10; i++) {
        await request(app).post('/api/movies/tt2/vote');
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
