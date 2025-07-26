const { Pool } = require('pg');
const logger = require('../../utils/logger');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

class AuditService {
  constructor() {
    this.retentionPeriods = {
      audit_logs: 365, // days
      user_sessions: 90,
      data_access_logs: 180,
      system_events: 730
    };
  }

  /**
   * Get audit logs with filtering and pagination
   */
  async getAuditLogs(filters = {}, pagination = {}) {
    try {
      const { limit = 50, offset = 0 } = pagination;
      
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

      // Apply filters
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
      
      // Get total count for pagination
      const countQuery = query.replace(/SELECT.*FROM/, 'SELECT COUNT(*) FROM').replace(/ORDER BY.*/, '').replace(/LIMIT.*/, '');
      const countParams = params.slice(0, -2); // Remove limit and offset
      const countResult = await pool.query(countQuery, countParams);

      return {
        data: result.rows,
        total: parseInt(countResult.rows[0].count),
        limit,
        offset
      };

    } catch (error) {
      logger.error('Failed to get audit logs', {
        error: error.message,
        filters,
        pagination
      });
      throw error;
    }
  }

  /**
   * Get specific audit log by ID
   */
  async getAuditLogById(id) {
    try {
      const query = `
        SELECT 
          al.*,
          u.first_name || ' ' || u.last_name as user_name,
          u.email as user_email,
          s.name as school_name
        FROM audit_logs al
        LEFT JOIN users u ON al.user_id = u.id
        LEFT JOIN schools s ON al.school_id = s.id
        WHERE al.id = $1
      `;

      const result = await pool.query(query, [id]);
      
      if (result.rows.length === 0) {
        throw new Error('Audit log not found');
      }

      return result.rows[0];

    } catch (error) {
      logger.error('Failed to get audit log by ID', {
        error: error.message,
        id
      });
      throw error;
    }
  }

  /**
   * Get user activity summary
   */
  async getUserActivity(userId, timeRange = '30d') {
    try {
      const days = this.parseTimeRange(timeRange);
      
      const query = `
        SELECT 
          COUNT(*) as total_operations,
          COUNT(CASE WHEN operation_type = 'CREATE' THEN 1 END) as creates,
          COUNT(CASE WHEN operation_type = 'UPDATE' THEN 1 END) as updates,
          COUNT(CASE WHEN operation_type = 'DELETE' THEN 1 END) as deletes,
          COUNT(CASE WHEN operation_type = 'LOGIN' THEN 1 END) as logins,
          COUNT(CASE WHEN success = false THEN 1 END) as failed_operations,
          COUNT(DISTINCT table_name) as tables_accessed,
          MAX(created_at) as last_activity,
          MIN(created_at) as first_activity
        FROM audit_logs
        WHERE user_id = $1
        AND created_at >= now() - interval '${days} days'
      `;

      const result = await pool.query(query, [userId]);
      return result.rows[0];

    } catch (error) {
      logger.error('Failed to get user activity', {
        error: error.message,
        userId,
        timeRange
      });
      throw error;
    }
  }

  /**
   * Get system activity dashboard data
   */
  async getSystemActivity(timeRange = '7d') {
    try {
      const days = this.parseTimeRange(timeRange);
      
      const queries = {
        overview: `
          SELECT 
            COUNT(*) as total_operations,
            COUNT(DISTINCT user_id) as active_users,
            COUNT(CASE WHEN success = false THEN 1 END) as failed_operations,
            COUNT(CASE WHEN operation_type = 'LOGIN' THEN 1 END) as logins,
            AVG(duration_ms) as avg_response_time
          FROM audit_logs
          WHERE created_at >= now() - interval '${days} days'
        `,
        
        byModule: `
          SELECT 
            module,
            COUNT(*) as operation_count,
            COUNT(DISTINCT user_id) as unique_users,
            COUNT(CASE WHEN success = false THEN 1 END) as failed_operations
          FROM audit_logs
          WHERE created_at >= now() - interval '${days} days'
          GROUP BY module
          ORDER BY operation_count DESC
        `,
        
        byOperation: `
          SELECT 
            operation_type,
            COUNT(*) as operation_count,
            AVG(duration_ms) as avg_duration
          FROM audit_logs
          WHERE created_at >= now() - interval '${days} days'
          GROUP BY operation_type
          ORDER BY operation_count DESC
        `,
        
        timeline: `
          SELECT 
            DATE_TRUNC('hour', created_at) as hour,
            COUNT(*) as operation_count,
            COUNT(CASE WHEN success = false THEN 1 END) as failed_count
          FROM audit_logs
          WHERE created_at >= now() - interval '${days} days'
          GROUP BY DATE_TRUNC('hour', created_at)
          ORDER BY hour
        `
      };

      const results = {};
      for (const [key, query] of Object.entries(queries)) {
        const result = await pool.query(query);
        results[key] = result.rows;
      }

      return results;

    } catch (error) {
      logger.error('Failed to get system activity', {
        error: error.message,
        timeRange
      });
      throw error;
    }
  }

