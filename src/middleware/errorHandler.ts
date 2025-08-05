import { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/AppError';

export const errorHandler = (
  error: Error,
  req: Request,
  res: Response,
  next: NextFunction
): Response => {
  let appError = error;

  // Convert non-AppError instances to AppError
  if (!(error instanceof AppError)) {
    if (error.name === 'ValidationError') {
      appError = new AppError(error.message, 400, 'VALIDATION_ERROR');
    } else if (error.name === 'CastError') {
      appError = new AppError('Invalid data format', 400, 'VALIDATION_ERROR');
    } else {
      appError = new AppError(
        process.env.NODE_ENV === 'production' ? 'Internal server error' : error.message,
        500,
        'INTERNAL_ERROR'
      );
    }
  }

  const response = {
    success: false,
    message: (appError as AppError).message,
    code: (appError as AppError).code || 'INTERNAL_ERROR',
    timestamp: new Date().toISOString()
  };

  return res.status((appError as AppError).statusCode || 500).json(response);
};