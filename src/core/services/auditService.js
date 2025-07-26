/**
 * Audit Service
 * 
 * Centralized service for audit trail operations, providing easy-to-use
 * methods for logging various types of system activities.
 * 
 * @author Assistant
 * @version 1.0.0
 */

const pool = require('../../../config/database');
const logger = require('../../utils/logger');
const { logDatabaseOperation, logAuthEvent, logDataAccess, logSystemEvent } = require('../../middleware/audit');

class AuditService {
  /**
   * Log user operations (create, update, delete users)
   */
  async logUserOperation(operation, userId, oldData, newData, performedBy) {
    return await logDatabaseOperation(
      operation,
      'users',
      userId,
      oldData,
      newData,
      performedBy
    );
  }

  /**
   * Log student operations
   */
  async logStudentOperation(operation, studentId, oldData, newData, performedBy) {
    return await logDatabaseOperation(
      operation,
      'student_profiles',
      studentId,
      oldData,
      newData,
      performedBy
    );
  }

  /**
   * Log attendance operations
   */
  async logAttendanceOperation(operation, attendanceId, oldData, newData, performedBy) {
    return await logDatabaseOperation(
      operation,
      'attendance',
      attendanceId,
      oldData,
      newData,
      performedBy
    );
  }

  /**
   * Log grade operations
   */
  async logGradeOperation(operation, gradeId, oldData, newData, performedBy) {
    return await logDatabaseOperation(
      operation,
      'grades',
      gradeId,
      oldData,
      newData,
      performedBy
    );
  }

  /**
   * Log financial operations
   */
  async logFinancialOperation(operation, recordId, tableName, oldData, newData, performedBy) {
    return await logDatabaseOperation(
      operation,
      tableName, // 'fee_payments', 'expenses', etc.
      recordId,
      oldData,
      newData,
      performedBy
    );
  }

  /**
   * Log authentication events
   */
  async logLogin(userId, userEmail, success, details = {}) {
    return await logAuthEvent('LOGIN', userId, userEmail, success, details);
  }

  async logLogout(userId, userEmail, details = {}) {
    return await logAuthEvent('LOGOUT', userId, userEmail, true, details);
  }

  async logFailedLogin(userEmail, details = {}) {
    return await logAuthEvent('LOGIN', null, userEmail, false, details);
  }

  /**
   * Log data access for sensitive information
   */
  async logSensitiveDataAccess(userId, tableName, recordId, purpose, details = {}) {
    return await logDataAccess(
      userId,
      tableName,
      recordId,
      'READ',
      {
        ...details,
        purpose,
        feature: details.feature || 'data_access'
      }
    );
  }

  /**
   * Log bulk operations
   */
  async logBulkOperation(operation, tableName, recordIds, performedBy, details = {}) {
    return await logSystemEvent(
      'BULK_OPERATION',
      'ADMIN',
      'MEDIUM',
      `Bulk ${operation} on ${tableName}`,
      `Performed bulk ${operation} operation on ${recordIds.length} records in ${tableName}`,
      {
        triggeredBy: performedBy.userId,
        tableName,
        operation,
        recordIds,
        recordCount: recordIds.length,
        ...details
      }
    );
  }

  /**
   * Log export operations
   */
  async logDataExport(userId, tableName, filters, recordCount, format, details = {}) {
    await logDataAccess(
      userId,
      tableName,
      null,
      'EXPORT',
      {
        queryType: 'EXPORT',
        filters,
        recordsCount: recordCount,
        feature: 'data_export',
        purpose: details.purpose || 'report_generation',
        ...details
      }
    );

    return await logSystemEvent(
      'EXPORT',
      'ADMIN',
      'MEDIUM',
      `Data export from ${tableName}`,
      `User exported ${recordCount} records from ${tableName} in ${format} format`,
      {
        triggeredBy: userId,
        tableName,
        recordCount,
        format,
        filters,
        ...details
      }
    );
  }

  /**
   * Log import operations
   */
  async logDataImport(userId, tableName, recordCount, success, details = {}) {
    return await logSystemEvent(
      'IMPORT',
      'ADMIN',
      success ? 'MEDIUM' : 'HIGH',
      `Data import to ${tableName}`,
      `User ${success ? 'successfully imported' : 'failed to import'} ${recordCount} records to ${tableName}`,
      {
        triggeredBy: userId,
        tableName,
        recordCount,
        success,
        errorDetails: details.errors,
        ...details
      }
    );
  }

  /**
   * Log security events
   */
  async logSecurityEvent(eventType, severity, description, details = {}) {
    return await logSystemEvent(
      eventType,
      'SECURITY',
      severity,
      `Security Event: ${eventType}`,
      description,
      details
    );
  }

