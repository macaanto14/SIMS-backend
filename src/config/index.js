/**
 * Configuration Management Module
 * 
 * This module provides centralized configuration management
 * for the SIMS backend with environment-specific settings,
 * validation, and secure handling of sensitive data.
 * 
 * @author Ismail Mohamed 
 * @version 2.0.0
 */

const path = require('path');
const fs = require('fs');

/**
 * Load environment variables from .env file
 */
require('dotenv').config({
  path: path.join(process.cwd(), `.env.${process.env.NODE_ENV || 'development'}`)
});

/**
 * Configuration validation schema
 */
const configSchema = {
  // Server configuration
  PORT: { required: true, type: 'number', default: 3000 },
  NODE_ENV: { required: true, type: 'string', default: 'development' },
  
  // Database configuration
  DATABASE_URL: { required: true, type: 'string' },
  DB_HOST: { required: false, type: 'string' },
  DB_PORT: { required: false, type: 'number', default: 5432 },
  DB_NAME: { required: false, type: 'string' },
  DB_USER: { required: false, type: 'string' },
  DB_PASSWORD: { required: false, type: 'string' },
  DB_SSL: { required: false, type: 'boolean', default: false },
  DB_POOL_MIN: { required: false, type: 'number', default: 2 },
  DB_POOL_MAX: { required: false, type: 'number', default: 10 },
  
  // JWT configuration
  JWT_SECRET: { required: true, type: 'string' },
  JWT_EXPIRES_IN: { required: false, type: 'string', default: '24h' },
  JWT_REFRESH_SECRET: { required: false, type: 'string' },
  JWT_REFRESH_EXPIRES_IN: { required: false, type: 'string', default: '7d' },
  
  // Encryption configuration
  ENCRYPTION_KEY: { required: true, type: 'string' },
  
  // Email configuration
  SMTP_HOST: { required: false, type: 'string' },
  SMTP_PORT: { required: false, type: 'number', default: 587 },
  SMTP_USER: { required: false, type: 'string' },
  SMTP_PASSWORD: { required: false, type: 'string' },
  SMTP_FROM: { required: false, type: 'string' },
  
  // File upload configuration
  UPLOAD_MAX_SIZE: { required: false, type: 'number', default: 10485760 }, // 10MB
  UPLOAD_ALLOWED_TYPES: { required: false, type: 'string', default: 'jpg,jpeg,png,pdf,doc,docx' },
  
  // Logging configuration
  LOG_LEVEL: { required: false, type: 'string', default: 'info' },
  LOG_FILE: { required: false, type: 'boolean', default: true },
  
  // Security configuration
  BCRYPT_ROUNDS: { required: false, type: 'number', default: 12 },
  RATE_LIMIT_WINDOW: { required: false, type: 'number', default: 900000 }, // 15 minutes
  RATE_LIMIT_MAX: { required: false, type: 'number', default: 100 },
  
  // External services
  REDIS_URL: { required: false, type: 'string' },
  AWS_ACCESS_KEY_ID: { required: false, type: 'string' },
  AWS_SECRET_ACCESS_KEY: { required: false, type: 'string' },
  AWS_REGION: { required: false, type: 'string', default: 'us-east-1' },
  AWS_S3_BUCKET: { required: false, type: 'string' }
};

/**
 * Validate configuration value
 * @param {string} key - Configuration key
 * @param {*} value - Configuration value
 * @param {Object} schema - Validation schema
 * @returns {*} Validated value
 */
const validateConfigValue = (key, value, schema) => {
  const { required, type, default: defaultValue } = schema;
  
  // Use default if value is undefined
  if (value === undefined) {
    if (required && defaultValue === undefined) {
      throw new Error(`Required configuration ${key} is missing`);
    }
    return defaultValue;
  }
  
  // Type conversion and validation
  switch (type) {
    case 'number':
      const numValue = Number(value);
      if (isNaN(numValue)) {
        throw new Error(`Configuration ${key} must be a number`);
      }
      return numValue;
      
    case 'boolean':
      if (typeof value === 'boolean') return value;
      if (value === 'true') return true;
      if (value === 'false') return false;
      throw new Error(`Configuration ${key} must be a boolean`);
      
    case 'string':
      return String(value);
      
    default:
      return value;
  }
};

/**
 * Load and validate configuration
 */
const loadConfig = () => {
  const config = {};
  const errors = [];
  
  for (const [key, schema] of Object.entries(configSchema)) {
    try {
      config[key] = validateConfigValue(key, process.env[key], schema);
    } catch (error) {
      errors.push(error.message);
    }
  }
  
  if (errors.length > 0) {
    throw new Error(`Configuration validation failed:\n${errors.join('\n')}`);
  }
  
  return config;
};

