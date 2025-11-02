# Development Dockerfile for Movie Voting Client
FROM node:20-alpine

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy source code
COPY . .

# Expose Vite dev server port
EXPOSE 5173

# Run Vite dev server with host flag to allow external access
CMD ["npm", "run", "dev", "--", "--host"]
