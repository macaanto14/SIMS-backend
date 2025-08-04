const express = require('express');
const router = express.Router();
const EmailController = require('../controllers/emailController');
const auth = require('../middleware/auth');
const { body, query } = require('express-validator');
const { handleValidationErrors: validate } = require('../middleware/validation');

/**
 * @swagger
 * components:
 *   schemas:
 *     EmailResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *         message:
 *           type: string
 *         data:
 *           type: object
 *     
 *     SystemNotificationRequest:
 *       type: object
 *       required:
 *         - userEmail
 *         - userName
 *         - action
 *       properties:
 *         userId:
 *           type: string
 *         userEmail:
 *           type: string
 *           format: email
 *         userName:
 *           type: string
 *         action:
 *           type: string
 *         details:
 *           type: string
 *         metadata:
 *           type: object
 */

/**
 * @swagger
 * /api/email/system-notification:
 *   post:
 *     summary: Send system notification email
 *     tags: [Email]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/SystemNotificationRequest'
 *     responses:
 *       200:
 *         description: System notification sent successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/EmailResponse'
 */
router.post('/system-notification',
  auth,
  [
    body('userEmail').isEmail().withMessage('Valid email is required'),
    body('userName').notEmpty().withMessage('User name is required'),
    body('action').notEmpty().withMessage('Action is required'),
    body('details').optional().isString()
  ],
  validate,
  EmailController.sendSystemNotification
);

/**
 * @swagger
 * /api/email/school-creation-confirmation:
 *   post:
 *     summary: Send school creation confirmation email
 *     tags: [Email]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - adminEmail
 *               - adminName
 *               - schoolName
 *               - schoolCode
 *             properties:
 *               adminEmail:
 *                 type: string
 *                 format: email
 *               adminName:
 *                 type: string
 *               schoolName:
 *                 type: string
 *               schoolCode:
 *                 type: string
 *               schoolId:
 *                 type: string
 *               loginUrl:
 *                 type: string
 *               temporaryPassword:
 *                 type: string
 *     responses:
 *       200:
 *         description: School creation confirmation sent successfully
 */
router.post('/school-creation-confirmation',
  auth,
  [
    body('adminEmail').isEmail().withMessage('Valid admin email is required'),
    body('adminName').notEmpty().withMessage('Admin name is required'),
    body('schoolName').notEmpty().withMessage('School name is required'),
    body('schoolCode').notEmpty().withMessage('School code is required')
  ],
  validate,
  EmailController.sendSchoolCreationConfirmation
);

/**
 * @swagger
 * /api/email/user-registration-confirmation:
 *   post:
 *     summary: Send user registration confirmation email
 *     tags: [Email]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - userEmail
 *               - userName
 *               - role
 *             properties:
 *               userEmail:
 *                 type: string
 *                 format: email
 *               userName:
 *                 type: string
 *               userId:
 *                 type: string
 *               role:
 *                 type: string
 *               schoolName:
 *                 type: string
 *               loginUrl:
 *                 type: string
 *               temporaryPassword:
 *                 type: string
 *               activationToken:
 *                 type: string
 *     responses:
 *       200:
 *         description: User registration confirmation sent successfully
 */
router.post('/user-registration-confirmation',
  auth,
  [
    body('userEmail').isEmail().withMessage('Valid email is required'),
    body('userName').notEmpty().withMessage('User name is required'),
    body('role').notEmpty().withMessage('Role is required')
  ],
  validate,
  EmailController.sendUserRegistrationConfirmation
);

/**
 * @swagger
 * /api/email/password-reset:
 *   post:
 *     summary: Send password reset email
 *     tags: [Email]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - userEmail
 *               - userName
 *               - resetToken
 *             properties:
 *               userEmail:
 *                 type: string
 *                 format: email
 *               userName:
 *                 type: string
 *               resetToken:
 *                 type: string
 *               expiresIn:
 *                 type: string
 *     responses:
 *       200:
 *         description: Password reset email sent successfully
 */
router.post('/password-reset',
  [
    body('userEmail').isEmail().withMessage('Valid email is required'),
    body('userName').notEmpty().withMessage('User name is required'),
    body('resetToken').notEmpty().withMessage('Reset token is required')
  ],
  validate,
  EmailController.sendPasswordResetEmail
);

/**
 * @swagger
 * /api/email/audit-alert:
 *   post:
 *     summary: Send audit alert email
 *     tags: [Email]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - adminEmails
 *               - alertType
 *               - severity
 *               - description
 *             properties:
 *               adminEmails:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: email
 *               alertType:
 *                 type: string
 *               severity:
 *                 type: string
 *                 enum: [LOW, MEDIUM, HIGH]
 *               description:
 *                 type: string
 *               details:
 *                 type: string
 *     responses:
 *       200:
 *         description: Audit alert sent successfully
 */
router.post('/audit-alert',
  auth,
  [
    body('adminEmails').isArray().withMessage('Admin emails must be an array'),
    body('adminEmails.*').isEmail().withMessage('All admin emails must be valid'),
    body('alertType').notEmpty().withMessage('Alert type is required'),
    body('severity').isIn(['LOW', 'MEDIUM', 'HIGH']).withMessage('Severity must be LOW, MEDIUM, or HIGH'),
    body('description').notEmpty().withMessage('Description is required')
  ],
  validate,
  EmailController.sendAuditAlert
);

/**
 * @swagger
 * /api/email/bulk-notification:
 *   post:
 *     summary: Send bulk notification emails
 *     tags: [Email]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - recipients
 *               - subject
 *             properties:
 *               recipients:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     email:
 *                       type: string
 *                       format: email
 *                     data:
 *                       type: object
 *               subject:
 *                 type: string
 *               template:
 *                 type: string
 *               data:
 *                 type: object
 *               batchSize:
 *                 type: integer
 *                 default: 50
 *     responses:
 *       200:
 *         description: Bulk notification sent successfully
 */
router.post('/bulk-notification',
  auth,
  [
    body('recipients').isArray().withMessage('Recipients must be an array'),
    body('recipients.*.email').isEmail().withMessage('All recipient emails must be valid'),
    body('subject').notEmpty().withMessage('Subject is required'),
    body('batchSize').optional().isInt({ min: 1, max: 100 }).withMessage('Batch size must be between 1 and 100')
  ],
  validate,
  EmailController.sendBulkNotification
);

/**
 * @swagger
 * /api/email/stats:
 *   get:
 *     summary: Get email statistics
 *     tags: [Email]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: template
 *         schema:
 *           type: string
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [sent, failed, pending]
 *     responses:
 *       200:
 *         description: Email statistics retrieved successfully
 */
router.get('/stats',
  auth,
  [
    query('startDate').optional().isISO8601().withMessage('Start date must be valid ISO 8601 date'),
    query('endDate').optional().isISO8601().withMessage('End date must be valid ISO 8601 date'),
    query('template').optional().isString(),
    query('status').optional().isIn(['sent', 'failed', 'pending']).withMessage('Status must be sent, failed, or pending')
  ],
  validate,
  EmailController.getEmailStats
);

/**
 * @swagger
 * /api/email/test:
 *   post:
 *     summary: Test email configuration
 *     tags: [Email]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - testEmail
 *             properties:
 *               testEmail:
 *                 type: string
 *                 format: email
 *     responses:
 *       200:
 *         description: Test email sent successfully
 */
router.post('/test',
  auth,
  [
    body('testEmail').isEmail().withMessage('Valid test email is required')
  ],
  validate,
  EmailController.testEmailConfiguration
);

module.exports = router;