/**
 * Audit Service
 * 
 * Provides comprehensive audit trail functionality for database operations,
 * user activities, and system events across the SIMS application.
 * 
 * @author Assistant
 * @version 1.0.0
 */

const pool = require('../../config/database');
const logger = require('../utils/logger');

class AuditService {
  /**
   * Enhanced database operation wrapper with automatic audit logging
   */
  static async executeWithAudit(operation, context = {}) {
    const {
      userId,
      userEmail,
      userRole,
      schoolId,
      tableName,
      operationType,
      recordId,
      module,
      action,
      description,
      ipAddress,
      userAgent,
      requestId
    } = context;

    const startTime = Date.now();
    let success = false;
    let error = null;
    let result = null;

    try {
      // Execute the operation
      result = await operation();
      success = true;
      return result;
    } catch (err) {
      error = err;
      success = false;
      throw err;
    } finally {
      const duration = Date.now() - startTime;

      // Log the operation
      try {
        await this.logDatabaseOperation({
          userId,
          userEmail,
          userRole,
          schoolId,
          tableName,
          recordId,
          operationType,
          module,
          action,
          description,
          success,
          errorMessage: error?.message,
          duration,
          ipAddress,
          userAgent,
          requestId,
          metadata: {
            timestamp: new Date(),
            affectedRows: result?.rowCount || 0
          }
        });
      } catch (auditError) {
        logger.error('Failed to log audit trail', {
          error: auditError.message,
          originalOperation: { tableName, operationType, recordId }
        });
      }
    }
  }

  /**
   * Log database operations with change tracking
   */
  static async logDatabaseOperation(params) {
    const {
      userId,
      userEmail,
      userRole,
      schoolId,
      tableName,
      recordId,
      operationType,
      module,
      action,
      description,
      success = true,
      errorMessage = null,
      duration = 0,
      ipAddress,
      userAgent,
      requestId,
      oldValues = null,
      newValues = null,
      changedFields = null,
      metadata = {}
    } = params;

    try {
      const query = `
        INSERT INTO audit_logs (
          user_id, user_email, user_role, school_id, table_name, record_id,
          operation_type, module, action, description, success, error_message,
          duration_ms, ip_address, user_agent, request_id, old_values,
          new_values, changed_fields, metadata
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20
        ) RETURNING id
      `;

      const values = [
        userId, userEmail, userRole, schoolId, tableName, recordId,
        operationType?.toUpperCase(), module, action, description, success,
        errorMessage, duration, ipAddress, userAgent, requestId,
        oldValues ? JSON.stringify(oldValues) : null,
        newValues ? JSON.stringify(newValues) : null,
        changedFields, JSON.stringify(metadata)
      ];

      const result = await pool.query(query, values);
      return result.rows[0].id;
    } catch (error) {
      logger.error('Failed to insert audit log', {
        error: error.message,
        params
      });
      throw error;
    }
  }

  /**
   * Track data access for sensitive operations
   */
  static async logDataAccess(userId, tableName, recordId, accessType, metadata = {}) {
    try {
      const query = `
        INSERT INTO data_access_logs (
          user_id, table_name, record_id, access_type, metadata
        ) VALUES ($1, $2, $3, $4, $5)
        RETURNING id
      `;

      const values = [
        userId,
        tableName,
        recordId,
        accessType?.toUpperCase(),
        JSON.stringify(metadata)
      ];

      const result = await pool.query(query, values);
      return result.rows[0].id;
    } catch (error) {
      logger.error('Failed to log data access', {
        error: error.message,
        userId,
        tableName,
        recordId,
        accessType
      });
      throw error;
    }
  }

  /**
   * Log system events and administrative actions
   */
  static async logSystemEvent(eventType, category, severity, title, description, metadata = {}) {
    try {
      const query = `
        INSERT INTO system_events (
          event_type, category, severity, title, description, metadata
        ) VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING id
      `;

      const values = [
        eventType?.toUpperCase(),
        category?.toUpperCase(),
        severity?.toUpperCase(),
        title,
        description,
        JSON.stringify(metadata)
      ];

      const result = await pool.query(query, values);
      return result.rows[0].id;
    } catch (error) {
      logger.error('Failed to log system event', {
        error: error.message,
        eventType,
        category,
        severity,
        title
      });
      throw error;
    }
  }

  /**
   * Create or update user session tracking
   */
  static async trackUserSession(userId, action, metadata = {}) {
    try {
      if (action === 'LOGIN') {
        const query = `
          INSERT INTO user_sessions (user_id, login_time, ip_address, user_agent, metadata)
          VALUES ($1, NOW(), $2, $3, $4)
          RETURNING id
        `;

        const values = [
          userId,
          metadata.ipAddress,
          metadata.userAgent,
          JSON.stringify(metadata)
        ];

        const result = await pool.query(query, values);
        return result.rows[0].id;
      } else if (action === 'LOGOUT') {
        const query = `
          UPDATE user_sessions 
          SET logout_time = NOW(), session_duration = EXTRACT(EPOCH FROM (NOW() - login_time))
          WHERE user_id = $1 AND logout_time IS NULL
          RETURNING id
        `;

        const result = await pool.query(query, [userId]);
        return result.rows[0]?.id;
      }
    } catch (error) {
      logger.error('Failed to track user session', {
        error: error.message,
        userId,
        action
      });
      throw error;
    }
  }

