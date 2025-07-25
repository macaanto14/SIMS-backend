/**
 * Authentication Service
 * 
 * Core business logic for authentication operations including
 * password hashing, token generation, and security utilities.
 * 
 * @module core/services/AuthService
 */

const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { APP_CONFIG } = require('../../config/app');
const logger = require('../../shared/utils/logger');

/**
 * Authentication Service Class
 * Provides secure authentication utilities and token management
 */
class AuthService {
  /**
   * Hash password using bcrypt with configurable salt rounds
   * 
   * @param {string} password - Plain text password to hash
   * @returns {Promise<string>} Hashed password
   * @throws {Error} If password hashing fails
   */
  static async hashPassword(password) {
    try {
      const saltRounds = APP_CONFIG.SECURITY.BCRYPT_ROUNDS;
      const hashedPassword = await bcrypt.hash(password, saltRounds);
      
      logger.debug('Password hashed successfully');
      return hashedPassword;
    } catch (error) {
      logger.error('Password hashing failed:', error);
      throw new Error('Failed to hash password');
    }
  }

  /**
   * Compare plain text password with hashed password
   * 
   * @param {string} password - Plain text password
   * @param {string} hashedPassword - Hashed password from database
   * @returns {Promise<boolean>} True if passwords match
   * @throws {Error} If password comparison fails
   */
  static async comparePassword(password, hashedPassword) {
    try {
      const isMatch = await bcrypt.compare(password, hashedPassword);
      
      logger.debug('Password comparison completed', { isMatch });
      return isMatch;
    } catch (error) {
      logger.error('Password comparison failed:', error);
      throw new Error('Failed to compare password');
    }
  }

  /**
   * Generate JWT access token with user payload
   * 
   * @param {Object} payload - Token payload containing user data
   * @param {string} payload.userId - User ID
   * @param {string} payload.email - User email
   * @returns {string} Signed JWT access token
   * @throws {Error} If token generation fails
   */
  static generateAccessToken(payload) {
    try {
      const token = jwt.sign(
        {
          userId: payload.userId,
          email: payload.email,
          type: 'access',
          iat: Math.floor(Date.now() / 1000),
        },
        APP_CONFIG.JWT.SECRET,
        {
          expiresIn: APP_CONFIG.JWT.EXPIRES_IN,
          issuer: 'sims-backend',
          audience: 'sims-frontend',
        }
      );
      
      logger.debug('Access token generated successfully', { userId: payload.userId });
      return token;
    } catch (error) {
      logger.error('Access token generation failed:', error);
      throw new Error('Failed to generate access token');
    }
  }

  /**
   * Generate JWT refresh token for token renewal
   * 
   * @param {Object} payload - Token payload
   * @param {string} payload.userId - User ID
   * @returns {string} Signed JWT refresh token
   * @throws {Error} If token generation fails
   */
  static generateRefreshToken(payload) {
    try {
      const token = jwt.sign(
        {
          userId: payload.userId,
          type: 'refresh',
          iat: Math.floor(Date.now() / 1000),
        },
        APP_CONFIG.JWT.SECRET,
        {
          expiresIn: APP_CONFIG.JWT.REFRESH_EXPIRES_IN,
          issuer: 'sims-backend',
          audience: 'sims-frontend',
        }
      );
      
      logger.debug('Refresh token generated successfully', { userId: payload.userId });
      return token;
    } catch (error) {
      logger.error('Refresh token generation failed:', error);
      throw new Error('Failed to generate refresh token');
    }
  }

  /**
   * Verify and decode JWT access token
   * 
   * @param {string} token - JWT token to verify
   * @returns {Object} Decoded token payload
   * @throws {Error} If token is invalid or expired
   */
  static verifyAccessToken(token) {
    try {
      const decoded = jwt.verify(token, APP_CONFIG.JWT.SECRET, {
        issuer: 'sims-backend',
        audience: 'sims-frontend',
      });
      
      // Verify token type
      if (decoded.type !== 'access') {
        throw new Error('Invalid token type');
      }
      
      logger.debug('Access token verified successfully', { userId: decoded.userId });
      return decoded;
    } catch (error) {
      logger.debug('Access token verification failed:', error.message);
      throw error;
    }
  }

  /**
   * Verify and decode JWT refresh token
   * 
   * @param {string} token - JWT refresh token to verify
   * @returns {Object} Decoded token payload
   * @throws {Error} If token is invalid or expired
   */
  static verifyRefreshToken(token) {
    try {
      const decoded = jwt.verify(token, APP_CONFIG.JWT.SECRET, {
        issuer: 'sims-backend',
        audience: 'sims-frontend',
      });
      
      // Verify token type
      if (decoded.type !== 'refresh') {
        throw new Error('Invalid token type');
      }
      
      logger.debug('Refresh token verified successfully', { userId: decoded.userId });
      return decoded;
    } catch (error) {
      logger.debug('Refresh token verification failed:', error.message);
      throw error;
    }
  }

  /**
   * Generate secure random token for password reset, email verification, etc.
   * 
   * @param {number} length - Token length (default: 32)
   * @returns {string} Random token string
   */
  static generateSecureToken(length = 32) {
    const crypto = require('crypto');
    return crypto.randomBytes(length).toString('hex');
  }

  /**
   * Validate password strength
   * 
   * @param {string} password - Password to validate
   * @returns {Object} Validation result with strength score and feedback
   */
  static validatePasswordStrength(password) {
    const result = {
      isValid: false,
      score: 0,
      feedback: [],
    };

    // Check minimum length
    if (password.length < 8) {
      result.feedback.push('Password must be at least 8 characters long');
    } else {
      result.score += 1;
    }

    // Check for uppercase letters
    if (!/[A-Z]/.test(password)) {
      result.feedback.push('Password must contain at least one uppercase letter');
    } else {
      result.score += 1;
    }

    // Check for lowercase letters
    if (!/[a-z]/.test(password)) {
      result.feedback.push('Password must contain at least one lowercase letter');
    } else {
      result.score += 1;
    }

    // Check for numbers
    if (!/\d/.test(password)) {
      result.feedback.push('Password must contain at least one number');
    } else {
      result.score += 1;
    }

    // Check for special characters
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      result.feedback.push('Password must contain at least one special character');
    } else {
      result.score += 1;
    }

    // Password is valid if it meets all criteria
    result.isValid = result.score >= 4;

    return result;
  }
}

module.exports = AuthService;