/**
 * Email Notification Middleware
 * 
 * Automatically sends email notifications for various system events
 * 
 * @author SIMS Development Team
 * @version 1.0.0
 */

const emailService = require('../services/emailService');
const logger = require('../utils/logger');

class EmailNotificationMiddleware {
  /**
   * Middleware to send email notifications after successful operations
   */
  static notifyAfterOperation(options = {}) {
    return async (req, res, next) => {
      // Store original res.json method
      const originalJson = res.json;

      // Override res.json to intercept successful responses
      res.json = function(data) {
        // Call original method first
        originalJson.call(this, data);

        // Send notification if operation was successful
        if (data.success && options.emailType) {
          setImmediate(async () => {
            try {
              await EmailNotificationMiddleware.sendNotification({
                emailType: options.emailType,
                data: data.data || {},
                req,
                res
              });
            } catch (error) {
              logger.error('Failed to send email notification', {
                error: error.message,
                emailType: options.emailType,
                route: req.route?.path
              });
            }
          });
        }
      };

      next();
    };
  }

  /**
   * Send notification based on type
   */
  static async sendNotification({ emailType, data, req }) {
    const user = req.user;
    const userAgent = req.get('User-Agent');
    const ipAddress = req.ip || req.connection.remoteAddress;

    switch (emailType) {
      case 'school_created':
        await EmailNotificationMiddleware.handleSchoolCreated(data, user);
        break;

      case 'user_registered':
        await EmailNotificationMiddleware.handleUserRegistered(data, user);
        break;

      case 'user_updated':
        await EmailNotificationMiddleware.handleUserUpdated(data, user);
        break;

      case 'password_changed':
        await EmailNotificationMiddleware.handlePasswordChanged(data, user);
        break;

      case 'security_alert':
        await EmailNotificationMiddleware.handleSecurityAlert(data, user, { userAgent, ipAddress });
        break;

      case 'system_notification':
        await EmailNotificationMiddleware.handleSystemNotification(data, user);
        break;

      default:
        logger.warn('Unknown email notification type', { emailType });
    }
  }

  /**
   * Handle school creation notification
   */
  static async handleSchoolCreated(data, user) {
    try {
      const { school, adminUser, temporaryPassword } = data;

      if (school && adminUser) {
        await emailService.sendSchoolCreationConfirmation({
          adminEmail: adminUser.email,
          adminName: `${adminUser.first_name} ${adminUser.last_name}`,
          schoolName: school.name,
          schoolCode: school.code,
          schoolId: school.id,
          temporaryPassword
        });

        // Also send system notification to the creator
        if (user && user.email !== adminUser.email) {
          await emailService.sendSystemNotification({
            userId: user.id,
            userEmail: user.email,
            userName: `${user.first_name} ${user.last_name}`,
            action: 'School Created',
            details: `You have successfully created school: ${school.name} (${school.code})`
          });
        }
      }
    } catch (error) {
      logger.error('Failed to send school creation notification', { error: error.message });
    }
  }

  /**
   * Handle user registration notification
   */
  static async handleUserRegistered(data, user) {
    try {
      const { newUser, role, school, temporaryPassword, activationToken } = data;

      if (newUser) {
        await emailService.sendUserRegistrationConfirmation({
          userEmail: newUser.email,
          userName: `${newUser.first_name} ${newUser.last_name}`,
          userId: newUser.id,
          role: role?.name || 'User',
          schoolName: school?.name,
          temporaryPassword,
          activationToken
        });

        // Send notification to the creator
        if (user && user.email !== newUser.email) {
          await emailService.sendSystemNotification({
            userId: user.id,
            userEmail: user.email,
            userName: `${user.first_name} ${user.last_name}`,
            action: 'User Account Created',
            details: `You have created a new user account for ${newUser.first_name} ${newUser.last_name} (${newUser.email})`
          });
        }
      }
    } catch (error) {
      logger.error('Failed to send user registration notification', { error: error.message });
    }
  }

