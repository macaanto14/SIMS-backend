/**
 * Error Handling Utility Module
 * 
 * This module provides comprehensive error handling utilities
 * including custom error classes, error formatting, and
 * centralized error management for the SIMS backend.
 * 
 * @author Ismail Mohamed 
 * @version 2.0.0
 */

const logger = require('../logger');

/**
 * Base application error class
 */
class AppError extends Error {
  constructor(message, statusCode = 500, code = 'INTERNAL_ERROR', details = null) {
    super(message);
    
    this.name = this.constructor.name;
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
    this.timestamp = new Date().toISOString();
    this.isOperational = true;

    // Capture stack trace
    Error.captureStackTrace(this, this.constructor);
  }

  /**
   * Convert error to JSON format
   */
  toJSON() {
    return {
      name: this.name,
      message: this.message,
      statusCode: this.statusCode,
      code: this.code,
      details: this.details,
      timestamp: this.timestamp,
      stack: process.env.NODE_ENV === 'development' ? this.stack : undefined
    };
  }
}

/**
 * Validation error class
 */
class ValidationError extends AppError {
  constructor(message, details = null) {
    super(message, 400, 'VALIDATION_ERROR', details);
  }
}

/**
 * Authentication error class
 */
class AuthenticationError extends AppError {
  constructor(message = 'Authentication failed', details = null) {
    super(message, 401, 'AUTHENTICATION_ERROR', details);
  }
}

/**
 * Authorization error class
 */
class AuthorizationError extends AppError {
  constructor(message = 'Access denied', details = null) {
    super(message, 403, 'AUTHORIZATION_ERROR', details);
  }
}

/**
 * Not found error class
 */
class NotFoundError extends AppError {
  constructor(resource = 'Resource', identifier = null) {
    const message = identifier 
      ? `${resource} with identifier '${identifier}' not found`
      : `${resource} not found`;
    
    super(message, 404, 'NOT_FOUND_ERROR', { resource, identifier });
  }
}

/**
 * Conflict error class
 */
class ConflictError extends AppError {
  constructor(message = 'Resource conflict', details = null) {
    super(message, 409, 'CONFLICT_ERROR', details);
  }
}

/**
 * Rate limit error class
 */
class RateLimitError extends AppError {
  constructor(message = 'Rate limit exceeded', details = null) {
    super(message, 429, 'RATE_LIMIT_ERROR', details);
  }
}

/**
 * Database error class
 */
class DatabaseError extends AppError {
  constructor(message, originalError = null) {
    super(message, 500, 'DATABASE_ERROR', { originalError: originalError?.message });
    this.originalError = originalError;
  }
}

/**
 * External service error class
 */
class ExternalServiceError extends AppError {
  constructor(service, message, statusCode = 502) {
    super(`${service} service error: ${message}`, statusCode, 'EXTERNAL_SERVICE_ERROR', { service });
  }
}

/**
 * Business logic error class
 */
class BusinessLogicError extends AppError {
  constructor(message, details = null) {
    super(message, 422, 'BUSINESS_LOGIC_ERROR', details);
  }
}

/**
 * Error handler middleware
 */
const errorHandler = (error, req, res, next) => {
  let appError = error;

  // Convert non-AppError instances to AppError
  if (!(error instanceof AppError)) {
    // Handle specific error types
    if (error.name === 'ValidationError') {
      appError = new ValidationError(error.message, error.details);
    } else if (error.name === 'CastError') {
      appError = new ValidationError('Invalid data format');
    } else if (error.code === '23505') { // PostgreSQL unique violation
      appError = new ConflictError('Resource already exists');
    } else if (error.code === '23503') { // PostgreSQL foreign key violation
      appError = new ValidationError('Referenced resource does not exist');
    } else if (error.code === '23502') { // PostgreSQL not null violation
      appError = new ValidationError('Required field is missing');
    } else {
      appError = new AppError(
        process.env.NODE_ENV === 'production' ? 'Internal server error' : error.message,
        500,
        'INTERNAL_ERROR',
        process.env.NODE_ENV === 'development' ? { originalError: error.message } : null
      );
    }
  }

  // Log error
  logger.error('Error handled by error middleware', {
    error: appError.toJSON(),
    method: req.method,
    url: req.originalUrl,
    requestId: res.locals?.requestId,
    userId: req.user?.id,
    userAgent: req.get('User-Agent'),
    ip: req.ip
  });

  // Send error response
  const response = {
    success: false,
    message: appError.message,
    code: appError.code,
    timestamp: appError.timestamp,
    requestId: res.locals?.requestId
  };

  // Include details in development or for operational errors
  if (appError.details && (process.env.NODE_ENV === 'development' || appError.isOperational)) {
    response.details = appError.details;
  }

  // Include stack trace in development
  if (process.env.NODE_ENV === 'development' && appError.stack) {
    response.stack = appError.stack;
  }

  res.status(appError.statusCode).json(response);
};

/**
 * Async error wrapper
 */
const asyncHandler = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

/**
 * 404 handler middleware
 */
const notFoundHandler = (req, res, next) => {
  const error = new NotFoundError('Endpoint', req.originalUrl);
  next(error);
};

/**
 * Unhandled rejection handler
 */
const handleUnhandledRejection = () => {
  process.on('unhandledRejection', (reason, promise) => {
    logger.error('Unhandled Promise Rejection', {
      reason: reason?.message || reason,
      stack: reason?.stack,
      promise: promise.toString()
    });

    // Graceful shutdown
    process.exit(1);
  });
};

/**
 * Uncaught exception handler
 */
const handleUncaughtException = () => {
  process.on('uncaughtException', (error) => {
    logger.error('Uncaught Exception', {
      error: error.message,
      stack: error.stack
    });

    // Graceful shutdown
    process.exit(1);
  });
};

/**
 * Initialize error handlers
 */
const initializeErrorHandlers = () => {
  handleUnhandledRejection();
  handleUncaughtException();
};

module.exports = {
  // Error classes
  AppError,
  ValidationError,
  AuthenticationError,
  AuthorizationError,
  NotFoundError,
  ConflictError,
  RateLimitError,
  DatabaseError,
  ExternalServiceError,
  BusinessLogicError,

  // Middleware
  errorHandler,
  asyncHandler,
  notFoundHandler,

  // Initialization
  initializeErrorHandlers
};