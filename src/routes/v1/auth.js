/**
 * Authentication Routes with Swagger Documentation
 * @swagger
 * tags:
 *   name: Authentication
 *   description: User authentication and authorization
 */

const express = require('express');
const router = express.Router();
const EnhancedAuthController = require('../../api/controllers/enhanced/authController');
const { enhancedAuth, enhancedValidation, createAdaptiveRateLimit } = require('../../middleware/async');
const { body } = require('express-validator');

// Rate limiting for auth endpoints
const authRateLimit = createAdaptiveRateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  standardLimit: 5, // 5 attempts per window for login
  premiumLimit: 10,
  adminLimit: 20
});

/**
 * @swagger
 * /api/v1/auth/register:
 *   post:
 *     summary: Register a new user
 *     description: |
 *       Creates a new user account with email verification.
 *       
 *       **Rate Limiting:** 5 requests per 15 minutes per IP
 *       
 *       **Validation Rules:**
 *       - Email must be valid and unique
 *       - Password must be at least 8 characters with uppercase, lowercase, number, and special character
 *       - First name and last name are required
 *       - Phone number must be valid format
 *     tags: [Authentication]
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *               - first_name
 *               - last_name
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 description: User's email address
 *                 example: john.doe@school.com
 *               password:
 *                 type: string
 *                 minLength: 8
 *                 description: Strong password with mixed case, numbers, and symbols
 *                 example: SecurePass123!
 *               first_name:
 *                 type: string
 *                 minLength: 2
 *                 maxLength: 50
 *                 description: User's first name
 *                 example: John
 *               last_name:
 *                 type: string
 *                 minLength: 2
 *                 maxLength: 50
 *                 description: User's last name
 *                 example: Doe
 *               phone:
 *                 type: string
 *                 pattern: '^[+]?[1-9]\d{1,14}$'
 *                 description: Phone number in international format
 *                 example: +1234567890
 *               school_id:
 *                 type: string
 *                 format: uuid
 *                 description: Optional school ID for automatic role assignment
 *                 example: 123e4567-e89b-12d3-a456-426614174000
 *     responses:
 *       201:
 *         description: User registered successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: object
 *                       properties:
 *                         user:
 *                           $ref: '#/components/schemas/User'
 *                         token:
 *                           type: string
 *                           description: JWT authentication token
 *                           example: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
 *             example:
 *               success: true
 *               message: User registered successfully
 *               data:
 *                 user:
 *                   id: 123e4567-e89b-12d3-a456-426614174000
 *                   email: john.doe@school.com
 *                   firstName: John
 *                   lastName: Doe
 *                   phone: +1234567890
 *                   isActive: true
 *                   createdAt: '2024-01-15T10:30:00Z'
 *                   roles: []
 *                 token: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
 *               requestId: req_123456789
 *               timestamp: '2024-01-15T10:30:00Z'
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       409:
 *         description: User already exists
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               success: false
 *               error: User already exists with this email
 *               code: DUPLICATE_USER
 *               requestId: req_123456789
 *               timestamp: '2024-01-15T10:30:00Z'
 *       429:
 *         $ref: '#/components/responses/RateLimitError'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.post('/register', 
  authRateLimit,
  enhancedValidation([
    body('email')
      .isEmail()
      .normalizeEmail()
      .withMessage('Valid email is required'),
    body('password')
      .isLength({ min: 8 })
      .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
      .withMessage('Password must be at least 8 characters with uppercase, lowercase, number, and special character'),
    body('first_name')
      .trim()
      .isLength({ min: 2, max: 50 })
      .withMessage('First name must be 2-50 characters'),
    body('last_name')
      .trim()
      .isLength({ min: 2, max: 50 })
      .withMessage('Last name must be 2-50 characters'),
    body('phone')
      .optional()
      .matches(/^[+]?[1-9]\d{1,14}$/)
      .withMessage('Invalid phone number format'),
    body('school_id')
      .optional()
      .isUUID()
      .withMessage('Invalid school ID format')
  ]),
  EnhancedAuthController.register
);

/**
 * @swagger
 * /api/v1/auth/login:
 *   post:
 *     summary: Authenticate user
 *     description: |
 *       Authenticates a user with email and password, returning a JWT token.
 *       
 *       **Features:**
 *       - Automatic session management
 *       - Login attempt tracking
 *       - Account lockout protection
 *       - Multi-device support
 *       
 *       **Rate Limiting:** 5 attempts per 15 minutes per IP
 *     tags: [Authentication]
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 description: User's email address
 *                 example: john.doe@school.com
 *               password:
 *                 type: string
 *                 description: User's password
 *                 example: SecurePass123!
 *               remember_me:
 *                 type: boolean
 *                 description: Extend token expiration time
 *                 default: false
 *     responses:
 *       200:
 *         description: Login successful
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: object
 *                       properties:
 *                         user:
 *                           allOf:
 *                             - $ref: '#/components/schemas/User'
 *                             - type: object
 *                               properties:
 *                                 lastLoginAt:
 *                                   type: string
 *                                   format: date-time
 *                                   description: Last login timestamp
 *                         token:
 *                           type: string
 *                           description: JWT authentication token
 *                         expiresAt:
 *                           type: string
 *                           format: date-time
 *                           description: Token expiration time
 *       401:
 *         description: Invalid credentials or account deactivated
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             examples:
 *               invalid_credentials:
 *                 summary: Invalid email or password
 *                 value:
 *                   success: false
 *                   error: Invalid credentials
 *                   code: INVALID_CREDENTIALS
 *               account_deactivated:
 *                 summary: Account is deactivated
 *                 value:
 *                   success: false
 *                   error: Account is deactivated
 *                   code: ACCOUNT_DEACTIVATED
 *       429:
 *         $ref: '#/components/responses/RateLimitError'
 */
