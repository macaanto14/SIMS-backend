/**
 * Audit Context Middleware
 * Sets PostgreSQL session variables for audit trigger functions
 */

const pool = require('../../config/database');
const logger = require('../../utils/logger');

class AuditContextMiddleware {
  /**
   * Middleware to set audit context in PostgreSQL session
   */
  static setAuditContext() {
    return async (req, res, next) => {
      try {
        // Extract user context from request
        const userContext = {
          userId: req.user?.id || null,
          userEmail: req.user?.email || null,
          userRole: req.user?.role_name || null,
          schoolId: req.user?.school_id || null,
          ipAddress: req.ip || req.connection?.remoteAddress || null,
          userAgent: req.get('User-Agent') || null,
          requestId: req.headers['x-request-id'] || `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
        };

        // Store context in request for later use
        req.auditContext = userContext;

        // Set PostgreSQL session variables for audit triggers
        if (userContext.userId || userContext.schoolId) {
          await this.setPostgreSQLAuditContext(userContext);
        }

        next();
      } catch (error) {
        logger.error('Failed to set audit context', {
          error: error.message,
          userId: req.user?.id,
          path: req.path
        });
        // Don't fail the request if audit context fails
        next();
      }
    };
  }

  /**
   * Set PostgreSQL session variables for audit triggers
   */
  static async setPostgreSQLAuditContext(context) {
    const client = await pool.connect();
    
    try {
      // Set session variables that the audit trigger function expects
      const queries = [];
      
      if (context.userId) {
        queries.push(`SELECT set_config('audit.user_id', '${context.userId}', false)`);
        queries.push(`SELECT set_config('audit.user_email', '${context.userEmail || ''}', false)`);
        queries.push(`SELECT set_config('audit.user_role', '${context.userRole || ''}', false)`);
      }
      
      if (context.schoolId) {
        queries.push(`SELECT set_config('audit.school_id', '${context.schoolId}', false)`);
      }
      
      if (context.ipAddress) {
        queries.push(`SELECT set_config('audit.ip_address', '${context.ipAddress}', false)`);
      }
      
      if (context.userAgent) {
        // Escape single quotes in user agent
        const escapedUserAgent = context.userAgent.replace(/'/g, "''");
        queries.push(`SELECT set_config('audit.user_agent', '${escapedUserAgent}', false)`);
      }
      
      if (context.requestId) {
        queries.push(`SELECT set_config('audit.request_id', '${context.requestId}', false)`);
      }

      // Execute all queries
      for (const query of queries) {
        await client.query(query);
      }

    } catch (error) {
      logger.error('Failed to set PostgreSQL audit context', {
        error: error.message,
        context
      });
    } finally {
      client.release();
    }
  }

  /**
   * Enhanced database operation wrapper with audit context
   */
  static async executeWithAuditContext(operation, context = {}) {
    const client = await pool.connect();
    const startTime = Date.now();
    
    try {
      await client.query('BEGIN');
      
      // Set audit context for this transaction
      await this.setPostgreSQLAuditContextForClient(client, context);
      
      // Execute the operation
      const result = await operation(client);
      
      await client.query('COMMIT');
      
      const duration = Date.now() - startTime;
      
      // Log successful operation
      logger.info('Database operation completed with audit context', {
        duration,
        userId: context.userId,
        operation: context.operation || 'unknown'
      });
      
      return result;
      
    } catch (error) {
      await client.query('ROLLBACK');
      
      const duration = Date.now() - startTime;
      
      // Log failed operation
      logger.error('Database operation failed', {
        error: error.message,
        duration,
        userId: context.userId,
        operation: context.operation || 'unknown'
      });
      
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Set audit context for a specific client connection
   */
  static async setPostgreSQLAuditContextForClient(client, context) {
    const queries = [];
    
    if (context.userId) {
      queries.push(`SELECT set_config('audit.user_id', '${context.userId}', false)`);
      queries.push(`SELECT set_config('audit.user_email', '${context.userEmail || ''}', false)`);
      queries.push(`SELECT set_config('audit.user_role', '${context.userRole || ''}', false)`);
    }
    
    if (context.schoolId) {
      queries.push(`SELECT set_config('audit.school_id', '${context.schoolId}', false)`);
    }
    
    if (context.ipAddress) {
      queries.push(`SELECT set_config('audit.ip_address', '${context.ipAddress}', false)`);
    }
    
    if (context.userAgent) {
      const escapedUserAgent = context.userAgent.replace(/'/g, "''");
      queries.push(`SELECT set_config('audit.user_agent', '${escapedUserAgent}', false)`);
    }
    
    if (context.requestId) {
      queries.push(`SELECT set_config('audit.request_id', '${context.requestId}', false)`);
    }

    // Execute all queries
    for (const query of queries) {
      await client.query(query);
    }
  }
}

module.exports = AuditContextMiddleware;