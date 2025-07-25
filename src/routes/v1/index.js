/**
 * API Routes Index - Version 1
 * 
 * This module serves as the main router for all API v1 endpoints.
 * It provides centralized route management with consistent middleware
 * application and comprehensive documentation.
 * 
 * @author Ismail Mohamed 
 * @version 2.0.0
 */

const express = require('express');
const router = express.Router();

// Import route modules
const authRoutes = require('./auth');
const userRoutes = require('./users');
const schoolRoutes = require('./schools');
const academicRoutes = require('./academic');
const studentRoutes = require('./students');
const teacherRoutes = require('./teachers');
const classRoutes = require('./classes');
const attendanceRoutes = require('./attendance');
const gradeRoutes = require('./grades');
const financeRoutes = require('./finance');
const libraryRoutes = require('./library');
const reportRoutes = require('./reports');
const notificationRoutes = require('./notifications');

// Import middleware
const { authenticateToken } = require('../../middleware/auth');
const { requestLogger } = require('../../middleware/logging');
const { rateLimiter } = require('../../middleware/security');

// Apply global middleware for all API routes
router.use(requestLogger);
router.use(rateLimiter);

// Public routes (no authentication required)
router.use('/auth', authRoutes);

// Protected routes (authentication required)
router.use('/users', authenticateToken, userRoutes);
router.use('/schools', authenticateToken, schoolRoutes);
router.use('/academic', authenticateToken, academicRoutes);
router.use('/students', authenticateToken, studentRoutes);
router.use('/teachers', authenticateToken, teacherRoutes);
router.use('/classes', authenticateToken, classRoutes);
router.use('/attendance', authenticateToken, attendanceRoutes);
router.use('/grades', authenticateToken, gradeRoutes);
router.use('/finance', authenticateToken, financeRoutes);
router.use('/library', authenticateToken, libraryRoutes);
router.use('/reports', authenticateToken, reportRoutes);
router.use('/notifications', authenticateToken, notificationRoutes);

// API health check endpoint
router.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    environment: process.env.NODE_ENV || 'development'
  });
});

// API documentation endpoint
router.get('/docs', (req, res) => {
  res.json({
    message: 'SIMS API Documentation',
    version: '1.0.0',
    endpoints: {
      auth: '/api/v1/auth',
      users: '/api/v1/users',
      schools: '/api/v1/schools',
      academic: '/api/v1/academic',
      students: '/api/v1/students',
      teachers: '/api/v1/teachers',
      classes: '/api/v1/classes',
      attendance: '/api/v1/attendance',
      grades: '/api/v1/grades',
      finance: '/api/v1/finance',
      library: '/api/v1/library',
      reports: '/api/v1/reports',
      notifications: '/api/v1/notifications'
    },
    documentation: 'https://docs.sims.example.com'
  });
});

module.exports = router;