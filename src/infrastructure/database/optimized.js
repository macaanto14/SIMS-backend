/**
 * Optimized Database Connection with Event-Driven Architecture
 */

const { Pool } = require('pg');
const EventEmitter = require('events');
const logger = require('../../utils/logger');

class OptimizedDatabasePool extends EventEmitter {
  constructor() {
    super();
    this.pool = null;
    this.connectionStats = {
      totalConnections: 0,
      activeConnections: 0,
      idleConnections: 0,
      waitingClients: 0
    };
    this.queryQueue = [];
    this.isProcessingQueue = false;
  }

  async initialize() {
    try {
      this.pool = new Pool({
        host: process.env.DB_HOST,
        port: process.env.DB_PORT,
        database: process.env.DB_NAME,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        
        // Optimized pool settings
        min: 5,                    // Minimum connections
        max: 20,                   // Maximum connections
        idleTimeoutMillis: 30000,  // Close idle connections after 30s
        connectionTimeoutMillis: 5000, // Connection timeout
        acquireTimeoutMillis: 10000,   // Client acquisition timeout
        
        // Advanced settings
        allowExitOnIdle: true,
        keepAlive: true,
        keepAliveInitialDelayMillis: 10000,
        
        // SSL configuration
        ssl: process.env.NODE_ENV === 'production' ? {
          rejectUnauthorized: false
        } : false
      });

      this.setupEventListeners();
      await this.testConnection();
      
      logger.info('Database pool initialized successfully');
      this.emit('pool:ready');
      
      return this.pool;
    } catch (error) {
      logger.error('Database pool initialization failed:', error);
      this.emit('pool:error', error);
      throw error;
    }
  }

  setupEventListeners() {
    // Pool events
    this.pool.on('connect', (client) => {
      this.connectionStats.totalConnections++;
      this.connectionStats.activeConnections++;
      
      logger.debug('Database client connected', {
        totalConnections: this.connectionStats.totalConnections,
        activeConnections: this.connectionStats.activeConnections
      });
      
      this.emit('client:connected', client);
    });

    this.pool.on('remove', (client) => {
      this.connectionStats.activeConnections--;
      
      logger.debug('Database client removed', {
        activeConnections: this.connectionStats.activeConnections
      });
      
      this.emit('client:removed', client);
    });

    this.pool.on('error', (err, client) => {
      logger.error('Database pool error:', err);
      this.emit('pool:error', err);
    });

    // Monitor pool health every 30 seconds
    setInterval(() => {
      this.monitorPoolHealth();
    }, 30000);
  }

  /**
   * Execute query with connection pooling and retry logic
   */
  async executeQuery(text, params = [], options = {}) {
    const {
      timeout = 30000,
      retries = 3,
      priority = 'normal'
    } = options;

    const queryId = require('crypto').randomUUID();
    const startTime = Date.now();

    try {
      // Add to queue if high priority or pool is busy
      if (priority === 'high' || this.connectionStats.waitingClients > 5) {
        return await this.queueQuery(text, params, options);
      }

      const client = await this.pool.connect();
      
      try {
        // Set query timeout
        const timeoutPromise = new Promise((_, reject) => {
          setTimeout(() => reject(new Error('Query timeout')), timeout);
        });

        const queryPromise = client.query(text, params);
        const result = await Promise.race([queryPromise, timeoutPromise]);

        const duration = Date.now() - startTime;
        
        // Log slow queries
        if (duration > 1000) {
          logger.warn('Slow query detected', {
            queryId,
            duration,
            query: text.replace(/\s+/g, ' ').trim().substring(0, 100)
          });
        }

        this.emit('query:completed', { queryId, duration, success: true });
        
        return result;
      } finally {
        client.release();
      }
    } catch (error) {
      const duration = Date.now() - startTime;
      
      logger.error('Query execution failed', {
        queryId,
        duration,
        error: error.message,
        query: text.replace(/\s+/g, ' ').trim().substring(0, 100)
      });

      this.emit('query:failed', { queryId, duration, error });

      // Retry logic
      if (retries > 0 && this.shouldRetry(error)) {
        logger.info('Retrying query', { queryId, retriesLeft: retries - 1 });
        await this.delay(1000); // Wait 1 second before retry
        return this.executeQuery(text, params, { ...options, retries: retries - 1 });
      }

      throw error;
    }
  }

