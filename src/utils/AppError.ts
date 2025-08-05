/**
 * Application Error Classes
 * TypeScript version of error handling utilities
 */

export class AppError extends Error {
  public readonly statusCode: number;
  public readonly code: string;
  public readonly details: any;
  public readonly timestamp: string;
  public readonly isOperational: boolean;

  constructor(message: string, statusCode: number = 500, code: string = 'INTERNAL_ERROR', details: any = null) {
    super(message);
    
    this.name = this.constructor.name;
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
    this.timestamp = new Date().toISOString();
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }

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

export class ValidationError extends AppError {
  constructor(message: string, details: any = null) {
    super(message, 400, 'VALIDATION_ERROR', details);
  }
}

export class AuthenticationError extends AppError {
  constructor(message: string = 'Authentication failed', details: any = null) {
    super(message, 401, 'AUTHENTICATION_ERROR', details);
  }
}

export class AuthorizationError extends AppError {
  constructor(message: string = 'Access denied', details: any = null) {
    super(message, 403, 'AUTHORIZATION_ERROR', details);
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string = 'Resource', identifier: string | null = null) {
    const message = identifier 
      ? `${resource} with identifier '${identifier}' not found`
      : `${resource} not found`;
    
    super(message, 404, 'NOT_FOUND_ERROR', { resource, identifier });
  }
}

export class ConflictError extends AppError {
  constructor(message: string = 'Resource conflict', details: any = null) {
    super(message, 409, 'CONFLICT_ERROR', details);
  }
}

export class DatabaseError extends AppError {
  public readonly originalError: Error | null;

  constructor(message: string, originalError: Error | null = null) {
    super(message, 500, 'DATABASE_ERROR', { originalError: originalError?.message });
    this.originalError = originalError;
  }
}