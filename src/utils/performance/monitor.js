/**
 * Performance Monitoring with Event-Driven Metrics
 */

const EventEmitter = require('events');
const logger = require('../logger');

class PerformanceMonitor extends EventEmitter {
  constructor() {
    super();
    this.metrics = {
      requests: {
        total: 0,
        successful: 0,
        failed: 0,
        averageResponseTime: 0
      },
      database: {
        queries: 0,
        slowQueries: 0,
        failedQueries: 0,
        averageQueryTime: 0
      },
      cache: {
        hits: 0,
        misses: 0,
        hitRate: 0
      },
      memory: {
        heapUsed: 0,
        heapTotal: 0,
        external: 0
      }
    };

    this.responseTimes = [];
    this.queryTimes = [];
    this.startTime = Date.now();

    this.setupEventListeners();
    this.startPeriodicReporting();
  }

  setupEventListeners() {
    // Request metrics
    this.on('request:start', this.handleRequestStart.bind(this));
    this.on('request:end', this.handleRequestEnd.bind(this));
    
    // Database metrics
    this.on('query:start', this.handleQueryStart.bind(this));
    this.on('query:end', this.handleQueryEnd.bind(this));
    
    // Cache metrics
    this.on('cache:hit', this.handleCacheHit.bind(this));
    this.on('cache:miss', this.handleCacheMiss.bind(this));
  }

  // Request tracking
  trackRequest(req, res, next) {
    const startTime = Date.now();
    req.startTime = startTime;

    this.emit('request:start', { url: req.originalUrl, method: req.method });

    const originalEnd = res.end;
    res.end = (...args) => {
      const duration = Date.now() - startTime;
      
      this.emit('request:end', {
        url: req.originalUrl,
        method: req.method,
        statusCode: res.statusCode,
        duration,
        success: res.statusCode < 400
      });

      originalEnd.apply(res, args);
    };

    next();
  }

  // Database query tracking
  trackQuery(queryText, params = []) {
    const startTime = Date.now();
    const queryId = require('crypto').randomUUID();

    this.emit('query:start', { queryId, queryText });

    return {
      end: (success = true, error = null) => {
        const duration = Date.now() - startTime;
        
        this.emit('query:end', {
          queryId,
          queryText,
          duration,
          success,
          error
        });
      }
    };
  }

  // Event handlers
  handleRequestStart(data) {
    this.metrics.requests.total++;
  }

  handleRequestEnd(data) {
    const { duration, success } = data;
    
    if (success) {
      this.metrics.requests.successful++;
    } else {
      this.metrics.requests.failed++;
    }

    // Track response times (keep last 1000)
    this.responseTimes.push(duration);
    if (this.responseTimes.length > 1000) {
      this.responseTimes.shift();
    }

    // Update average response time
    this.metrics.requests.averageResponseTime = 
      this.responseTimes.reduce((a, b) => a + b, 0) / this.responseTimes.length;

    // Alert on slow requests
    if (duration > 5000) {
      this.emit('alert:slow_request', data);
    }
  }

  handleQueryStart(data) {
    this.metrics.database.queries++;
  }

  handleQueryEnd(data) {
    const { duration, success } = data;

    if (!success) {
      this.metrics.database.failedQueries++;
    }

    // Track query times
    this.queryTimes.push(duration);
    if (this.queryTimes.length > 1000) {
      this.queryTimes.shift();
    }

    // Update average query time
    this.metrics.database.averageQueryTime = 
      this.queryTimes.reduce((a, b) => a + b, 0) / this.queryTimes.length;

    // Track slow queries
    if (duration > 1000) {
      this.metrics.database.slowQueries++;
      this.emit('alert:slow_query', data);
    }
  }

  handleCacheHit() {
    this.metrics.cache.hits++;
    this.updateCacheHitRate();
  }

  handleCacheMiss() {
    this.metrics.cache.misses++;
    this.updateCacheHitRate();
  }

  updateCacheHitRate() {
    const total = this.metrics.cache.hits + this.metrics.cache.misses;
    this.metrics.cache.hitRate = total > 0 ? (this.metrics.cache.hits / total) * 100 : 0;
  }

  // Memory monitoring
  updateMemoryMetrics() {
    const memUsage = process.memoryUsage();
    this.metrics.memory = {
      heapUsed: Math.round(memUsage.heapUsed / 1024 / 1024), // MB
      heapTotal: Math.round(memUsage.heapTotal / 1024 / 1024), // MB
      external: Math.round(memUsage.external / 1024 / 1024) // MB
    };

    // Alert on high memory usage
    if (this.metrics.memory.heapUsed > 500) { // 500MB threshold
      this.emit('alert:high_memory', this.metrics.memory);
    }
  }

  // Periodic reporting
  startPeriodicReporting() {
    // Update memory metrics every 30 seconds
    setInterval(() => {
      this.updateMemoryMetrics();
    }, 30000);

    // Generate performance report every 5 minutes
    setInterval(() => {
      this.generatePerformanceReport();
    }, 5 * 60 * 1000);

    // Alert handlers
    this.on('alert:slow_request', (data) => {
      logger.warn('Slow request detected', data);
    });

    this.on('alert:slow_query', (data) => {
      logger.warn('Slow query detected', {
        duration: data.duration,
        query: data.queryText.substring(0, 100)
      });
    });

    this.on('alert:high_memory', (data) => {
      logger.warn('High memory usage detected', data);
    });
  }

  generatePerformanceReport() {
    const uptime = Date.now() - this.startTime;
    const report = {
      uptime: Math.round(uptime / 1000), // seconds
      timestamp: new Date().toISOString(),
      metrics: this.metrics,
      health: this.getHealthStatus()
    };

    logger.info('Performance report', report);
    this.emit('performance:report', report);

    return report;
  }

  getHealthStatus() {
    const health = {
      status: 'healthy',
      issues: []
    };

    // Check response time
    if (this.metrics.requests.averageResponseTime > 2000) {
      health.issues.push('High average response time');
      health.status = 'degraded';
    }

    // Check error rate
    const errorRate = this.metrics.requests.total > 0 ? 
      (this.metrics.requests.failed / this.metrics.requests.total) * 100 : 0;
    
    if (errorRate > 5) {
      health.issues.push('High error rate');
      health.status = 'unhealthy';
    }

    // Check cache hit rate
    if (this.metrics.cache.hitRate < 70 && this.metrics.cache.hits + this.metrics.cache.misses > 100) {
      health.issues.push('Low cache hit rate');
      health.status = 'degraded';
    }

    // Check memory usage
    if (this.metrics.memory.heapUsed > 500) {
      health.issues.push('High memory usage');
      health.status = 'degraded';
    }

    return health;
  }

  getMetrics() {
    return {
      ...this.metrics,
      uptime: Date.now() - this.startTime,
      health: this.getHealthStatus()
    };
  }

  reset() {
    this.metrics = {
      requests: { total: 0, successful: 0, failed: 0, averageResponseTime: 0 },
      database: { queries: 0, slowQueries: 0, failedQueries: 0, averageQueryTime: 0 },
      cache: { hits: 0, misses: 0, hitRate: 0 },
      memory: { heapUsed: 0, heapTotal: 0, external: 0 }
    };
    this.responseTimes = [];
    this.queryTimes = [];
    this.startTime = Date.now();
  }
}

module.exports = new PerformanceMonitor();