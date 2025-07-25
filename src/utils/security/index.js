/**
 * Security Utilities Module
 * 
 * This module provides comprehensive security utilities including
 * encryption, hashing, input sanitization, and security middleware
 * for the SIMS backend.
 * 
 * @author Ismail Mohamed 
 * @version 2.0.0
 */

const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const xss = require('xss');
const validator = require('validator');
const logger = require('../logger');

/**
 * Password utilities
 */
const password = {
  /**
   * Hash a password using bcrypt
   * @param {string} plainPassword - Plain text password
   * @param {number} rounds - Salt rounds (default: 12)
   * @returns {Promise<string>} Hashed password
   */
  hash: async (plainPassword, rounds = 12) => {
    try {
      const salt = await bcrypt.genSalt(rounds);
      return await bcrypt.hash(plainPassword, salt);
    } catch (error) {
      logger.error('Password hashing failed', { error: error.message });
      throw new Error('Password hashing failed');
    }
  },

  /**
   * Verify a password against its hash
   * @param {string} plainPassword - Plain text password
   * @param {string} hashedPassword - Hashed password
   * @returns {Promise<boolean>} Verification result
   */
  verify: async (plainPassword, hashedPassword) => {
    try {
      return await bcrypt.compare(plainPassword, hashedPassword);
    } catch (error) {
      logger.error('Password verification failed', { error: error.message });
      return false;
    }
  },

  /**
   * Generate a secure random password
   * @param {number} length - Password length (default: 16)
   * @param {Object} options - Password generation options
   * @returns {string} Generated password
   */
  generate: (length = 16, options = {}) => {
    const {
      includeUppercase = true,
      includeLowercase = true,
      includeNumbers = true,
      includeSymbols = true,
      excludeSimilar = true
    } = options;

    let charset = '';
    if (includeLowercase) charset += 'abcdefghijklmnopqrstuvwxyz';
    if (includeUppercase) charset += 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    if (includeNumbers) charset += '0123456789';
    if (includeSymbols) charset += '!@#$%^&*()_+-=[]{}|;:,.<>?';

    if (excludeSimilar) {
      charset = charset.replace(/[0O1lI]/g, '');
    }

    let password = '';
    for (let i = 0; i < length; i++) {
      password += charset.charAt(Math.floor(Math.random() * charset.length));
    }

    return password;
  },

  /**
   * Check password strength
   * @param {string} password - Password to check
   * @returns {Object} Password strength analysis
   */
  checkStrength: (password) => {
    const analysis = {
      score: 0,
      feedback: [],
      isStrong: false
    };

    // Length check
    if (password.length >= 8) analysis.score += 1;
    else analysis.feedback.push('Password should be at least 8 characters long');

    if (password.length >= 12) analysis.score += 1;

    // Character variety checks
    if (/[a-z]/.test(password)) analysis.score += 1;
    else analysis.feedback.push('Password should contain lowercase letters');

    if (/[A-Z]/.test(password)) analysis.score += 1;
    else analysis.feedback.push('Password should contain uppercase letters');

    if (/\d/.test(password)) analysis.score += 1;
    else analysis.feedback.push('Password should contain numbers');

    if (/[!@#$%^&*()_+\-=\[\]{}|;:,.<>?]/.test(password)) analysis.score += 1;
    else analysis.feedback.push('Password should contain special characters');

    // Common patterns check
    if (!/(.)\1{2,}/.test(password)) analysis.score += 1;
    else analysis.feedback.push('Password should not contain repeated characters');

    analysis.isStrong = analysis.score >= 5;
    return analysis;
  }
};

/**
 * Encryption utilities
 */
const encryption = {
  /**
   * Encrypt data using AES-256-GCM
   * @param {string} text - Text to encrypt
   * @param {string} key - Encryption key
   * @returns {Object} Encrypted data with IV and auth tag
   */
  encrypt: (text, key = process.env.ENCRYPTION_KEY) => {
    try {
      const algorithm = 'aes-256-gcm';
      const iv = crypto.randomBytes(16);
      const cipher = crypto.createCipher(algorithm, key);
      
      let encrypted = cipher.update(text, 'utf8', 'hex');
      encrypted += cipher.final('hex');
      
      const authTag = cipher.getAuthTag();
      
      return {
        encrypted,
        iv: iv.toString('hex'),
        authTag: authTag.toString('hex')
      };
    } catch (error) {
      logger.error('Encryption failed', { error: error.message });
      throw new Error('Encryption failed');
    }
  },

  /**
   * Decrypt data using AES-256-GCM
   * @param {Object} encryptedData - Encrypted data object
   * @param {string} key - Decryption key
   * @returns {string} Decrypted text
   */
  decrypt: (encryptedData, key = process.env.ENCRYPTION_KEY) => {
    try {
      const algorithm = 'aes-256-gcm';
      const decipher = crypto.createDecipher(algorithm, key);
      
      decipher.setAuthTag(Buffer.from(encryptedData.authTag, 'hex'));
      
      let decrypted = decipher.update(encryptedData.encrypted, 'hex', 'utf8');
      decrypted += decipher.final('utf8');
      
      return decrypted;
    } catch (error) {
      logger.error('Decryption failed', { error: error.message });
      throw new Error('Decryption failed');
    }
  }
};

/**
 * Input sanitization utilities
 */
const sanitize = {
  /**
   * Sanitize HTML input to prevent XSS
   * @param {string} input - Input string
   * @param {Object} options - XSS options
   * @returns {string} Sanitized string
   */
  html: (input, options = {}) => {
    if (typeof input !== 'string') return input;
    
    return xss(input, {
      whiteList: options.allowedTags || {},
      stripIgnoreTag: true,
      stripIgnoreTagBody: ['script'],
      ...options
    });
  },

  /**
   * Sanitize SQL input to prevent injection
   * @param {string} input - Input string
   * @returns {string} Sanitized string
   */
  sql: (input) => {
    if (typeof input !== 'string') return input;
    
    return input.replace(/['";\\]/g, '');
  },

  /**
   * Sanitize email input
   * @param {string} email - Email string
   * @returns {string} Sanitized email
   */
  email: (email) => {
    if (typeof email !== 'string') return email;
    
    return validator.normalizeEmail(email.toLowerCase().trim()) || '';
  },

  /**
   * Sanitize phone number
   * @param {string} phone - Phone number
   * @returns {string} Sanitized phone number
   */
  phone: (phone) => {
    if (typeof phone !== 'string') return phone;
    
    return phone.replace(/[^\d+\-\(\)\s]/g, '').trim();
  },

  /**
   * Sanitize general text input
   * @param {string} input - Input string
   * @param {Object} options - Sanitization options
   * @returns {string} Sanitized string
   */
  text: (input, options = {}) => {
    if (typeof input !== 'string') return input;
    
    const {
      maxLength = 1000,
      allowHtml = false,
      trim = true
    } = options;

    let sanitized = input;
    
    if (trim) sanitized = sanitized.trim();
    if (!allowHtml) sanitized = sanitize.html(sanitized);
    if (maxLength) sanitized = sanitized.substring(0, maxLength);
    
    return sanitized;
  }
};

/**
 * Rate limiting configurations
 */
const rateLimiters = {
  /**
   * General API rate limiter
   */
  general: rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // 100 requests per window
    message: {
      error: 'Too many requests, please try again later',
      retryAfter: '15 minutes'
    },
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) => {
      logger.security('Rate limit exceeded', {
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        endpoint: req.originalUrl
      });
      
      res.status(429).json({
        error: 'Too many requests, please try again later',
        retryAfter: '15 minutes'
      });
    }
  }),

  /**
   * Authentication rate limiter
   */
  auth: rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // 5 attempts per window
    skipSuccessfulRequests: true,
    message: {
      error: 'Too many authentication attempts, please try again later',
      retryAfter: '15 minutes'
    }
  }),

  /**
   * Password reset rate limiter
   */
  passwordReset: rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 3, // 3 attempts per hour
    message: {
      error: 'Too many password reset attempts, please try again later',
      retryAfter: '1 hour'
    }
  })
};

