/**
 * Database Utilities Module
 * 
 * This module provides comprehensive database utility functions
 * for the SIMS backend, including query builders, transaction
 * management, and database operation helpers.
 * 
 * @author Ismail Mohamed 
 * @version 2.0.0
 */

const pool = require('../../infrastructure/database/connection');
const logger = require('../logger');
const { AppError } = require('../errors');

/**
 * Execute a database query with error handling and logging
 * 
 * @param {string} query - SQL query string
 * @param {Array} params - Query parameters
 * @param {Object} options - Query options
 * @returns {Promise<Object>} Query result
 */
const executeQuery = async (query, params = [], options = {}) => {
  const { 
    logQuery = true, 
    timeout = 30000,
    retries = 0 
  } = options;

  const startTime = Date.now();
  let attempt = 0;

  while (attempt <= retries) {
    try {
      if (logQuery) {
        logger.debug('Executing database query', {
          query: query.replace(/\s+/g, ' ').trim(),
          paramCount: params.length,
          attempt: attempt + 1,
          timeout
        });
      }

      const client = await pool.connect();
      
      try {
        // Set query timeout
        await client.query('SET statement_timeout = $1', [timeout]);
        
        const result = await client.query(query, params);
        
        const duration = Date.now() - startTime;
        
        if (logQuery) {
          logger.info('Database query executed successfully', {
            duration,
            rowCount: result.rowCount,
            attempt: attempt + 1
          });
        }

        return result;
      } finally {
        client.release();
      }
    } catch (error) {
      attempt++;
      const duration = Date.now() - startTime;
      
      logger.error('Database query failed', {
        error: error.message,
        query: query.replace(/\s+/g, ' ').trim(),
        paramCount: params.length,
        duration,
        attempt,
        maxRetries: retries
      });

      if (attempt > retries) {
        throw new AppError(
          `Database query failed after ${attempt} attempts: ${error.message}`,
          500,
          'DATABASE_ERROR',
          { originalError: error, query, params }
        );
      }

      // Wait before retry (exponential backoff)
      await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
    }
  }
};

/**
 * Execute multiple queries in a transaction
 * 
 * @param {Array<Object>} queries - Array of query objects {query, params}
 * @param {Object} options - Transaction options
 * @returns {Promise<Array>} Array of query results
 */
const executeTransaction = async (queries, options = {}) => {
  const { isolationLevel = 'READ COMMITTED' } = options;
  
  const client = await pool.connect();
  const results = [];

  try {
    await client.query('BEGIN');
    await client.query(`SET TRANSACTION ISOLATION LEVEL ${isolationLevel}`);

    logger.info('Database transaction started', {
      queryCount: queries.length,
      isolationLevel
    });

    for (let i = 0; i < queries.length; i++) {
      const { query, params = [] } = queries[i];
      
      logger.debug(`Executing transaction query ${i + 1}/${queries.length}`, {
        query: query.replace(/\s+/g, ' ').trim()
      });

      const result = await client.query(query, params);
      results.push(result);
    }

    await client.query('COMMIT');
    
    logger.info('Database transaction committed successfully', {
      queryCount: queries.length,
      totalRowsAffected: results.reduce((sum, r) => sum + (r.rowCount || 0), 0)
    });

    return results;
  } catch (error) {
    await client.query('ROLLBACK');
    
    logger.error('Database transaction rolled back', {
      error: error.message,
      queryCount: queries.length,
      completedQueries: results.length
    });

    throw new AppError(
      `Transaction failed: ${error.message}`,
      500,
      'TRANSACTION_ERROR',
      { originalError: error, queries }
    );
  } finally {
    client.release();
  }
};

/**
 * Build a dynamic UPDATE query
 * 
 * @param {string} tableName - Table name
 * @param {Object} data - Data to update
 * @param {string} whereClause - WHERE clause
 * @param {Object} options - Query options
 * @returns {Object} Query object with query string and parameters
 */
const buildUpdateQuery = (tableName, data, whereClause, options = {}) => {
  const { 
    excludeFields = ['id', 'created_at'],
    includeUpdatedAt = true,
    returning = '*'
  } = options;

  // Filter out excluded fields
  const filteredData = Object.keys(data)
    .filter(key => !excludeFields.includes(key) && data[key] !== undefined)
    .reduce((obj, key) => {
      obj[key] = data[key];
      return obj;
    }, {});

  if (Object.keys(filteredData).length === 0) {
    throw new AppError('No valid fields to update', 400, 'INVALID_UPDATE_DATA');
  }

  const keys = Object.keys(filteredData);
  const setClause = keys.map((key, index) => `${key} = $${index + 1}`).join(', ');
  const values = keys.map(key => filteredData[key]);

  let query = `UPDATE ${tableName} SET ${setClause}`;
  
  if (includeUpdatedAt) {
    query += `, updated_at = NOW()`;
  }
  
  query += ` WHERE ${whereClause}`;
  
  if (returning) {
    query += ` RETURNING ${returning}`;
  }

  return { query, values };
};

/**
 * Build a dynamic INSERT query
 * 
 * @param {string} tableName - Table name
 * @param {Object|Array} data - Data to insert (single object or array)
 * @param {Object} options - Query options
 * @returns {Object} Query object with query string and parameters
 */
