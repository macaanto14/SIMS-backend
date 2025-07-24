const pool = require('../config/database');
const { successResponse, errorResponse, getPaginationParams, buildPaginatedResponse } = require('../utils/helpers');

// Academic Years
const getAcademicYears = async (req, res) => {
  try {
    const { page, limit, offset } = getPaginationParams(req);
    const { school_id } = req.query;
    
    if (!school_id) {
      return errorResponse(res, 'School ID is required', 400);
    }
    
    // Check school access
    if (!req.user.roles.some(role => role.roleName === 'Super Admin' || role.schoolId === school_id)) {
      return errorResponse(res, 'Access denied to this school', 403);
    }
    
    const countResult = await pool.query(
      'SELECT COUNT(*) as total FROM academic_years WHERE school_id = $1',
      [school_id]
    );
    const total = parseInt(countResult.rows[0].total);
    
    const academicYearsResult = await pool.query(
      `SELECT * FROM academic_years 
       WHERE school_id = $1 
       ORDER BY start_date DESC 
       LIMIT $2 OFFSET $3`,
      [school_id, limit, offset]
    );
    
    const academicYears = academicYearsResult.rows.map(year => ({
      id: year.id,
      schoolId: year.school_id,
      name: year.name,
      startDate: year.start_date,
      endDate: year.end_date,
      isCurrent: year.is_current,
      createdAt: year.created_at,
      updatedAt: year.updated_at
    }));
    
    const response = buildPaginatedResponse(academicYears, total, page, limit);
    successResponse(res, response);
    
  } catch (error) {
    console.error('Get academic years error:', error);
    errorResponse(res, 'Failed to get academic years', 500);
  }
};

const createAcademicYear = async (req, res) => {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    const { school_id, name, start_date, end_date, is_current } = req.body;
    
    // Check permissions
    if (!req.user.roles.some(role => ['Super Admin', 'Admin'].includes(role.roleName) && 
        (role.roleName === 'Super Admin' || role.schoolId === school_id))) {
      return errorResponse(res, 'Permission denied', 403);
    }
    
    // If setting as current, unset other current academic years for this school
    if (is_current) {
      await client.query(
        'UPDATE academic_years SET is_current = false WHERE school_id = $1',
        [school_id]
      );
    }
    
    const academicYearResult = await client.query(
      `INSERT INTO academic_years (school_id, name, start_date, end_date, is_current)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [school_id, name, start_date, end_date, is_current || false]
    );
    
    const academicYear = academicYearResult.rows[0];
    
    await client.query('COMMIT');
    
    successResponse(res, {
      id: academicYear.id,
      schoolId: academicYear.school_id,
      name: academicYear.name,
      startDate: academicYear.start_date,
      endDate: academicYear.end_date,
      isCurrent: academicYear.is_current,
      createdAt: academicYear.created_at
    }, 'Academic year created successfully', 201);
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Create academic year error:', error);
    errorResponse(res, 'Failed to create academic year', 500);
  } finally {
    client.release();
  }
};

// Classes
const getClasses = async (req, res) => {
  try {
    const { page, limit, offset } = getPaginationParams(req);
    const { school_id, academic_year_id } = req.query;
    
    if (!school_id) {
      return errorResponse(res, 'School ID is required', 400);
    }
    
    // Check school access
    if (!req.user.roles.some(role => role.roleName === 'Super Admin' || role.schoolId === school_id)) {
      return errorResponse(res, 'Access denied to this school', 403);
    }
    
    let whereConditions = ['c.school_id = $1'];
    let queryParams = [school_id];
    let paramCount = 1;
    
    if (academic_year_id) {
      paramCount++;
      whereConditions.push(`c.academic_year_id = $${paramCount}`);
      queryParams.push(academic_year_id);
    }
    
    const whereClause = whereConditions.join(' AND ');
    
    const countResult = await pool.query(
      `SELECT COUNT(*) as total FROM classes c WHERE ${whereClause}`,
      queryParams
    );
    const total = parseInt(countResult.rows[0].total);
    
    const classesResult = await pool.query(
      `SELECT c.*, ay.name as academic_year_name, 
              u.first_name as teacher_first_name, u.last_name as teacher_last_name,
              COUNT(e.id) as student_count
       FROM classes c
       LEFT JOIN academic_years ay ON c.academic_year_id = ay.id
       LEFT JOIN users u ON c.class_teacher_id = u.id
       LEFT JOIN enrollments e ON c.id = e.class_id AND e.status = 'active'
       WHERE ${whereClause}
       GROUP BY c.id, ay.name, u.first_name, u.last_name
       ORDER BY c.grade_level, c.name
       LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}`,
      [...queryParams, limit, offset]
    );
    
    const classes = classesResult.rows.map(cls => ({
      id: cls.id,
      schoolId: cls.school_id,
      academicYearId: cls.academic_year_id,
      academicYearName: cls.academic_year_name,
      name: cls.name,
      gradeLevel: cls.grade_level,
      section: cls.section,
      maxStudents: cls.max_students,
      roomNumber: cls.room_number,
      isActive: cls.is_active,
      studentCount: parseInt(cls.student_count),
      classTeacher: cls.teacher_first_name ? {
        firstName: cls.teacher_first_name,
        lastName: cls.teacher_last_name
      } : null,
      createdAt: cls.created_at,
      updatedAt: cls.updated_at
    }));
    
    const response = buildPaginatedResponse(classes, total, page, limit);
    successResponse(res, response);
    
  } catch (error) {
    console.error('Get classes error:', error);
    errorResponse(res, 'Failed to get classes', 500);
  }
};

const createClass = async (req, res) => {
  try {
    const { school_id, academic_year_id, name, grade_level, section, class_teacher_id, max_students, room_number } = req.body;
    
    // Check permissions
    if (!req.user.roles.some(role => ['Super Admin', 'Admin'].includes(role.roleName) && 
        (role.roleName === 'Super Admin' || role.schoolId === school_id))) {
      return errorResponse(res, 'Permission denied', 403);
    }
    
    const classResult = await pool.query(
      `INSERT INTO classes (school_id, academic_year_id, name, grade_level, section, class_teacher_id, max_students, room_number)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
      [school_id, academic_year_id, name, grade_level, section, class_teacher_id, max_students, room_number]
    );
    
    const newClass = classResult.rows[0];
    
    successResponse(res, {
      id: newClass.id,
      schoolId: newClass.school_id,
      academicYearId: newClass.academic_year_id,
      name: newClass.name,
      gradeLevel: newClass.grade_level,
      section: newClass.section,
      maxStudents: newClass.max_students,
      roomNumber: newClass.room_number,
      createdAt: newClass.created_at
    }, 'Class created successfully', 201);
    
  } catch (error) {
    console.error('Create class error:', error);
    errorResponse(res, 'Failed to create class', 500);
  }
};