  /**
   * Export audit logs
   */
  async exportAuditLogs(filters = {}, format = 'json') {
    try {
      const logs = await this.getAuditLogs(filters, { limit: 10000, offset: 0 });
      
      switch (format.toLowerCase()) {
        case 'csv':
          return this.convertToCSV(logs.data);
        case 'json':
          return JSON.stringify(logs.data, null, 2);
        default:
          throw new Error(`Unsupported export format: ${format}`);
      }

    } catch (error) {
      logger.error('Failed to export audit logs', {
        error: error.message,
        filters,
        format
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
        MAX(created_at) as last_occurrence,
        MIN(created_at) as first_occurrence
      FROM system_events
      WHERE event_category = 'SECURITY'
      AND created_at >= COALESCE($1, now() - interval '30 days')
      AND created_at <= COALESCE($2, now())
      GROUP BY event_type, severity
      ORDER BY event_count DESC
    `;

    const result = await pool.query(query, [filters.startDate, filters.endDate]);
    return result.rows;
  }

  async generateDataAccessReport(filters) {
    const query = `
      SELECT 
        table_name,
        access_type,
        COUNT(*) as access_count,
        COUNT(DISTINCT user_id) as unique_users,
        SUM(result_count) as total_records_accessed,
        MAX(created_at) as last_access,
        MIN(created_at) as first_access
      FROM data_access_logs
      WHERE created_at >= COALESCE($1, now() - interval '30 days')
      AND created_at <= COALESCE($2, now())
      GROUP BY table_name, access_type
      ORDER BY access_count DESC
    `;

    const result = await pool.query(query, [filters.startDate, filters.endDate]);
    return result.rows;
  }

  /**
   * Helper methods
   */
  parseTimeRange(timeRange) {
    const match = timeRange.match(/^(\d+)([dwmy])$/);
    if (!match) return 30; // default to 30 days

    const [, amount, unit] = match;
    const multipliers = { d: 1, w: 7, m: 30, y: 365 };
    return parseInt(amount) * (multipliers[unit] || 1);
  }

  convertToCSV(data) {
    if (!data || data.length === 0) return '';

    const headers = Object.keys(data[0]);
    const csvContent = [
      headers.join(','),
      ...data.map(row => 
        headers.map(header => {
          const value = row[header];
          if (value === null || value === undefined) return '';
          if (typeof value === 'object') return JSON.stringify(value);
          return `"${String(value).replace(/"/g, '""')}"`;
        }).join(',')
      )
    ].join('\n');

    return csvContent;
  }

  /**
   * Cleanup old audit logs based on retention policy
   */
  async cleanupOldLogs() {
    try {
      const results = {};
      
      for (const [tableName, retentionDays] of Object.entries(this.retentionPeriods)) {
        const query = `
          DELETE FROM ${tableName}
          WHERE created_at < now() - interval '${retentionDays} days'
        `;
        
        const result = await pool.query(query);
        results[tableName] = result.rowCount;
        
        logger.info(`Cleaned up ${result.rowCount} old records from ${tableName}`);
      }

      return results;

    } catch (error) {
      logger.error('Failed to cleanup old audit logs', {
        error: error.message
      });
      throw error;
    }
  }
}

module.exports = new AuditService();