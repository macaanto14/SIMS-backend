/**
 * Database Connection and Pool Management
 * 
 * Provides a robust database connection pool with error handling,
 * connection monitoring, and graceful shutdown capabilities.
 * 
 * @module infrastructure/database
 */

const { Pool } = require('pg');
const { APP_CONFIG } = require('../../config/app');
const logger = require('../../shared/utils/logger');

/**
 * Database connection pool instance
 * @type {Pool}
 */
let pool = null;

/**
 * Database connection statistics
 * @type {Object}
 */
const connectionStats = {
  totalConnections: 0,
  activeConnections: 0,
  idleConnections: 0,
  waitingClients: 0,
};

/**
 * Create and configure database connection pool
 * @returns {Pool} Configured PostgreSQL connection pool
 */
const createPool = () => {
  // Parse database URL for individual connection parameters
  const databaseUrl = new URL(APP_CONFIG.DATABASE.URL);

  const poolConfig = {
    // Connection parameters
    host: databaseUrl.hostname,
    port: parseInt(databaseUrl.port, 10),
    database: databaseUrl.pathname.slice(1), // Remove leading slash
    user: databaseUrl.username,
    password: databaseUrl.password,

    // SSL configuration for production
    ssl: APP_CONFIG.NODE_ENV === 'production' ? {
      rejectUnauthorized: false,
    } : false,

    // Pool configuration for optimal performance
    max: APP_CONFIG.DATABASE.POOL_SIZE, // Maximum number of connections
    min: 2, // Minimum number of connections to maintain
    idleTimeoutMillis: APP_CONFIG.DATABASE.IDLE_TIMEOUT,
    connectionTimeoutMillis: APP_CONFIG.DATABASE.CONNECTION_TIMEOUT,
    acquireTimeoutMillis: 30000,
    createTimeoutMillis: 30000,
    destroyTimeoutMillis: 5000,
    reapIntervalMillis: 1000,
    createRetryIntervalMillis: 200,

    // Additional stability settings
    keepAlive: true,
    keepAliveInitialDelayMillis: 10000,
    statement_timeout: 30000,
    query_timeout: 30000,
  };

  return new Pool(poolConfig);
};

/**
 * Setup database event listeners for monitoring and logging
 * @param {Pool} poolInstance - Database pool instance
 */
const setupEventListeners = (poolInstance) => {
  // Connection established
  poolInstance.on('connect', (client) => {
    connectionStats.totalConnections++;
    connectionStats.activeConnections++;
    logger.debug('New database client connected', {
      totalConnections: connectionStats.totalConnections,
      activeConnections: connectionStats.activeConnections,
    });
  });

  // Client acquired from pool
  poolInstance.on('acquire', (client) => {
    connectionStats.activeConnections++;
    connectionStats.idleConnections--;
    logger.debug('Database client acquired from pool');
  });

  // Client released back to pool
  poolInstance.on('release', (client) => {
    connectionStats.activeConnections--;
    connectionStats.idleConnections++;
    logger.debug('Database client released back to pool');
  });

  // Client removed from pool
  poolInstance.on('remove', (client) => {
    connectionStats.totalConnections--;
    logger.debug('Database client removed from pool');
  });

  // Pool error handling
  poolInstance.on('error', (err, client) => {
    logger.error('Unexpected database pool error:', {
      error: err.message,
      stack: err.stack,
      client: client ? 'with client' : 'without client',
    });
  });
};

/**
 * Test database connection with retry logic
 * @param {number} maxRetries - Maximum number of retry attempts
 * @returns {Promise<boolean>} True if connection successful
 */
const testConnection = async (maxRetries = 3) => {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      logger.info(`Testing database connection (attempt ${attempt}/${maxRetries})`);
      
      const client = await pool.connect();
      
      // Test with a simple query
      const result = await client.query('SELECT NOW() as current_time, version() as pg_version');
      
      logger.info('Database connection test successful', {
        currentTime: result.rows[0].current_time,
        postgresVersion: result.rows[0].pg_version.split(' ')[0],
      });
      
      client.release();
      return true;
    } catch (error) {
      logger.error(`Database connection test failed (attempt ${attempt}/${maxRetries}):`, {
        error: error.message,
        code: error.code,
      });
      
      if (attempt === maxRetries) {
        throw new Error(`Database connection failed after ${maxRetries} attempts: ${error.message}`);
      }
      
      // Wait before retry (exponential backoff)
      await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
    }
  }
};

/**
 * Initialize database connection
 * @returns {Promise<Pool>} Database pool instance
 */
const connectDatabase = async () => {
  try {
    if (pool) {
      logger.warn('Database pool already exists, returning existing instance');
      return pool;
    }

    logger.info('Initializing database connection pool');
    
    // Create connection pool
    pool = createPool();
    
    // Setup event listeners
    setupEventListeners(pool);
    
    // Test connection
    await testConnection();
    
    logger.info('Database connection pool initialized successfully', {
      maxConnections: APP_CONFIG.DATABASE.POOL_SIZE,
      environment: APP_CONFIG.NODE_ENV,
    });
    
    return pool;
  } catch (error) {
    logger.error('Failed to initialize database connection:', error);
    throw error;
  }
};

/**
 * Get database pool instance
 * @returns {Pool} Database pool instance
 * @throws {Error} If pool is not initialized
 */
const getPool = () => {
  if (!pool) {
    throw new Error('Database pool not initialized. Call connectDatabase() first.');
  }
  return pool;
};

/**
 * Execute a database query with error handling and logging
 * @param {string} text - SQL query text
 * @param {Array} params - Query parameters
 * @param {Object} options - Query options
 * @returns {Promise<Object>} Query result
 */
const query = async (text, params = [], options = {}) => {
  const { logQuery = false, timeout = 30000 } = options;
  const start = Date.now();
  
  try {
    if (logQuery && APP_CONFIG.NODE_ENV === 'development') {
      logger.debug('Executing database query:', { query: text, params });
    }
    
    const result = await pool.query(text, params);
    const duration = Date.now() - start;
    
    if (duration > 1000) { // Log slow queries
      logger.warn('Slow database query detected:', {
        query: text.substring(0, 100) + '...',
        duration: `${duration}ms`,
        rowCount: result.rowCount,
      });
    }
    
    return result;
  } catch (error) {
    const duration = Date.now() - start;
    logger.error('Database query error:', {
      error: error.message,
      query: text.substring(0, 100) + '...',
      params: params,
      duration: `${duration}ms`,
    });
    throw error;
  }
};

/**
 * Get current connection statistics
 * @returns {Object} Connection statistics
 */
const getConnectionStats = () => {
  return {
    ...connectionStats,
    poolStats: pool ? {
      totalCount: pool.totalCount,
      idleCount: pool.idleCount,
      waitingCount: pool.waitingCount,
    } : null,
  };
};

/**
 * Close database connection pool gracefully
 * @returns {Promise<void>}
 */
const closeConnection = async () => {
  if (pool) {
    try {
      logger.info('Closing database connection pool');
      await pool.end();
      pool = null;
      logger.info('Database connection pool closed successfully');
    } catch (error) {
      logger.error('Error closing database connection pool:', error);
      throw error;
    }
  }
};

module.exports = {
  connectDatabase,
  closeConnection,
  getPool,
  query,
  getConnectionStats,
};