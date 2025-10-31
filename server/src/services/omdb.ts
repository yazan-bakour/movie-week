import axios from 'axios';
import { OMDbSearchResponse, OMDbMovieSearchResult } from '../types';

const OMDB_API_URL = 'http://www.omdbapi.com/';

function getApiKey(): string {
  const API_KEY = process.env.OMDB_API_KEY;
  if (!API_KEY) {
    console.warn('⚠️  OMDB_API_KEY is not set in environment variables');
    throw new Error('OMDb API key is not configured');
  }
  return API_KEY;
}

export class OMDbService {
  /**
   * Search for movies by title
   * @param query - Search query string
   * @param page - Page number (default: 1)
   * @returns Promise with search results
   */
  static async searchMovies(
    query: string,
    page: number = 1
  ): Promise<{ results: OMDbMovieSearchResult[]; totalResults: number }> {
    const apiKey = getApiKey();

    if (!query || query.trim().length === 0) {
      throw new Error('Search query cannot be empty');
    }

    try {
      const response = await axios.get<OMDbSearchResponse>(OMDB_API_URL, {
        params: {
          apikey: apiKey,
          s: query.trim(),
          page,
          type: 'movie' // Only search for movies, not series
        },
        timeout: 5000 // 5 second timeout
      });

      const data = response.data;

      // OMDb returns Response: "False" when no results found
      if (data.Response === 'False') {
        return {
          results: [],
          totalResults: 0
        };
      }

      return {
        results: data.Search || [],
        totalResults: Number.parseInt(data.totalResults || '0', 10)
      };
    } catch (error) {
      if (axios.isAxiosError(error)) {
        if (error.code === 'ECONNABORTED') {
          throw new Error('OMDb API request timed out');
        }
        if (error.response?.status === 401) {
          throw new Error('Invalid OMDb API key');
        }
        throw new Error(`OMDb API error: ${error.message}`);
      }
      throw error;
    }
  }

  /**
   * Get detailed movie information by IMDb ID
   * @param imdbId - IMDb ID (e.g., "tt0111161")
   * @returns Promise with movie details
   */
  static async getMovieById(imdbId: string): Promise<any> {
    const apiKey = getApiKey();

    if (!imdbId?.startsWith('tt')) {
      throw new Error('Invalid IMDb ID');
    }

    try {
      const response = await axios.get(OMDB_API_URL, {
        params: {
          apikey: apiKey,
          i: imdbId,
          plot: 'short'
        },
        timeout: 5000
      });

      const data = response.data;

      if (data.Response === 'False') {
        throw new Error(data.Error || 'Movie not found');
      }

      return data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        if (error.code === 'ECONNABORTED') {
          throw new Error('OMDb API request timed out');
        }
        throw new Error(`OMDb API error: ${error.message}`);
      }
      throw error;
    }
  }
}
