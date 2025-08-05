/**
 * Enhanced Authentication Controller with Role-Based Access
 * Supports comprehensive user role management and login with role selection
 */

const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('../config/database');
const { successResponse, errorResponse } = require('../utils/responseHelper');
const { logAuthEvent } = require('../middleware/audit');
const { clearUserPermissionCache } = require('../middleware/rbac');
const { hashPassword, comparePassword } = require('../utils/passwordHelper');
const { generateToken } = require('../utils/jwtHelper');

/**
 * Get available roles for login selection
 */
const getAvailableRoles = async (req, res) => {
  try {
    const rolesResult = await pool.query(`
      SELECT id, name, description, is_system_role
      FROM roles 
      WHERE name IN ('Super Admin', 'Admin', 'Teacher', 'Student', 'Parent', 'Receptionist', 'Librarian', 'Accountant')
      ORDER BY 
        CASE name
          WHEN 'Super Admin' THEN 1
          WHEN 'Admin' THEN 2
          WHEN 'Teacher' THEN 3
          WHEN 'Student' THEN 4
          WHEN 'Parent' THEN 5
          WHEN 'Receptionist' THEN 6
          WHEN 'Librarian' THEN 7
          WHEN 'Accountant' THEN 8
        END
    `);

    const roles = rolesResult.rows.map(role => ({
      id: role.id,
      name: role.name,
      description: role.description,
      isSystemRole: role.is_system_role
    }));

    successResponse(res, { roles }, 'Available roles retrieved successfully');
  } catch (error) {
    console.error('Get available roles error:', error);
    errorResponse(res, 'Failed to retrieve available roles', 500);
  }
};

/**
 * Enhanced login with role-based authentication
 */
const loginWithRole = async (req, res) => {
  try {
    const { email, password, selectedRole, schoolId } = req.body;
    
    // Get user with all their roles and permissions
    const userResult = await pool.query(`
      SELECT u.id, u.email, u.password_hash, u.first_name, u.last_name, u.is_active,
             ur.role_id, r.name as role_name, ur.school_id, s.name as school_name,
             r.description as role_description
      FROM users u
      LEFT JOIN user_roles ur ON u.id = ur.user_id AND ur.is_active = true
      LEFT JOIN roles r ON ur.role_id = r.id
      LEFT JOIN schools s ON ur.school_id = s.id
      WHERE u.email = $1
    `, [email]);
    
    if (userResult.rows.length === 0) {
      await logAuthEvent('LOGIN', null, {
        email,
        reason: 'user_not_found',
        success: false,
        ipAddress: req.ip,
        userAgent: req.get('User-Agent')
      });
      return errorResponse(res, 'Invalid credentials', 401);
    }
    
    const user = userResult.rows[0];
    
    if (!user.is_active) {
      await logAuthEvent('LOGIN', user.id, {
        email,
        reason: 'account_deactivated',
        success: false,
        ipAddress: req.ip,
        userAgent: req.get('User-Agent')
      });
      return errorResponse(res, 'Account is deactivated', 401);
    }
    
    // Verify password
    const isValidPassword = await comparePassword(password, user.password_hash);
    if (!isValidPassword) {
      await logAuthEvent('LOGIN', user.id, {
        email,
        reason: 'invalid_password',
        success: false,
        ipAddress: req.ip,
        userAgent: req.get('User-Agent')
      });
      return errorResponse(res, 'Invalid credentials', 401);
    }
    
    // Get all user roles
    const userRoles = userResult.rows
      .filter(row => row.role_id)
      .map(row => ({
        roleId: row.role_id,
        roleName: row.role_name,
        roleDescription: row.role_description,
        schoolId: row.school_id,
        schoolName: row.school_name
      }));
    
    // If no role selected, return available roles for selection
    if (!selectedRole) {
      return successResponse(res, {
        requiresRoleSelection: true,
        user: {
          id: user.id,
          email: user.email,
          firstName: user.first_name,
          lastName: user.last_name
        },
        availableRoles: userRoles
      }, 'Please select a role to continue');
    }
    
    // Validate selected role
    const selectedUserRole = userRoles.find(role => 
      role.roleName === selectedRole && 
      (!schoolId || role.schoolId === schoolId)
    );
    
    if (!selectedUserRole) {
      return errorResponse(res, 'Invalid role selection or insufficient permissions', 403);
    }
    
    // Update last login
    await pool.query('UPDATE users SET last_login_at = NOW() WHERE id = $1', [user.id]);
    
    // Clear any cached permissions
    clearUserPermissionCache(user.id);
    
    // Generate JWT token with selected role information
    const token = generateToken({ 
      userId: user.id, 
      email: user.email,
      selectedRole: selectedUserRole.roleName,
      schoolId: selectedUserRole.schoolId
    });
    
    // Log successful login
    await logAuthEvent('LOGIN', user.id, {
      email: user.email,
      selectedRole: selectedUserRole.roleName,
      schoolId: selectedUserRole.schoolId,
      success: true,
      ipAddress: req.ip,
      userAgent: req.get('User-Agent'),
      sessionStart: new Date()
    });
    
    successResponse(res, {
      user: {
        id: user.id,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name,
        selectedRole: selectedUserRole,
        allRoles: userRoles
      },
      token,
      permissions: await getUserPermissions(user.id, selectedUserRole.roleName)
    }, 'Login successful');
    
  } catch (error) {
    console.error('Login with role error:', error);
    
    await logAuthEvent('LOGIN', null, {
      email: req.body.email,
      error: error.message,
      reason: 'system_error',
      success: false,
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    });
    
    errorResponse(res, 'Login failed', 500);
  }
};

