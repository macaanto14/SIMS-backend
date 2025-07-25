/**
 * Authentication Middleware Module
 * 
 * This module provides comprehensive authentication and authorization middleware
 * for the SIMS (School Information Management System) backend.
 * 
 * Features:
 * - JWT token verification
 * - Role-based access control (RBAC)
 * - School-specific access control
 * - Multi-role support per user
 * - Comprehensive error handling
 * 
 * @author Ismail Mohamed 
 * @version 2.0.0
 */

const jwt = require('jsonwebtoken');
const { AppError } = require('../../utils/errors');
const { errorResponse } = require('../../utils/response');
const userService = require('../../core/services/userService');
const logger = require('../../utils/logger');

/**
 * Authentication middleware to verify JWT tokens
 * 
 * @description Validates JWT tokens and attaches user information to request object
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 * @returns {void}
 */
const authenticateToken = async (req, res, next) => {
  try {
    // Extract token from Authorization header
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      logger.warn('Authentication attempt without token', {
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        endpoint: req.originalUrl
      });
      
      return errorResponse(res, 'Access token required', 401);
    }

    // Verify JWT token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Get comprehensive user details from database
    const user = await userService.getUserWithRoles(decoded.userId);
    
    if (!user || !user.isActive) {
      logger.warn('Authentication with invalid or inactive user', {
        userId: decoded.userId,
        ip: req.ip
      });
      
      return errorResponse(res, 'Invalid or inactive user account', 401);
    }

    // Attach user information to request object
    req.user = {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      fullName: `${user.firstName} ${user.lastName}`,
      roles: user.roles || [],
      permissions: user.permissions || [],
      schools: user.schools || [],
      lastLoginAt: user.lastLoginAt,
      createdAt: user.createdAt
    };

    // Log successful authentication
    logger.info('User authenticated successfully', {
      userId: user.id,
      email: user.email,
      roles: user.roles.map(r => r.name),
      endpoint: req.originalUrl
    });

    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      logger.warn('Invalid JWT token', { error: error.message, ip: req.ip });
      return errorResponse(res, 'Invalid token format', 403);
    }
    
    if (error.name === 'TokenExpiredError') {
      logger.warn('Expired JWT token', { error: error.message, ip: req.ip });
      return errorResponse(res, 'Token has expired', 403);
    }

    logger.error('Authentication error', {
      error: error.message,
      stack: error.stack,
      ip: req.ip
    });
    
    return errorResponse(res, 'Authentication failed', 500);
  }
};

/**
 * Role-based authorization middleware
 * 
 * @description Checks if user has required roles for accessing specific resources
 * @param {Array<string>} requiredRoles - Array of role names required for access
 * @param {Object} options - Additional authorization options
 * @returns {Function} Express middleware function
 */
const requireRole = (requiredRoles, options = {}) => {
  const { 
    requireAll = false,  // If true, user must have ALL roles, not just one
    allowSuperAdmin = true,  // If true, Super Admin bypasses role checks
    logAccess = true  // If true, logs access attempts
  } = options;

  return (req, res, next) => {
    try {
      if (!req.user || !req.user.roles) {
        return errorResponse(res, 'User authentication required', 403);
      }

      const userRoles = req.user.roles.map(role => role.name);
      
      // Super Admin bypass (if enabled)
      if (allowSuperAdmin && userRoles.includes('Super Admin')) {
        if (logAccess) {
          logger.info('Super Admin access granted', {
            userId: req.user.id,
            endpoint: req.originalUrl,
            requiredRoles
          });
        }
        return next();
      }

      // Check role requirements
      let hasAccess;
      if (requireAll) {
        hasAccess = requiredRoles.every(role => userRoles.includes(role));
      } else {
        hasAccess = requiredRoles.some(role => userRoles.includes(role));
      }

      if (!hasAccess) {
        if (logAccess) {
          logger.warn('Access denied - insufficient roles', {
            userId: req.user.id,
            userRoles,
            requiredRoles,
            endpoint: req.originalUrl
          });
        }
        
        return errorResponse(res, 'Insufficient permissions', 403, {
          required: requiredRoles,
          current: userRoles,
          requireAll
        });
      }

      if (logAccess) {
        logger.info('Role-based access granted', {
          userId: req.user.id,
          userRoles,
          requiredRoles,
          endpoint: req.originalUrl
        });
      }

      next();
    } catch (error) {
      logger.error('Role authorization error', {
        error: error.message,
        userId: req.user?.id,
        endpoint: req.originalUrl
      });
      
      return errorResponse(res, 'Authorization failed', 500);
    }
  };
};

