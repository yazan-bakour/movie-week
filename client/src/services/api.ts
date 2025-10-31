import axios from 'axios';
import type { Movie, Winner, ApiResponse, SearchApiResponse } from '../types';

const API_BASE_URL = import.meta.env.VITE_API_URL;

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Search movies via OMDb
export const searchMovies = async (query: string, page = 1): Promise<SearchApiResponse> => {
  const response = await api.get<SearchApiResponse>(`/api/search`, {
    params: { q: query, page },
  });
  return response.data;
};

// Get all active movies
export const getMovies = async (): Promise<Movie[]> => {
  const response = await api.get<ApiResponse<Movie[]>>('/api/movies');
  return response.data.data || [];
};

// Add a new movie
export const addMovie = async (movie: {
  id: string;
  title: string;
  year: string;
  poster: string;
}): Promise<Movie> => {
  const response = await api.post<ApiResponse<Movie>>('/api/movies', movie);
  if (!response.data.success) {
    throw new Error(response.data.error || 'Failed to add movie');
  }
  return response.data.data!;
};

// Vote for a movie
export const voteForMovie = async (id: string): Promise<{ movie: Movie; isWinner: boolean }> => {
  const response = await api.post<ApiResponse<Movie> & { isWinner: boolean }>(
    `/api/movies/${id}/vote`
  );
  if (!response.data.success) {
    throw new Error(response.data.error || 'Failed to vote');
  }
  return {
    movie: response.data.data!,
    isWinner: response.data.isWinner,
  };
};

// Get all winners
export const getWinners = async (): Promise<Winner[]> => {
  const response = await api.get<ApiResponse<Winner[]>>('/api/winners');
  return response.data.data || [];
};

export default api;