/**
 * Get user permissions for selected role
 */
const getUserPermissions = async (userId, roleName) => {
  try {
    const permissionsResult = await pool.query(`
      SELECT DISTINCT p.module, p.action, p.description
      FROM permissions p
      JOIN role_permissions rp ON p.id = rp.permission_id
      JOIN roles r ON rp.role_id = r.id
      JOIN user_roles ur ON r.id = ur.role_id
      WHERE ur.user_id = $1 AND r.name = $2 AND ur.is_active = true
      ORDER BY p.module, p.action
    `, [userId, roleName]);
    
    const permissions = {};
    permissionsResult.rows.forEach(perm => {
      if (!permissions[perm.module]) {
        permissions[perm.module] = [];
      }
      permissions[perm.module].push({
        action: perm.action,
        description: perm.description
      });
    });
    
    return permissions;
  } catch (error) {
    console.error('Get user permissions error:', error);
    return {};
  }
};

/**
 * Switch user role during active session
 */
const switchRole = async (req, res) => {
  try {
    const { selectedRole, schoolId } = req.body;
    const userId = req.user.id;
    
    // Get user's available roles
    const userRolesResult = await pool.query(`
      SELECT ur.role_id, r.name as role_name, ur.school_id, s.name as school_name,
             r.description as role_description
      FROM user_roles ur
      JOIN roles r ON ur.role_id = r.id
      LEFT JOIN schools s ON ur.school_id = s.id
      WHERE ur.user_id = $1 AND ur.is_active = true
    `, [userId]);
    
    const userRoles = userRolesResult.rows.map(row => ({
      roleId: row.role_id,
      roleName: row.role_name,
      roleDescription: row.role_description,
      schoolId: row.school_id,
      schoolName: row.school_name
    }));
    
    // Validate selected role
    const selectedUserRole = userRoles.find(role => 
      role.roleName === selectedRole && 
      (!schoolId || role.schoolId === schoolId)
    );
    
    if (!selectedUserRole) {
      return errorResponse(res, 'Invalid role selection or insufficient permissions', 403);
    }
    
    // Clear cached permissions
    clearUserPermissionCache(userId);
    
    // Generate new token with updated role
    const token = generateToken({ 
      userId: userId, 
      email: req.user.email,
      selectedRole: selectedUserRole.roleName,
      schoolId: selectedUserRole.schoolId
    });
    
    // Log role switch
    await logAuthEvent('ROLE_SWITCH', userId, {
      fromRole: req.user.selectedRole,
      toRole: selectedUserRole.roleName,
      schoolId: selectedUserRole.schoolId,
      success: true,
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    });
    
    successResponse(res, {
      selectedRole: selectedUserRole,
      token,
      permissions: await getUserPermissions(userId, selectedUserRole.roleName)
    }, 'Role switched successfully');
    
  } catch (error) {
    console.error('Switch role error:', error);
    errorResponse(res, 'Failed to switch role', 500);
  }
};

