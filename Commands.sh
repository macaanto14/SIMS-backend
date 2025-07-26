npm run setup:superadmin

npm run setup:rbac


# Check if Schools Table Has Data

node -e "
const pool = require('./config/database');
pool.query('SELECT id, name, is_active FROM schools LIMIT 5')
  .then(result => {
    console.log('Schools data:', result.rows);
    process.exit(0);
  })
  .catch(error => {
    console.error('Database error:', error.message);
    process.exit(1);
  });
"

# Database Connection Test
node -e "
const pool = require('./config/database');
pool.query('SELECT COUNT(*) FROM schools')
  .then(result => {
    console.log('Schools count:', result.rows[0].count);
    process.exit(0);
  })
  .catch(error => {
    console.error('Database error:', error.message);
    process.exit(1);
  });
"


✅ Correct endpoint: GET {{base_url}}/api/schools
🔑 Authentication: Bearer token required
📝 Headers: Authorization: Bearer YOUR_JWT_TOKEN

# Use the fixed SQL file:
node run-fixed-audit-migration.js

# Run migration for Audit

node run-corrected-audit-migration.js