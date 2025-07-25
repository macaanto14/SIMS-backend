/**
 * Response Utilities Module
 * 
 * This module provides standardized response formatting utilities
 * for consistent API responses across the SIMS backend.
 * 
 * Features:
 * - Standardized success/error response formats
 * - Pagination response helpers
 * - HTTP status code management
 * - Response metadata inclusion
 * 
 * @author Ismail Mohamed 
 * @version 2.0.0
 */

const logger = require('../logger');

/**
 * Standard API response format
 * @typedef {Object} ApiResponse
 * @property {boolean} success - Indicates if the request was successful
 * @property {string} message - Human-readable message
 * @property {*} data - Response data (null for errors)
 * @property {Object} meta - Response metadata
 * @property {Array} errors - Error details (only for error responses)
 * @property {string} timestamp - ISO timestamp of response
 * @property {string} requestId - Unique request identifier
 */

/**
 * Generate a successful API response
 * 
 * @param {Object} res - Express response object
 * @param {*} data - Response data
 * @param {string} message - Success message
 * @param {number} statusCode - HTTP status code
 * @param {Object} meta - Additional metadata
 * @returns {Object} Express response
 */
const successResponse = (res, data = null, message = 'Success', statusCode = 200, meta = {}) => {
  const response = {
    success: true,
    message,
    data,
    meta: {
      timestamp: new Date().toISOString(),
      requestId: res.locals.requestId || generateRequestId(),
      ...meta
    }
  };

  // Log successful responses for audit trail
  logger.info('API Success Response', {
    statusCode,
    message,
    requestId: response.meta.requestId,
    endpoint: res.req?.originalUrl,
    method: res.req?.method,
    userId: res.req?.user?.id,
    dataType: data ? typeof data : 'null',
    hasData: !!data
  });

  return res.status(statusCode).json(response);
};

/**
 * Generate an error API response
 * 
 * @param {Object} res - Express response object
 * @param {string} message - Error message
 * @param {number} statusCode - HTTP status code
 * @param {*} errors - Error details
 * @param {Object} meta - Additional metadata
 * @returns {Object} Express response
 */
const errorResponse = (res, message = 'Internal server error', statusCode = 500, errors = null, meta = {}) => {
  const response = {
    success: false,
    message,
    data: null,
    meta: {
      timestamp: new Date().toISOString(),
      requestId: res.locals.requestId || generateRequestId(),
      ...meta
    }
  };

  // Include error details if provided
  if (errors) {
    response.errors = Array.isArray(errors) ? errors : [errors];
  }

  // Log error responses
  const logLevel = statusCode >= 500 ? 'error' : 'warn';
  logger[logLevel]('API Error Response', {
    statusCode,
    message,
    errors,
    requestId: response.meta.requestId,
    endpoint: res.req?.originalUrl,
    method: res.req?.method,
    userId: res.req?.user?.id,
    userAgent: res.req?.get('User-Agent'),
    ip: res.req?.ip
  });

  return res.status(statusCode).json(response);
};

/**
 * Generate a paginated response
 * 
 * @param {Object} res - Express response object
 * @param {Array} data - Array of data items
 * @param {Object} pagination - Pagination information
 * @param {string} message - Success message
 * @param {number} statusCode - HTTP status code
 * @returns {Object} Express response
 */
const paginatedResponse = (res, data, pagination, message = 'Data retrieved successfully', statusCode = 200) => {
  const {
    currentPage,
    totalPages,
    totalItems,
    itemsPerPage,
    hasNextPage,
    hasPrevPage
  } = pagination;

  return successResponse(res, data, message, statusCode, {
    pagination: {
      currentPage,
      totalPages,
      totalItems,
      itemsPerPage,
      hasNextPage,
      hasPrevPage,
      itemsInCurrentPage: data.length
    }
  });
};

/**
 * Generate a created resource response
 * 
 * @param {Object} res - Express response object
 * @param {*} data - Created resource data
 * @param {string} message - Success message
 * @param {string} location - Resource location URL
 * @returns {Object} Express response
 */
