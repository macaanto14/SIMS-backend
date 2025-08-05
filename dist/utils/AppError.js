"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DatabaseError = exports.ConflictError = exports.NotFoundError = exports.AuthorizationError = exports.AuthenticationError = exports.ValidationError = exports.AppError = void 0;
class AppError extends Error {
    constructor(message, statusCode = 500, code = 'INTERNAL_ERROR', details = null) {
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
exports.AppError = AppError;
class ValidationError extends AppError {
    constructor(message, details = null) {
        super(message, 400, 'VALIDATION_ERROR', details);
    }
}
exports.ValidationError = ValidationError;
class AuthenticationError extends AppError {
    constructor(message = 'Authentication failed', details = null) {
        super(message, 401, 'AUTHENTICATION_ERROR', details);
    }
}
exports.AuthenticationError = AuthenticationError;
class AuthorizationError extends AppError {
    constructor(message = 'Access denied', details = null) {
        super(message, 403, 'AUTHORIZATION_ERROR', details);
    }
}
exports.AuthorizationError = AuthorizationError;
class NotFoundError extends AppError {
    constructor(resource = 'Resource', identifier = null) {
        const message = identifier
            ? `${resource} with identifier '${identifier}' not found`
            : `${resource} not found`;
        super(message, 404, 'NOT_FOUND_ERROR', { resource, identifier });
    }
}
exports.NotFoundError = NotFoundError;
class ConflictError extends AppError {
    constructor(message = 'Resource conflict', details = null) {
        super(message, 409, 'CONFLICT_ERROR', details);
    }
}
exports.ConflictError = ConflictError;
class DatabaseError extends AppError {
    constructor(message, originalError = null) {
        super(message, 500, 'DATABASE_ERROR', { originalError: originalError?.message });
        this.originalError = originalError;
    }
}
exports.DatabaseError = DatabaseError;
//# sourceMappingURL=AppError.js.map