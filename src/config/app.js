/**
 * Application Configuration
 * 
 * Centralized configuration management for the SIMS Backend API.
 * All environment variables and application settings are defined here.
 * 
 * @module config/app
 */

const path = require('path');

/**
 * Validate required environment variables
 * @param {string[]} requiredVars - Array of required environment variable names
 * @throws {Error} If any required variable is missing
 */
const validateRequiredEnvVars = (requiredVars) => {
  const missing = requiredVars.filter(varName => !process.env[varName]);
  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }
};

// Validate critical environment variables
validateRequiredEnvVars(['JWT_SECRET', 'DATABASE_URL']);

/**
 * Application configuration object
 * Contains all application settings organized by category
 */
const APP_CONFIG = {
  // Server configuration
  NODE_ENV: process.env.NODE_ENV || 'development',
  PORT: parseInt(process.env.PORT, 10) || 3000,
  HOST: process.env.HOST || 'localhost',

  // Database configuration
  DATABASE: {
    URL: process.env.DATABASE_URL,
    POOL_SIZE: parseInt(process.env.DB_POOL_SIZE, 10) || 10,
    CONNECTION_TIMEOUT: parseInt(process.env.DB_CONNECTION_TIMEOUT, 10) || 30000,
    IDLE_TIMEOUT: parseInt(process.env.DB_IDLE_TIMEOUT, 10) || 10000,
  },

  // JWT configuration
  JWT: {
    SECRET: process.env.JWT_SECRET,
    EXPIRES_IN: process.env.JWT_EXPIRES_IN || '24h',
    REFRESH_EXPIRES_IN: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
  },

  // Security configuration
  SECURITY: {
    BCRYPT_ROUNDS: parseInt(process.env.BCRYPT_ROUNDS, 10) || 12,
    RATE_LIMIT_WINDOW_MS: parseInt(process.env.RATE_LIMIT_WINDOW_MS, 10) || 900000, // 15 minutes
    RATE_LIMIT_MAX_REQUESTS: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS, 10) || 100,
    CORS_ORIGINS: process.env.CORS_ORIGINS ? process.env.CORS_ORIGINS.split(',') : ['http://localhost:3000'],
  },

  // File upload configuration
  UPLOAD: {
    MAX_FILE_SIZE: parseInt(process.env.MAX_FILE_SIZE, 10) || 10 * 1024 * 1024, // 10MB
    ALLOWED_TYPES: ['image/jpeg', 'image/png', 'image/gif', 'application/pdf'],
    UPLOAD_DIR: path.join(__dirname, '../../uploads'),
  },

  // Logging configuration
  LOGGING: {
    LEVEL: process.env.LOG_LEVEL || 'info',
    FILE_PATH: process.env.LOG_FILE_PATH || path.join(__dirname, '../../logs'),
  },

  // Pagination defaults
  PAGINATION: {
    DEFAULT_PAGE: 1,
    DEFAULT_LIMIT: 20,
    MAX_LIMIT: 100,
  },

  // Cache configuration
  CACHE: {
    TTL: parseInt(process.env.CACHE_TTL, 10) || 3600, // 1 hour
    REDIS_URL: process.env.REDIS_URL,
  },

  // Email configuration (for future use)
  EMAIL: {
    SMTP_HOST: process.env.SMTP_HOST,
    SMTP_PORT: parseInt(process.env.SMTP_PORT, 10) || 587,
    SMTP_USER: process.env.SMTP_USER,
    SMTP_PASS: process.env.SMTP_PASS,
    FROM_EMAIL: process.env.FROM_EMAIL || 'noreply@sims.com',
  },
};

/**
 * Environment-specific configurations
 */
const ENVIRONMENT_CONFIGS = {
  development: {
    DEBUG: true,
    LOG_LEVEL: 'debug',
  },
  production: {
    DEBUG: false,
    LOG_LEVEL: 'warn',
  },
  test: {
    DEBUG: false,
    LOG_LEVEL: 'error',
    DATABASE: {
      ...APP_CONFIG.DATABASE,
      URL: process.env.TEST_DATABASE_URL || APP_CONFIG.DATABASE.URL,
    },
  },
};

// Merge environment-specific config
const envConfig = ENVIRONMENT_CONFIGS[APP_CONFIG.NODE_ENV] || {};
Object.assign(APP_CONFIG, envConfig);

module.exports = {
  APP_CONFIG,
  validateRequiredEnvVars,
};