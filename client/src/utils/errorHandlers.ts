import axios from 'axios';

/**
 * Extract error message from various error types
 * @param error - Error object (can be Error, AxiosError, or unknown)
 * @param fallbackMessage - Default message if error message cannot be extracted
 * @returns User-friendly error message
 */
export const getErrorMessage = (error: unknown, fallbackMessage = 'An error occurred'): string => {
  // Check if it's an Axios error with response data
  if (axios.isAxiosError(error) && error.response?.data?.error) {
    return error.response.data.error;
  }

  // Check if it's a standard Error instance
  if (error instanceof Error) {
    return error.message;
  }

  // Check if it's a string
  if (typeof error === 'string') {
    return error;
  }

  // Return fallback for unknown error types
  return fallbackMessage;
};

/**
 * Check if error is a network error
 * @param error - Error object
 * @returns true if it's a network error
 */
export const isNetworkError = (error: unknown): boolean => {
  if (axios.isAxiosError(error)) {
    return !error.response && error.code === 'ERR_NETWORK';
  }
  return false;
};

/**
 * Check if error is a specific HTTP status code
 * @param error - Error object
 * @param statusCode - HTTP status code to check
 * @returns true if error matches the status code
 */
export const isHttpError = (error: unknown, statusCode: number): boolean => {
  if (axios.isAxiosError(error)) {
    return error.response?.status === statusCode;
  }
  return false;
};