/**
 * School-specific access control middleware
 * 
 * @description Ensures users can only access resources from schools they're associated with
 * @param {Object} options - Configuration options for school access control
 * @returns {Function} Express middleware function
 */
const requireSchoolAccess = (options = {}) => {
  const {
    paramName = 'schoolId',  // Parameter name containing school ID
    bodyField = 'school_id',  // Body field containing school ID
    queryField = 'school_id',  // Query field containing school ID
    allowSuperAdmin = true,  // Super Admin can access all schools
    strict = false  // If true, requires explicit school association
  } = options;

  return (req, res, next) => {
    try {
      // Extract school ID from various sources
      const schoolId = req.params[paramName] || 
                      req.body[bodyField] || 
                      req.query[queryField];
      
      if (!schoolId) {
        return errorResponse(res, `School ID required (${paramName})`, 400);
      }

      const userSchools = req.user.schools.map(school => school.id);
      const userRoles = req.user.roles.map(role => role.name);
      
      // Super Admin bypass
      if (allowSuperAdmin && userRoles.includes('Super Admin')) {
        req.schoolId = schoolId;
        req.schoolAccess = 'super_admin';
        return next();
      }

      // Check school access
      const hasSchoolAccess = userSchools.includes(schoolId);
      
      if (!hasSchoolAccess) {
        logger.warn('School access denied', {
          userId: req.user.id,
          requestedSchool: schoolId,
          userSchools,
          endpoint: req.originalUrl
        });
        
        return errorResponse(res, 'Access denied to this school', 403, {
          requestedSchool: schoolId,
          accessibleSchools: userSchools
        });
      }

      // Attach school information to request
      req.schoolId = schoolId;
      req.schoolAccess = 'authorized';
      req.userSchoolRole = req.user.roles.find(role => 
        role.schoolId === schoolId
      );

      logger.info('School access granted', {
        userId: req.user.id,
        schoolId,
        role: req.userSchoolRole?.name,
        endpoint: req.originalUrl
      });

      next();
    } catch (error) {
      logger.error('School access control error', {
        error: error.message,
        userId: req.user?.id,
        endpoint: req.originalUrl
      });
      
      return errorResponse(res, 'School access verification failed', 500);
    }
  };
};

/**
 * Permission-based authorization middleware
 * 
 * @description Checks specific permissions rather than roles
 * @param {Array<string>} requiredPermissions - Array of permission names
 * @param {Object} options - Authorization options
 * @returns {Function} Express middleware function
 */
const requirePermission = (requiredPermissions, options = {}) => {
  const { requireAll = false, allowSuperAdmin = true } = options;

  return (req, res, next) => {
    try {
      if (!req.user || !req.user.permissions) {
        return errorResponse(res, 'User authentication required', 403);
      }

      const userPermissions = req.user.permissions.map(perm => perm.name);
      const userRoles = req.user.roles.map(role => role.name);
      
      // Super Admin bypass
      if (allowSuperAdmin && userRoles.includes('Super Admin')) {
        return next();
      }

      // Check permissions
      let hasAccess;
      if (requireAll) {
        hasAccess = requiredPermissions.every(perm => userPermissions.includes(perm));
      } else {
        hasAccess = requiredPermissions.some(perm => userPermissions.includes(perm));
      }

      if (!hasAccess) {
        logger.warn('Access denied - insufficient permissions', {
          userId: req.user.id,
          userPermissions,
          requiredPermissions,
          endpoint: req.originalUrl
        });
        
        return errorResponse(res, 'Insufficient permissions', 403, {
          required: requiredPermissions,
          current: userPermissions
        });
      }

      next();
    } catch (error) {
      logger.error('Permission authorization error', {
        error: error.message,
        userId: req.user?.id
      });
      
      return errorResponse(res, 'Permission check failed', 500);
    }
  };
};

/**
 * Rate limiting middleware for authentication endpoints
 * 
 * @description Prevents brute force attacks on authentication endpoints
 * @param {Object} options - Rate limiting options
 * @returns {Function} Express middleware function
 */
const authRateLimit = (options = {}) => {
  const rateLimit = require('express-rate-limit');
  
  const {
    windowMs = 15 * 60 * 1000, // 15 minutes
    max = 5, // 5 attempts per window
    message = 'Too many authentication attempts, please try again later',
    skipSuccessfulRequests = true
  } = options;

  return rateLimit({
    windowMs,
    max,
    message: { error: message },
    skipSuccessfulRequests,
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) => {
      logger.warn('Rate limit exceeded for authentication', {
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        endpoint: req.originalUrl
      });
      
      return errorResponse(res, message, 429);
    }
  });
};

module.exports = {
  authenticateToken,
  requireRole,
  requireSchoolAccess,
  requirePermission,
  authRateLimit
};