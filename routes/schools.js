const express = require('express');
const router = express.Router();
const { getSchools, getSchoolById, createSchool, updateSchool } = require('../controllers/schoolController');
const { authenticateToken, requireRole } = require('../middleware/auth');
const { validateUUID, validateSchool, validatePagination, handleValidationErrors } = require('../middleware/validation');

// All routes require authentication
router.use(authenticateToken);

// Get schools with filtering and pagination
router.get('/', validatePagination(), handleValidationErrors, getSchools);

// Get school by ID
router.get('/:id', validateUUID('id'), handleValidationErrors, getSchoolById);

// Create school (Super Admin only)
router.post('/', 
  validateSchool(), 
  handleValidationErrors, 
  requireRole(['Super Admin']), 
  createSchool
);

// Update school (Super Admin and school Admin)
router.put('/:id', 
  validateUUID('id'), 
  handleValidationErrors, 
  updateSchool
);

module.exports = router;