/**
 * Environment-specific configurations
 */
const environmentConfigs = {
  development: {
    database: {
      logging: true,
      ssl: false
    },
    cors: {
      origin: ['http://localhost:3000', 'http://localhost:3001'],
      credentials: true
    },
    security: {
      rateLimitEnabled: false
    }
  },
  
  test: {
    database: {
      logging: false,
      ssl: false
    },
    cors: {
      origin: '*',
      credentials: false
    },
    security: {
      rateLimitEnabled: false
    }
  },
  
  production: {
    database: {
      logging: false,
      ssl: true
    },
    cors: {
      origin: process.env.ALLOWED_ORIGINS?.split(',') || [],
      credentials: true
    },
    security: {
      rateLimitEnabled: true
    }
  }
};

// Load base configuration
const baseConfig = loadConfig();

// Merge with environment-specific configuration
const envConfig = environmentConfigs[baseConfig.NODE_ENV] || {};

/**
 * Final configuration object
 */
const config = {
  // Server settings
  server: {
    port: baseConfig.PORT,
    env: baseConfig.NODE_ENV,
    isDevelopment: baseConfig.NODE_ENV === 'development',
    isProduction: baseConfig.NODE_ENV === 'production',
    isTest: baseConfig.NODE_ENV === 'test'
  },
  
  // Database settings
  database: {
    url: baseConfig.DATABASE_URL,
    host: baseConfig.DB_HOST,
    port: baseConfig.DB_PORT,
    name: baseConfig.DB_NAME,
    user: baseConfig.DB_USER,
    password: baseConfig.DB_PASSWORD,
    ssl: baseConfig.DB_SSL,
    pool: {
      min: baseConfig.DB_POOL_MIN,
      max: baseConfig.DB_POOL_MAX
    },
    ...envConfig.database
  },
  
  // JWT settings
  jwt: {
    secret: baseConfig.JWT_SECRET,
    expiresIn: baseConfig.JWT_EXPIRES_IN,
    refreshSecret: baseConfig.JWT_REFRESH_SECRET || baseConfig.JWT_SECRET,
    refreshExpiresIn: baseConfig.JWT_REFRESH_EXPIRES_IN
  },
  
  // Security settings
  security: {
    encryptionKey: baseConfig.ENCRYPTION_KEY,
    bcryptRounds: baseConfig.BCRYPT_ROUNDS,
    rateLimit: {
      windowMs: baseConfig.RATE_LIMIT_WINDOW,
      max: baseConfig.RATE_LIMIT_MAX,
      enabled: envConfig.security?.rateLimitEnabled ?? true
    }
  },
  
  // Email settings
  email: {
    smtp: {
      host: baseConfig.SMTP_HOST,
      port: baseConfig.SMTP_PORT,
      user: baseConfig.SMTP_USER,
      password: baseConfig.SMTP_PASSWORD,
      from: baseConfig.SMTP_FROM
    }
  },
  
  // File upload settings
  upload: {
    maxSize: baseConfig.UPLOAD_MAX_SIZE,
    allowedTypes: baseConfig.UPLOAD_ALLOWED_TYPES.split(','),
    destination: path.join(process.cwd(), 'uploads')
  },
  
  // Logging settings
  logging: {
    level: baseConfig.LOG_LEVEL,
    file: baseConfig.LOG_FILE
  },
  
  // CORS settings
  cors: envConfig.cors || {
    origin: '*',
    credentials: false
  },
  
  // External services
  aws: {
    accessKeyId: baseConfig.AWS_ACCESS_KEY_ID,
    secretAccessKey: baseConfig.AWS_SECRET_ACCESS_KEY,
    region: baseConfig.AWS_REGION,
    s3Bucket: baseConfig.AWS_S3_BUCKET
  },
  
  redis: {
    url: baseConfig.REDIS_URL
  }
};

/**
 * Validate required configuration for current environment
 */
const validateEnvironmentConfig = () => {
  const requiredForProduction = [
    'database.url',
    'jwt.secret',
    'security.encryptionKey'
  ];
  
  if (config.server.isProduction) {
    const missing = requiredForProduction.filter(path => {
      const keys = path.split('.');
      let value = config;
      
      for (const key of keys) {
        value = value[key];
        if (value === undefined) return true;
      }
      
      return false;
    });
    
    if (missing.length > 0) {
      throw new Error(`Missing required production configuration: ${missing.join(', ')}`);
    }
  }
};

// Validate configuration
validateEnvironmentConfig();

module.exports = config;