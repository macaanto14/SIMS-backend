const express = require('express');
const router = express.Router();
const { register, login, getProfile } = require('../controllers/authController');
const { authenticateToken } = require('../middleware/auth');
const { validateUserRegistration, validateUserLogin, handleValidationErrors } = require('../middleware/validation');

// Public routes
router.post('/register', validateUserRegistration(), handleValidationErrors, register);
router.post('/login', validateUserLogin(), handleValidationErrors, login);

// Protected routes
router.get('/profile', authenticateToken, getProfile);

// Add SMS authentication routes
const { loginSMS, resetPasswordSMS } = require('../controllers/authController');
const { validateSMSVerification } = require('../middleware/validation');

/**
 * @swagger
 * /auth/login-sms:
 *   post:
 *     summary: Login with SMS verification
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - phoneNumber
 *               - code
 *             properties:
 *               phoneNumber:
 *                 type: string
 *                 example: "+251927802065"
 *               code:
 *                 type: string
 *                 example: "123456"
 *               twilioConfig:
 *                 type: object
 *     responses:
 *       200:
 *         description: Login successful
 *       401:
 *         description: Invalid verification code
 */
router.post('/login-sms',
  validateSMSVerification(),
  handleValidationErrors,
  loginSMS
);

/**
 * @swagger
 * /auth/reset-password-sms:
 *   post:
 *     summary: Reset password with SMS verification
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - phoneNumber
 *               - code
 *               - newPassword
 *             properties:
 *               phoneNumber:
 *                 type: string
 *                 example: "+251927802065"
 *               code:
 *                 type: string
 *                 example: "123456"
 *               newPassword:
 *                 type: string
 *                 example: "newSecurePassword123"
 *               twilioConfig:
 *                 type: object
 *     responses:
 *       200:
 *         description: Password reset successful
 *       401:
 *         description: Invalid verification code
 */
router.post('/reset-password-sms',
  validateSMSVerification(),
  handleValidationErrors,
  resetPasswordSMS
);

module.exports = router;