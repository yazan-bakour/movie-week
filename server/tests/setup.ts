// Load environment variables from .env file
import dotenv from 'dotenv';
dotenv.config();

// Set NODE_ENV to test before any modules are loaded
process.env.NODE_ENV = 'test';
