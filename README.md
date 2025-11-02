# Movie of the Week - Voting Application

A full-stack movie voting application with real-time updates using WebSockets.

Server is deployed to home set server for production ready.
Client is deployed to vercel https://movie-week.vercel.app/.

## Tech Stack

- **Server**: Node.js, Express, TypeScript, Socket.IO, SQLite
- **Client**: React, TypeScript, Vite, Socket.IO Client
- **Development**: Docker, Docker Compose

## Prerequisites

### Option 1: Docker (Recommended for Quick Setup)
- [Docker](https://www.docker.com/get-started) installed
- [Docker Compose](https://docs.docker.com/compose/install/) installed

### Option 2: Manual Setup
- Node.js v20.19+ or v22.12+
- npm

## Getting Started

### Option 1: Using Docker (One Command Setup)

This is the easiest way to get started. Docker will handle all dependencies and setup for you.

2. **Set up environment variables**
   ```bash
   cd client 
   cp .env.example .env

   cd server 
   cp .env.example .env
   ```

   Edit `.env` and add your VITE_API_URL and VITE_WS_URL:
   ```
   OMDB_API_KEY=your_omdb_api_key_here
   ```

   Get a free API key from: https://www.omdbapi.com/apikey.aspx

3. **Start everything with one command**
   ```bash
   docker-compose up
   ```

   That's it! The application will start:
   - **Server**: http://localhost:3000
   - **Client**: http://localhost:5173

   Both services have hot-reload enabled, so your changes will be reflected automatically.

4. **Stop the application**
   ```bash
   # Press Ctrl+C in the terminal, then run:
   docker-compose down
   ```

### Option 2: Manual Setup (Without Docker)

If you prefer to run the services directly on your machine:

#### Server Setup

1. **Navigate to server directory**
   ```bash
   cd server
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Create environment file**
   ```bash
   # Create .env file
   cp .env.example .env
   ```

   Edit `server/.env`:
   ```
   PORT=3000
   NODE_ENV=development
   DATABASE_PATH=./data/movies.db
   OMDB_API_KEY=your_actual_api_key_here
   ```

4. **Start development server**
   ```bash
   npm run dev
   ```

   Server will run on http://localhost:3000

#### Client Setup

1. **Open a new terminal and navigate to client directory**
   ```bash
   cd client
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Create environment file (optional)**
   ```bash
   # Create .env.local file if you need custom API URL
   echo "VITE_API_URL=http://localhost:3000" > .env.local
   echo "VITE_WS_URL=http://localhost:3000" >> .env.local
   ```

4. **Start development server**
   ```bash
   npm run dev
   ```

   Client will run on http://localhost:5173

## Development Workflow

## Project Structure

```
quillbot/
├── client/                 # React frontend
│   ├── src/
│   ├── public/
│   ├── Dockerfile         # Docker config for client
│   └── package.json
├── server/                # Express backend
│   ├── src/
│   ├── data/             # SQLite database
│   ├── Dockerfile        # Docker config for server
│   └── package.json
├── docker-compose.yml    # Orchestrates both services
└── README.md
```

## Testing

### Server Tests

```bash
# With Docker
docker-compose exec server npm test

# Without Docker
cd server
npm test

# Watch mode
npm run test:watch
```