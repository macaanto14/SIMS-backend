const pool = require('../config/database');

/**
 * Role-Based Access Control Middleware
 * Checks if user has required permissions for the requested action
 */

// Cache for user permissions (in production, use Redis)
const permissionCache = new Map();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

/**
 * Get user permissions from database
 */
async function getUserPermissions(userId) {
  const cacheKey = `user_permissions_${userId}`;
  const cached = permissionCache.get(cacheKey);
  
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.permissions;
  }
  
  const result = await pool.query(`
    SELECT DISTINCT p.module, p.action, ur.school_id, r.name as role_name
    FROM user_roles ur
    JOIN roles r ON ur.role_id = r.id
    JOIN role_permissions rp ON r.id = rp.role_id
    JOIN permissions p ON rp.permission_id = p.id
    WHERE ur.user_id = $1 AND ur.is_active = true
    AND (ur.expires_at IS NULL OR ur.expires_at > NOW())
  `, [userId]);
  
  const permissions = result.rows;
  
  // Cache the permissions
  permissionCache.set(cacheKey, {
    permissions,
    timestamp: Date.now()
  });
  
  return permissions;
}

/**
 * Check if user has specific permission
 */
function hasPermission(userPermissions, module, action, schoolId = null) {
  return userPermissions.some(perm => {
    const moduleMatch = perm.module === module;
    const actionMatch = perm.action === action;
    const schoolMatch = !schoolId || !perm.school_id || perm.school_id === schoolId;
    
    return moduleMatch && actionMatch && schoolMatch;
  });
}

/**
 * Check if user has any of the specified roles
 */
function hasRole(userPermissions, roles) {
  const userRoles = [...new Set(userPermissions.map(perm => perm.role_name))];
  return roles.some(role => userRoles.includes(role));
}

/**
 * Middleware factory for permission checking
 */
function requirePermission(module, action) {
  return async (req, res, next) => {
    try {
      if (!req.user || !req.user.id) {
        return res.status(401).json({
          success: false,
          message: 'Authentication required'
        });
      }
      
      const userPermissions = await getUserPermissions(req.user.id);
      const schoolId = req.params.schoolId || req.body.schoolId || req.query.schoolId;
      
      if (hasPermission(userPermissions, module, action, schoolId)) {
        req.userPermissions = userPermissions;
        return next();
      }
      
      return res.status(403).json({
        success: false,
        message: 'Insufficient permissions',
        required: { module, action },
        userRoles: [...new Set(userPermissions.map(perm => perm.role_name))]
      });
      
    } catch (error) {
      console.error('Permission check error:', error);
      return res.status(500).json({
        success: false,
        message: 'Permission check failed'
      });
    }
  };
}

/**
 * Middleware factory for role checking
 */
function requireRole(roles) {
  if (typeof roles === 'string') {
    roles = [roles];
  }
  
  return async (req, res, next) => {
    try {
      if (!req.user || !req.user.id) {
        return res.status(401).json({
          success: false,
          message: 'Authentication required'
        });
      }
      
      const userPermissions = await getUserPermissions(req.user.id);
      
      if (hasRole(userPermissions, roles)) {
        req.userPermissions = userPermissions;
        return next();
      }
      
      return res.status(403).json({
        success: false,
        message: 'Insufficient role permissions',
        required: roles,
        userRoles: [...new Set(userPermissions.map(perm => perm.role_name))]
      });
      
    } catch (error) {
      console.error('Role check error:', error);
      return res.status(500).json({
        success: false,
        message: 'Role check failed'
      });
    }
  };
}

/**
 * Middleware for Super Admin only access
 */
const requireSuperAdmin = requireRole(['Super Admin']);

/**
 * Middleware for Admin level access (Super Admin or Admin)
 */
const requireAdmin = requireRole(['Super Admin', 'Admin']);

/**
 * Clear permission cache for a user (call when roles change)
 */
function clearUserPermissionCache(userId) {
  const cacheKey = `user_permissions_${userId}`;
  permissionCache.delete(cacheKey);
}

/**
 * Get user's school context based on their roles
 */
async function getUserSchoolContext(userId) {
  const result = await pool.query(`
    SELECT DISTINCT ur.school_id, s.name as school_name, r.name as role_name
    FROM user_roles ur
    JOIN roles r ON ur.role_id = r.id
    LEFT JOIN schools s ON ur.school_id = s.id
    WHERE ur.user_id = $1 AND ur.is_active = true
    AND (ur.expires_at IS NULL OR ur.expires_at > NOW())
  `, [userId]);
  
  return result.rows;
}

module.exports = {
  requirePermission,
  requireRole,
  requireSuperAdmin,
  requireAdmin,
  hasPermission,
  hasRole,
  getUserPermissions,
  getUserSchoolContext,
  clearUserPermissionCache
};