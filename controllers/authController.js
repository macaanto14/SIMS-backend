const pool = require('../config/database');
const { hashPassword, comparePassword, generateToken, successResponse, errorResponse } = require('../utils/helpers');
const { clearUserPermissionCache } = require('../middleware/rbac');
const { logAuthEvent, logSystemEvent } = require('../src/middleware/audit');

const register = async (req, res) => {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    const { email, password, first_name, last_name, phone, role, school_id } = req.body;
    
    // Check if user already exists
    const existingUser = await client.query('SELECT id FROM users WHERE email = $1', [email]);
    if (existingUser.rows.length > 0) {
      // Log failed registration attempt
      await logAuthEvent(
        'REGISTER',
        null,
        {
          email,
          reason: 'duplicate_email',
          success: false,
          ipAddress: req.ip,
          userAgent: req.get('User-Agent')
        }
      );
      return errorResponse(res, 'User already exists with this email', 409);
    }
    
    // Validate role if provided
    let roleId = null;
    if (role) {
      const roleResult = await client.query('SELECT id FROM roles WHERE name = $1', [role]);
      if (roleResult.rows.length === 0) {
        await logAuthEvent(
          'REGISTER',
          null,
          {
            email,
            role,
            reason: 'invalid_role',
            success: false,
            ipAddress: req.ip,
            userAgent: req.get('User-Agent')
          }
        );
        return errorResponse(res, 'Invalid role specified', 400);
      }
      roleId = roleResult.rows[0].id;
    }
    
    // Validate school if provided
    if (school_id) {
      const schoolResult = await client.query('SELECT id FROM schools WHERE id = $1 AND is_active = true', [school_id]);
      if (schoolResult.rows.length === 0) {
        await logAuthEvent(
          'REGISTER',
          null,
          {
            email,
            school_id,
            reason: 'invalid_school',
            success: false,
            ipAddress: req.ip,
            userAgent: req.get('User-Agent')
          }
        );
        return errorResponse(res, 'Invalid or inactive school specified', 400);
      }
    }
    
    // Hash password
    const hashedPassword = await hashPassword(password);
    
    // Create user
    const userResult = await client.query(
      `INSERT INTO users (email, password_hash, first_name, last_name, phone) 
       VALUES ($1, $2, $3, $4, $5) RETURNING id, email, first_name, last_name, createdAt`,
      [email, hashedPassword, first_name, last_name, phone]
    );
    
    const user = userResult.rows[0];
    
    // Assign role if provided
    if (roleId) {
      await client.query(
        `INSERT INTO user_roles (user_id, role_id, school_id, assigned_by) 
         VALUES ($1, $2, $3, $1)`,
        [user.id, roleId, school_id]
      );
    }
    
    await client.query('COMMIT');
    
    // Log successful registration
    await logAuthEvent(
      'REGISTER',
      user.id,
      {
        email: user.email,
        role: role || null,
        school_id: school_id || null,
        success: true,
        ipAddress: req.ip,
        userAgent: req.get('User-Agent')
      }
    );
    
    // Generate JWT token
    const token = generateToken({ userId: user.id, email: user.email });
    
    successResponse(res, {
      user: {
        id: user.id,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name,
        createdAt: user.createdAt,
        role: role || null,
        schoolId: school_id || null
      },
      token
    }, 'User registered successfully', 201);
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Registration error:', error);
    
    // Log registration error
    await logAuthEvent(
      'REGISTER',
      null,
      {
        email: req.body.email,
        error: error.message,
        reason: 'system_error',
        success: false,
        ipAddress: req.ip,
        userAgent: req.get('User-Agent')
      }
    );
    
    errorResponse(res, 'Registration failed', 500);
  } finally {
    client.release();
  }
};

