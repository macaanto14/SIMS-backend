const { Pool } = require('pg');
const { v4: uuidv4 } = require('uuid');
const logger = require('../../utils/logger');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

class AuditMiddleware {
  constructor() {
    this.sensitiveFields = [
      'password', 'password_hash', 'token', 'secret', 'key',
      'credit_card', 'ssn', 'social_security'
    ];
    
    this.criticalTables = [
      'users', 'user_roles', 'schools', 'fee_payments', 'grades'
    ];
  }

  /**
   * Main audit middleware function
   */
  auditMiddleware() {
    return async (req, res, next) => {
      const startTime = Date.now();
      
      // Initialize audit context
      req.auditContext = {
        requestId: uuidv4(),
        startTime,
        operation: this.determineOperation(req),
        module: this.determineModule(req.path),
        userContext: this.extractUserContext(req)
      };

      // Log request start
      await this.logRequestStart(req);

      // Override res.end to capture response
      const originalEnd = res.end;
      res.end = function(chunk, encoding) {
        const duration = Date.now() - startTime;
        
        // Log request completion
        setImmediate(async () => {
          try {
            await req.auditMiddleware?.logRequestEnd(req, res, duration);
          } catch (error) {
            logger.error('Failed to log request end', { error: error.message });
          }
        });

        originalEnd.call(this, chunk, encoding);
      };

      next();
    };
  }

  /**
   * Log database operations
   */
  async logDatabaseOperation(operation, tableName, recordId, oldData, newData, userContext = {}) {
    try {
      const auditLog = {
        operation_type: operation.toUpperCase(),
        table_name: tableName,
        record_id: recordId,
        user_id: userContext.userId,
        user_email: userContext.email,
        user_role: userContext.role,
        school_id: userContext.schoolId,
        ip_address: userContext.ipAddress,
        user_agent: userContext.userAgent,
        request_id: userContext.requestId,
        session_id: userContext.sessionId,
        old_values: this.sanitizeData(oldData),
        new_values: this.sanitizeData(newData),
        changed_fields: this.getChangedFields(oldData, newData),
        module: this.getModuleForTable(tableName),
        action: `${operation.toUpperCase()}_${tableName.toUpperCase()}`,
        description: `${operation} operation on ${tableName}`,
        success: true,
        createdAt: new Date()
      };

      const auditId = await this.insertAuditLog(auditLog);

      // Log critical operations as system events
      if (this.criticalTables.includes(tableName)) {
        await this.logCriticalOperation({ ...auditLog, id: auditId });
      }

      return auditId;

    } catch (error) {
      logger.error('Failed to log database operation', {
        error: error.message,
        operation,
        tableName,
        recordId
      });
    }
  }

  /**
   * Log authentication events
   */
  async logAuthEvent(eventType, userId, details = {}) {
    try {
      const auditLog = {
        operation_type: eventType.toUpperCase(),
        table_name: 'auth_events',
        record_id: userId,
        user_id: userId,
        user_email: details.email,
        user_role: details.role,
        school_id: details.schoolId,
        ip_address: details.ipAddress,
        user_agent: details.userAgent,
        request_id: details.requestId,
        session_id: details.sessionId,
        module: 'auth',
        action: `AUTH_${eventType.toUpperCase()}`,
        description: `Authentication event: ${eventType}`,
        success: details.success !== false,
        error_message: details.error,
        new_values: {
          eventType,
          loginMethod: details.loginMethod,
          deviceInfo: details.deviceInfo,
          location: details.location
        },
        createdAt: new Date()
      };

      await this.insertAuditLog(auditLog);

      // Create user session for successful logins
      if (eventType === 'LOGIN' && details.success !== false) {
        await this.createUserSession(userId, details);
      }

      // End user session for logouts
      if (eventType === 'LOGOUT') {
        await this.endUserSession(details.sessionId, 'manual');
      }

    } catch (error) {
      logger.error('Failed to log auth event', {
        error: error.message,
        eventType,
        userId
      });
    }
  }

  /**
   * Log data access events
   */
  async logDataAccess(userId, tableName, recordId, accessType, details = {}) {
    try {
      const accessLog = {
        user_id: userId,
        table_name: tableName,  // Fixed: was accessed_table
        record_id: recordId,    // Fixed: was accessed_record_id
        access_type: accessType.toUpperCase(),
        query_type: details.queryType || 'SELECT',
        filters_applied: details.filters,
        result_count: details.recordsCount || 1,  // Fixed: was records_count
        module: this.getModuleForTable(tableName),
        purpose: details.purpose,
        ip_address: details.ipAddress,
        user_agent: details.userAgent,
        createdAt: new Date()  // Fixed: was accessed_at
      };

      await this.insertDataAccessLog(accessLog);

    } catch (error) {
      logger.error('Failed to log data access', {
        error: error.message,
        userId,
        tableName,
        accessType
      });
    }
  }