  /**
   * Handle user update notification
   */
  static async handleUserUpdated(data, user) {
    try {
      const { updatedUser, changes } = data;

      if (updatedUser && changes && Object.keys(changes).length > 0) {
        const changesList = Object.entries(changes)
          .map(([field, { from, to }]) => `${field}: ${from} → ${to}`)
          .join(', ');

        await emailService.sendSystemNotification({
          userId: updatedUser.id,
          userEmail: updatedUser.email,
          userName: `${updatedUser.first_name} ${updatedUser.last_name}`,
          action: 'Account Updated',
          details: `Your account information has been updated. Changes: ${changesList}`
        });

        // Send notification to the updater if different
        if (user && user.id !== updatedUser.id) {
          await emailService.sendSystemNotification({
            userId: user.id,
            userEmail: user.email,
            userName: `${user.first_name} ${user.last_name}`,
            action: 'User Account Updated',
            details: `You have updated the account for ${updatedUser.first_name} ${updatedUser.last_name}. Changes: ${changesList}`
          });
        }
      }
    } catch (error) {
      logger.error('Failed to send user update notification', { error: error.message });
    }
  }

  /**
   * Handle password change notification
   */
  static async handlePasswordChanged(data, user) {
    try {
      const { targetUser } = data;
      const notifyUser = targetUser || user;

      if (notifyUser) {
        await emailService.sendSystemNotification({
          userId: notifyUser.id,
          userEmail: notifyUser.email,
          userName: `${notifyUser.first_name} ${notifyUser.last_name}`,
          action: 'Password Changed',
          details: 'Your password has been successfully changed. If you did not make this change, please contact support immediately.',
          metadata: {
            timestamp: new Date().toISOString(),
            securityAlert: true
          }
        });
      }
    } catch (error) {
      logger.error('Failed to send password change notification', { error: error.message });
    }
  }

  /**
   * Handle security alert notification
   */
  static async handleSecurityAlert(data, user, context = {}) {
    try {
      const { alertType, severity, description, details } = data;
      const { userAgent, ipAddress } = context;

      // Get admin emails for security alerts
      const adminEmails = await EmailNotificationMiddleware.getAdminEmails();

      if (adminEmails.length > 0) {
        await emailService.sendAuditAlert({
          adminEmails,
          alertType,
          severity: severity || 'MEDIUM',
          description,
          details: {
            ...details,
            user: user ? `${user.first_name} ${user.last_name} (${user.email})` : 'Unknown',
            userAgent,
            ipAddress,
            timestamp: new Date().toISOString()
          }
        });
      }
    } catch (error) {
      logger.error('Failed to send security alert notification', { error: error.message });
    }
  }

  /**
   * Handle system notification
   */
  static async handleSystemNotification(data, user) {
    try {
      const { action, details, metadata, targetUsers } = data;

      // Send to specific users or current user
      const recipients = targetUsers || (user ? [user] : []);

      for (const recipient of recipients) {
        await emailService.sendSystemNotification({
          userId: recipient.id,
          userEmail: recipient.email,
          userName: `${recipient.first_name} ${recipient.last_name}`,
          action,
          details,
          metadata
        });
      }
    } catch (error) {
      logger.error('Failed to send system notification', { error: error.message });
    }
  }

  /**
   * Get admin email addresses for alerts
   */
  static async getAdminEmails() {
    try {
      const pool = require('../../config/database');
      const query = `
        SELECT DISTINCT u.email
        FROM users u
        JOIN user_roles ur ON u.id = ur.user_id
        JOIN roles r ON ur.role_id = r.id
        WHERE r.name IN ('Admin', 'Super Admin', 'System Admin')
          AND u.is_active = true
          AND ur.is_active = true
      `;

      const result = await pool.query(query);
      return result.rows.map(row => row.email);
    } catch (error) {
      logger.error('Failed to get admin emails', { error: error.message });
      return [];
    }
  }
}

module.exports = EmailNotificationMiddleware;