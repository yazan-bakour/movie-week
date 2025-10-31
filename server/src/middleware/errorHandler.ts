import { Request, Response, NextFunction } from 'express';
import { sendServerError } from '../utils/apiResponse';

/**
 * Async handler wrapper to catch errors in async route handlers
 */
export const asyncHandler = (
  fn: (req: Request, res: Response, next: NextFunction) => Promise<void | Response | unknown>
) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch((error: unknown) => {
      console.error('❌ Unhandled error in route:', error);
      sendServerError(res, error instanceof Error ? error.message : 'Unknown error');
    });
  };
};

/**
 * Global error handler middleware (fallback)
 */
export const globalErrorHandler = (
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  console.error('❌ Global error handler:', err);

  sendServerError(res, err.message || 'Internal server error');
};