  /**
   * Log system events
   */
  async logSystemEvent(eventType, category, severity, title, description, details = {}) {
    try {
      const systemEvent = {
        event_type: eventType.toUpperCase(),
        event_category: category.toUpperCase(),
        severity: severity.toUpperCase(),
        title,
        description,
        details: details,
        user_id: details.triggeredBy,
        school_id: details.schoolId,
        ip_address: details.ipAddress,
        createdAt: new Date()
      };

      await this.insertSystemEvent(systemEvent);

    } catch (error) {
      logger.error('Failed to log system event', {
        error: error.message,
        eventType,
        category,
        severity
      });
    }
  }

  /**
   * Helper Methods
   */

  determineOperation(req) {
    const method = req.method.toLowerCase();
    switch (method) {
      case 'post': return 'CREATE';
      case 'get': return 'READ';
      case 'put':
      case 'patch': return 'UPDATE';
      case 'delete': return 'DELETE';
      default: return 'ACCESS';
    }
  }

  determineModule(path) {
    const pathSegments = path.split('/').filter(Boolean);
    if (pathSegments.length >= 2 && pathSegments[0] === 'api') {
      return pathSegments[1];
    }
    return 'unknown';
  }

  extractUserContext(req) {
    return {
      userId: req.user?.id,
      email: req.user?.email,
      role: req.user?.role_name,
      schoolId: req.user?.school_id,
      ipAddress: req.ip || req.connection.remoteAddress,
      userAgent: req.get('User-Agent'),
      sessionId: req.session?.id || req.headers['x-session-id']
    };
  }

  getModuleForTable(tableName) {
    const moduleMap = {
      'users': 'users',
      'user_roles': 'users',
      'schools': 'schools',
      'student_profiles': 'students',
      'teacher_profiles': 'teachers',
      'parent_profiles': 'parents',
      'classes': 'academic',
      'attendance': 'attendance',
      'grades': 'grades',
      'fee_payments': 'finance',
      'fee_structures': 'finance',
      'expenses': 'finance',
      'library_books': 'library',
      'library_issues': 'library',
      'announcements': 'communication',
      'notifications': 'communication'
    };
    return moduleMap[tableName] || 'unknown';
  }

  getChangedFields(oldData, newData) {
    if (!oldData || !newData) return [];
    
    const changed = [];
    const allKeys = new Set([...Object.keys(oldData), ...Object.keys(newData)]);
    
    for (const key of allKeys) {
      if (oldData[key] !== newData[key]) {
        changed.push(key);
      }
    }
    
    return changed;
  }

  sanitizeData(data) {
    if (!data) return null;
    
    const sanitized = { ...data };
    
    for (const field of this.sensitiveFields) {
      if (sanitized[field]) {
        sanitized[field] = '[REDACTED]';
      }
    }
    
    return sanitized;
  }

  async logRequestStart(req) {
    logger.info('Request started', {
      requestId: req.auditContext.requestId,
      method: req.method,
      path: req.path,
      userId: req.auditContext.userContext.userId,
      ipAddress: req.auditContext.userContext.ipAddress
    });
  }

  async logRequestEnd(req, res, duration) {
    const context = req.auditContext;
    
    logger.info('Request completed', {
      requestId: context.requestId,
      method: req.method,
      path: req.path,
      statusCode: res.statusCode,
      duration,
      userId: context.userContext.userId,
      operation: context.operation,
      module: context.module
    });

    // Log to audit_logs table for API operations
    if (context.operation !== 'READ' || this.shouldLogRead(req.path)) {
      await this.logApiOperation(req, res, duration);
    }
  }

  shouldLogRead(path) {
    const sensitiveEndpoints = [
      '/api/users',
      '/api/finance',
      '/api/grades',
      '/api/reports'
    ];
    return sensitiveEndpoints.some(endpoint => path.startsWith(endpoint));
  }

  async logApiOperation(req, res, duration) {
    try {
      const context = req.auditContext;
      
      const auditLog = {
        operation_type: context.operation,
        table_name: 'api_operations',
        user_id: context.userContext.userId,
        user_email: context.userContext.email,
        user_role: context.userContext.role,
        school_id: context.userContext.schoolId,
        ip_address: context.userContext.ipAddress,
        user_agent: context.userContext.userAgent,
        request_id: context.requestId,
        session_id: context.userContext.sessionId,
        module: context.module,
        action: `${req.method}_${req.path}`,
        description: `${context.operation} operation on ${req.path}`,
        success: res.statusCode < 400,
        error_message: res.statusCode >= 400 ? `HTTP ${res.statusCode}` : null,
        duration_ms: duration,
        new_values: {
          method: req.method,
          path: req.path,
          query: req.query,
          statusCode: res.statusCode
        },
        createdAt: new Date()
      };

      await this.insertAuditLog(auditLog);

    } catch (error) {
      logger.error('Failed to log API operation', {
        error: error.message,
        path: req.path,
        method: req.method
      });
    }
  }

