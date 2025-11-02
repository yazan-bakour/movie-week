# Movie of the Week - Backend Server

TypeScript Express server with SQLite for the Movie Voting application.

## Features

- **TypeScript**: Type-safe development
- **Express**: Fast, minimal web framework
- **SQLite**: Lightweight, file-based database
- **Jest**: Comprehensive unit and integration tests
- **Better-SQLite3**: Synchronous database operations

## Prerequisites

- Node.js 18+
- npm or yarn

## Setup

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Environment variables**

   Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```

   Default values:
   ```
   PORT=3000
   NODE_ENV=development
   DATABASE_PATH=./data/movies.db
   OMDB_API_KEY=your_omdb_api_key_here
   ```

## Running the Server

### Development Mode (with hot reload)
```bash
npm run dev
```

### Production Build
```bash
npm run build
npm start
```

## Testing

### Run all tests
```bash
npm test
```

### Watch mode (for development)
```bash
npm run test:watch
```

### Test Coverage
```bash
npm test -- --coverage
```

## Database Schema

### Movies Table
```sql
CREATE TABLE movies (
  id TEXT PRIMARY KEY,        -- OMDb imdbID
  title TEXT NOT NULL,
  year TEXT NOT NULL,
  poster TEXT NOT NULL,
  votes INTEGER DEFAULT 0,
  addedAt INTEGER NOT NULL,   -- timestamp
  status TEXT DEFAULT 'active' -- 'active' | 'winner'
)
```

### Winners Table
```sql
CREATE TABLE winners (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  movieId TEXT NOT NULL,
  title TEXT NOT NULL,
  year TEXT NOT NULL,
  poster TEXT NOT NULL,
  finalVotes INTEGER NOT NULL,
  wonAt INTEGER NOT NULL      -- timestamp
)
```

## API Endpoints

### Health Check
```
GET /health
```

**Response:**
```json
{
  "status": "ok",
  "timestamp": "2025-01-15T10:30:00.000Z"
}
```

### Search Movies (OMDb API)
```
GET /api/search?q=<query>&page=<page_number>
```

**Query Parameters:**
- `q` (required): Search query string
- `page` (optional): Page number for pagination (default: 1)

**Response:**
```json
{
  "success": true,
  "query": "Matrix",
  "page": 1,
  "totalResults": 63,
  "results": [
    {
      "id": "tt0133093",
      "title": "The Matrix",
      "year": "1999",
      "poster": "https://...",
      "type": "movie"
    },
    {
      "id": "tt0234215",
      "title": "The Matrix Reloaded",
      "year": "2003",
      "poster": "https://...",
      "type": "movie"
    }
  ]
}
```

**Error Response (missing query):**
```json
{
  "success": false,
  "error": "Query parameter \"q\" is required"
}
```

### Get All Active Movies
```
GET /api/movies
```

**Response:**
```json
{
  "success": true,
  "count": 2,
  "data": [
    {
      "id": "tt0111161",
      "title": "The Shawshank Redemption",
      "year": "1994",
      "poster": "https://...",
      "votes": 5,
      "addedAt": 1704451200000,
      "status": "active"
    }
  ]
}
```

### Add a Movie
```
POST /api/movies
Content-Type: application/json

{
  "id": "tt0111161",
  "title": "The Shawshank Redemption",
  "year": "1994",
  "poster": "https://example.com/poster.jpg"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "tt0111161",
    "title": "The Shawshank Redemption",
    "year": "1994",
    "poster": "https://...",
    "votes": 0,
    "addedAt": 1704451200000,
    "status": "active"
  }
}
```

### Vote for a Movie
```
POST /api/movies/:id/vote
```

**Response (regular vote):**
```json
{
  "success": true,
  "data": {
    "id": "tt0111161",
    "votes": 6,
    ...
  },
  "isWinner": false
}
```

**Response (winner declared at 10 votes):**
```json
{
  "success": true,
  "data": {
    "id": "tt0111161",
    "votes": 10,
    "status": "winner",
    ...
  },
  "isWinner": true
}
```

### Get All Winners
```
GET /api/winners
```

**Response:**
```json
{
  "success": true,
  "count": 1,
  "data": [
    {
      "id": 1,
      "movieId": "tt0111161",
      "title": "The Shawshank Redemption",
      "year": "1994",
      "poster": "https://...",
      "finalVotes": 10,
      "wonAt": 1704451200000
    }
  ]
}
```

## Project Structure

```
server/
├── src/
│   ├── db/
│   │   └── database.ts        # Database class and operations
│   ├── routes/                # (Future API routes)
│   ├── types/
│   │   └── index.ts           # TypeScript interfaces
│   └── server.ts              # Express app setup
├── tests/
│   ├── database.test.ts       # Database unit tests
│   └── api.test.ts            # API endpoint tests
├── data/                      # SQLite database files (gitignored)
├── dist/                      # Compiled JavaScript (gitignored)
├── .env                       # Environment variables (gitignored)
├── .env.example               # Example environment variables
├── tsconfig.json              # TypeScript configuration
├── jest.config.js             # Jest configuration
└── package.json               # Dependencies and scripts
```

## Testing Locally with curl

### Search for movies
```bash
curl "http://localhost:3000/api/search?q=Matrix"
```

### Add a movie
```bash
curl -X POST http://localhost:3000/api/movies \
  -H "Content-Type: application/json" \
  -d '{
    "id": "tt0111161",
    "title": "The Shawshank Redemption",
    "year": "1994",
    "poster": "https://example.com/poster.jpg"
  }'
```

### Get all movies
```bash
curl http://localhost:3000/api/movies
```

### Vote for a movie
```bash
curl -X POST http://localhost:3000/api/movies/tt0111161/vote
```

### Get winners
```bash
curl http://localhost:3000/api/winners
```