const buildInsertQuery = (tableName, data, options = {}) => {
  const { 
    onConflict = null,
    returning = '*',
    includeTimestamps = true 
  } = options;

  const isArray = Array.isArray(data);
  const records = isArray ? data : [data];

  if (records.length === 0) {
    throw new AppError('No data provided for insert', 400, 'INVALID_INSERT_DATA');
  }

  // Get all unique keys from all records
  const allKeys = [...new Set(records.flatMap(record => Object.keys(record)))];
  
  if (includeTimestamps) {
    if (!allKeys.includes('created_at')) allKeys.push('created_at');
    if (!allKeys.includes('updated_at')) allKeys.push('updated_at');
  }

  const values = [];
  const valuePlaceholders = [];

  records.forEach((record, recordIndex) => {
    const recordValues = [];
    
    allKeys.forEach((key, keyIndex) => {
      const paramIndex = recordIndex * allKeys.length + keyIndex + 1;
      
      if (key === 'created_at' || key === 'updated_at') {
        recordValues.push('NOW()');
      } else {
        recordValues.push(`$${paramIndex}`);
        values.push(record[key] || null);
      }
    });
    
    valuePlaceholders.push(`(${recordValues.join(', ')})`);
  });

  let query = `INSERT INTO ${tableName} (${allKeys.join(', ')}) VALUES ${valuePlaceholders.join(', ')}`;
  
  if (onConflict) {
    query += ` ${onConflict}`;
  }
  
  if (returning) {
    query += ` RETURNING ${returning}`;
  }

  return { query, values };
};

/**
 * Build a paginated SELECT query
 * 
 * @param {Object} options - Query options
 * @returns {Object} Query components
 */
const buildPaginatedQuery = (options = {}) => {
  const {
    tableName,
    selectFields = '*',
    whereClause = '',
    joinClause = '',
    orderBy = 'created_at DESC',
    page = 1,
    limit = 20,
    searchFields = [],
    searchTerm = '',
    filters = {}
  } = options;

  let query = `SELECT ${selectFields} FROM ${tableName}`;
  let countQuery = `SELECT COUNT(*) as total FROM ${tableName}`;
  const params = [];
  let paramIndex = 1;

  // Add JOIN clause
  if (joinClause) {
    query += ` ${joinClause}`;
    countQuery += ` ${joinClause}`;
  }

  // Build WHERE conditions
  const conditions = [];
  
  // Add base WHERE clause
  if (whereClause) {
    conditions.push(whereClause);
  }

  // Add search conditions
  if (searchTerm && searchFields.length > 0) {
    const searchConditions = searchFields.map(field => 
      `${field} ILIKE $${paramIndex}`
    ).join(' OR ');
    
    conditions.push(`(${searchConditions})`);
    params.push(`%${searchTerm}%`);
    paramIndex++;
  }

  // Add filter conditions
  Object.entries(filters).forEach(([field, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      if (Array.isArray(value)) {
        const placeholders = value.map(() => `$${paramIndex++}`).join(', ');
        conditions.push(`${field} IN (${placeholders})`);
        params.push(...value);
      } else {
        conditions.push(`${field} = $${paramIndex++}`);
        params.push(value);
      }
    }
  });

  // Apply WHERE conditions
  if (conditions.length > 0) {
    const whereClauseStr = ` WHERE ${conditions.join(' AND ')}`;
    query += whereClauseStr;
    countQuery += whereClauseStr;
  }

  // Add ORDER BY
  query += ` ORDER BY ${orderBy}`;

  // Add pagination
  const offset = (page - 1) * limit;
  query += ` LIMIT $${paramIndex++} OFFSET $${paramIndex++}`;
  params.push(limit, offset);

  return {
    query,
    countQuery,
    params: params.slice(0, -2), // Remove limit and offset for count query
    paginationParams: [limit, offset]
  };
};

/**
 * Execute a paginated query and return formatted results
 * 
 * @param {Object} options - Query options
 * @returns {Promise<Object>} Paginated results
 */
const executePaginatedQuery = async (options) => {
  const { query, countQuery, params, paginationParams } = buildPaginatedQuery(options);
  
  // Execute count query and main query in parallel
  const [countResult, dataResult] = await Promise.all([
    executeQuery(countQuery, params),
    executeQuery(query, [...params, ...paginationParams])
  ]);

  const total = parseInt(countResult.rows[0].total);
  const { page = 1, limit = 20 } = options;
  const totalPages = Math.ceil(total / limit);

  return {
    data: dataResult.rows,
    pagination: {
      currentPage: page,
      totalPages,
      totalItems: total,
      itemsPerPage: limit,
      hasNextPage: page < totalPages,
      hasPrevPage: page > 1
    }
  };
};

module.exports = {
  executeQuery,
  executeTransaction,
  buildUpdateQuery,
  buildInsertQuery,
  buildPaginatedQuery,
  executePaginatedQuery,
  
  // Connection utilities
  getConnection: () => pool.connect(),
  
  // Health check
  healthCheck: async () => {
    try {
      const result = await executeQuery('SELECT NOW() as timestamp', [], { logQuery: false });
      return {
        status: 'healthy',
        timestamp: result.rows[0].timestamp,
        connectionCount: pool.totalCount,
        idleCount: pool.idleCount,
        waitingCount: pool.waitingCount
      };
    } catch (error) {
      throw new AppError('Database health check failed', 500, 'DATABASE_HEALTH_ERROR', {
        originalError: error
      });
    }
  }
};