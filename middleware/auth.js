const jwt = require('jsonwebtoken');
const pool = require('../config/database');

const authenticateToken = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
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
      return res.status(401).json({ error: 'Invalid token' });
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
    return res.status(403).json({ error: 'Invalid token' });
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