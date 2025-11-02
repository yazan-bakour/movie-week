# Development Dockerfile for Movie Voting Server
FROM node:20-alpine

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies (including dev dependencies for ts-node-dev)
RUN npm install

# Copy source code
COPY . .

# Create data directory for SQLite database
RUN mkdir -p data

# Expose port
EXPOSE 3000

# Run development server with hot reload
CMD ["npm", "run", "dev"]
