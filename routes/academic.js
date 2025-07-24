const express = require('express');
const router = express.Router();
const { 
  getAcademicYears, 
  createAcademicYear, 
  getClasses, 
  createClass, 
  getAttendance, 
  markAttendance 
} = require('../controllers/academicController');
const { authenticateToken, requireRole } = require('../middleware/auth');
const { 
  validateAcademicYear, 
  validateClass, 
  validateAttendance, 
  validatePagination, 
  handleValidationErrors 
} = require('../middleware/validation');

// All routes require authentication
router.use(authenticateToken);

// Academic Years
router.get('/academic-years', validatePagination(), handleValidationErrors, getAcademicYears);
router.post('/academic-years', 
  validateAcademicYear(), 
  handleValidationErrors, 
  requireRole(['Super Admin', 'Admin']), 
  createAcademicYear
);

// Classes
router.get('/classes', validatePagination(), handleValidationErrors, getClasses);
router.post('/classes', 
  validateClass(), 
  handleValidationErrors, 
  requireRole(['Super Admin', 'Admin']), 
  createClass
);

// Attendance
router.get('/attendance', validatePagination(), handleValidationErrors, getAttendance);
router.post('/attendance', 
  validateAttendance(), 
  handleValidationErrors, 
  requireRole(['Super Admin', 'Admin', 'Teacher']), 
  markAttendance
);

module.exports = router;