const pool = require('../config/database');
const { successResponse, errorResponse, getPaginationParams, buildPaginatedResponse } = require('../utils/helpers');
const AuditContextMiddleware = require('../src/middleware/audit/auditContext');

const getSchools = async (req, res) => {
  try {
    // Simple query without complex filtering for testing
    const result = await pool.query(`
      SELECT id, name, code, address, phone, email, is_active, createdAt
      FROM schools 
      WHERE is_active = true 
      ORDER BY createdAt DESC 
      LIMIT 10
    `);
    
    const schools = result.rows.map(school => ({
      id: school.id,
      name: school.name,
      code: school.code,
      address: school.address,
      phone: school.phone,
      email: school.email,
      isActive: school.is_active,
      createdAt: school.createdAt
    }));
    
    successResponse(res, { schools, total: schools.length });
    
  } catch (error) {
    console.error('Simple get schools error:', error);
    errorResponse(res, `Failed to get schools: ${error.message}`, 500);
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
      createdAt: school.createdAt,
      updatedAt: school.updatedAt,
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
  try {
    // Only Super Admin can create schools
    if (!req.user.roles.some(role => role.roleName === 'Super Admin')) {
      return errorResponse(res, 'Permission denied', 403);
    }
    
    const { name, code, address, phone, email, website, logo_url, principal_id, settings } = req.body;
    
    // Use audit context wrapper for database operations
    const result = await AuditContextMiddleware.executeWithAuditContext(
      async (client) => {
        // Check if school code already exists
        const existingSchool = await client.query('SELECT id FROM schools WHERE code = $1', [code]);
        if (existingSchool.rows.length > 0) {
          throw new Error('School code already exists');
        }
        
        // Create school
        const schoolResult = await client.query(
          `INSERT INTO schools (name, code, address, phone, email, website, logo_url, principal_id, settings)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
           RETURNING *`,
          [name, code, address, phone, email, website, logo_url, principal_id, settings || {}]
        );
        
        return schoolResult.rows[0];
      },
      {
        userId: req.user.id,
        userEmail: req.user.email,
        userRole: req.user.role_name,
        schoolId: req.user.school_id,
        ipAddress: req.ip || req.connection?.remoteAddress,
        userAgent: req.get('User-Agent'),
        requestId: req.auditContext?.requestId,
        operation: 'CREATE_SCHOOL'
      }
    );
    
    successResponse(res, {
      id: result.id,
      name: result.name,
      code: result.code,
      address: result.address,
      phone: result.phone,
      email: result.email,
      website: result.website,
      logoUrl: result.logo_url,
      settings: result.settings,
      createdAt: result.createdAt
    }, 'School created successfully', 201);
    
  } catch (error) {
    console.error('Create school error:', error);
    if (error.message === 'School code already exists') {
      return errorResponse(res, error.message, 409);
    }
    errorResponse(res, 'Failed to create school', 500);
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
    
    // Use audit context wrapper for database operations
    const result = await AuditContextMiddleware.executeWithAuditContext(
      async (client) => {
        const updateResult = await client.query(
          `UPDATE schools 
           SET name = COALESCE($1, name),
               address = COALESCE($2, address),
               phone = COALESCE($3, phone),
               email = COALESCE($4, email),
               website = COALESCE($5, website),
               logo_url = COALESCE($6, logo_url),
               principal_id = COALESCE($7, principal_id),
               settings = COALESCE($8, settings),
               updatedAt = NOW()
           WHERE id = $9 AND is_active = true
           RETURNING *`,
          [name, address, phone, email, website, logo_url, principal_id, settings, id]
        );
        
        if (updateResult.rows.length === 0) {
          throw new Error('School not found');
        }
        
        return updateResult.rows[0];
      },
      {
        userId: req.user.id,
        userEmail: req.user.email,
        userRole: req.user.role_name,
        schoolId: req.user.school_id,
        ipAddress: req.ip || req.connection?.remoteAddress,
        userAgent: req.get('User-Agent'),
        requestId: req.auditContext?.requestId,
        operation: 'UPDATE_SCHOOL'
      }
    );
    
    successResponse(res, {
      id: result.id,
      name: result.name,
      code: result.code,
      address: result.address,
      phone: result.phone,
      email: result.email,
      website: result.website,
      logoUrl: result.logo_url,
      settings: result.settings,
      updatedAt: result.updatedAt
    }, 'School updated successfully');
    
  } catch (error) {
    console.error('Update school error:', error);
    if (error.message === 'School not found') {
      return errorResponse(res, error.message, 404);
    }
    errorResponse(res, 'Failed to update school', 500);
  }
};

module.exports = {
  getSchools,
  getSchoolById,
  createSchool,
  updateSchool
};