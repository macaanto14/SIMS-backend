/**
 * Authentication Routes
 * 
 * This module handles all authentication-related endpoints including
 * user registration, login, logout, password reset, and token management.
 * 
 * @author Ismail Mohamed 
 * @version 2.0.0
 */

const express = require('express');
const router = express.Router();

// Import controllers
const authController = require('../../api/controllers/authController');

// Import middleware
const { authenticateToken, authRateLimit } = require('../../middleware/auth');
const { 
  validateUserRegistration, 
  validateUserLogin, 
  handleValidationErrors,
  validateEmail,
  validatePassword
} = require('../../middleware/validation');

// Import utilities
const { successResponse } = require('../../utils/response');

/**
 * @route   POST /api/v1/auth/register
 * @desc    Register a new user account
 * @access  Public
 * @rateLimit 5 requests per 15 minutes per IP
 */
router.post('/register', 
  authRateLimit({ max: 5, windowMs: 15 * 60 * 1000 }),
  validateUserRegistration(),
  handleValidationErrors,
  authController.register
);

/**
 * @route   POST /api/v1/auth/login
 * @desc    Authenticate user and return JWT token
 * @access  Public
 * @rateLimit 10 requests per 15 minutes per IP
 */
router.post('/login',
  authRateLimit({ max: 10, windowMs: 15 * 60 * 1000 }),
  validateUserLogin(),
  handleValidationErrors,
  authController.login
);

/**
 * @route   POST /api/v1/auth/logout
 * @desc    Logout user and invalidate token
 * @access  Private
 */
router.post('/logout',
  authenticateToken,
  authController.logout
);

/**
 * @route   POST /api/v1/auth/refresh
 * @desc    Refresh JWT token
 * @access  Private
 */
router.post('/refresh',
  authenticateToken,
  authController.refreshToken
);

/**
 * @route   GET /api/v1/auth/profile
 * @desc    Get current user profile
 * @access  Private
 */
router.get('/profile',
  authenticateToken,
  authController.getProfile
);

/**
 * @route   PUT /api/v1/auth/profile
 * @desc    Update current user profile
 * @access  Private
 */
router.put('/profile',
  authenticateToken,
  // Add profile update validation here
  handleValidationErrors,
  authController.updateProfile
);

/**
 * @route   POST /api/v1/auth/forgot-password
 * @desc    Request password reset
 * @access  Public
 * @rateLimit 3 requests per hour per IP
 */
router.post('/forgot-password',
  authRateLimit({ max: 3, windowMs: 60 * 60 * 1000 }),
  validateEmail({ message: 'Valid email required for password reset' }),
  handleValidationErrors,
  authController.forgotPassword
);

/**
 * @route   POST /api/v1/auth/reset-password
 * @desc    Reset password using reset token
 * @access  Public
 * @rateLimit 5 requests per hour per IP
 */
router.post('/reset-password',
  authRateLimit({ max: 5, windowMs: 60 * 60 * 1000 }),
  [
    validatePassword({ field: 'newPassword' }),
    body('resetToken').notEmpty().withMessage('Reset token is required')
  ],
  handleValidationErrors,
  authController.resetPassword
);

/**
 * @route   POST /api/v1/auth/change-password
 * @desc    Change password for authenticated user
 * @access  Private
 */
router.post('/change-password',
  authenticateToken,
  [
    body('currentPassword').notEmpty().withMessage('Current password is required'),
    validatePassword({ field: 'newPassword' })
  ],
  handleValidationErrors,
  authController.changePassword
);

/**
 * @route   POST /api/v1/auth/verify-email
 * @desc    Verify email address using verification token
 * @access  Public
 */
router.post('/verify-email',
  [
    body('verificationToken').notEmpty().withMessage('Verification token is required')
  ],
  handleValidationErrors,
  authController.verifyEmail
);

/**
 * @route   POST /api/v1/auth/resend-verification
 * @desc    Resend email verification
 * @access  Public
 * @rateLimit 3 requests per hour per email
 */
router.post('/resend-verification',
  authRateLimit({ max: 3, windowMs: 60 * 60 * 1000 }),
  validateEmail(),
  handleValidationErrors,
  authController.resendVerification
);

module.exports = router;