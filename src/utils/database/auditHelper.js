/**
 * Database Audit Helper
 * 
 * Provides database operation wrappers that automatically include
 * audit trail logging for all CRUD operations.
 * 
 * @author Assistant
 * @version 1.0.0
 */

const pool = require('../../../config/database');
const AuditService = require('../../services/auditService');
const logger = require('../logger');

class DatabaseAuditHelper {
  /**
   * Execute SELECT with audit logging
   */
  static async select(tableName, conditions = {}, context = {}) {
    const startTime = Date.now();
    
    try {
      let query = `SELECT * FROM ${tableName}`;
      let values = [];
      let paramIndex = 1;

      if (Object.keys(conditions).length > 0) {
        const whereClause = Object.keys(conditions)
          .map(key => `${key} = $${paramIndex++}`)
          .join(' AND ');
        query += ` WHERE ${whereClause}`;
        values = Object.values(conditions);
      }

      const result = await pool.query(query, values);
      
      // Log data access
      if (context.userId) {
        await AuditService.logDataAccess(
          context.userId,
          tableName,
          null,
          'READ',
          {
            queryType: 'SELECT',
            conditions,
            recordsCount: result.rows.length,
            duration: Date.now() - startTime,
            ipAddress: context.ipAddress,
            userAgent: context.userAgent,
            requestId: context.requestId
          }
        );
      }

      return result;
    } catch (error) {
      logger.error('Database SELECT operation failed', {
        error: error.message,
        tableName,
        conditions,
        context
      });
      throw error;
    }
  }