const createdResponse = (res, data, message = 'Resource created successfully', location = null) => {
  if (location) {
    res.set('Location', location);
  }

  return successResponse(res, data, message, 201, {
    resourceLocation: location
  });
};

/**
 * Generate a no content response
 * 
 * @param {Object} res - Express response object
 * @param {string} message - Success message
 * @returns {Object} Express response
 */
const noContentResponse = (res, message = 'Operation completed successfully') => {
  logger.info('API No Content Response', {
    message,
    requestId: res.locals.requestId,
    endpoint: res.req?.originalUrl,
    method: res.req?.method,
    userId: res.req?.user?.id
  });

  return res.status(204).json({
    success: true,
    message,
    meta: {
      timestamp: new Date().toISOString(),
      requestId: res.locals.requestId || generateRequestId()
    }
  });
};

/**
 * Generate a validation error response
 * 
 * @param {Object} res - Express response object
 * @param {Array} validationErrors - Array of validation errors
 * @param {string} message - Error message
 * @returns {Object} Express response
 */
const validationErrorResponse = (res, validationErrors, message = 'Validation failed') => {
  return errorResponse(res, message, 400, validationErrors, {
    errorType: 'validation',
    errorCount: validationErrors.length
  });
};

/**
 * Generate an unauthorized response
 * 
 * @param {Object} res - Express response object
 * @param {string} message - Error message
 * @returns {Object} Express response
 */
const unauthorizedResponse = (res, message = 'Authentication required') => {
  return errorResponse(res, message, 401, null, {
    errorType: 'authentication'
  });
};

/**
 * Generate a forbidden response
 * 
 * @param {Object} res - Express response object
 * @param {string} message - Error message
 * @param {Object} permissions - Permission details
 * @returns {Object} Express response
 */
const forbiddenResponse = (res, message = 'Access denied', permissions = null) => {
  return errorResponse(res, message, 403, permissions, {
    errorType: 'authorization'
  });
};

/**
 * Generate a not found response
 * 
 * @param {Object} res - Express response object
 * @param {string} resource - Resource type that was not found
 * @param {string} identifier - Resource identifier
 * @returns {Object} Express response
 */
const notFoundResponse = (res, resource = 'Resource', identifier = null) => {
  const message = identifier 
    ? `${resource} with identifier '${identifier}' not found`
    : `${resource} not found`;

  return errorResponse(res, message, 404, null, {
    errorType: 'not_found',
    resource,
    identifier
  });
};

/**
 * Generate a conflict response
 * 
 * @param {Object} res - Express response object
 * @param {string} message - Error message
 * @param {Object} conflictDetails - Details about the conflict
 * @returns {Object} Express response
 */
const conflictResponse = (res, message = 'Resource conflict', conflictDetails = null) => {
  return errorResponse(res, message, 409, conflictDetails, {
    errorType: 'conflict'
  });
};

/**
 * Generate a rate limit exceeded response
 * 
 * @param {Object} res - Express response object
 * @param {string} message - Error message
 * @param {Object} rateLimitInfo - Rate limit information
 * @returns {Object} Express response
 */
const rateLimitResponse = (res, message = 'Rate limit exceeded', rateLimitInfo = null) => {
  return errorResponse(res, message, 429, rateLimitInfo, {
    errorType: 'rate_limit'
  });
};

/**
 * Generate a unique request ID
 * 
 * @returns {string} Unique request identifier
 */
const generateRequestId = () => {
  return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

/**
 * Middleware to add request ID to response locals
 * 
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
const addRequestId = (req, res, next) => {
  res.locals.requestId = generateRequestId();
  res.set('X-Request-ID', res.locals.requestId);
  next();
};

module.exports = {
  successResponse,
  errorResponse,
  paginatedResponse,
  createdResponse,
  noContentResponse,
  validationErrorResponse,
  unauthorizedResponse,
  forbiddenResponse,
  notFoundResponse,
  conflictResponse,
  rateLimitResponse,
  addRequestId,
  generateRequestId
};