  /**
   * Log system maintenance events
   */
  async logMaintenanceEvent(eventType, description, details = {}) {
    return await logSystemEvent(
      eventType,
      'MAINTENANCE',
      'LOW',
      `Maintenance: ${eventType}`,
      description,
      details
    );
  }

  /**
   * Get audit trail for a specific record
   */
  async getRecordAuditTrail(tableName, recordId, limit = 50) {
    try {
      const query = `
        SELECT 
          al.*,
          u.first_name || ' ' || u.last_name as user_name,
          s.name as school_name
        FROM audit_logs al
        LEFT JOIN users u ON al.user_id = u.id
        LEFT JOIN schools s ON al.school_id = s.id
        WHERE al.table_name = $1 AND al.record_id = $2
        ORDER BY al.created_at DESC
        LIMIT $3
      `;

      const result = await pool.query(query, [tableName, recordId, limit]);
      return result.rows;

    } catch (error) {
      logger.error('Failed to get record audit trail', {
        error: error.message,
        tableName,
        recordId
      });
      throw error;
    }
  }

  /**
   * Get user activity summary
   */
  async getUserActivitySummary(userId, days = 30) {
    try {
      const query = `
        SELECT 
          operation_type,
          module,
          COUNT(*) as operation_count,
          MAX(created_at) as last_operation,
          MIN(created_at) as first_operation
        FROM audit_logs
        WHERE user_id = $1 
        AND created_at >= (now() - interval '${days} days')
        GROUP BY operation_type, module
        ORDER BY operation_count DESC
      `;

      const result = await pool.query(query, [userId]);
      return result.rows;

    } catch (error) {
      logger.error('Failed to get user activity summary', {
        error: error.message,
        userId,
        days
      });
      throw error;
    }
  }

  /**
   * Get system activity summary
   */
  async getSystemActivitySummary(schoolId = null, days = 30) {
    try {
      let query = `
        SELECT 
          table_name,
          operation_type,
          module,
          COUNT(*) as operation_count,
          COUNT(DISTINCT user_id) as unique_users,
          MAX(created_at) as last_operation
        FROM audit_logs
        WHERE created_at >= (now() - interval '${days} days')
      `;

      const params = [];
      if (schoolId) {
        query += ' AND school_id = $1';
        params.push(schoolId);
      }

      query += `
        GROUP BY table_name, operation_type, module
        ORDER BY operation_count DESC
        LIMIT 100
      `;

      const result = await pool.query(query, params);
      return result.rows;

    } catch (error) {
      logger.error('Failed to get system activity summary', {
        error: error.message,
        schoolId,
        days
      });
      throw error;
    }
  }

  /**
   * Get recent critical activities
   */
  async getRecentCriticalActivities(limit = 50) {
    try {
      const query = `
        SELECT * FROM recent_critical_activities
        LIMIT $1
      `;

      const result = await pool.query(query, [limit]);
      return result.rows;

    } catch (error) {
      logger.error('Failed to get recent critical activities', {
        error: error.message,
        limit
      });
      throw error;
    }
  }

  /**
   * Search audit logs
   */
  async searchAuditLogs(filters = {}, limit = 100, offset = 0) {
    try {
      let query = `
        SELECT 
          al.*,
          u.first_name || ' ' || u.last_name as user_name,
          s.name as school_name
        FROM audit_logs al
        LEFT JOIN users u ON al.user_id = u.id
        LEFT JOIN schools s ON al.school_id = s.id
        WHERE 1=1
      `;

      const params = [];
      let paramCount = 0;

      // Add filters
      if (filters.userId) {
        params.push(filters.userId);
        query += ` AND al.user_id = $${++paramCount}`;
      }

      if (filters.tableName) {
        params.push(filters.tableName);
        query += ` AND al.table_name = $${++paramCount}`;
      }

      if (filters.operation) {
        params.push(filters.operation);
        query += ` AND al.operation_type = $${++paramCount}`;
      }

      if (filters.module) {
        params.push(filters.module);
        query += ` AND al.module = $${++paramCount}`;
      }

      if (filters.schoolId) {
        params.push(filters.schoolId);
        query += ` AND al.school_id = $${++paramCount}`;
      }

      if (filters.startDate) {
        params.push(filters.startDate);
        query += ` AND al.created_at >= $${++paramCount}`;
      }

      if (filters.endDate) {
        params.push(filters.endDate);
        query += ` AND al.created_at <= $${++paramCount}`;
      }

      if (filters.success !== undefined) {
        params.push(filters.success);
        query += ` AND al.success = $${++paramCount}`;
      }

      // Add ordering and pagination
      query += ` ORDER BY al.created_at DESC`;
      
      params.push(limit, offset);
      query += ` LIMIT $${++paramCount} OFFSET $${++paramCount}`;

      const result = await pool.query(query, params);
      return result.rows;

    } catch (error) {
      logger.error('Failed to search audit logs', {
        error: error.message,
        filters
      });
      throw error;
    }
  }