const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // Get user with roles and permissions
    const userResult = await pool.query(
      `SELECT u.id, u.email, u.password_hash, u.first_name, u.last_name, u.is_active,
              ur.role_id, r.name as role_name, ur.school_id, s.name as school_name
       FROM users u
       LEFT JOIN user_roles ur ON u.id = ur.user_id AND ur.is_active = true
       LEFT JOIN roles r ON ur.role_id = r.id
       LEFT JOIN schools s ON ur.school_id = s.id
       WHERE u.email = $1`,
      [email]
    );
    
    if (userResult.rows.length === 0) {
      // Log failed login attempt - user not found
      await logAuthEvent(
        'LOGIN',
        null,
        {
          email,
          reason: 'user_not_found',
          success: false,
          ipAddress: req.ip,
          userAgent: req.get('User-Agent')
        }
      );
      return errorResponse(res, 'Invalid credentials', 401);
    }
    
    const user = userResult.rows[0];
    
    if (!user.is_active) {
      // Log failed login attempt - account deactivated
      await logAuthEvent(
        'LOGIN',
        user.id,
        {
          email,
          reason: 'account_deactivated',
          success: false,
          ipAddress: req.ip,
          userAgent: req.get('User-Agent')
        }
      );
      return errorResponse(res, 'Account is deactivated', 401);
    }
    
    // Verify password
    const isValidPassword = await comparePassword(password, user.password_hash);
    if (!isValidPassword) {
      // Log failed login attempt - invalid password
      await logAuthEvent(
        'LOGIN',
        user.id,
        {
          email,
          reason: 'invalid_password',
          success: false,
          ipAddress: req.ip,
          userAgent: req.get('User-Agent')
        }
      );
      return errorResponse(res, 'Invalid credentials', 401);
    }
    
    // Update last login
    await pool.query(
      'UPDATE users SET last_login_at = NOW() WHERE id = $1',
      [user.id]
    );
    
    // Clear any cached permissions
    clearUserPermissionCache(user.id);
    
    // Generate JWT token with role information
    const token = generateToken({ 
      userId: user.id, 
      email: user.email,
      roles: userResult.rows.filter(row => row.role_id).map(row => row.role_name)
    });
    
    // Prepare user roles
    const roles = userResult.rows
      .filter(row => row.role_id)
      .map(row => ({
        roleId: row.role_id,
        roleName: row.role_name,
        schoolId: row.school_id,
        schoolName: row.school_name
      }));
    
    // Log successful login
    await logAuthEvent(
      'LOGIN',
      user.id,
      {
        email: user.email,
        roles: roles.map(r => r.roleName),
        success: true,
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
        sessionStart: new Date()
      }
    );
    
    successResponse(res, {
      user: {
        id: user.id,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name,
        roles
      },
      token
    }, 'Login successful');
    
  } catch (error) {
    console.error('Login error:', error);
    
    // Log login system error
    await logAuthEvent(
      'LOGIN',
      null,
      {
        email: req.body.email,
        error: error.message,
        reason: 'system_error',
        success: false,
        ipAddress: req.ip,
        userAgent: req.get('User-Agent')
      }
    );
    
    errorResponse(res, 'Login failed', 500);
  }
};

const getProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    
    const userResult = await pool.query(
      `SELECT u.id, u.email, u.first_name, u.last_name, u.phone, u.avatar_url, u.createdAt,
              ur.role_id, r.name as role_name, ur.school_id, s.name as school_name,
              COUNT(DISTINCT p.id) as permission_count
       FROM users u
       LEFT JOIN user_roles ur ON u.id = ur.user_id AND ur.is_active = true
       LEFT JOIN roles r ON ur.role_id = r.id
       LEFT JOIN schools s ON ur.school_id = s.id
       LEFT JOIN role_permissions rp ON r.id = rp.role_id
       LEFT JOIN permissions p ON rp.permission_id = p.id
       WHERE u.id = $1
       GROUP BY u.id, u.email, u.first_name, u.last_name, u.phone, u.avatar_url, u.createdAt,
                ur.role_id, r.name, ur.school_id, s.name`,
      [userId]
    );
    
    if (userResult.rows.length === 0) {
      return errorResponse(res, 'User not found', 404);
    }
    
    const user = userResult.rows[0];
    const roles = userResult.rows
      .filter(row => row.role_id)
      .map(row => ({
        roleId: row.role_id,
        roleName: row.role_name,
        schoolId: row.school_id,
        schoolName: row.school_name,
        permissionCount: row.permission_count
      }));
    
    successResponse(res, {
      id: user.id,
      email: user.email,
      firstName: user.first_name,
      lastName: user.last_name,
      phone: user.phone,
      avatarUrl: user.avatar_url,
      createdAt: user.createdAt,
      roles
    });
    
  } catch (error) {
    console.error('Get profile error:', error);
    errorResponse(res, 'Failed to get profile', 500);
  }
};

// New endpoint to assign roles (Super Admin only)
const assignRole = async (req, res) => {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    const { userId, roleId, schoolId, expiresAt } = req.body;
    const assignedBy = req.user.id;
    
    // Validate user exists
    const userResult = await client.query('SELECT id FROM users WHERE id = $1', [userId]);
    if (userResult.rows.length === 0) {
      return errorResponse(res, 'User not found', 404);
    }
    
    // Validate role exists
    const roleResult = await client.query('SELECT id, name FROM roles WHERE id = $1', [roleId]);
    if (roleResult.rows.length === 0) {
      return errorResponse(res, 'Role not found', 404);
    }
    
    // Validate school if provided
    if (schoolId) {
      const schoolResult = await client.query('SELECT id FROM schools WHERE id = $1', [schoolId]);
      if (schoolResult.rows.length === 0) {
        return errorResponse(res, 'School not found', 404);
      }
    }
    
    // Check if role assignment already exists
    const existingRole = await client.query(
      'SELECT id FROM user_roles WHERE user_id = $1 AND role_id = $2 AND school_id = $3',
      [userId, roleId, schoolId]
    );
    
    if (existingRole.rows.length > 0) {
      return errorResponse(res, 'Role already assigned to user for this school', 409);
    }
    
    // Assign role
    await client.query(
      `INSERT INTO user_roles (user_id, role_id, school_id, assigned_by, expires_at) 
       VALUES ($1, $2, $3, $4, $5)`,
      [userId, roleId, schoolId, assignedBy, expiresAt]
    );
    
    // Clear user's permission cache
    clearUserPermissionCache(userId);
    
    await client.query('COMMIT');
    
    successResponse(res, {
      userId,
      roleId,
      roleName: roleResult.rows[0].name,
      schoolId,
      assignedBy,
      expiresAt
    }, 'Role assigned successfully');
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Assign role error:', error);
    errorResponse(res, 'Failed to assign role', 500);
  } finally {
    client.release();
  }
};

