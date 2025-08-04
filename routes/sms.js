const express = require('express');
const router = express.Router();
const { sendVerification, verifyCode, getVerificationStatus } = require('../controllers/smsController');
const { authenticateToken } = require('../middleware/auth');
const { smsRateLimit, smsSecurityMiddleware } = require('../middleware/smsMiddleware');
const { validateSMSRequest, validateSMSVerification, handleValidationErrors } = require('../middleware/validation');

/**
 * @swagger
 * components:
 *   schemas:
 *     SMSVerificationRequest:
 *       type: object
 *       required:
 *         - phoneNumber
 *         - purpose
 *       properties:
 *         phoneNumber:
 *           type: string
 *           description: Ethiopian phone number (supports 927802065, 0927802065, or 251927802065 formats)
 *           example: "927802065"
 *         purpose:
 *           type: string
 *           enum: [registration, login, password_reset, two_factor, verification]
 *           description: Purpose of SMS verification
 *         twilioConfig:
 *           type: object
 *           properties:
 *             accountSid:
 *               type: string
 *               description: Twilio Account SID (optional, uses default if not provided)
 *             authToken:
 *               type: string
 *               description: Twilio Auth Token (optional, uses default if not provided)
 *             serviceSid:
 *               type: string
 *               description: Twilio Verify Service SID (optional, uses default if not provided)
 *     
 *     SMSVerificationResponse:
 *       type: object
 *       properties:
 *         account_sid:
 *           type: string
 *           example: "AC131789d6616539423cfee4038cc9d8dc"
 *         sid:
 *           type: string
 *           example: "VE..."
 *         service_sid:
 *           type: string
 *           example: "VA4bc275d07c23341a7850b9c33851d28a"
 *         to:
 *           type: string
 *           example: "+251927802065"
 *         channel:
 *           type: string
 *           example: "sms"
 *         status:
 *           type: string
 *           example: "pending"
 *         valid:
 *           type: boolean
 *           example: false
 *         date_created:
 *           type: string
 *           format: date-time
 *         date_updated:
 *           type: string
 *           format: date-time
 *     
 *     SMSCodeVerificationRequest:
 *       type: object
 *       required:
 *         - phoneNumber
 *         - code
 *         - purpose
 *       properties:
 *         phoneNumber:
 *           type: string
 *           description: Ethiopian phone number (supports 927802065, 0927802065, or 251927802065 formats)
 *           example: "927802065"
 *         code:
 *           type: string
 *           description: 4-8 digit verification code
 *           example: "123456"
 *         purpose:
 *           type: string
 *           enum: [registration, login, password_reset, two_factor, verification]
 *           description: Purpose of SMS verification
 *         twilioConfig:
 *           type: object
 *           properties:
 *             accountSid:
 *               type: string
 *             authToken:
 *               type: string
 *             serviceSid:
 *               type: string
 */

/**
 * @swagger
 * /sms/send-verification:
 *   post:
 *     summary: Send SMS verification code
 *     description: |
 *       Send a verification code via SMS to the specified Ethiopian phone number.
 *       
 *       **Supported phone number formats:**
 *       - 9 digits starting with 9: `927802065`
 *       - 10 digits starting with 09: `0927802065`
 *       - 12 digits starting with 251: `251927802065`
 *       
 *       All formats will be normalized to the backend format: `251927802065`
 *     tags: [SMS]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/SMSVerificationRequest'
 *           examples:
 *             format_9_digit:
 *               summary: 9-digit format
 *               value:
 *                 phoneNumber: "927802065"
 *                 purpose: "verification"
 *             format_10_digit:
 *               summary: 10-digit format
 *               value:
 *                 phoneNumber: "0927802065"
 *                 purpose: "verification"
 *             format_12_digit:
 *               summary: 12-digit format
 *               value:
 *                 phoneNumber: "251927802065"
 *                 purpose: "verification"
 *     responses:
 *       200:
 *         description: SMS verification code sent successfully
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
 *                   example: "SMS verification code sent successfully"
 *                 data:
 *                   $ref: '#/components/schemas/SMSVerificationResponse'
 *       400:
 *         description: Invalid request data or phone number format
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Validation failed"
 *                 details:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       msg:
 *                         type: string
 *                         example: "Ethiopian mobile numbers must start with 9 and be 9 digits long"
 *       429:
 *         description: Rate limit exceeded
 *       500:
 *         description: Internal server error
 */
router.post('/send-verification', 
  validateSMSRequest(),
  handleValidationErrors,
  smsSecurityMiddleware.sanitizePhoneNumber,
  smsRateLimit,
  sendVerification
);

/**
 * @swagger
 * /sms/verify-code:
 *   post:
 *     summary: Verify SMS code
 *     description: |
 *       Verify the SMS verification code sent to the Ethiopian phone number.
 *       
 *       **Supported phone number formats:**
 *       - 9 digits starting with 9: `927802065`
 *       - 10 digits starting with 09: `0927802065`
 *       - 12 digits starting with 251: `251927802065`
 *     tags: [SMS]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/SMSCodeVerificationRequest'
 *           examples:
 *             verify_code:
 *               summary: Verify code example
 *               value:
 *                 phoneNumber: "927802065"
 *                 code: "123456"
 *                 purpose: "verification"
 *     responses:
 *       200:
 *         description: SMS code verified successfully
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
 *                   example: "SMS code verified successfully"
 *                 data:
 *                   $ref: '#/components/schemas/SMSVerificationResponse'
 *       400:
 *         description: Invalid verification code or request data
 *       500:
 *         description: Internal server error
 */
router.post('/verify-code',
  validateSMSVerification(),
  handleValidationErrors,
  smsSecurityMiddleware.sanitizePhoneNumber,
  verifyCode
);

/**
 * @swagger
 * /sms/status/{phoneNumber}/{purpose}:
 *   get:
 *     summary: Get SMS verification status
 *     description: Get the current status of SMS verification for a phone number and purpose
 *     tags: [SMS]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: phoneNumber
 *         required: true
 *         schema:
 *           type: string
 *         description: Ethiopian phone number (backend format - 251927802065)
 *         example: "251927802065"
 *       - in: path
 *         name: purpose
 *         required: true
 *         schema:
 *           type: string
 *           enum: [registration, login, password_reset, two_factor, verification]
 *         description: Purpose of SMS verification
 *         example: "verification"
 *     responses:
 *       200:
 *         description: Verification status retrieved successfully
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
 *                   example: "Verification status retrieved successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     status:
 *                       type: string
 *                       enum: [pending, verified, failed, expired]
 *                       example: "pending"
 *                     attempts:
 *                       type: integer
 *                       example: 1
 *                     maxAttempts:
 *                       type: integer
 *                       example: 3
 *                     expiresAt:
 *                       type: string
 *                       format: date-time
 *                     verifiedAt:
 *                       type: string
 *                       format: date-time
 *                       nullable: true
 *                     createdAt:
 *                       type: string
 *                       format: date-time
 *       401:
 *         description: Authentication required
 *       404:
 *         description: No verification found
 *       500:
 *         description: Internal server error
 */
router.get('/status/:phoneNumber/:purpose',
  authenticateToken,
  smsSecurityMiddleware.sanitizePhoneNumber,
  getVerificationStatus
);

module.exports = router;