router.post('/login',
  authRateLimit,
  enhancedValidation([
    body('email')
      .isEmail()
      .normalizeEmail()
      .withMessage('Valid email is required'),
    body('password')
      .notEmpty()
      .withMessage('Password is required'),
    body('remember_me')
      .optional()
      .isBoolean()
      .withMessage('Remember me must be boolean')
  ]),
  EnhancedAuthController.login
);

/**
 * @swagger
 * /api/v1/auth/profile:
 *   get:
 *     summary: Get current user profile
 *     description: |
 *       Retrieves the authenticated user's profile information including roles and permissions.
 *       
 *       **Caching:** Response is cached for 5 minutes to improve performance
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User profile retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       allOf:
 *                         - $ref: '#/components/schemas/User'
 *                         - type: object
 *                           properties:
 *                             lastLoginAt:
 *                               type: string
 *                               format: date-time
 *                             recentActivity:
 *                               type: array
 *                               items:
 *                                 type: object
 *                                 properties:
 *                                   action:
 *                                     type: string
 *                                   timestamp:
 *                                     type: string
 *                                     format: date-time
 *                                   metadata:
 *                                     type: object
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       404:
 *         description: User not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get('/profile',
  enhancedAuth,
  EnhancedAuthController.getProfile
);

/**
 * @swagger
 * /api/v1/auth/refresh:
 *   post:
 *     summary: Refresh authentication token
 *     description: |
 *       Generates a new JWT token using the current valid token.
 *       Useful for extending session without re-authentication.
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Token refreshed successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: object
 *                       properties:
 *                         token:
 *                           type: string
 *                           description: New JWT token
 *                         expiresAt:
 *                           type: string
 *                           format: date-time
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.post('/refresh',
  enhancedAuth,
  EnhancedAuthController.refreshToken
);

/**
 * @swagger
 * /api/v1/auth/logout:
 *   post:
 *     summary: Logout user
 *     description: |
 *       Invalidates the current JWT token and clears user session.
 *       Token will be added to blacklist to prevent reuse.
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Logout successful
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse'
 *             example:
 *               success: true
 *               message: Logout successful
 *               data: {}
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.post('/logout',
  enhancedAuth,
  EnhancedAuthController.logout
);

module.exports = router;