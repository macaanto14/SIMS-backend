/**
 * Authentication Controller
 * 
 * Handles user authentication operations including registration, login,
 * profile management, and token refresh. Implements secure authentication
 * practices with comprehensive error handling and logging.
 * 
 * @module api/controllers/authController
 */

const { query } = require('../../infrastructure/database');
const AuthService = require('../../core/services/AuthService');
const UserService = require('../../core/services/UserService');
const { successResponse, errorResponse } = require('../../shared/utils/response');
const { validateInput } = require('../../shared/validators');
const logger = require('../../shared/utils/logger');
const { AUTH_ERRORS } = require('../../shared/constants/errors');

/**
 * Register a new user account
 * 
 * Creates a new user with hashed password and generates JWT token.
 * Implements transaction to ensure data consistency.
 * 
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {Promise<void>}
 */
const register = async (req, res) => {
  // Start database transaction for data consistency
  const client = await require('../../infrastructure/database').getPool().connect();
  
  try {
    // Begin transaction
    await client.query('BEGIN');
    
    // Extract and validate user data from request body
    const { email, password, first_name, last_name, phone } = req.body;
    
    logger.info('User registration attempt', { email, firstName: first_name, lastName: last_name });
    
    // Check if user already exists with the provided email
    const existingUser = await client.query(
      'SELECT id FROM users WHERE email = $1',
      [email.toLowerCase()]
    );
    
    if (existingUser.rows.length > 0) {
      logger.warn('Registration failed: User already exists', { email });
      return errorResponse(res, AUTH_ERRORS.USER_ALREADY_EXISTS, 409);
    }
    
    // Hash password using secure bcrypt algorithm
    const hashedPassword = await AuthService.hashPassword(password);
    
    // Create new user record in database
    const userResult = await client.query(
      `INSERT INTO users (email, password_hash, first_name, last_name, phone, created_at, updated_at) 
       VALUES ($1, $2, $3, $4, $5, NOW(), NOW()) 
       RETURNING id, email, first_name, last_name, created_at`,
      [email.toLowerCase(), hashedPassword, first_name, last_name, phone]
    );
    
    const newUser = userResult.rows[0];
    
    // Commit transaction
    await client.query('COMMIT');
    
    // Generate JWT access token for immediate authentication
    const token = AuthService.generateAccessToken({
      userId: newUser.id,
      email: newUser.email
    });
    
    // Generate refresh token for token renewal
    const refreshToken = AuthService.generateRefreshToken({
      userId: newUser.id
    });
    
    logger.info('User registered successfully', { 
      userId: newUser.id, 
      email: newUser.email 
    });
    
    // Return success response with user data and tokens
    return successResponse(res, {
      user: {
        id: newUser.id,
        email: newUser.email,
        firstName: newUser.first_name,
        lastName: newUser.last_name,
        createdAt: newUser.created_at
      },
      tokens: {
        accessToken: token,
        refreshToken: refreshToken
      }
    }, 'User registered successfully', 201);
    
  } catch (error) {
    // Rollback transaction on error
    await client.query('ROLLBACK');
    
    logger.error('User registration error:', {
      error: error.message,
      stack: error.stack,
      email: req.body.email
    });
    
    return errorResponse(res, 'Registration failed. Please try again.', 500);
  } finally {
    // Always release database client back to pool
    client.release();
  }
};

/**
 * Authenticate user login
 * 
 * Validates user credentials, updates login timestamp, and returns
 * user data with JWT tokens and role information.
 * 
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {Promise<void>}
 */
const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    
    logger.info('User login attempt', { email });
    
    // Retrieve user with password hash and role information
    const userResult = await query(
      `SELECT u.id, u.email, u.password_hash, u.first_name, u.last_name, 
              u.is_active, u.last_login_at,
              ur.role_id, r.name as role_name, ur.school_id, s.name as school_name
       FROM users u
       LEFT JOIN user_roles ur ON u.id = ur.user_id AND ur.is_active = true
       LEFT JOIN roles r ON ur.role_id = r.id
       LEFT JOIN schools s ON ur.school_id = s.id
       WHERE u.email = $1`,
      [email.toLowerCase()]
    );
    
    // Check if user exists
    if (userResult.rows.length === 0) {
      logger.warn('Login failed: User not found', { email });
      return errorResponse(res, AUTH_ERRORS.INVALID_CREDENTIALS, 401);
    }
    
    const user = userResult.rows[0];
    
    // Check if user account is active
    if (!user.is_active) {
      logger.warn('Login failed: Account deactivated', { email, userId: user.id });
      return errorResponse(res, AUTH_ERRORS.ACCOUNT_DEACTIVATED, 401);
    }
    
    // Verify password using secure comparison
    const isValidPassword = await AuthService.comparePassword(password, user.password_hash);
    if (!isValidPassword) {
      logger.warn('Login failed: Invalid password', { email, userId: user.id });
      return errorResponse(res, AUTH_ERRORS.INVALID_CREDENTIALS, 401);
    }
    
    // Update last login timestamp
    await query(
      'UPDATE users SET last_login_at = NOW(), updated_at = NOW() WHERE id = $1',
      [user.id]
    );
    
    // Generate new JWT tokens
    const accessToken = AuthService.generateAccessToken({
      userId: user.id,
      email: user.email
    });
    
    const refreshToken = AuthService.generateRefreshToken({
      userId: user.id
    });
    
    // Prepare user roles data
    const roles = userResult.rows
      .filter(row => row.role_id)
      .map(row => ({
        roleId: row.role_id,
        roleName: row.role_name,
        schoolId: row.school_id,
        schoolName: row.school_name
      }));
    
    logger.info('User login successful', { 
      userId: user.id, 
      email: user.email,
      rolesCount: roles.length
    });
    
    // Return success response with user data and tokens
    return successResponse(res, {
      user: {
        id: user.id,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name,
        lastLoginAt: user.last_login_at,
        roles
      },
      tokens: {
        accessToken,
        refreshToken
      }
    }, 'Login successful');
    
  } catch (error) {
    logger.error('User login error:', {
      error: error.message,
      stack: error.stack,
      email: req.body.email
    });
    
    return errorResponse(res, 'Login failed. Please try again.', 500);
  }
};