  /**
   * Generate audit report
   */
  async generateAuditReport(reportType, filters = {}) {
    try {
      switch (reportType) {
        case 'user_activity':
          return await this.generateUserActivityReport(filters);
        case 'system_activity':
          return await this.generateSystemActivityReport(filters);
        case 'security_events':
          return await this.generateSecurityEventsReport(filters);
        case 'data_access':
          return await this.generateDataAccessReport(filters);
        default:
          throw new Error(`Unknown report type: ${reportType}`);
      }
    } catch (error) {
      logger.error('Failed to generate audit report', {
        error: error.message,
        reportType,
        filters
      });
      throw error;
    }
  }

  async generateUserActivityReport(filters) {
    const query = `
      SELECT 
        u.id,
        u.first_name || ' ' || u.last_name as user_name,
        u.email,
        COUNT(al.id) as total_operations,
        COUNT(CASE WHEN al.operation_type = 'CREATE' THEN 1 END) as creates,
        COUNT(CASE WHEN al.operation_type = 'UPDATE' THEN 1 END) as updates,
        COUNT(CASE WHEN al.operation_type = 'DELETE' THEN 1 END) as deletes,
        COUNT(CASE WHEN al.operation_type = 'LOGIN' THEN 1 END) as logins,
        MAX(al.created_at) as last_activity,
        MIN(al.created_at) as first_activity
      FROM users u
      LEFT JOIN audit_logs al ON u.id = al.user_id
      WHERE al.created_at >= COALESCE($1, now() - interval '30 days')
      AND al.created_at <= COALESCE($2, now())
      GROUP BY u.id, u.first_name, u.last_name, u.email
      HAVING COUNT(al.id) > 0
      ORDER BY total_operations DESC
    `;

    const result = await pool.query(query, [filters.startDate, filters.endDate]);
    return result.rows;
  }

  async generateSystemActivityReport(filters) {
    const query = `
      SELECT 
        table_name,
        module,
        operation_type,
        COUNT(*) as operation_count,
        COUNT(DISTINCT user_id) as unique_users,
        COUNT(CASE WHEN success = false THEN 1 END) as failed_operations,
        AVG(duration_ms) as avg_duration_ms,
        MAX(created_at) as last_operation,
        MIN(created_at) as first_operation
      FROM audit_logs
      WHERE created_at >= COALESCE($1, now() - interval '30 days')
      AND created_at <= COALESCE($2, now())
      GROUP BY table_name, module, operation_type
      ORDER BY operation_count DESC
    `;

    const result = await pool.query(query, [filters.startDate, filters.endDate]);
    return result.rows;
  }

  async generateSecurityEventsReport(filters) {
    const query = `
      SELECT 
        event_type,
        severity,
        COUNT(*) as event_count,
        COUNT(CASE WHEN status = 'RESOLVED' THEN 1 END) as resolved_count,
        MAX(occurred_at) as last_occurrence,
        MIN(occurred_at) as first_occurrence
      FROM system_events
      WHERE event_category = 'SECURITY'
      AND occurred_at >= COALESCE($1, now() - interval '30 days')
      AND occurred_at <= COALESCE($2, now())
      GROUP BY event_type, severity
      ORDER BY event_count DESC
    `;

    const result = await pool.query(query, [filters.startDate, filters.endDate]);
    return result.rows;
  }

  async generateDataAccessReport(filters) {
    const query = `
      SELECT 
        accessed_table,
        access_type,
        module,
        COUNT(*) as access_count,
        COUNT(DISTINCT user_id) as unique_users,
        SUM(records_count) as total_records_accessed,
        AVG(duration_ms) as avg_duration_ms,
        MAX(accessed_at) as last_access,
        MIN(accessed_at) as first_access
      FROM data_access_logs
      WHERE accessed_at >= COALESCE($1, now() - interval '30 days')
      AND accessed_at <= COALESCE($2, now())
      GROUP BY accessed_table, access_type, module
      ORDER BY access_count DESC
    `;

    const result = await pool.query(query, [filters.startDate, filters.endDate]);
    return result.rows;
  }
}

module.exports = new AuditService();