const loginSMS = async (req, res) => {
  try {
    const { phoneNumber, code, twilioConfig } = req.body;
    
    // Verify SMS code first
    const phoneHash = phoneValidationService.hashPhoneNumber(phoneNumber);
    
    const verificationResult = await pool.query(
      `SELECT * FROM sms_verifications 
       WHERE phone_number_hash = $1 AND purpose = 'login' AND status = 'verified' 
       AND verified_at > NOW() - INTERVAL '5 minutes'`,
      [phoneHash]
    );
    
    if (verificationResult.rows.length === 0) {
      return errorResponse(res, 'SMS verification required or expired', 401);
    }
    
    // Find user by phone number
    const userResult = await pool.query(
      `SELECT u.id, u.email, u.first_name, u.last_name, u.is_active, u.phone,
              ur.role_id, r.name as role_name, ur.school_id, s.name as school_name
       FROM users u
       LEFT JOIN user_roles ur ON u.id = ur.user_id AND ur.is_active = true
       LEFT JOIN roles r ON ur.role_id = r.id
       LEFT JOIN schools s ON ur.school_id = s.id
       WHERE u.phone = $1 AND u.is_active = true`,
      [phoneNumber]
    );
    
    if (userResult.rows.length === 0) {
      await logAuthEvent('SMS_LOGIN', null, {
        phoneNumber: phoneHash,
        reason: 'user_not_found',
        success: false,
        ipAddress: req.ip,
        userAgent: req.get('User-Agent')
      });
      return errorResponse(res, 'No account found with this phone number', 404);
    }
    
    const user = userResult.rows[0];
    
    // Mark verification as used
    await pool.query(
      `UPDATE sms_verifications SET status = 'used' WHERE phone_number_hash = $1 AND purpose = 'login'`,
      [phoneHash]
    );
    
    // Log successful login
    await logAuthEvent('SMS_LOGIN', user.id, {
      phoneNumber: phoneHash,
      success: true,
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    });
    
    // Generate JWT token
    const token = generateToken({ 
      userId: user.id, 
      email: user.email,
      phone: user.phone 
    });
    
    successResponse(res, {
      user: {
        id: user.id,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name,
        phone: user.phone,
        role: user.role_name,
        schoolId: user.school_id,
        schoolName: user.school_name
      },
      token
    }, 'SMS login successful');
    
  } catch (error) {
    console.error('SMS login error:', error);
    errorResponse(res, 'SMS login failed', 500);
  }
};

const resetPasswordSMS = async (req, res) => {
  try {
    const { phoneNumber, code, newPassword, twilioConfig } = req.body;
    
    // Verify SMS code first
    const phoneHash = phoneValidationService.hashPhoneNumber(phoneNumber);
    
    const verificationResult = await pool.query(
      `SELECT * FROM sms_verifications 
       WHERE phone_number_hash = $1 AND purpose = 'password_reset' AND status = 'verified' 
       AND verified_at > NOW() - INTERVAL '15 minutes'`,
      [phoneHash]
    );
    
    if (verificationResult.rows.length === 0) {
      return errorResponse(res, 'SMS verification required or expired', 401);
    }
    
    // Find user by phone number
    const userResult = await pool.query(
      `SELECT id, email, phone FROM users WHERE phone = $1 AND is_active = true`,
      [phoneNumber]
    );
    
    if (userResult.rows.length === 0) {
      return errorResponse(res, 'No account found with this phone number', 404);
    }
    
    const user = userResult.rows[0];
    
    // Hash new password
    const hashedPassword = await hashPassword(newPassword);
    
    // Update password
    await pool.query(
      `UPDATE users SET password_hash = $1, updatedAt = NOW() WHERE id = $2`,
      [hashedPassword, user.id]
    );
    
    // Mark verification as used
    await pool.query(
      `UPDATE sms_verifications SET status = 'used' WHERE phone_number_hash = $1 AND purpose = 'password_reset'`,
      [phoneHash]
    );
    
    // Log password reset
    await logAuthEvent('PASSWORD_RESET_SMS', user.id, {
      phoneNumber: phoneHash,
      success: true,
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    });
    
    successResponse(res, null, 'Password reset successful');
    
  } catch (error) {
    console.error('SMS password reset error:', error);
    errorResponse(res, 'Password reset failed', 500);
  }
};

module.exports = {
  register,
  login,
  getProfile,
  loginSMS,
  resetPasswordSMS
};