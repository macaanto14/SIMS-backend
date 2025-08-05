const express = require('express');
const router = express.Router();
const { getSchools, getSchoolById, createSchool, updateSchool } = require('../controllers/schoolController');
// Temporarily comment out authentication
// const { authenticateToken, requireRole } = require('../middleware/auth');
const { validateUUID, validateSchool, validatePagination, handleValidationErrors } = require('../middleware/validation');

// Temporarily remove authentication requirement
// router.use(authenticateToken);

// Get schools with filtering and pagination
router.get('/', validatePagination(), handleValidationErrors, getSchools);

// Get school by ID
router.get('/:id', validateUUID('id'), handleValidationErrors, getSchoolById);

// Create school (temporarily without auth)
router.post('/', 
  validateSchool(), 
  handleValidationErrors, 
  // requireRole(['Super Admin']), // Temporarily disabled
  createSchool
);

// Update school (temporarily without auth)
router.put('/:id', 
  validateUUID('id'), 
  handleValidationErrors, 
  updateSchool
);

module.exports = router;