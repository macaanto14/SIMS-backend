const jwt = require('jsonwebtoken');
const pool = require('../config/database');

const authenticateToken = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  
  if (!authHeader) {
    return res.status(401).json({ 
      success: false,
      error: 'Authorization header missing',
      message: 'Please provide Authorization header with Bearer token'
    });
  }

  if (!authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ 
      success: false,
      error: 'Invalid authorization format',
      message: 'Authorization header must start with "Bearer "'
    });
  }

  const token = authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ 
      success: false,
      error: 'Access token required',
      message: 'Token missing after Bearer'
    });
  }

  // Basic token format validation
  const tokenParts = token.split('.');
  if (tokenParts.length !== 3) {
    return res.status(401).json({ 
      success: false,
      error: 'Malformed token',
      message: 'JWT token must have 3 parts separated by dots',
      debug: {
        tokenLength: token.length,
        parts: tokenParts.length,
        tokenStart: token.substring(0, 20) + '...'
      }
    });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Get user details from database
    const userQuery = `
      SELECT u.*, ur.role_id, r.name as role_name, ur.school_id
      FROM users u
      LEFT JOIN user_roles ur ON u.id = ur.user_id AND ur.is_active = true
      LEFT JOIN roles r ON ur.role_id = r.id
      WHERE u.id = $1 AND u.is_active = true
    `;
    
    const result = await pool.query(userQuery, [decoded.userId]);
    
    if (result.rows.length === 0) {
      return res.status(401).json({ 
        success: false,
        error: 'Invalid token',
        message: 'User not found or inactive'
      });
    }

    req.user = {
      id: result.rows[0].id,
      email: result.rows[0].email,
      firstName: result.rows[0].first_name,
      lastName: result.rows[0].last_name,
      roles: result.rows.map(row => ({
        roleId: row.role_id,
        roleName: row.role_name,
        schoolId: row.school_id
      })).filter(role => role.roleId)
    };

    next();
  } catch (error) {
    console.error('Token verification error:', error);
    
    let errorMessage = 'Invalid token';
    let errorDetails = {};

    if (error.name === 'JsonWebTokenError') {
      errorMessage = 'Malformed or invalid JWT token';
      errorDetails = {
        reason: error.message,
        tokenStart: token.substring(0, 20) + '...'
      };
    } else if (error.name === 'TokenExpiredError') {
      errorMessage = 'Token has expired';
      errorDetails = {
        expiredAt: error.expiredAt
      };
    } else if (error.name === 'NotBeforeError') {
      errorMessage = 'Token not active yet';
      errorDetails = {
        date: error.date
      };
    }

    return res.status(403).json({ 
      success: false,
      error: errorMessage,
      details: errorDetails
    });
  }
};

const requireRole = (requiredRoles) => {
  return (req, res, next) => {
    if (!req.user || !req.user.roles) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const userRoles = req.user.roles.map(role => role.roleName);
    const hasRequiredRole = requiredRoles.some(role => userRoles.includes(role));

    if (!hasRequiredRole) {
      return res.status(403).json({ 
        error: 'Insufficient permissions',
        required: requiredRoles,
        current: userRoles
      });
    }

    next();
  };
};

const requireSchoolAccess = (req, res, next) => {
  const schoolId = req.params.schoolId || req.body.school_id || req.query.school_id;
  
  if (!schoolId) {
    return res.status(400).json({ error: 'School ID required' });
  }

  const userSchools = req.user.roles.map(role => role.schoolId).filter(Boolean);
  const isSuperAdmin = req.user.roles.some(role => role.roleName === 'Super Admin');

  if (!isSuperAdmin && !userSchools.includes(schoolId)) {
    return res.status(403).json({ error: 'Access denied to this school' });
  }

  req.schoolId = schoolId;
  next();
};

module.exports = {
  authenticateToken,
  requireRole,
  requireSchoolAccess
};