/**
 * Security headers middleware
 */
const securityHeaders = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'"],
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"]
    }
  },
  crossOriginEmbedderPolicy: false,
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  }
});

/**
 * Input validation middleware
 */
const validateInput = (req, res, next) => {
  // Sanitize request body
  if (req.body && typeof req.body === 'object') {
    for (const [key, value] of Object.entries(req.body)) {
      if (typeof value === 'string') {
        req.body[key] = sanitize.text(value);
      }
    }
  }

  // Sanitize query parameters
  if (req.query && typeof req.query === 'object') {
    for (const [key, value] of Object.entries(req.query)) {
      if (typeof value === 'string') {
        req.query[key] = sanitize.text(value, { maxLength: 100 });
      }
    }
  }

  next();
};

/**
 * Generate secure tokens
 */
const tokens = {
  /**
   * Generate a secure random token
   * @param {number} length - Token length in bytes
   * @returns {string} Hex token
   */
  generate: (length = 32) => {
    return crypto.randomBytes(length).toString('hex');
  },

  /**
   * Generate a numeric OTP
   * @param {number} length - OTP length
   * @returns {string} Numeric OTP
   */
  generateOTP: (length = 6) => {
    const digits = '0123456789';
    let otp = '';
    
    for (let i = 0; i < length; i++) {
      otp += digits[Math.floor(Math.random() * digits.length)];
    }
    
    return otp;
  }
};

module.exports = {
  password,
  encryption,
  sanitize,
  rateLimiters,
  securityHeaders,
  validateInput,
  tokens
};