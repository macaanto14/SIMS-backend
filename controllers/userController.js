const pool = require('../config/database');
const { successResponse, errorResponse, getPaginationParams, buildPaginatedResponse } = require('../utils/helpers');

const getUsers = async (req, res) => {
  try {
    const { page, limit, offset } = getPaginationParams(req);
    const { role, school_id, search } = req.query;
    
    let whereConditions = ['u.is_active = true'];
    let queryParams = [];
    let paramCount = 0;
    
    if (role) {
      paramCount++;
      whereConditions.push(`r.name = $${paramCount}`);
      queryParams.push(role);
    }
    
    if (school_id) {
      paramCount++;
      whereConditions.push(`ur.school_id = $${paramCount}`);
      queryParams.push(school_id);
    }
    
    if (search) {
      paramCount++;
      whereConditions.push(`(u.first_name ILIKE $${paramCount} OR u.last_name ILIKE $${paramCount} OR u.email ILIKE $${paramCount})`);
      queryParams.push(`%${search}%`);
    }
    
    const whereClause = whereConditions.join(' AND ');
    
    // Get total count
    const countQuery = `
      SELECT COUNT(DISTINCT u.id) as total
      FROM users u
      LEFT JOIN user_roles ur ON u.id = ur.user_id AND ur.is_active = true
      LEFT JOIN roles r ON ur.role_id = r.id
      WHERE ${whereClause}
    `;
    
    const countResult = await pool.query(countQuery, queryParams);
    const total = parseInt(countResult.rows[0].total);
    
    // Get users with pagination
    const usersQuery = `
      SELECT DISTINCT u.id, u.email, u.first_name, u.last_name, u.phone, u.avatar_url, u.createdAt,
             array_agg(DISTINCT jsonb_build_object(
               'roleId', ur.role_id,
               'roleName', r.name,
               'schoolId', ur.school_id,
               'schoolName', s.name
             )) FILTER (WHERE ur.role_id IS NOT NULL) as roles
      FROM users u
      LEFT JOIN user_roles ur ON u.id = ur.user_id AND ur.is_active = true
      LEFT JOIN roles r ON ur.role_id = r.id
      LEFT JOIN schools s ON ur.school_id = s.id
      WHERE ${whereClause}
      GROUP BY u.id, u.email, u.first_name, u.last_name, u.phone, u.avatar_url, u.createdAt
      ORDER BY u.createdAt DESC
      LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}
    `;
    
    queryParams.push(limit, offset);
    const usersResult = await pool.query(usersQuery, queryParams);
    
    const users = usersResult.rows.map(user => ({
      id: user.id,
      email: user.email,
      firstName: user.first_name,
      lastName: user.last_name,
      phone: user.phone,
      avatarUrl: user.avatar_url,
      createdAt: user.createdAt,
      roles: user.roles || []
    }));
    
    const response = buildPaginatedResponse(users, total, page, limit);
    successResponse(res, response);
    
  } catch (error) {
    console.error('Get users error:', error);
    errorResponse(res, 'Failed to get users', 500);
  }
};

const getUserById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const userResult = await pool.query(
      `SELECT u.id, u.email, u.first_name, u.last_name, u.phone, u.avatar_url, u.createdAt,
              array_agg(DISTINCT jsonb_build_object(
                'roleId', ur.role_id,
                'roleName', r.name,
                'schoolId', ur.school_id,
                'schoolName', s.name
              )) FILTER (WHERE ur.role_id IS NOT NULL) as roles
       FROM users u
       LEFT JOIN user_roles ur ON u.id = ur.user_id AND ur.is_active = true
       LEFT JOIN roles r ON ur.role_id = r.id
       LEFT JOIN schools s ON ur.school_id = s.id
       WHERE u.id = $1 AND u.is_active = true
       GROUP BY u.id`,
      [id]
    );
    
    if (userResult.rows.length === 0) {
      return errorResponse(res, 'User not found', 404);
    }
    
    const user = userResult.rows[0];
    
    successResponse(res, {
      id: user.id,
      email: user.email,
      firstName: user.first_name,
      lastName: user.last_name,
      phone: user.phone,
      avatarUrl: user.avatar_url,
      createdAt: user.createdAt,
      roles: user.roles || []
    });
    
  } catch (error) {
    console.error('Get user by ID error:', error);
    errorResponse(res, 'Failed to get user', 500);
  }
};

const updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { first_name, last_name, phone, avatar_url } = req.body;
    
    // Check if user exists and user has permission to update
    if (req.user.id !== id && !req.user.roles.some(role => ['Super Admin', 'Admin'].includes(role.roleName))) {
      return errorResponse(res, 'Permission denied', 403);
    }
    
    const updateResult = await pool.query(
      `UPDATE users 
       SET first_name = COALESCE($1, first_name),
           last_name = COALESCE($2, last_name),
           phone = COALESCE($3, phone),
           avatar_url = COALESCE($4, avatar_url),
           updatedAt = NOW()
       WHERE id = $5 AND is_active = true
       RETURNING id, email, first_name, last_name, phone, avatar_url, updatedAt`,
      [first_name, last_name, phone, avatar_url, id]
    );
    
    if (updateResult.rows.length === 0) {
      return errorResponse(res, 'User not found', 404);
    }
    
    const user = updateResult.rows[0];
    
    successResponse(res, {
      id: user.id,
      email: user.email,
      firstName: user.first_name,
      lastName: user.last_name,
      phone: user.phone,
      avatarUrl: user.avatar_url,
      updatedAt: user.updatedAt
    }, 'User updated successfully');
    
  } catch (error) {
    console.error('Update user error:', error);
    errorResponse(res, 'Failed to update user', 500);
  }
};

const deactivateUser = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Only Super Admin and Admin can deactivate users
    if (!req.user.roles.some(role => ['Super Admin', 'Admin'].includes(role.roleName))) {
      return errorResponse(res, 'Permission denied', 403);
    }
    
    const updateResult = await pool.query(
      `UPDATE users 
       SET is_active = false, updatedAt = NOW()
       WHERE id = $1 AND is_active = true
       RETURNING id`,
      [id]
    );
    
    if (updateResult.rows.length === 0) {
      return errorResponse(res, 'User not found', 404);
    }
    
    successResponse(res, { id }, 'User deactivated successfully');
    
  } catch (error) {
    console.error('Deactivate user error:', error);
    errorResponse(res, 'Failed to deactivate user', 500);
  }
};

module.exports = {
  getUsers,
  getUserById,
  updateUser,
  deactivateUser
};