  /**
   * Get audit configuration settings
   */
  static async getAuditConfig() {
    try {
      const query = `
        SELECT setting_key, setting_value, description
        FROM audit_configuration
        WHERE is_active = true
      `;

      const result = await pool.query(query);
      
      const config = {};
      result.rows.forEach(row => {
        config[row.setting_key] = row.setting_value;
      });

      return config;
    } catch (error) {
      logger.error('Failed to get audit configuration', {
        error: error.message
      });
      return {};
    }
  }

  /**
   * Update audit configuration
   */
  static async updateAuditConfig(settingKey, settingValue, updatedBy) {
    try {
      const query = `
        UPDATE audit_configuration 
        SET setting_value = $1, updated_by = $2, updated_at = NOW()
        WHERE setting_key = $3
        RETURNING *
      `;

      const result = await pool.query(query, [settingValue, updatedBy, settingKey]);
      
      if (result.rows.length === 0) {
        // Insert new setting if it doesn't exist
        const insertQuery = `
          INSERT INTO audit_configuration (setting_key, setting_value, updated_by)
          VALUES ($1, $2, $3)
          RETURNING *
        `;
        
        const insertResult = await pool.query(insertQuery, [settingKey, settingValue, updatedBy]);
        return insertResult.rows[0];
      }

      return result.rows[0];
    } catch (error) {
      logger.error('Failed to update audit configuration', {
        error: error.message,
        settingKey,
        settingValue,
        updatedBy
      });
      throw error;
    }
  }

  /**
   * Generate audit report
   */
  static async generateAuditReport(filters = {}) {
    const {
      startDate,
      endDate,
      userId,
      schoolId,
      operationType,
      tableName,
      module,
      limit = 1000
    } = filters;

    try {
      let whereConditions = [];
      let queryParams = [];
      let paramIndex = 1;

      if (startDate) {
        whereConditions.push(`al.created_at >= $${paramIndex++}`);
        queryParams.push(startDate);
      }

      if (endDate) {
        whereConditions.push(`al.created_at <= $${paramIndex++}`);
        queryParams.push(endDate);
      }

      if (userId) {
        whereConditions.push(`al.user_id = $${paramIndex++}`);
        queryParams.push(userId);
      }

      if (schoolId) {
        whereConditions.push(`al.school_id = $${paramIndex++}`);
        queryParams.push(schoolId);
      }

      if (operationType) {
        whereConditions.push(`al.operation_type = $${paramIndex++}`);
        queryParams.push(operationType.toUpperCase());
      }

      if (tableName) {
        whereConditions.push(`al.table_name = $${paramIndex++}`);
        queryParams.push(tableName);
      }

      if (module) {
        whereConditions.push(`al.module = $${paramIndex++}`);
        queryParams.push(module);
      }

      const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

      const query = `
        SELECT 
          al.*,
          s.name as school_name,
          u.first_name || ' ' || u.last_name as user_full_name
        FROM audit_logs al
        LEFT JOIN schools s ON al.school_id = s.id
        LEFT JOIN users u ON al.user_id = u.id
        ${whereClause}
        ORDER BY al.created_at DESC
        LIMIT $${paramIndex}
      `;

      queryParams.push(limit);

      const result = await pool.query(query, queryParams);
      return result.rows;
    } catch (error) {
      logger.error('Failed to generate audit report', {
        error: error.message,
        filters
      });
      throw error;
    }
  }

  /**
   * Clean up old audit logs based on retention policy
   */
  static async cleanupAuditLogs() {
    try {
      const config = await this.getAuditConfig();
      const retentionDays = parseInt(config.retention_days) || 365;

      const query = `
        DELETE FROM audit_logs 
        WHERE created_at < (NOW() - INTERVAL '${retentionDays} days')
        AND operation_type NOT IN ('DELETE', 'LOGIN', 'LOGOUT')
      `;

      const result = await pool.query(query);
      
      await this.logSystemEvent(
        'CLEANUP',
        'MAINTENANCE',
        'INFO',
        'Audit logs cleanup completed',
        `Removed ${result.rowCount} old audit log records`,
        {
          retentionDays,
          recordsRemoved: result.rowCount,
          cleanupDate: new Date()
        }
      );

      return result.rowCount;
    } catch (error) {
      logger.error('Failed to cleanup audit logs', {
        error: error.message
      });
      throw error;
    }
  }
}

module.exports = AuditService;