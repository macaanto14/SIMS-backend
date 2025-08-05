/**
 * Enhanced Authentication Routes with Role-Based Access
 */

const express = require('express');
const router = express.Router();
const enhancedAuthController = require('../controllers/enhancedAuthController');
const { authenticateToken } = require('../middleware/auth');
const { body, validationResult } = require('express-validator');

// Validation middleware
const validateRequest = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      error: 'Validation failed',
      details: errors.array()
    });
  }
  next();
};

/**
 * @swagger
 * /api/auth/roles:
 *   get:
 *     summary: Get available roles for login
 *     description: Retrieves all available user roles for the login selection interface
 *     tags: [Authentication]
 *     responses:
 *       200:
 *         description: Available roles retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Available roles retrieved successfully
 *                 data:
 *                   type: object
 *                   properties:
 *                     roles:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: string
 *                             format: uuid
 *                           name:
 *                             type: string
 *                             enum: [Super Admin, Admin, Teacher, Student, Parent, Receptionist, Librarian, Accountant]
 *                           description:
 *                             type: string
 *                           isSystemRole:
 *                             type: boolean
 */
router.get('/roles', enhancedAuthController.getAvailableRoles);

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: Enhanced login with role selection
 *     description: |
 *       Authenticate user with email/password and optional role selection.
 *       If no role is selected, returns available roles for user to choose from.
 *     tags: [Authentication]
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
 *                 example: john.doe@school.com
 *               password:
 *                 type: string
 *                 example: SecurePass123!
 *               selectedRole:
 *                 type: string
 *                 enum: [Super Admin, Admin, Teacher, Student, Parent, Receptionist, Librarian, Accountant]
 *                 example: Teacher
 *               schoolId:
 *                 type: string
 *                 format: uuid
 *                 description: Required for school-specific roles
 *     responses:
 *       200:
 *         description: Login successful or role selection required
 *         content:
 *           application/json:
 *             schema:
 *               oneOf:
 *                 - type: object
 *                   properties:
 *                     success:
 *                       type: boolean
 *                       example: true
 *                     message:
 *                       type: string
 *                       example: Please select a role to continue
 *                     data:
 *                       type: object
 *                       properties:
 *                         requiresRoleSelection:
 *                           type: boolean
 *                           example: true
 *                         user:
 *                           type: object
 *                           properties:
 *                             id:
 *                               type: string
 *                               format: uuid
 *                             email:
 *                               type: string
 *                             firstName:
 *                               type: string
 *                             lastName:
 *                               type: string
 *                         availableRoles:
 *                           type: array
 *                           items:
 *                             type: object
 *                             properties:
 *                               roleId:
 *                                 type: string
 *                                 format: uuid
 *                               roleName:
 *                                 type: string
 *                               roleDescription:
 *                                 type: string
 *                               schoolId:
 *                                 type: string
 *                                 format: uuid
 *                               schoolName:
 *                                 type: string
 *                 - type: object
 *                   properties:
 *                     success:
 *                       type: boolean
 *                       example: true
 *                     message:
 *                       type: string
 *                       example: Login successful
 *                     data:
 *                       type: object
 *                       properties:
 *                         user:
 *                           type: object
 *                         token:
 *                           type: string
 *                         permissions:
 *                           type: object
 *       401:
 *         description: Invalid credentials
 *       403:
 *         description: Invalid role selection
 */
router.post('/login', [
  body('email').isEmail().normalizeEmail(),
  body('password').notEmpty(),
  body('selectedRole').optional().isIn(['Super Admin', 'Admin', 'Teacher', 'Student', 'Parent', 'Receptionist', 'Librarian', 'Accountant']),
  body('schoolId').optional().isUUID(),
  validateRequest
], enhancedAuthController.loginWithRole);

/**
 * @swagger
 * /api/auth/switch-role:
 *   post:
 *     summary: Switch user role during active session
 *     description: Allows authenticated users to switch between their assigned roles
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - selectedRole
 *             properties:
 *               selectedRole:
 *                 type: string
 *                 enum: [Super Admin, Admin, Teacher, Student, Parent, Receptionist, Librarian, Accountant]
 *               schoolId:
 *                 type: string
 *                 format: uuid
 *     responses:
 *       200:
 *         description: Role switched successfully
 *       403:
 *         description: Invalid role selection
 */
router.post('/switch-role', authenticateToken, [
  body('selectedRole').isIn(['Super Admin', 'Admin', 'Teacher', 'Student', 'Parent', 'Receptionist', 'Librarian', 'Accountant']),
  body('schoolId').optional().isUUID(),
  validateRequest
], enhancedAuthController.switchRole);

/**
 * @swagger
 * /api/auth/profile:
 *   get:
 *     summary: Get current user profile with role information
 *     description: Retrieves the authenticated user's profile including all roles and current permissions
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Profile retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                       format: uuid
 *                     email:
 *                       type: string
 *                     firstName:
 *                       type: string
 *                     lastName:
 *                       type: string
 *                     phone:
 *                       type: string
 *                     currentRole:
 *                       type: string
 *                     allRoles:
 *                       type: array
 *                     permissions:
 *                       type: object
 */
router.get('/profile', authenticateToken, enhancedAuthController.getProfile);

/**
 * @swagger
 * /api/auth/register:
 *   post:
 *     summary: Register new user with optional role assignment
 *     description: Creates a new user account with optional initial role and school assignment
 *     tags: [Authentication]
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
 *               password:
 *                 type: string
 *                 minLength: 8
 *               first_name:
 *                 type: string
 *               last_name:
 *                 type: string
 *               phone:
 *                 type: string
 *               school_id:
 *                 type: string
 *                 format: uuid
 *               initial_role:
 *                 type: string
 *                 enum: [Admin, Teacher, Student, Parent, Receptionist, Librarian, Accountant]
 *     responses:
 *       201:
 *         description: User registered successfully
 *       409:
 *         description: User already exists
 */
router.post('/register', [
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 8 }).matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])/),
  body('first_name').trim().isLength({ min: 2, max: 50 }),
  body('last_name').trim().isLength({ min: 2, max: 50 }),
  body('phone').optional().matches(/^[+]?[1-9]\d{1,14}$/),
  body('school_id').optional().isUUID(),
  body('initial_role').optional().isIn(['Admin', 'Teacher', 'Student', 'Parent', 'Receptionist', 'Librarian', 'Accountant']),
  validateRequest
], enhancedAuthController.register);

module.exports = router;