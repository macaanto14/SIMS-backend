/**
 * Email Controller
 * 
 * Handles email notification endpoints and template management
 * 
 * @author SIMS Development Team
 * @version 1.0.0
 */

const emailService = require('../src/services/emailService');
const logger = require('../src/utils/logger');

class EmailController {
  /**
   * Send system notification email
   */
  static async sendSystemNotification(req, res) {
    try {
      const {
        userId,
        userEmail,
        userName,
        action,
        details,
        metadata = {}
      } = req.body;

      // Validate required fields
      if (!userEmail || !userName || !action) {
        return res.status(400).json({
          success: false,
          message: 'Missing required fields: userEmail, userName, action'
        });
      }

      const result = await emailService.sendSystemNotification({
        userId,
        userEmail,
        userName,
        action,
        details,
        metadata
      });

      res.json({
        success: true,
        message: 'System notification sent successfully',
        data: result
      });

    } catch (error) {
      logger.error('Failed to send system notification', { error: error.message });
      res.status(500).json({
        success: false,
        message: 'Failed to send system notification',
        error: error.message
      });
    }
  }

  /**
   * Send school creation confirmation email
   */
  static async sendSchoolCreationConfirmation(req, res) {
    try {
      const {
        adminEmail,
        adminName,
        schoolName,
        schoolCode,
        schoolId,
        loginUrl,
        temporaryPassword
      } = req.body;

      // Validate required fields
      if (!adminEmail || !adminName || !schoolName || !schoolCode) {
        return res.status(400).json({
          success: false,
          message: 'Missing required fields: adminEmail, adminName, schoolName, schoolCode'
        });
      }

      const result = await emailService.sendSchoolCreationConfirmation({
        adminEmail,
        adminName,
        schoolName,
        schoolCode,
        schoolId,
        loginUrl,
        temporaryPassword
      });

      res.json({
        success: true,
        message: 'School creation confirmation sent successfully',
        data: result
      });

    } catch (error) {
      logger.error('Failed to send school creation confirmation', { error: error.message });
      res.status(500).json({
        success: false,
        message: 'Failed to send school creation confirmation',
        error: error.message
      });
    }
  }

  /**
   * Send user registration confirmation email
   */
  static async sendUserRegistrationConfirmation(req, res) {
    try {
      const {
        userEmail,
        userName,
        userId,
        role,
        schoolName,
        loginUrl,
        temporaryPassword,
        activationToken
      } = req.body;

      // Validate required fields
      if (!userEmail || !userName || !role) {
        return res.status(400).json({
          success: false,
          message: 'Missing required fields: userEmail, userName, role'
        });
      }

      const result = await emailService.sendUserRegistrationConfirmation({
        userEmail,
        userName,
        userId,
        role,
        schoolName,
        loginUrl,
        temporaryPassword,
        activationToken
      });

      res.json({
        success: true,
        message: 'User registration confirmation sent successfully',
        data: result
      });

    } catch (error) {
      logger.error('Failed to send user registration confirmation', { error: error.message });
      res.status(500).json({
        success: false,
        message: 'Failed to send user registration confirmation',
        error: error.message
      });
    }
  }

  /**
   * Send password reset email
   */
  static async sendPasswordResetEmail(req, res) {
    try {
      const {
        userEmail,
        userName,
        resetToken,
        expiresIn
      } = req.body;

      // Validate required fields
      if (!userEmail || !userName || !resetToken) {
        return res.status(400).json({
          success: false,
          message: 'Missing required fields: userEmail, userName, resetToken'
        });
      }

      const result = await emailService.sendPasswordResetEmail({
        userEmail,
        userName,
        resetToken,
        expiresIn
      });

      res.json({
        success: true,
        message: 'Password reset email sent successfully',
        data: result
      });

    } catch (error) {
      logger.error('Failed to send password reset email', { error: error.message });
      res.status(500).json({
        success: false,
        message: 'Failed to send password reset email',
        error: error.message
      });
    }
  }

  /**
   * Send audit alert email
   */
  static async sendAuditAlert(req, res) {
    try {
      const {
        adminEmails,
        alertType,
        severity,
        description,
        details
      } = req.body;

      // Validate required fields
      if (!adminEmails || !alertType || !severity || !description) {
        return res.status(400).json({
          success: false,
          message: 'Missing required fields: adminEmails, alertType, severity, description'
        });
      }

      const result = await emailService.sendAuditAlert({
        adminEmails,
        alertType,
        severity,
        description,
        details
      });

      res.json({
        success: true,
        message: 'Audit alert sent successfully',
        data: result
      });

    } catch (error) {
      logger.error('Failed to send audit alert', { error: error.message });
      res.status(500).json({
        success: false,
        message: 'Failed to send audit alert',
        error: error.message
      });
    }
  }

  /**
   * Send bulk notification
   */
  static async sendBulkNotification(req, res) {
    try {
      const {
        recipients,
        subject,
        template,
        data,
        batchSize
      } = req.body;

      // Validate required fields
      if (!recipients || !Array.isArray(recipients) || !subject) {
        return res.status(400).json({
          success: false,
          message: 'Missing required fields: recipients (array), subject'
        });
      }

      const result = await emailService.sendBulkNotification({
        recipients,
        subject,
        template,
        data,
        batchSize
      });

      res.json({
        success: true,
        message: 'Bulk notification sent successfully',
        data: {
          totalSent: result.filter(r => r.success).length,
          totalFailed: result.filter(r => !r.success).length,
          results: result
        }
      });

    } catch (error) {
      logger.error('Failed to send bulk notification', { error: error.message });
      res.status(500).json({
        success: false,
        message: 'Failed to send bulk notification',
        error: error.message
      });
    }
  }

  /**
   * Get email statistics
   */
  static async getEmailStats(req, res) {
    try {
      const {
        startDate,
        endDate,
        template,
        status
      } = req.query;

      const stats = await emailService.getEmailStats({
        startDate,
        endDate,
        template,
        status
      });

      res.json({
        success: true,
        message: 'Email statistics retrieved successfully',
        data: stats
      });

    } catch (error) {
      logger.error('Failed to get email statistics', { error: error.message });
      res.status(500).json({
        success: false,
        message: 'Failed to get email statistics',
        error: error.message
      });
    }
  }

  /**
   * Test email configuration
   */
  static async testEmailConfiguration(req, res) {
    try {
      const { testEmail } = req.body;

      if (!testEmail) {
        return res.status(400).json({
          success: false,
          message: 'Test email address is required'
        });
      }

      const result = await emailService.sendEmail({
        to: testEmail,
        subject: 'SIMS Email Configuration Test',
        template: 'system-notification',
        data: {
          userName: 'Test User',
          action: 'Email Configuration Test',
          details: 'This is a test email to verify your SIMS email configuration is working correctly.',
          timestamp: new Date().toLocaleString(),
          systemName: 'SIMS',
          supportEmail: process.env.SMTP_FROM
        },
        trackingId: `test-${Date.now()}`
      });

      res.json({
        success: true,
        message: 'Test email sent successfully',
        data: result
      });

    } catch (error) {
      logger.error('Failed to send test email', { error: error.message });
      res.status(500).json({
        success: false,
        message: 'Failed to send test email',
        error: error.message
      });
    }
  }
}

module.exports = EmailController;