  /**
   * Execute transaction with optimistic locking
   */
  async executeTransaction(queries, options = {}) {
    const {
      isolationLevel = 'READ COMMITTED',
      timeout = 60000
    } = options;

    const client = await this.pool.connect();
    const transactionId = require('crypto').randomUUID();
    const startTime = Date.now();

    try {
      await client.query('BEGIN');
      await client.query(`SET TRANSACTION ISOLATION LEVEL ${isolationLevel}`);

      const results = [];
      
      // Execute queries in sequence within transaction
      for (const { query, params } of queries) {
        const result = await client.query(query, params);
        results.push(result);
      }

      await client.query('COMMIT');

      const duration = Date.now() - startTime;
      logger.info('Transaction completed', { transactionId, duration, queryCount: queries.length });

      this.emit('transaction:completed', { transactionId, duration, queryCount: queries.length });

      return results;
    } catch (error) {
      await client.query('ROLLBACK');
      
      const duration = Date.now() - startTime;
      logger.error('Transaction failed', {
        transactionId,
        duration,
        error: error.message,
        queryCount: queries.length
      });

      this.emit('transaction:failed', { transactionId, duration, error });
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Queue management for high-priority queries
   */
  async queueQuery(text, params, options) {
    return new Promise((resolve, reject) => {
      this.queryQueue.push({
        text,
        params,
        options,
        resolve,
        reject,
        timestamp: Date.now()
      });

      this.processQueue();
    });
  }

  async processQueue() {
    if (this.isProcessingQueue || this.queryQueue.length === 0) {
      return;
    }

    this.isProcessingQueue = true;

    try {
      // Process queries in batches
      const batchSize = 5;
      const batch = this.queryQueue.splice(0, batchSize);

      await Promise.all(
        batch.map(async (queryItem) => {
          try {
            const result = await this.executeQuery(
              queryItem.text,
              queryItem.params,
              { ...queryItem.options, retries: 1 }
            );
            queryItem.resolve(result);
          } catch (error) {
            queryItem.reject(error);
          }
        })
      );

      // Continue processing if more queries in queue
      if (this.queryQueue.length > 0) {
        setImmediate(() => this.processQueue());
      }
    } finally {
      this.isProcessingQueue = false;
    }
  }

  /**
   * Monitor pool health and emit events
   */
  monitorPoolHealth() {
    const stats = {
      totalCount: this.pool.totalCount,
      idleCount: this.pool.idleCount,
      waitingCount: this.pool.waitingCount
    };

    this.connectionStats = {
      ...this.connectionStats,
      activeConnections: stats.totalCount - stats.idleCount,
      idleConnections: stats.idleCount,
      waitingClients: stats.waitingCount
    };

    // Emit health status
    this.emit('pool:health', this.connectionStats);

    // Alert on high waiting clients
    if (stats.waitingCount > 10) {
      logger.warn('High number of waiting clients', stats);
      this.emit('pool:congestion', stats);
    }

    // Alert on low idle connections
    if (stats.idleCount < 2 && stats.totalCount > 15) {
      logger.warn('Low idle connections', stats);
      this.emit('pool:low_idle', stats);
    }
  }

  shouldRetry(error) {
    const retryableErrors = [
      'ECONNRESET',
      'ENOTFOUND',
      'ECONNREFUSED',
      'ETIMEDOUT',
      'connection terminated unexpectedly'
    ];

    return retryableErrors.some(retryableError => 
      error.message.includes(retryableError) || error.code === retryableError
    );
  }

  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async testConnection() {
    const client = await this.pool.connect();
    try {
      await client.query('SELECT NOW()');
      logger.info('Database connection test successful');
    } finally {
      client.release();
    }
  }

  async gracefulShutdown() {
    logger.info('Shutting down database pool gracefully');
    
    try {
      // Process remaining queued queries
      if (this.queryQueue.length > 0) {
        logger.info(`Processing ${this.queryQueue.length} remaining queries`);
        await this.processQueue();
      }

      await this.pool.end();
      logger.info('Database pool closed successfully');
    } catch (error) {
      logger.error('Error during database shutdown:', error);
      throw error;
    }
  }

  getStats() {
    return {
      ...this.connectionStats,
      queueLength: this.queryQueue.length,
      poolStats: {
        totalCount: this.pool?.totalCount || 0,
        idleCount: this.pool?.idleCount || 0,
        waitingCount: this.pool?.waitingCount || 0
      }
    };
  }
}

module.exports = new OptimizedDatabasePool();