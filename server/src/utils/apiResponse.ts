import { Response } from 'express';

/**
 * Standard API response format
 */
export interface ApiSuccessResponse<T = unknown> {
  success: true;
  data?: T;
  count?: number;
  message?: string;
}

export interface ApiErrorResponse {
  success: false;
  error: string;
}

export type ApiResponse<T = unknown> = ApiSuccessResponse<T> | ApiErrorResponse;

/**
 * Send a successful response with data
 */
export const sendSuccess = <T>(
  res: Response,
  data?: T,
  options?: {
    count?: number;
    message?: string;
    statusCode?: number;
  }
): void => {
  const response: ApiSuccessResponse<T> = {
    success: true,
    ...(data !== undefined && { data }),
    ...(options?.count !== undefined && { count: options.count }),
    ...(options?.message && { message: options.message }),
  };

  res.status(options?.statusCode || 200).json(response);
};

/**
 * Send an error response
 */
export const sendError = (
  res: Response,
  error: string | Error,
  statusCode: number = 500
): void => {
  const response: ApiErrorResponse = {
    success: false,
    error: error instanceof Error ? error.message : error,
  };

  res.status(statusCode).json(response);
};

/**
 * Send a bad request error (400)
 */
export const sendBadRequest = (res: Response, error: string): void => {
  sendError(res, error, 400);
};

/**
 * Send a not found error (404)
 */
export const sendNotFound = (res: Response, error: string): void => {
  sendError(res, error, 404);
};

/**
 * Send a conflict error (409)
 */
export const sendConflict = (res: Response, error: string): void => {
  sendError(res, error, 409);
};

/**
 * Send an internal server error (500)
 */
export const sendServerError = (res: Response, error: string | Error): void => {
  sendError(res, error, 500);
};
