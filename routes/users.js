const express = require('express');
const router = express.Router();
const { requirePermission, requireRole, requireSuperAdmin } = require('../middleware/rbac');
const { authenticateToken } = require('../middleware/auth');

// Example: Only Super Admin can create users
router.post('/', authenticateToken, requireSuperAdmin, (req, res) => {
  res.json({ message: 'Create user endpoint - Super Admin only' });
});

// Example: Admin or Super Admin can view users
router.get('/', authenticateToken, requireRole(['Super Admin', 'Admin']), (req, res) => {
  res.json({ message: 'Get users endpoint - Admin or Super Admin' });
});

// Example: Teachers can read student information
router.get('/students', authenticateToken, requirePermission('students', 'read'), (req, res) => {
  res.json({ message: 'Get students endpoint - Teachers with read permission' });
});

// Example: Only Accountants can collect fees
router.post('/fees/collect', authenticateToken, requirePermission('finance', 'collect_fees'), (req, res) => {
  res.json({ message: 'Collect fees endpoint - Accountants only' });
});

module.exports = router;