  async logCriticalOperation(auditLog) {
    await this.logSystemEvent(
      'SECURITY_ALERT',
      'SECURITY',
      'MEDIUM',
      `Critical table operation: ${auditLog.table_name}`,
      `${auditLog.operation_type} operation performed on critical table ${auditLog.table_name}`,
      {
        triggeredBy: auditLog.user_id,
        auditLogId: auditLog.id,
        tableName: auditLog.table_name,
        operation: auditLog.operation_type
      }
    );
  }

  /**
   * Database Operations
   */

  async insertAuditLog(auditLog) {
    const query = `
      INSERT INTO audit_logs (
        operation_type, table_name, record_id, user_id, user_email, user_role,
        school_id, ip_address, user_agent, request_id, session_id, old_values,
        new_values, changed_fields, description, module, action, success,
        error_message, duration_ms, createdAt
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21
      ) RETURNING id
    `;

    const values = [
      auditLog.operation_type, auditLog.table_name, auditLog.record_id,
      auditLog.user_id, auditLog.user_email, auditLog.user_role,
      auditLog.school_id, auditLog.ip_address, auditLog.user_agent,
      auditLog.request_id, auditLog.session_id,
      JSON.stringify(auditLog.old_values), JSON.stringify(auditLog.new_values),
      auditLog.changed_fields, auditLog.description, auditLog.module,
      auditLog.action, auditLog.success, auditLog.error_message,
      auditLog.duration_ms, auditLog.createdAt
    ];

    const result = await pool.query(query, values);
    return result.rows[0].id;
  }

  async insertDataAccessLog(accessLog) {
    const query = `
      INSERT INTO data_access_logs (
        user_id, table_name, record_id, access_type, query_type,
        filters_applied, result_count, purpose, ip_address,
        user_agent, createdAt
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11
      ) RETURNING id
    `;

    const values = [
      accessLog.user_id, accessLog.table_name, accessLog.record_id,
      accessLog.access_type, accessLog.query_type,
      JSON.stringify(accessLog.filters_applied), accessLog.result_count,
      accessLog.purpose, accessLog.ip_address, accessLog.user_agent,
      accessLog.createdAt
    ];

    const result = await pool.query(query, values);
    return result.rows[0].id;
  }

  async insertSystemEvent(systemEvent) {
    const query = `
      INSERT INTO system_events (
        event_type, event_category, severity, title, description, details,
        user_id, school_id, ip_address, createdAt
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10
      ) RETURNING id
    `;

    const values = [
      systemEvent.event_type, systemEvent.event_category, systemEvent.severity,
      systemEvent.title, systemEvent.description, JSON.stringify(systemEvent.details),
      systemEvent.user_id, systemEvent.school_id, systemEvent.ip_address,
      systemEvent.createdAt
    ];

    const result = await pool.query(query, values);
    return result.rows[0].id;
  }

  async createUserSession(userId, details) {
    const sessionToken = uuidv4();
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    const query = `
      INSERT INTO user_sessions (
        user_id, session_token, ip_address, user_agent, device_info,
        login_at, is_active, last_activity, school_id
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING id, session_token
    `;

    const values = [
      userId, sessionToken, details.ipAddress, details.userAgent,
      JSON.stringify(details.deviceInfo || {}), new Date(), true, new Date(),
      details.schoolId
    ];

    const result = await pool.query(query, values);
    return result.rows[0];
  }

  async endUserSession(sessionId, reason) {
    const query = `
      UPDATE user_sessions 
      SET is_active = false, logout_at = $1, last_activity = $2
      WHERE session_token = $3 OR id = $3
    `;

    await pool.query(query, [new Date(), new Date(), sessionId]);
  }
}

// Create singleton instance
const auditMiddleware = new AuditMiddleware();

module.exports = {
  auditMiddleware: auditMiddleware.auditMiddleware.bind(auditMiddleware),
  logDatabaseOperation: auditMiddleware.logDatabaseOperation.bind(auditMiddleware),
  logAuthEvent: auditMiddleware.logAuthEvent.bind(auditMiddleware),
  logDataAccess: auditMiddleware.logDataAccess.bind(auditMiddleware),
  logSystemEvent: auditMiddleware.logSystemEvent.bind(auditMiddleware),
  AuditMiddleware
};