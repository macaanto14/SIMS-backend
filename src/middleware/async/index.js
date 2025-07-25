/**
 * Enhanced Async Middleware
 * Implements non-blocking patterns with rate limiting and caching
 */

const rateLimit = require('express-rate-limit');
const RedisStore = require('rate-limit-redis');
const redis = require('redis');
const { executeQuery } = require('../../utils/database');
const { CacheService } = require('../../core/services/CacheService');
const logger = require('../../utils/logger');
const { asyncHandler } = require('../../utils/errors');

// Redis client for rate limiting
const redisClient = redis.createClient({
  host: process.env.REDIS_HOST || 'localhost',
  port: process.env.REDIS_PORT || 6379
});

/**
 * Enhanced authentication middleware with caching
 */
const enhancedAuth = asyncHandler(async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  try {
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Check cache first for user data
    let userData = await CacheService.getUserSession(decoded.userId).catch(() => null);
    
    if (!userData) {
      // Fallback to database with optimized query
      const userResult = await executeQuery(`
        SELECT u.id, u.email, u.first_name, u.last_name, u.is_active,
               array_agg(
                 DISTINCT jsonb_build_object(
                   'roleId', ur.role_id,
                   'roleName', r.name,
                   'schoolId', ur.school_id
                 )
               ) FILTER (WHERE ur.role_id IS NOT NULL) as roles
        FROM users u
        LEFT JOIN user_roles ur ON u.id = ur.user_id AND ur.is_active = true
        LEFT JOIN roles r ON ur.role_id = r.id
        WHERE u.id = $1 AND u.is_active = true
        GROUP BY u.id
      `, [decoded.userId]);

      if (userResult.rows.length === 0) {
        return res.status(401).json({ error: 'Invalid token' });
      }

      userData = userResult.rows[0];
      
      // Cache user data asynchronously
      setImmediate(() => {
        CacheService.setUserSession(decoded.userId, userData).catch(err => 
          logger.error('Session cache failed:', err)
        );
      });
    }

    req.user = {
      id: userData.id,
      email: userData.email,
      firstName: userData.first_name,
      lastName: userData.last_name,
      roles: userData.roles || []
    };

    next();
  } catch (error) {
    logger.error('Authentication error:', error);
    return res.status(403).json({ error: 'Invalid token' });
  }
});

/**
 * Adaptive rate limiting based on user role
 */
const createAdaptiveRateLimit = (options = {}) => {
  const {
    windowMs = 15 * 60 * 1000, // 15 minutes
    standardLimit = 100,
    premiumLimit = 1000,
    adminLimit = 5000
  } = options;

  return rateLimit({
    store: new RedisStore({
      client: redisClient,
      prefix: 'rl:'
    }),
    windowMs,
    max: async (req) => {
      if (!req.user) return standardLimit;
      
      const userRoles = req.user.roles.map(role => role.roleName);
      
      if (userRoles.includes('Super Admin') || userRoles.includes('Admin')) {
        return adminLimit;
      }
      
      if (userRoles.includes('Premium User')) {
        return premiumLimit;
      }
      
      return standardLimit;
    },
    keyGenerator: (req) => {
      return req.user ? `user:${req.user.id}` : req.ip;
    },
    handler: (req, res) => {
      logger.warn('Rate limit exceeded', {
        userId: req.user?.id,
        ip: req.ip,
        endpoint: req.originalUrl
      });
      
      res.status(429).json({
        error: 'Too many requests',
        retryAfter: Math.round(windowMs / 1000)
      });
    }
  });
};

/**
 * Async validation middleware with parallel checks
 */
const enhancedValidation = (validationRules) => {
  return asyncHandler(async (req, res, next) => {
    const startTime = Date.now();
    
    try {
      // Run all validations in parallel
      const validationPromises = validationRules.map(rule => rule.run(req));
      await Promise.all(validationPromises);

      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        const duration = Date.now() - startTime;
        logger.warn('Validation failed', {
          duration,
          errors: errors.array(),
          endpoint: req.originalUrl
        });
        
        return res.status(400).json({
          error: 'Validation failed',
          details: errors.array()
        });
      }

      const duration = Date.now() - startTime;
      logger.debug('Validation passed', { duration });
      
      next();
    } catch (error) {
      logger.error('Validation error:', error);
      return res.status(500).json({ error: 'Validation processing failed' });
    }
  });
};

/**
 * Request logging middleware with async operations
 */
const enhancedRequestLogger = asyncHandler(async (req, res, next) => {
  const startTime = Date.now();
  const requestId = require('crypto').randomUUID();
  
  req.requestId = requestId;
  req.startTime = startTime;

  // Log request start asynchronously
  setImmediate(() => {
    logger.http('Request started', {
      requestId,
      method: req.method,
      url: req.originalUrl,
      userAgent: req.get('User-Agent'),
      ip: req.ip,
      userId: req.user?.id
    });
  });

  // Override res.end to log response
  const originalEnd = res.end;
  res.end = function(...args) {
    const duration = Date.now() - startTime;
    
    // Log response asynchronously
    setImmediate(() => {
      logger.http('Request completed', {
        requestId,
        method: req.method,
        url: req.originalUrl,
        statusCode: res.statusCode,
        duration,
        userId: req.user?.id
      });
    });

    originalEnd.apply(this, args);
  };

  next();
});

/**
 * Cache middleware for GET requests
 */
const cacheMiddleware = (ttl = 300) => {
  return asyncHandler(async (req, res, next) => {
    if (req.method !== 'GET') {
      return next();
    }

    const cacheKey = `cache:${req.originalUrl}:${req.user?.id || 'anonymous'}`;
    
    try {
      const cachedResponse = await CacheService.get(cacheKey);
      
      if (cachedResponse) {
        logger.debug('Cache hit', { cacheKey });
        return res.json(cachedResponse);
      }
      
      // Override res.json to cache the response
      const originalJson = res.json;
      res.json = function(data) {
        // Cache response asynchronously
        setImmediate(() => {
          CacheService.set(cacheKey, data, ttl).catch(err => 
            logger.error('Cache set failed:', err)
          );
        });
        
        return originalJson.call(this, data);
      };
      
      next();
    } catch (error) {
      logger.error('Cache middleware error:', error);
      next(); // Continue without caching
    }
  });
};

module.exports = {
  enhancedAuth,
  createAdaptiveRateLimit,
  enhancedValidation,
  enhancedRequestLogger,
  cacheMiddleware
};