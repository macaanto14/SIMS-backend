/**
 * Email Notification Service
 * 
 * Provides comprehensive email notification functionality with customizable templates
 * for system notifications, user confirmations, and administrative alerts.
 * 
 * @author SIMS Development Team
 * @version 1.0.0
 */

const nodemailer = require('nodemailer');
const handlebars = require('handlebars');
const fs = require('fs').promises;
const path = require('path');
const logger = require('../utils/logger');
const pool = require('../../config/database');

class EmailService {
  constructor() {
    this.transporter = null;
    this.templates = new Map();
    this.defaultConfig = {
      from: process.env.SMTP_FROM || 'noreply@sims.com',
      replyTo: process.env.SMTP_REPLY_TO || 'support@sims.com'
    };
    this.initialize();
  }

  /**
   * Initialize email service with SMTP configuration
   */
  async initialize() {
    try {
      // Create SMTP transporter
      this.transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST || 'smtp.gmail.com',
        port: parseInt(process.env.SMTP_PORT) || 587,
        secure: process.env.SMTP_SECURE === 'true', // true for 465, false for other ports
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASSWORD
        },
        tls: {
          rejectUnauthorized: process.env.NODE_ENV === 'production'
        }
      });

      // Verify SMTP connection
      if (process.env.SMTP_USER && process.env.SMTP_PASSWORD) {
        await this.transporter.verify();
        logger.info('Email service initialized successfully');
      } else {
        logger.warn('Email service initialized without SMTP credentials');
      }

      // Load email templates
      await this.loadTemplates();
    } catch (error) {
      logger.error('Failed to initialize email service', { error: error.message });
      throw error;
    }
  }

  /**
   * Load and compile email templates
   */
  async loadTemplates() {
    try {
      const templatesDir = path.join(__dirname, '../templates/email');
      const templateFiles = await fs.readdir(templatesDir);

      for (const file of templateFiles) {
        if (file.endsWith('.hbs')) {
          const templateName = path.basename(file, '.hbs');
          const templatePath = path.join(templatesDir, file);
          const templateContent = await fs.readFile(templatePath, 'utf8');
          const compiledTemplate = handlebars.compile(templateContent);
          this.templates.set(templateName, compiledTemplate);
        }
      }

      logger.info(`Loaded ${this.templates.size} email templates`);
    } catch (error) {
      logger.error('Failed to load email templates', { error: error.message });
    }
  }

  /**
   * Send email with template
   */
  async sendEmail(options) {
    try {
      const {
        to,
        cc,
        bcc,
        subject,
        template,
        data = {},
        attachments = [],
        priority = 'normal',
        trackingId = null
      } = options;

      // Validate required fields
      if (!to || !subject) {
        throw new Error('Email recipient and subject are required');
      }

      // Get compiled template
      let htmlContent = '';
      let textContent = '';

      if (template && this.templates.has(template)) {
        const compiledTemplate = this.templates.get(template);
        htmlContent = compiledTemplate(data);
        textContent = this.extractTextFromHtml(htmlContent);
      } else if (options.html) {
        htmlContent = options.html;
        textContent = options.text || this.extractTextFromHtml(htmlContent);
      } else {
        textContent = options.text || subject;
      }

      // Prepare email options
      const mailOptions = {
        from: this.defaultConfig.from,
        replyTo: this.defaultConfig.replyTo,
        to: Array.isArray(to) ? to.join(', ') : to,
        cc: cc ? (Array.isArray(cc) ? cc.join(', ') : cc) : undefined,
        bcc: bcc ? (Array.isArray(bcc) ? bcc.join(', ') : bcc) : undefined,
        subject,
        text: textContent,
        html: htmlContent,
        attachments,
        priority,
        headers: trackingId ? { 'X-Tracking-ID': trackingId } : {}
      };

      // Send email
      const result = await this.transporter.sendMail(mailOptions);

      // Log email sent
      await this.logEmailSent({
        to: mailOptions.to,
        cc: mailOptions.cc,
        bcc: mailOptions.bcc,
        subject,
        template,
        messageId: result.messageId,
        trackingId,
        status: 'sent',
        data
      });

      logger.info('Email sent successfully', {
        to: mailOptions.to,
        subject,
        messageId: result.messageId,
        trackingId
      });

      return {
        success: true,
        messageId: result.messageId,
        trackingId
      };

    } catch (error) {
      logger.error('Failed to send email', {
        error: error.message,
        to: options.to,
        subject: options.subject,
        template: options.template
      });

      // Log email failure
      await this.logEmailSent({
        to: options.to,
        subject: options.subject,
        template: options.template,
        trackingId: options.trackingId,
        status: 'failed',
        errorMessage: error.message
      });

      throw error;
    }
  }

  /**
   * Send system notification email
   */
  async sendSystemNotification(options) {
    const {
      userId,
      userEmail,
      userName,
      action,
      details,
      timestamp = new Date(),
      metadata = {}
    } = options;

    return await this.sendEmail({
      to: userEmail,
      subject: `SIMS System Notification - ${action}`,
      template: 'system-notification',
      data: {
        userName,
        action,
        details,
        timestamp: timestamp.toLocaleString(),
        metadata,
        systemName: 'SIMS',
        supportEmail: this.defaultConfig.replyTo
      },
      trackingId: `sys-${userId}-${Date.now()}`
    });
  }

  /**
   * Send school creation confirmation email
   */
  async sendSchoolCreationConfirmation(options) {
    const {
      adminEmail,
      adminName,
      schoolName,
      schoolCode,
      schoolId,
      loginUrl,
      temporaryPassword
    } = options;

    return await this.sendEmail({
      to: adminEmail,
      subject: `Welcome to SIMS - School Registration Confirmed: ${schoolName}`,
      template: 'school-creation-confirmation',
      data: {
        adminName,
        schoolName,
        schoolCode,
        schoolId,
        loginUrl: loginUrl || `${process.env.FRONTEND_URL}/login`,
        temporaryPassword,
        supportEmail: this.defaultConfig.replyTo,
        systemName: 'SIMS'
      },
      trackingId: `school-${schoolId}-${Date.now()}`
    });
  }

  /**
   * Send user registration confirmation email
   */
  async sendUserRegistrationConfirmation(options) {
    const {
      userEmail,
      userName,
      userId,
      role,
      schoolName,
      loginUrl,
      temporaryPassword,
      activationToken
    } = options;

    return await this.sendEmail({
      to: userEmail,
      subject: `Welcome to SIMS - Account Created`,
      template: 'user-registration-confirmation',
      data: {
        userName,
        userId,
        role,
        schoolName,
        loginUrl: loginUrl || `${process.env.FRONTEND_URL}/login`,
        temporaryPassword,
        activationToken,
        activationUrl: `${process.env.FRONTEND_URL}/activate?token=${activationToken}`,
        supportEmail: this.defaultConfig.replyTo,
        systemName: 'SIMS'
      },
      trackingId: `user-${userId}-${Date.now()}`
    });
  }

  /**
   * Send password reset email
   */
  async sendPasswordResetEmail(options) {
    const {
      userEmail,
      userName,
      resetToken,
      expiresIn = '1 hour'
    } = options;

    return await this.sendEmail({
      to: userEmail,
      subject: 'SIMS - Password Reset Request',
      template: 'password-reset',
      data: {
        userName,
        resetUrl: `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`,
        expiresIn,
        supportEmail: this.defaultConfig.replyTo,
        systemName: 'SIMS'
      },
      trackingId: `reset-${Date.now()}`
    });
  }

  /**
   * Send audit alert email
   */
  async sendAuditAlert(options) {
    const {
      adminEmails,
      alertType,
      severity,
      description,
      details,
      timestamp = new Date()
    } = options;

    return await this.sendEmail({
      to: adminEmails,
      subject: `SIMS Security Alert - ${alertType} (${severity})`,
      template: 'audit-alert',
      data: {
        alertType,
        severity,
        description,
        details,
        timestamp: timestamp.toLocaleString(),
        systemName: 'SIMS',
        supportEmail: this.defaultConfig.replyTo
      },
      priority: severity === 'HIGH' ? 'high' : 'normal',
      trackingId: `alert-${Date.now()}`
    });
  }

  /**
   * Send bulk notification
   */
  async sendBulkNotification(options) {
    const {
      recipients,
      subject,
      template,
      data,
      batchSize = 50
    } = options;

    const results = [];
    const batches = this.chunkArray(recipients, batchSize);

    for (let i = 0; i < batches.length; i++) {
      const batch = batches[i];
      const batchPromises = batch.map(recipient => {
        return this.sendEmail({
          to: recipient.email,
          subject,
          template,
          data: { ...data, ...recipient.data },
          trackingId: `bulk-${i}-${recipient.id || Date.now()}`
        }).catch(error => ({
          success: false,
          email: recipient.email,
          error: error.message
        }));
      });

      const batchResults = await Promise.allSettled(batchPromises);
      results.push(...batchResults.map(result => result.value || result.reason));

      // Add delay between batches to avoid rate limiting
      if (i < batches.length - 1) {
        await this.delay(1000);
      }
    }

    return results;
  }

  /**
   * Log email activity
   */
  async logEmailSent(params) {
    try {
      const {
        to,
        cc,
        bcc,
        subject,
        template,
        messageId,
        trackingId,
        status,
        errorMessage = null,
        data = {}
      } = params;

      const query = `
        INSERT INTO email_logs (
          recipient_email, cc_emails, bcc_emails, subject, template_name,
          message_id, tracking_id, status, error_message, template_data,
          sent_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW())
        RETURNING id
      `;

      const values = [
        to,
        cc || null,
        bcc || null,
        subject,
        template || null,
        messageId || null,
        trackingId || null,
        status,
        errorMessage,
        JSON.stringify(data)
      ];

      await pool.query(query, values);
    } catch (error) {
      logger.error('Failed to log email activity', { error: error.message });
    }
  }

  /**
   * Get email statistics
   */
  async getEmailStats(options = {}) {
    try {
      const {
        startDate,
        endDate,
        template,
        status
      } = options;

      let query = `
        SELECT 
          template_name,
          status,
          COUNT(*) as count,
          DATE(sent_at) as date
        FROM email_logs
        WHERE 1=1
      `;

      const values = [];
      let paramCount = 0;

      if (startDate) {
        paramCount++;
        query += ` AND sent_at >= $${paramCount}`;
        values.push(startDate);
      }

      if (endDate) {
        paramCount++;
        query += ` AND sent_at <= $${paramCount}`;
        values.push(endDate);
      }

      if (template) {
        paramCount++;
        query += ` AND template_name = $${paramCount}`;
        values.push(template);
      }

      if (status) {
        paramCount++;
        query += ` AND status = $${paramCount}`;
        values.push(status);
      }

      query += ` GROUP BY template_name, status, DATE(sent_at) ORDER BY date DESC`;

      const result = await pool.query(query, values);
      return result.rows;
    } catch (error) {
      logger.error('Failed to get email statistics', { error: error.message });
      throw error;
    }
  }

  /**
   * Utility methods
   */
  extractTextFromHtml(html) {
    return html.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
  }

  chunkArray(array, size) {
    const chunks = [];
    for (let i = 0; i < array.length; i += size) {
      chunks.push(array.slice(i, i + size));
    }
    return chunks;
  }

  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Create singleton instance
const emailService = new EmailService();

module.exports = emailService;