/**
 * Get current user profile with role information
 */
const getProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    
    const userResult = await pool.query(`
      SELECT u.id, u.email, u.first_name, u.last_name, u.phone, u.avatar_url, u.created_at,
             ur.role_id, r.name as role_name, ur.school_id, s.name as school_name,
             r.description as role_description
      FROM users u
      LEFT JOIN user_roles ur ON u.id = ur.user_id AND ur.is_active = true
      LEFT JOIN roles r ON ur.role_id = r.id
      LEFT JOIN schools s ON ur.school_id = s.id
      WHERE u.id = $1
    `, [userId]);
    
    if (userResult.rows.length === 0) {
      return errorResponse(res, 'User not found', 404);
    }
    
    const user = userResult.rows[0];
    const roles = userResult.rows
      .filter(row => row.role_id)
      .map(row => ({
        roleId: row.role_id,
        roleName: row.role_name,
        roleDescription: row.role_description,
        schoolId: row.school_id,
        schoolName: row.school_name
      }));
    
    successResponse(res, {
      id: user.id,
      email: user.email,
      firstName: user.first_name,
      lastName: user.last_name,
      phone: user.phone,
      avatarUrl: user.avatar_url,
      createdAt: user.created_at,
      currentRole: req.user.selectedRole,
      allRoles: roles,
      permissions: await getUserPermissions(userId, req.user.selectedRole || roles[0]?.roleName)
    });
    
  } catch (error) {
    console.error('Get profile error:', error);
    errorResponse(res, 'Failed to get profile', 500);
  }
};

/**
 * Register new user (enhanced version)
 */
const register = async (req, res) => {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    const { email, password, first_name, last_name, phone, school_id, initial_role } = req.body;
    
    // Check if user already exists
    const existingUser = await client.query('SELECT id FROM users WHERE email = $1', [email]);
    if (existingUser.rows.length > 0) {
      await client.query('ROLLBACK');
      return errorResponse(res, 'User already exists with this email', 409);
    }
    
    // Hash password
    const password_hash = await hashPassword(password);
    
    // Create user
    const userResult = await client.query(`
      INSERT INTO users (email, password_hash, first_name, last_name, phone, is_active)
      VALUES ($1, $2, $3, $4, $5, true)
      RETURNING id, email, first_name, last_name, phone, created_at
    `, [email, password_hash, first_name, last_name, phone]);
    
    const user = userResult.rows[0];
    
    // Assign initial role if provided
    if (initial_role && school_id) {
      const roleResult = await client.query('SELECT id FROM roles WHERE name = $1', [initial_role]);
      if (roleResult.rows.length > 0) {
        await client.query(`
          INSERT INTO user_roles (user_id, role_id, school_id, is_active)
          VALUES ($1, $2, $3, true)
        `, [user.id, roleResult.rows[0].id, school_id]);
      }
    }
    
    await client.query('COMMIT');
    
    // Generate token
    const token = generateToken({ 
      userId: user.id, 
      email: user.email 
    });
    
    // Log registration
    await logAuthEvent('REGISTER', user.id, {
      email: user.email,
      initialRole: initial_role,
      schoolId: school_id,
      success: true,
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    });
    
    successResponse(res, {
      user: {
        id: user.id,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name,
        phone: user.phone,
        createdAt: user.created_at
      },
      token
    }, 'User registered successfully', 201);
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Registration error:', error);
    
    await logAuthEvent('REGISTER', null, {
      email: req.body.email,
      error: error.message,
      success: false,
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    });
    
    errorResponse(res, 'Registration failed', 500);
  } finally {
    client.release();
  }
};

module.exports = {
  getAvailableRoles,
  loginWithRole,
  switchRole,
  getProfile,
  register,
  getUserPermissions
};