/**
 * Get authenticated user profile
 * 
 * Returns comprehensive user profile information including
 * roles, permissions, and associated school data.
 * 
 * @param {Object} req - Express request object (contains authenticated user)
 * @param {Object} res - Express response object
 * @returns {Promise<void>}
 */
const getProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    
    logger.debug('Fetching user profile', { userId });
    
    // Retrieve comprehensive user profile data
    const userResult = await query(
      `SELECT u.id, u.email, u.first_name, u.last_name, u.phone, 
              u.avatar_url, u.created_at, u.last_login_at,
              ur.role_id, r.name as role_name, r.description as role_description,
              ur.school_id, s.name as school_name, s.code as school_code
       FROM users u
       LEFT JOIN user_roles ur ON u.id = ur.user_id AND ur.is_active = true
       LEFT JOIN roles r ON ur.role_id = r.id
       LEFT JOIN schools s ON ur.school_id = s.id
       WHERE u.id = $1 AND u.is_active = true`,
      [userId]
    );
    
    // Check if user exists and is active
    if (userResult.rows.length === 0) {
      logger.warn('Profile fetch failed: User not found or inactive', { userId });
      return errorResponse(res, 'User not found', 404);
    }
    
    const user = userResult.rows[0];
    
    // Prepare roles data with detailed information
    const roles = userResult.rows
      .filter(row => row.role_id)
      .map(row => ({
        roleId: row.role_id,
        roleName: row.role_name,
        roleDescription: row.role_description,
        school: row.school_id ? {
          id: row.school_id,
          name: row.school_name,
          code: row.school_code
        } : null
      }));
    
    logger.debug('User profile fetched successfully', { 
      userId, 
      rolesCount: roles.length 
    });
    
    // Return user profile data
    return successResponse(res, {
      id: user.id,
      email: user.email,
      firstName: user.first_name,
      lastName: user.last_name,
      phone: user.phone,
      avatarUrl: user.avatar_url,
      createdAt: user.created_at,
      lastLoginAt: user.last_login_at,
      roles
    });
    
  } catch (error) {
    logger.error('Get profile error:', {
      error: error.message,
      stack: error.stack,
      userId: req.user?.id
    });
    
    return errorResponse(res, 'Failed to fetch profile', 500);
  }
};

/**
 * Refresh JWT access token
 * 
 * Validates refresh token and generates new access token
 * for continued authentication without re-login.
 * 
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {Promise<void>}
 */
const refreshToken = async (req, res) => {
  try {
    const { refreshToken } = req.body;
    
    if (!refreshToken) {
      return errorResponse(res, 'Refresh token required', 400);
    }
    
    // Verify refresh token
    const decoded = AuthService.verifyRefreshToken(refreshToken);
    
    // Check if user still exists and is active
    const userResult = await query(
      'SELECT id, email, is_active FROM users WHERE id = $1',
      [decoded.userId]
    );
    
    if (userResult.rows.length === 0 || !userResult.rows[0].is_active) {
      return errorResponse(res, 'Invalid refresh token', 401);
    }
    
    const user = userResult.rows[0];
    
    // Generate new access token
    const newAccessToken = AuthService.generateAccessToken({
      userId: user.id,
      email: user.email
    });
    
    logger.info('Token refreshed successfully', { userId: user.id });
    
    return successResponse(res, {
      accessToken: newAccessToken
    }, 'Token refreshed successfully');
    
  } catch (error) {
    logger.error('Token refresh error:', {
      error: error.message,
      stack: error.stack
    });
    
    return errorResponse(res, 'Invalid refresh token', 401);
  }
};

/**
 * User logout
 * 
 * Invalidates user session and optionally blacklists tokens.
 * In a stateless JWT implementation, this primarily serves
 * for logging and potential token blacklisting.
 * 
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {Promise<void>}
 */
const logout = async (req, res) => {
  try {
    const userId = req.user.id;
    
    logger.info('User logout', { userId });
    
    // In a stateless JWT system, logout is primarily for logging
    // In production, you might want to implement token blacklisting
    
    return successResponse(res, null, 'Logout successful');
    
  } catch (error) {
    logger.error('Logout error:', {
      error: error.message,
      userId: req.user?.id
    });
    
    return errorResponse(res, 'Logout failed', 500);
  }
};

module.exports = {
  register,
  login,
  getProfile,
  refreshToken,
  logout,
};