node -e "
const fs = require('fs');
const pool = require('./config/database');

async function setupRoles() {
  try {
    const sql = fs.readFileSync('./scripts/setup-role-permissions.sql', 'utf8');
    await pool.query(sql);
    console.log('✅ Role permissions setup completed');
  } catch (error) {
    console.error('❌ Error setting up roles:', error);
  } finally {
    process.exit();
  }
}

setupRoles();
"