  /**
   * Execute INSERT with audit logging
   */
  static async insert(tableName, data, context = {}) {
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');

      const columns = Object.keys(data);
      const values = Object.values(data);
      const placeholders = values.map((_, index) => `$${index + 1}`).join(', ');

      const query = `
        INSERT INTO ${tableName} (${columns.join(', ')})
        VALUES (${placeholders})
        RETURNING *
      `;

      const result = await client.query(query, values);
      const newRecord = result.rows[0];

      // Log the operation
      await AuditService.logDatabaseOperation({
        userId: context.userId,
        userEmail: context.userEmail,
        userRole: context.userRole,
        schoolId: context.schoolId,
        tableName,
        recordId: newRecord.id,
        operationType: 'CREATE',
        module: context.module,
        action: context.action || `Create ${tableName}`,
        description: context.description || `Created new record in ${tableName}`,
        success: true,
        ipAddress: context.ipAddress,
        userAgent: context.userAgent,
        requestId: context.requestId,
        newValues: newRecord,
        metadata: {
          insertedFields: columns,
          timestamp: new Date()
        }
      });

      await client.query('COMMIT');
      return result;
    } catch (error) {
      await client.query('ROLLBACK');
      
      // Log failed operation
      await AuditService.logDatabaseOperation({
        userId: context.userId,
        userEmail: context.userEmail,
        userRole: context.userRole,
        schoolId: context.schoolId,
        tableName,
        recordId: null,
        operationType: 'CREATE',
        module: context.module,
        action: context.action || `Create ${tableName}`,
        description: context.description || `Failed to create record in ${tableName}`,
        success: false,
        errorMessage: error.message,
        ipAddress: context.ipAddress,
        userAgent: context.userAgent,
        requestId: context.requestId,
        metadata: {
          attemptedData: data,
          timestamp: new Date()
        }
      });

      logger.error('Database INSERT operation failed', {
        error: error.message,
        tableName,
        data,
        context
      });
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Execute UPDATE with audit logging and change tracking
   */
  static async update(tableName, id, data, context = {}) {
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');

      // Get current record for change tracking
      const currentResult = await client.query(`SELECT * FROM ${tableName} WHERE id = $1`, [id]);
      if (currentResult.rows.length === 0) {
        throw new Error(`Record not found in ${tableName} with id: ${id}`);
      }
      const oldRecord = currentResult.rows[0];

      // Prepare update query
      const columns = Object.keys(data);
      const values = Object.values(data);
      const setClause = columns.map((col, index) => `${col} = $${index + 2}`).join(', ');

      const query = `
        UPDATE ${tableName} 
        SET ${setClause}, updated_at = NOW()
        WHERE id = $1
        RETURNING *
      `;

      const result = await client.query(query, [id, ...values]);
      const newRecord = result.rows[0];

      // Identify changed fields
      const changedFields = [];
      columns.forEach(column => {
        if (oldRecord[column] !== data[column]) {
          changedFields.push(column);
        }
      });

      // Log the operation
      await AuditService.logDatabaseOperation({
        userId: context.userId,
        userEmail: context.userEmail,
        userRole: context.userRole,
        schoolId: context.schoolId,
        tableName,
        recordId: id,
        operationType: 'UPDATE',
        module: context.module,
        action: context.action || `Update ${tableName}`,
        description: context.description || `Updated record in ${tableName}`,
        success: true,
        ipAddress: context.ipAddress,
        userAgent: context.userAgent,
        requestId: context.requestId,
        oldValues: oldRecord,
        newValues: newRecord,
        changedFields,
        metadata: {
          updatedFields: columns,
          changedFieldsCount: changedFields.length,
          timestamp: new Date()
        }
      });

      await client.query('COMMIT');
      return result;
    } catch (error) {
      await client.query('ROLLBACK');
      
      // Log failed operation
      await AuditService.logDatabaseOperation({
        userId: context.userId,
        userEmail: context.userEmail,
        userRole: context.userRole,
        schoolId: context.schoolId,
        tableName,
        recordId: id,
        operationType: 'UPDATE',
        module: context.module,
        action: context.action || `Update ${tableName}`,
        description: context.description || `Failed to update record in ${tableName}`,
        success: false,
        errorMessage: error.message,
        ipAddress: context.ipAddress,
        userAgent: context.userAgent,
        requestId: context.requestId,
        metadata: {
          attemptedData: data,
          timestamp: new Date()
        }
      });

      logger.error('Database UPDATE operation failed', {
        error: error.message,
        tableName,
        id,
        data,
        context
      });
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Execute DELETE with audit logging
   */
  static async delete(tableName, id, context = {}) {
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');

      // Get record before deletion for audit trail
      const currentResult = await client.query(`SELECT * FROM ${tableName} WHERE id = $1`, [id]);
      if (currentResult.rows.length === 0) {
        throw new Error(`Record not found in ${tableName} with id: ${id}`);
      }
      const deletedRecord = currentResult.rows[0];

      // Perform deletion
      const query = `DELETE FROM ${tableName} WHERE id = $1 RETURNING id`;
      const result = await client.query(query, [id]);

      // Log the operation
      await AuditService.logDatabaseOperation({
        userId: context.userId,
        userEmail: context.userEmail,
        userRole: context.userRole,
        schoolId: context.schoolId,
        tableName,
        recordId: id,
        operationType: 'DELETE',
        module: context.module,
        action: context.action || `Delete ${tableName}`,
        description: context.description || `Deleted record from ${tableName}`,
        success: true,
        ipAddress: context.ipAddress,
        userAgent: context.userAgent,
        requestId: context.requestId,
        oldValues: deletedRecord,
        metadata: {
          deletedAt: new Date(),
          recordData: deletedRecord
        }
      });

      await client.query('COMMIT');
      return result;
    } catch (error) {
      await client.query('ROLLBACK');
      
      // Log failed operation
      await AuditService.logDatabaseOperation({
        userId: context.userId,
        userEmail: context.userEmail,
        userRole: context.userRole,
        schoolId: context.schoolId,
        tableName,
        recordId: id,
        operationType: 'DELETE',
        module: context.module,
        action: context.action || `Delete ${tableName}`,
        description: context.description || `Failed to delete record from ${tableName}`,
        success: false,
        errorMessage: error.message,
        ipAddress: context.ipAddress,
        userAgent: context.userAgent,
        requestId: context.requestId,
        metadata: {
          timestamp: new Date()
        }
      });

      logger.error('Database DELETE operation failed', {
        error: error.message,
        tableName,
        id,
        context
      });
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Execute soft delete with audit logging
   */
  static async softDelete(tableName, id, context = {}) {
    return this.update(
      tableName,
      id,
      { is_active: false, deleted_at: new Date() },
      {
        ...context,
        action: context.action || `Soft delete ${tableName}`,
        description: context.description || `Soft deleted record in ${tableName}`
      }
    );
  }

  /**
   * Bulk operations with audit logging
   */
  static async bulkInsert(tableName, records, context = {}) {
    const client = await pool.connect();
    const insertedRecords = [];
    
    try {
      await client.query('BEGIN');

      for (const record of records) {
        const columns = Object.keys(record);
        const values = Object.values(record);
        const placeholders = values.map((_, index) => `$${index + 1}`).join(', ');

        const query = `
          INSERT INTO ${tableName} (${columns.join(', ')})
          VALUES (${placeholders})
          RETURNING *
        `;

        const result = await client.query(query, values);
        insertedRecords.push(result.rows[0]);
      }

      // Log bulk operation
      await AuditService.logDatabaseOperation({
        userId: context.userId,
        userEmail: context.userEmail,
        userRole: context.userRole,
        schoolId: context.schoolId,
        tableName,
        recordId: null,
        operationType: 'CREATE',
        module: context.module,
        action: context.action || `Bulk insert ${tableName}`,
        description: context.description || `Bulk inserted ${records.length} records in ${tableName}`,
        success: true,
        ipAddress: context.ipAddress,
        userAgent: context.userAgent,
        requestId: context.requestId,
        metadata: {
          recordsCount: records.length,
          insertedIds: insertedRecords.map(r => r.id),
          timestamp: new Date()
        }
      });

      await client.query('COMMIT');
      return { rows: insertedRecords, rowCount: insertedRecords.length };
    } catch (error) {
      await client.query('ROLLBACK');
      
      // Log failed bulk operation
      await AuditService.logDatabaseOperation({
        userId: context.userId,
        userEmail: context.userEmail,
        userRole: context.userRole,
        schoolId: context.schoolId,
        tableName,
        recordId: null,
        operationType: 'CREATE',
        module: context.module,
        action: context.action || `Bulk insert ${tableName}`,
        description: context.description || `Failed bulk insert in ${tableName}`,
        success: false,
        errorMessage: error.message,
        ipAddress: context.ipAddress,
        userAgent: context.userAgent,
        requestId: context.requestId,
        metadata: {
          attemptedRecordsCount: records.length,
          timestamp: new Date()
        }
      });

      logger.error('Database BULK INSERT operation failed', {
        error: error.message,
        tableName,
        recordsCount: records.length,
        context
      });
      throw error;
    } finally {
      client.release();
    }
  }
}

module.exports = DatabaseAuditHelper;