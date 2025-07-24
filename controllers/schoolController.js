const pool = require('../config/database');
const { successResponse, errorResponse, getPaginationParams, buildPaginatedResponse } = require('../utils/helpers');

const getSchools = async (req, res) => {
  try {
    const { page, limit, offset } = getPaginationParams(req);
    const { search } = req.query;
    
    let whereConditions = ['is_active = true'];
    let queryParams = [];
    let paramCount = 0;
    
    if (search) {
      paramCount++;
      whereConditions.push(`(name ILIKE $${paramCount} OR code ILIKE $${paramCount})`);
      queryParams.push(`%${search}%`);
    }
    
    // If not Super Admin, filter by user's schools
    if (!req.user.roles.some(role => role.roleName === 'Super Admin')) {
      const userSchools = req.user.roles.map(role => role.schoolId).filter(Boolean);
      if (userSchools.length > 0) {
        paramCount++;
        whereConditions.push(`id = ANY($${paramCount})`);
        queryParams.push(userSchools);
      } else {
        // User has no school access
        return successResponse(res, buildPaginatedResponse([], 0, page, limit));
      }
    }
    
    const whereClause = whereConditions.join(' AND ');
    
    // Get total count
    const countQuery = `SELECT COUNT(*) as total FROM schools WHERE ${whereClause}`;
    const countResult = await pool.query(countQuery, queryParams);
    const total = parseInt(countResult.rows[0].total);
    
    // Get schools with pagination
    const schoolsQuery = `
      SELECT s.id, s.name, s.code, s.address, s.phone, s.email, s.website, s.logo_url,
             s.is_active, s.created_at, s.updated_at,
             u.first_name as principal_first_name, u.last_name as principal_last_name
      FROM schools s
      LEFT JOIN users u ON s.principal_id = u.id
      WHERE ${whereClause}
      ORDER BY s.created_at DESC
      LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}
    `;
    
    queryParams.push(limit, offset);
    const schoolsResult = await pool.query(schoolsQuery, queryParams);
    
    const schools = schoolsResult.rows.map(school => ({
      id: school.id,
      name: school.name,
      code: school.code,
      address: school.address,
      phone: school.phone,
      email: school.email,
      website: school.website,
      logoUrl: school.logo_url,
      isActive: school.is_active,
      createdAt: school.created_at,
      updatedAt: school.updated_at,
      principal: school.principal_first_name ? {
        firstName: school.principal_first_name,
        lastName: school.principal_last_name
      } : null
    }));
    
    const response = buildPaginatedResponse(schools, total, page, limit);
    successResponse(res, response);
    
  } catch (error) {
    console.error('Get schools error:', error);
    errorResponse(res, 'Failed to get schools', 500);
  }
};

const getSchoolById = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Check access permissions
    if (!req.user.roles.some(role => role.roleName === 'Super Admin' || role.schoolId === id)) {
      return errorResponse(res, 'Access denied to this school', 403);
    }
    
    const schoolResult = await pool.query(
      `SELECT s.*, u.first_name as principal_first_name, u.last_name as principal_last_name,
              u.email as principal_email
       FROM schools s
       LEFT JOIN users u ON s.principal_id = u.id
       WHERE s.id = $1 AND s.is_active = true`,
      [id]
    );
    
    if (schoolResult.rows.length === 0) {
      return errorResponse(res, 'School not found', 404);
    }
    
    const school = schoolResult.rows[0];
    
    successResponse(res, {
      id: school.id,
      name: school.name,
      code: school.code,
      address: school.address,
      phone: school.phone,
      email: school.email,
      website: school.website,
      logoUrl: school.logo_url,
      settings: school.settings,
      isActive: school.is_active,
      createdAt: school.created_at,
      updatedAt: school.updated_at,
      principal: school.principal_first_name ? {
        firstName: school.principal_first_name,
        lastName: school.principal_last_name,
        email: school.principal_email
      } : null
    });
    
  } catch (error) {
    console.error('Get school by ID error:', error);
    errorResponse(res, 'Failed to get school', 500);
  }
};

const createSchool = async (req, res) => {
  const client = await pool.connect();
  
  try {
    // Only Super Admin can create schools
    if (!req.user.roles.some(role => role.roleName === 'Super Admin')) {
      return errorResponse(res, 'Permission denied', 403);
    }
    
    await client.query('BEGIN');
    
    const { name, code, address, phone, email, website, logo_url, principal_id, settings } = req.body;
    
    // Check if school code already exists
    const existingSchool = await client.query('SELECT id FROM schools WHERE code = $1', [code]);
    if (existingSchool.rows.length > 0) {
      return errorResponse(res, 'School code already exists', 409);
    }
    
    // Create school
    const schoolResult = await client.query(
      `INSERT INTO schools (name, code, address, phone, email, website, logo_url, principal_id, settings)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING *`,
      [name, code, address, phone, email, website, logo_url, principal_id, settings || {}]
    );
    
    const school = schoolResult.rows[0];
    
    await client.query('COMMIT');
    
    successResponse(res, {
      id: school.id,
      name: school.name,
      code: school.code,
      address: school.address,
      phone: school.phone,
      email: school.email,
      website: school.website,
      logoUrl: school.logo_url,
      settings: school.settings,
      createdAt: school.created_at
    }, 'School created successfully', 201);
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Create school error:', error);
    errorResponse(res, 'Failed to create school', 500);
  } finally {
    client.release();
  }
};

const updateSchool = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, address, phone, email, website, logo_url, principal_id, settings } = req.body;
    
    // Check permissions
    if (!req.user.roles.some(role => role.roleName === 'Super Admin' || (role.roleName === 'Admin' && role.schoolId === id))) {
      return errorResponse(res, 'Permission denied', 403);
    }
    
    const updateResult = await pool.query(
      `UPDATE schools 
       SET name = COALESCE($1, name),
           address = COALESCE($2, address),
           phone = COALESCE($3, phone),
           email = COALESCE($4, email),
           website = COALESCE($5, website),
           logo_url = COALESCE($6, logo_url),
           principal_id = COALESCE($7, principal_id),
           settings = COALESCE($8, settings),
           updated_at = NOW()
       WHERE id = $9 AND is_active = true
       RETURNING *`,
      [name, address, phone, email, website, logo_url, principal_id, settings, id]
    );
    
    if (updateResult.rows.length === 0) {
      return errorResponse(res, 'School not found', 404);
    }
    
    const school = updateResult.rows[0];
    
    successResponse(res, {
      id: school.id,
      name: school.name,
      code: school.code,
      address: school.address,
      phone: school.phone,
      email: school.email,
      website: school.website,
      logoUrl: school.logo_url,
      settings: school.settings,
      updatedAt: school.updated_at
    }, 'School updated successfully');
    
  } catch (error) {
    console.error('Update school error:', error);
    errorResponse(res, 'Failed to update school', 500);
  }
};

module.exports = {
  getSchools,
  getSchoolById,
  createSchool,
  updateSchool
};