// Attendance
const getAttendance = async (req, res) => {
  try {
    const { page, limit, offset } = getPaginationParams(req);
    const { class_id, date, student_id } = req.query;
    
    let whereConditions = ['1=1'];
    let queryParams = [];
    let paramCount = 0;
    
    if (class_id) {
      paramCount++;
      whereConditions.push(`a.class_id = $${paramCount}`);
      queryParams.push(class_id);
    }
    
    if (date) {
      paramCount++;
      whereConditions.push(`a.date = $${paramCount}`);
      queryParams.push(date);
    }
    
    if (student_id) {
      paramCount++;
      whereConditions.push(`a.student_id = $${paramCount}`);
      queryParams.push(student_id);
    }
    
    const whereClause = whereConditions.join(' AND ');
    
    const countResult = await pool.query(
      `SELECT COUNT(*) as total FROM attendance a WHERE ${whereClause}`,
      queryParams
    );
    const total = parseInt(countResult.rows[0].total);
    
    const attendanceResult = await pool.query(
      `SELECT a.*, 
              sp.student_id, u.first_name as student_first_name, u.last_name as student_last_name,
              c.name as class_name, c.grade_level,
              marker.first_name as marked_by_first_name, marker.last_name as marked_by_last_name
       FROM attendance a
       JOIN student_profiles sp ON a.student_id = sp.id
       JOIN users u ON sp.user_id = u.id
       JOIN classes c ON a.class_id = c.id
       JOIN users marker ON a.marked_by = marker.id
       WHERE ${whereClause}
       ORDER BY a.date DESC, u.first_name, u.last_name
       LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}`,
      [...queryParams, limit, offset]
    );
    
    const attendance = attendanceResult.rows.map(record => ({
      id: record.id,
      studentId: record.student_id,
      student: {
        id: record.student_id,
        studentId: record.student_id,
        firstName: record.student_first_name,
        lastName: record.student_last_name
      },
      classId: record.class_id,
      class: {
        id: record.class_id,
        name: record.class_name,
        gradeLevel: record.grade_level
      },
      date: record.date,
      status: record.status,
      notes: record.notes,
      markedBy: {
        firstName: record.marked_by_first_name,
        lastName: record.marked_by_last_name
      },
      createdAt: record.created_at,
      updatedAt: record.updated_at
    }));
    
    const response = buildPaginatedResponse(attendance, total, page, limit);
    successResponse(res, response);
    
  } catch (error) {
    console.error('Get attendance error:', error);
    errorResponse(res, 'Failed to get attendance', 500);
  }
};

const markAttendance = async (req, res) => {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    const { student_id, class_id, date, status, notes } = req.body;
    const marked_by = req.user.id;
    
    // Check if attendance already exists for this student and date
    const existingAttendance = await client.query(
      'SELECT id FROM attendance WHERE student_id = $1 AND date = $2',
      [student_id, date]
    );
    
    let attendanceResult;
    
    if (existingAttendance.rows.length > 0) {
      // Update existing attendance
      attendanceResult = await client.query(
        `UPDATE attendance 
         SET status = $1, notes = $2, marked_by = $3, updated_at = NOW()
         WHERE student_id = $4 AND date = $5
         RETURNING *`,
        [status, notes, marked_by, student_id, date]
      );
    } else {
      // Create new attendance record
      attendanceResult = await client.query(
        `INSERT INTO attendance (student_id, class_id, date, status, notes, marked_by)
         VALUES ($1, $2, $3, $4, $5, $6)
         RETURNING *`,
        [student_id, class_id, date, status, notes, marked_by]
      );
    }
    
    const attendance = attendanceResult.rows[0];
    
    await client.query('COMMIT');
    
    successResponse(res, {
      id: attendance.id,
      studentId: attendance.student_id,
      classId: attendance.class_id,
      date: attendance.date,
      status: attendance.status,
      notes: attendance.notes,
      createdAt: attendance.created_at,
      updatedAt: attendance.updated_at
    }, 'Attendance marked successfully', existingAttendance.rows.length > 0 ? 200 : 201);
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Mark attendance error:', error);
    errorResponse(res, 'Failed to mark attendance', 500);
  } finally {
    client.release();
  }
};

module.exports = {
  getAcademicYears,
  createAcademicYear,
  getClasses,
  createClass,
  getAttendance,
  markAttendance
};