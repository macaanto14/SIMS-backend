const pool = require('../config/database');
const { hashPassword, comparePassword, generateToken, successResponse, errorResponse } = require('../utils/helpers');

const register = async (req, res) => {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    const { email, password, first_name, last_name, phone } = req.body;
    
    // Check if user already exists
    const existingUser = await client.query('SELECT id FROM users WHERE email = $1', [email]);
    if (existingUser.rows.length > 0) {
      return errorResponse(res, 'User already exists with this email', 409);
    }
    
    // Hash password
    const hashedPassword = await hashPassword(password);
    
    // Create user
    const userResult = await client.query(
      `INSERT INTO users (email, password_hash, first_name, last_name, phone) 
       VALUES ($1, $2, $3, $4, $5) RETURNING id, email, first_name, last_name, created_at`,
      [email, hashedPassword, first_name, last_name, phone]
    );
    
    const user = userResult.rows[0];
    
    await client.query('COMMIT');
    
    // Generate JWT token
    const token = generateToken({ userId: user.id, email: user.email });
    
    successResponse(res, {
      user: {
        id: user.id,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name,
        createdAt: user.created_at
      },
      token
    }, 'User registered successfully', 201);
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Registration error:', error);
    errorResponse(res, 'Registration failed', 500);
  } finally {
    client.release();
  }
};

const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // Get user with password hash
    const userResult = await pool.query(
      `SELECT u.id, u.email, u.password_hash, u.first_name, u.last_name, u.is_active,
              ur.role_id, r.name as role_name, ur.school_id
       FROM users u
       LEFT JOIN user_roles ur ON u.id = ur.user_id AND ur.is_active = true
       LEFT JOIN roles r ON ur.role_id = r.id
       WHERE u.email = $1`,
      [email]
    );
    
    if (userResult.rows.length === 0) {
      return errorResponse(res, 'Invalid credentials', 401);
    }
    
    const user = userResult.rows[0];
    
    if (!user.is_active) {
      return errorResponse(res, 'Account is deactivated', 401);
    }
    
    // Verify password
    const isValidPassword = await comparePassword(password, user.password_hash);
    if (!isValidPassword) {
      return errorResponse(res, 'Invalid credentials', 401);
    }
    
    // Update last login
    await pool.query(
      'UPDATE users SET last_login_at = NOW() WHERE id = $1',
      [user.id]
    );
    
    // Generate JWT token
    const token = generateToken({ userId: user.id, email: user.email });
    
    // Prepare user roles
    const roles = userResult.rows
      .filter(row => row.role_id)
      .map(row => ({
        roleId: row.role_id,
        roleName: row.role_name,
        schoolId: row.school_id
      }));
    
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
    errorResponse(res, 'Login failed', 500);
  }
};

const getProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    
    const userResult = await pool.query(
      `SELECT u.id, u.email, u.first_name, u.last_name, u.phone, u.avatar_url, u.created_at,
              ur.role_id, r.name as role_name, ur.school_id, s.name as school_name
       FROM users u
       LEFT JOIN user_roles ur ON u.id = ur.user_id AND ur.is_active = true
       LEFT JOIN roles r ON ur.role_id = r.id
       LEFT JOIN schools s ON ur.school_id = s.id
       WHERE u.id = $1`,
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
      roles
    });
    
  } catch (error) {
    console.error('Get profile error:', error);
    errorResponse(res, 'Failed to get profile', 500);
  }
};

module.exports = {
  register,
  login,
  getProfile
};