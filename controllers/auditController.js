/**
 * Audit Trail Controller
 * 
 * Handles audit trail queries, reports, and analytics for transparency
 * and accountability across the SIMS system.
 * 
 * @author Assistant
 * @version 1.0.0
 */

const pool = require('../config/database');
const { logDataAccess, logSystemEvent } = require('../src/middleware/audit');
const logger = require('../src/utils/logger');

/**
 * Get audit logs with filtering and pagination
 */
const getAuditLogs = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 50,
      operation_type,
      table_name,
      module,
      user_id,
      school_id,
      start_date,
      end_date,
      search
    } = req.query;

    const offset = (page - 1) * limit;
    let whereConditions = [];
    let queryParams = [];
    let paramIndex = 1;

    // Build dynamic WHERE clause
    if (operation_type) {
      whereConditions.push(`al.operation_type = $${paramIndex++}`);
      queryParams.push(operation_type.toUpperCase());
    }

    if (table_name) {
      whereConditions.push(`al.table_name = $${paramIndex++}`);
      queryParams.push(table_name);
    }

    if (module) {
      whereConditions.push(`al.module = $${paramIndex++}`);
      queryParams.push(module);
    }

    if (user_id) {
      whereConditions.push(`al.user_id = $${paramIndex++}`);
      queryParams.push(user_id);
    }

    if (school_id) {
      whereConditions.push(`al.school_id = $${paramIndex++}`);
      queryParams.push(school_id);
    }

    if (start_date) {
      whereConditions.push(`al.created_at >= $${paramIndex++}`);
      queryParams.push(start_date);
    }

    if (end_date) {
      whereConditions.push(`al.created_at <= $${paramIndex++}`);
      queryParams.push(end_date);
    }

    if (search) {
      whereConditions.push(`(al.description ILIKE $${paramIndex++} OR al.user_email ILIKE $${paramIndex++})`);
      queryParams.push(`%${search}%`, `%${search}%`);
      paramIndex++;
    }

    // Apply school-based filtering for non-Super Admin users
    if (req.user.role_name !== 'Super Admin' && req.user.school_id) {
      whereConditions.push(`al.school_id = $${paramIndex++}`);
      queryParams.push(req.user.school_id);
    }

    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

    // Main query
    const query = `
      SELECT 
        al.id,
        al.operation_type,
        al.table_name,
        al.record_id,
        al.user_email,
        al.user_role,
        s.name as school_name,
        al.ip_address,
        al.module,
        al.action,
        al.description,
        al.success,
        al.error_message,
        al.duration_ms,
        al.created_at,
        CASE 
          WHEN al.changed_fields IS NOT NULL THEN array_length(al.changed_fields, 1)
          ELSE 0
        END as fields_changed
      FROM audit_logs al
      LEFT JOIN schools s ON al.school_id = s.id
      ${whereClause}
      ORDER BY al.created_at DESC
      LIMIT $${paramIndex++} OFFSET $${paramIndex++}
    `;

    queryParams.push(limit, offset);

    // Count query
    const countQuery = `
      SELECT COUNT(*) as total
      FROM audit_logs al
      ${whereClause}
    `;

    const [logsResult, countResult] = await Promise.all([
      pool.query(query, queryParams),
      pool.query(countQuery, queryParams.slice(0, -2)) // Remove limit and offset for count
    ]);

    const totalRecords = parseInt(countResult.rows[0].total);
    const totalPages = Math.ceil(totalRecords / limit);

    // Log data access
    await logDataAccess(
      req.user.id,
      'audit_logs',
      null,
      'READ',
      {
        queryType: 'SEARCH',
        filters: req.query,
        recordsCount: logsResult.rows.length,
        feature: 'audit_logs_search',
        purpose: 'audit_review',
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
        requestId: res.locals.requestId
      }
    );

    res.json({
      success: true,
      data: {
        logs: logsResult.rows,
        pagination: {
          currentPage: parseInt(page),
          totalPages,
          totalRecords,
          limit: parseInt(limit),
          hasNext: page < totalPages,
          hasPrev: page > 1
        }
      }
    });

  } catch (error) {
    logger.error('Error fetching audit logs', {
      error: error.message,
      userId: req.user?.id,
      query: req.query
    });

    res.status(500).json({
      success: false,
      message: 'Failed to fetch audit logs',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * Get audit log details by ID
 */
const getAuditLogById = async (req, res) => {
  try {
    const { id } = req.params;

    const query = `
      SELECT 
        al.*,
        s.name as school_name,
        u.first_name || ' ' || u.last_name as user_full_name
      FROM audit_logs al
      LEFT JOIN schools s ON al.school_id = s.id
      LEFT JOIN users u ON al.user_id = u.id
      WHERE al.id = $1
    `;

    // Apply school-based filtering for non-Super Admin users
    let finalQuery = query;
    let queryParams = [id];

    if (req.user.role_name !== 'Super Admin' && req.user.school_id) {
      finalQuery += ' AND al.school_id = $2';
      queryParams.push(req.user.school_id);
    }

    const result = await pool.query(finalQuery, queryParams);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Audit log not found'
      });
    }

    // Log data access
    await logDataAccess(
      req.user.id,
      'audit_logs',
      id,
      'READ',
      {
        feature: 'audit_log_details',
        purpose: 'audit_review',
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
        requestId: res.locals.requestId
      }
    );

    res.json({
      success: true,
      data: result.rows[0]
    });

  } catch (error) {
    logger.error('Error fetching audit log details', {
      error: error.message,
      auditLogId: req.params.id,
      userId: req.user?.id
    });

    res.status(500).json({
      success: false,
      message: 'Failed to fetch audit log details',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * Get user activity summary
 */
const getUserActivitySummary = async (req, res) => {
  try {
    const { days = 30, user_id } = req.query;

    let whereClause = `WHERE al.created_at >= (now() - interval '${days} days')`;
    let queryParams = [];

    if (user_id) {
      whereClause += ' AND al.user_id = $1';
      queryParams.push(user_id);
    }

    // Apply school-based filtering for non-Super Admin users
    if (req.user.role_name !== 'Super Admin' && req.user.school_id) {
      const paramIndex = queryParams.length + 1;
      whereClause += ` AND al.school_id = $${paramIndex}`;
      queryParams.push(req.user.school_id);
    }

    const query = `
      SELECT 
        u.id as user_id,
        u.first_name || ' ' || u.last_name as user_name,
        u.email,
        COUNT(al.id) as total_operations,
        COUNT(CASE WHEN al.operation_type = 'CREATE' THEN 1 END) as creates,
        COUNT(CASE WHEN al.operation_type = 'UPDATE' THEN 1 END) as updates,
        COUNT(CASE WHEN al.operation_type = 'DELETE' THEN 1 END) as deletes,
        COUNT(CASE WHEN al.operation_type = 'LOGIN' THEN 1 END) as logins,
        COUNT(CASE WHEN al.success = false THEN 1 END) as failed_operations,
        MAX(al.created_at) as last_activity,
        MIN(al.created_at) as first_activity,
        array_agg(DISTINCT al.module) FILTER (WHERE al.module IS NOT NULL) as modules_accessed
      FROM users u
      LEFT JOIN audit_logs al ON u.id = al.user_id
      ${whereClause}
      GROUP BY u.id, u.first_name, u.last_name, u.email
      HAVING COUNT(al.id) > 0
      ORDER BY total_operations DESC
    `;

    const result = await pool.query(query, queryParams);

    // Log data access
    await logDataAccess(
      req.user.id,
      'audit_logs',
      null,
      'READ',
      {
        queryType: 'REPORT',
        filters: { days, user_id },
        recordsCount: result.rows.length,
        feature: 'user_activity_summary',
        purpose: 'audit_analytics',
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
        requestId: res.locals.requestId
      }
    );

    res.json({
      success: true,
      data: {
        summary: result.rows,
        period_days: parseInt(days),
        generated_at: new Date()
      }
    });

  } catch (error) {
    logger.error('Error generating user activity summary', {
      error: error.message,
      userId: req.user?.id,
      query: req.query
    });

    res.status(500).json({
      success: false,
      message: 'Failed to generate user activity summary',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * Get system activity dashboard
 */
const getSystemActivityDashboard = async (req, res) => {
  try {
    const { days = 7 } = req.query;

    // Apply school-based filtering for non-Super Admin users
    let schoolFilter = '';
    let queryParams = [days];

    if (req.user.role_name !== 'Super Admin' && req.user.school_id) {
      schoolFilter = 'AND al.school_id = $2';
      queryParams.push(req.user.school_id);
    }

    // Get activity statistics
    const statsQuery = `
      SELECT 
        COUNT(*) as total_operations,
        COUNT(CASE WHEN al.operation_type = 'CREATE' THEN 1 END) as creates,
        COUNT(CASE WHEN al.operation_type = 'UPDATE' THEN 1 END) as updates,
        COUNT(CASE WHEN al.operation_type = 'DELETE' THEN 1 END) as deletes,
        COUNT(CASE WHEN al.operation_type = 'LOGIN' THEN 1 END) as logins,
        COUNT(CASE WHEN al.success = false THEN 1 END) as failed_operations,
        COUNT(DISTINCT al.user_id) as active_users,
        COUNT(DISTINCT al.table_name) as affected_tables
      FROM audit_logs al
      WHERE al.created_at >= (now() - interval '$1 days')
      ${schoolFilter}
    `;

    // Get daily activity trend
    const trendQuery = `
      SELECT 
        DATE(al.created_at) as activity_date,
        COUNT(*) as operations_count,
        COUNT(DISTINCT al.user_id) as unique_users,
        COUNT(CASE WHEN al.success = false THEN 1 END) as failed_operations
      FROM audit_logs al
      WHERE al.created_at >= (now() - interval '$1 days')
      ${schoolFilter}
      GROUP BY DATE(al.created_at)
      ORDER BY activity_date DESC
    `;

    // Get top modules
    const modulesQuery = `
      SELECT 
        al.module,
        COUNT(*) as operations_count,
        COUNT(DISTINCT al.user_id) as unique_users
      FROM audit_logs al
      WHERE al.created_at >= (now() - interval '$1 days')
      ${schoolFilter}
      GROUP BY al.module
      ORDER BY operations_count DESC
      LIMIT 10
    `;

    // Get recent critical activities
    const criticalQuery = `
      SELECT 
        al.operation_type,
        al.table_name,
        al.user_email,
        al.description,
        al.created_at,
        al.success
      FROM audit_logs al
      WHERE al.created_at >= (now() - interval '$1 days')
      ${schoolFilter}
      AND (
        al.operation_type = 'DELETE' 
        OR al.table_name IN ('users', 'user_roles', 'schools')
        OR al.success = false
      )
      ORDER BY al.created_at DESC
      LIMIT 20
    `;

    const [statsResult, trendResult, modulesResult, criticalResult] = await Promise.all([
      pool.query(statsQuery, queryParams),
      pool.query(trendQuery, queryParams),
      pool.query(modulesQuery, queryParams),
      pool.query(criticalQuery, queryParams)
    ]);

    // Log data access
    await logDataAccess(
      req.user.id,
      'audit_logs',
      null,
      'READ',
      {
        queryType: 'DASHBOARD',
        filters: { days },
        recordsCount: statsResult.rows.length,
        feature: 'system_activity_dashboard',
        purpose: 'audit_monitoring',
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
        requestId: res.locals.requestId
      }
    );

    res.json({
      success: true,
      data: {
        statistics: statsResult.rows[0],
        daily_trend: trendResult.rows,
        top_modules: modulesResult.rows,
        critical_activities: criticalResult.rows,
        period_days: parseInt(days),
        generated_at: new Date()
      }
    });

  } catch (error) {
    logger.error('Error generating system activity dashboard', {
      error: error.message,
      userId: req.user?.id,
      query: req.query
    });

    res.status(500).json({
      success: false,
      message: 'Failed to generate system activity dashboard',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * Export audit logs
 */
const exportAuditLogs = async (req, res) => {
  try {
    const {
      format = 'csv',
      start_date,
      end_date,
      operation_type,
      table_name,
      module,
      user_id
    } = req.query;

    // Validate export permissions
    if (req.user.role_name !== 'Super Admin' && req.user.role_name !== 'Admin') {
      return res.status(403).json({
        success: false,
        message: 'Insufficient permissions to export audit logs'
      });
    }

    let whereConditions = [];
    let queryParams = [];
    let paramIndex = 1;

    // Build filters
    if (start_date) {
      whereConditions.push(`al.created_at >= $${paramIndex++}`);
      queryParams.push(start_date);
    }

    if (end_date) {
      whereConditions.push(`al.created_at <= $${paramIndex++}`);
      queryParams.push(end_date);
    }

    if (operation_type) {
      whereConditions.push(`al.operation_type = $${paramIndex++}`);
      queryParams.push(operation_type.toUpperCase());
    }

    if (table_name) {
      whereConditions.push(`al.table_name = $${paramIndex++}`);
      queryParams.push(table_name);
    }

    if (module) {
      whereConditions.push(`al.module = $${paramIndex++}`);
      queryParams.push(module);
    }

    if (user_id) {
      whereConditions.push(`al.user_id = $${paramIndex++}`);
      queryParams.push(user_id);
    }

    // Apply school-based filtering for non-Super Admin users
    if (req.user.role_name !== 'Super Admin' && req.user.school_id) {
      whereConditions.push(`al.school_id = $${paramIndex++}`);
      queryParams.push(req.user.school_id);
    }

    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

    const query = `
      SELECT 
        al.created_at,
        al.operation_type,
        al.table_name,
        al.user_email,
        al.user_role,
        s.name as school_name,
        al.ip_address,
        al.module,
        al.action,
        al.description,
        al.success,
        al.error_message,
        al.duration_ms
      FROM audit_logs al
      LEFT JOIN schools s ON al.school_id = s.id
      ${whereClause}
      ORDER BY al.created_at DESC
      LIMIT 10000
    `;

    const result = await pool.query(query, queryParams);

    // Log export activity
    await logSystemEvent(
      'EXPORT',
      'ADMIN',
      'MEDIUM',
      'Audit logs exported',
      `User ${req.user.email} exported ${result.rows.length} audit log records`,
      {
        triggeredBy: req.user.id,
        exportFormat: format,
        recordsCount: result.rows.length,
        filters: req.query
      }
    );

    if (format === 'json') {
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', `attachment; filename=audit_logs_${new Date().toISOString().split('T')[0]}.json`);
      res.json({
        export_info: {
          generated_at: new Date(),
          generated_by: req.user.email,
          total_records: result.rows.length,
          filters: req.query
        },
        data: result.rows
      });
    } else {
      // CSV format
      const csv = convertToCSV(result.rows);
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename=audit_logs_${new Date().toISOString().split('T')[0]}.csv`);
      res.send(csv);
    }

  } catch (error) {
    logger.error('Error exporting audit logs', {
      error: error.message,
      userId: req.user?.id,
      query: req.query
    });

    res.status(500).json({
      success: false,
      message: 'Failed to export audit logs',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * Helper function to convert data to CSV
 */
function convertToCSV(data) {
  if (data.length === 0) return '';

  const headers = Object.keys(data[0]);
  const csvHeaders = headers.join(',');
  
  const csvRows = data.map(row => {
    return headers.map(header => {
      const value = row[header];
      // Escape quotes and wrap in quotes if contains comma
      if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
        return `"${value.replace(/"/g, '""')}"`;
      }
      return value || '';
    }).join(',');
  });

  return [csvHeaders, ...csvRows].join('\n');
}

module.exports = {
  getAuditLogs,
  getAuditLogById,
  getUserActivitySummary,
  getSystemActivityDashboard,
  exportAuditLogs
};