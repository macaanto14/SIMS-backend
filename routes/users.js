const express = require('express');
const router = express.Router();
const { getUsers, getUserById, updateUser, deactivateUser } = require('../controllers/userController');
const { authenticateToken, requireRole } = require('../middleware/auth');
const { validateUUID, validatePagination, handleValidationErrors } = require('../middleware/validation');

// All routes require authentication
router.use(authenticateToken);

// Get users with filtering and pagination
router.get('/', validatePagination(), handleValidationErrors, getUsers);

// Get user by ID
router.get('/:id', validateUUID('id'), handleValidationErrors, getUserById);

// Update user (users can update their own profile, admins can update any)
router.put('/:id', validateUUID('id'), handleValidationErrors, updateUser);

// Deactivate user (Admin and Super Admin only)
router.delete('/:id', 
  validateUUID('id'), 
  handleValidationErrors, 
  requireRole(['Super Admin', 'Admin']), 
  deactivateUser
);

module.exports = router;