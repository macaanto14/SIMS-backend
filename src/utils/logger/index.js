/**
 * Logging Utility Module
 * 
 * This module provides comprehensive logging functionality for the SIMS backend
 * with structured logging, multiple transports, and performance monitoring.
 * 
 * Features:
 * - Structured JSON logging
 * - Multiple log levels and transports
 * - Request/response logging
 * - Performance monitoring
 * - Error tracking with stack traces
 * - Log rotation and archival
 * 
 * @author Ismail Mohamed 
 * @version 2.0.0
 */

const winston = require('winston');
const path = require('path');
const fs = require('fs');

// Ensure logs directory exists
const logsDir = path.join(process.cwd(), 'logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

/**
 * Custom log format for structured logging
 */
const logFormat = winston.format.combine(
  winston.format.timestamp({
    format: 'YYYY-MM-DD HH:mm:ss.SSS'
  }),
  winston.format.errors({ stack: true }),
  winston.format.json(),
  winston.format.printf(({ timestamp, level, message, ...meta }) => {
    const logEntry = {
      timestamp,
      level: level.toUpperCase(),
      message,
      ...meta
    };

    // Add environment and service information
    logEntry.environment = process.env.NODE_ENV || 'development';
    logEntry.service = 'sims-backend';
    logEntry.version = process.env.APP_VERSION || '1.0.0';

    return JSON.stringify(logEntry);
  })
);

/**
 * Console format for development
 */
const consoleFormat = winston.format.combine(
  winston.format.colorize(),
  winston.format.timestamp({
    format: 'HH:mm:ss'
  }),
  winston.format.printf(({ timestamp, level, message, ...meta }) => {
    const metaStr = Object.keys(meta).length > 0 ? 
      `\n${JSON.stringify(meta, null, 2)}` : '';
    return `${timestamp} [${level}]: ${message}${metaStr}`;
  })
);

/**
 * Create Winston logger instance
 */
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: logFormat,
  defaultMeta: {
    service: 'sims-backend',
    pid: process.pid
  },
  transports: [
    // Error logs
    new winston.transports.File({
      filename: path.join(logsDir, 'error.log'),
      level: 'error',
      maxsize: 10 * 1024 * 1024, // 10MB
      maxFiles: 5,
      tailable: true
    }),

    // Combined logs
    new winston.transports.File({
      filename: path.join(logsDir, 'combined.log'),
      maxsize: 10 * 1024 * 1024, // 10MB
      maxFiles: 10,
      tailable: true
    }),

    // Access logs
    new winston.transports.File({
      filename: path.join(logsDir, 'access.log'),
      level: 'http',
      maxsize: 10 * 1024 * 1024, // 10MB
      maxFiles: 7,
      tailable: true
    })
  ],
  
  // Handle uncaught exceptions and rejections
  exceptionHandlers: [
    new winston.transports.File({
      filename: path.join(logsDir, 'exceptions.log')
    })
  ],
  
  rejectionHandlers: [
    new winston.transports.File({
      filename: path.join(logsDir, 'rejections.log')
    })
  ]
});

// Add console transport for development
if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: consoleFormat,
    level: 'debug'
  }));
}

/**
 * Enhanced logging methods with context
 */
const enhancedLogger = {
  /**
   * Log info level message
   * @param {string} message - Log message
   * @param {Object} meta - Additional metadata
   */
  info: (message, meta = {}) => {
    logger.info(message, {
      ...meta,
      timestamp: new Date().toISOString()
    });
  },

  /**
   * Log error level message
   * @param {string} message - Log message
   * @param {Object} meta - Additional metadata
   */
  error: (message, meta = {}) => {
    logger.error(message, {
      ...meta,
      timestamp: new Date().toISOString()
    });
  },

  /**
   * Log warning level message
   * @param {string} message - Log message
   * @param {Object} meta - Additional metadata
   */
  warn: (message, meta = {}) => {
    logger.warn(message, {
      ...meta,
      timestamp: new Date().toISOString()
    });
  },

  /**
   * Log debug level message
   * @param {string} message - Log message
   * @param {Object} meta - Additional metadata
   */
  debug: (message, meta = {}) => {
    logger.debug(message, {
      ...meta,
      timestamp: new Date().toISOString()
    });
  },

  /**
   * Log HTTP requests
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {number} duration - Request duration in ms
   */
  http: (req, res, duration) => {
    logger.log('http', 'HTTP Request', {
      method: req.method,
      url: req.originalUrl,
      statusCode: res.statusCode,
      duration,
      userAgent: req.get('User-Agent'),
      ip: req.ip,
      userId: req.user?.id,
      requestId: res.locals?.requestId,
      contentLength: res.get('Content-Length'),
      timestamp: new Date().toISOString()
    });
  },

  /**
   * Log database operations
   * @param {string} operation - Database operation type
   * @param {string} table - Table name
   * @param {Object} meta - Additional metadata
   */
  database: (operation, table, meta = {}) => {
    logger.info('Database Operation', {
      operation,
      table,
      ...meta,
      category: 'database',
      timestamp: new Date().toISOString()
    });
  },

  /**
   * Log authentication events
   * @param {string} event - Authentication event type
   * @param {Object} meta - Additional metadata
   */
  auth: (event, meta = {}) => {
    logger.info('Authentication Event', {
      event,
      ...meta,
      category: 'authentication',
      timestamp: new Date().toISOString()
    });
  },

  /**
   * Log security events
   * @param {string} event - Security event type
   * @param {Object} meta - Additional metadata
   */
  security: (event, meta = {}) => {
    logger.warn('Security Event', {
      event,
      ...meta,
      category: 'security',
      timestamp: new Date().toISOString()
    });
  },

  /**
   * Log performance metrics
   * @param {string} operation - Operation name
   * @param {number} duration - Duration in milliseconds
   * @param {Object} meta - Additional metadata
   */
  performance: (operation, duration, meta = {}) => {
    logger.info('Performance Metric', {
      operation,
      duration,
      ...meta,
      category: 'performance',
      timestamp: new Date().toISOString()
    });
  }
};

/**
 * Request logging middleware
 */
const requestLogger = (req, res, next) => {
  const startTime = Date.now();
  
  // Generate request ID if not exists
  if (!res.locals.requestId) {
    res.locals.requestId = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Log request start
  enhancedLogger.debug('Request started', {
    method: req.method,
    url: req.originalUrl,
    requestId: res.locals.requestId,
    userAgent: req.get('User-Agent'),
    ip: req.ip,
    userId: req.user?.id
  });

  // Override res.end to log response
  const originalEnd = res.end;
  res.end = function(...args) {
    const duration = Date.now() - startTime;
    
    // Log HTTP request
    enhancedLogger.http(req, res, duration);
    
    // Log slow requests
    if (duration > 1000) {
      enhancedLogger.warn('Slow request detected', {
        method: req.method,
        url: req.originalUrl,
        duration,
        requestId: res.locals.requestId,
        userId: req.user?.id
      });
    }

    originalEnd.apply(this, args);
  };

  next();
};

/**
 * Error logging middleware
 */
const errorLogger = (error, req, res, next) => {
  enhancedLogger.error('Unhandled error', {
    error: error.message,
    stack: error.stack,
    method: req.method,
    url: req.originalUrl,
    requestId: res.locals?.requestId,
    userId: req.user?.id,
    userAgent: req.get('User-Agent'),
    ip: req.ip
  });

  next(error);
};

module.exports = {
  ...enhancedLogger,
  requestLogger,
  errorLogger,
  winston: logger
};