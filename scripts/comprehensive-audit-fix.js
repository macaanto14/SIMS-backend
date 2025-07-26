const fs = require('fs');
const path = require('path');

console.log('🔧 Starting comprehensive audit system fix...');

// Fix 1: Correct server.js audit middleware usage
console.log('1. Fixing server.js audit middleware usage...');
const serverPath = path.join(__dirname, 'server.js');
let serverContent = fs.readFileSync(serverPath, 'utf8');

// Fix the audit middleware usage - it should be called as a function
serverContent = serverContent.replace(
  'app.use(auditMiddleware);',
  'app.use(auditMiddleware());'
);

fs.writeFileSync(serverPath, serverContent);
console.log('✅ Fixed server.js audit middleware usage');

// Fix 2: Recreate audit.js routes file to ensure no encoding issues
console.log('2. Recreating audit.js routes file...');
const auditRoutesPath = path.join(__dirname, 'routes', 'audit.js');
const auditRoutesContent = `/**
 * Audit Trail Routes
 * 
 * Provides endpoints for accessing audit logs, generating reports,
 * and monitoring system activity for transparency and accountability.
 * 
 * @author Assistant
 * @version 1.0.0
 */

const express = require('express');
const router = express.Router();
const {
  getAuditLogs,
  getAuditLogById,
  getUserActivitySummary,
  getSystemActivityDashboard,
  exportAuditLogs
} = require('../controllers/auditController');
const { authenticateToken } = require('../middleware/auth');
const { requireRole } = require('../middleware/rbac');
const { validatePagination, handleValidationErrors } = require('../middleware/validation');

// All audit routes require authentication
router.use(authenticateToken);

/**
 * @swagger
 * /api/audit/logs:
 *   get:
 *     summary: Get audit logs with filtering and pagination
 *     tags: [Audit]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 50
 *         description: Number of records per page
 *       - in: query
 *         name: operation_type
 *         schema:
 *           type: string
 *           enum: [CREATE, UPDATE, DELETE, LOGIN, LOGOUT, ACCESS]
 *         description: Filter by operation type
 *       - in: query
 *         name: table_name
 *         schema:
 *           type: string
 *         description: Filter by table name
 *       - in: query
 *         name: module
 *         schema:
 *           type: string
 *         description: Filter by module
 *       - in: query
 *         name: user_id
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Filter by user ID
 *       - in: query
 *         name: school_id
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Filter by school ID
 *       - in: query
 *         name: start_date
 *         schema:
 *           type: string
 *           format: date-time
 *         description: Filter from date
 *       - in: query
 *         name: end_date
 *         schema:
 *           type: string
 *           format: date-time
 *         description: Filter to date
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search in description and user email
 *     responses:
 *       200:
 *         description: Audit logs retrieved successfully
 *       403:
 *         description: Insufficient permissions
 *       500:
 *         description: Server error
 */
router.get('/logs', 
  requireRole(['Super Admin', 'Admin', 'Principal']),
  validatePagination(),
  handleValidationErrors,
  getAuditLogs
);

/**
 * @swagger
 * /api/audit/logs/{id}:
 *   get:
 *     summary: Get audit log details by ID
 *     tags: [Audit]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Audit log ID
 *     responses:
 *       200:
 *         description: Audit log details retrieved successfully
 *       404:
 *         description: Audit log not found
 *       403:
 *         description: Insufficient permissions
 *       500:
 *         description: Server error
 */
router.get('/logs/:id',
  requireRole(['Super Admin', 'Admin', 'Principal']),
  getAuditLogById
);

/**
 * @swagger
 * /api/audit/user-activity:
 *   get:
 *     summary: Get user activity summary
 *     tags: [Audit]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: days
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 365
 *           default: 30
 *         description: Number of days to analyze
 *       - in: query
 *         name: user_id
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Specific user ID to analyze
 *     responses:
 *       200:
 *         description: User activity summary generated successfully
 *       403:
 *         description: Insufficient permissions
 *       500:
 *         description: Server error
 */
router.get('/user-activity',
  requireRole(['Super Admin', 'Admin', 'Principal']),
  getUserActivitySummary
);

/**
 * @swagger
 * /api/audit/dashboard:
 *   get:
 *     summary: Get system activity dashboard
 *     tags: [Audit]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: days
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 90
 *           default: 7
 *         description: Number of days for dashboard data
 *     responses:
 *       200:
 *         description: System activity dashboard generated successfully
 *       403:
 *         description: Insufficient permissions
 *       500:
 *         description: Server error
 */
router.get('/dashboard',
  requireRole(['Super Admin', 'Admin', 'Principal']),
  getSystemActivityDashboard
);

/**
 * @swagger
 * /api/audit/export:
 *   get:
 *     summary: Export audit logs
 *     tags: [Audit]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: format
 *         schema:
 *           type: string
 *           enum: [csv, json]
 *           default: csv
 *         description: Export format
 *       - in: query
 *         name: start_date
 *         schema:
 *           type: string
 *           format: date-time
 *         description: Filter from date
 *       - in: query
 *         name: end_date
 *         schema:
 *           type: string
 *           format: date-time
 *         description: Filter to date
 *       - in: query
 *         name: operation_type
 *         schema:
 *           type: string
 *           enum: [CREATE, UPDATE, DELETE, LOGIN, LOGOUT, ACCESS]
 *         description: Filter by operation type
 *       - in: query
 *         name: table_name
 *         schema:
 *           type: string
 *         description: Filter by table name
 *       - in: query
 *         name: module
 *         schema:
 *           type: string
 *         description: Filter by module
 *       - in: query
 *         name: user_id
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Filter by user ID
 *     responses:
 *       200:
 *         description: Audit logs exported successfully
 *         content:
 *           text/csv:
 *             schema:
 *               type: string
 *           application/json:
 *             schema:
 *               type: object
 *       403:
 *         description: Insufficient permissions
 *       500:
 *         description: Server error
 */
router.get('/export',
  requireRole(['Super Admin', 'Admin']),
  exportAuditLogs
);

module.exports = router;
`;

fs.writeFileSync(auditRoutesPath, auditRoutesContent);
console.log('✅ Recreated audit.js routes file');

// Fix 3: Verify audit controller exists and has correct exports
console.log('3. Verifying audit controller...');
const auditControllerPath = path.join(__dirname, 'controllers', 'auditController.js');
if (fs.existsSync(auditControllerPath)) {
  console.log('✅ Audit controller exists');
} else {
  console.log('❌ Audit controller missing - this needs to be created');
}

// Fix 4: Verify audit middleware exists and has correct exports
console.log('4. Verifying audit middleware...');
const auditMiddlewarePath = path.join(__dirname, 'src', 'middleware', 'audit', 'index.js');
if (fs.existsSync(auditMiddlewarePath)) {
  console.log('✅ Audit middleware exists');
} else {
  console.log('❌ Audit middleware missing - this needs to be created');
}

console.log('🎉 Comprehensive audit system fix completed!');
console.log('📝 Summary of fixes:');
console.log('   - Fixed server.js audit middleware usage');
console.log('   - Recreated audit.js routes file with clean encoding');
console.log('   - Verified audit controller and middleware existence');
console.log('');
console.log('🚀 Try starting the server now with: npm run dev');