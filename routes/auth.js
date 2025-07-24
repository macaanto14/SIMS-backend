const express = require('express');
const router = express.Router();
const { register, login, getProfile } = require('../controllers/authController');
const { authenticateToken } = require('../middleware/auth');
const { validateUserRegistration, validateUserLogin, handleValidationErrors } = require('../middleware/validation');

// Public routes
router.post('/register', validateUserRegistration(), handleValidationErrors, register);
router.post('/login', validateUserLogin(), handleValidationErrors, login);

// Protected routes
router.get('/profile', authenticateToken, getProfile);

module.exports = router;