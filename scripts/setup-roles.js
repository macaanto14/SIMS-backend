const pool = require('../config/database');
const fs = require('fs');
const path = require('path');

async function setupRolePermissions() {
  const client = await pool.connect();
  
  try {
    console.log('🔧 Setting up role permissions...');
    
    // Read the SQL file
    const sqlPath = path.join(__dirname, 'setup-role-permissions.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');
    
    // Execute the entire SQL as one block instead of splitting
    // This preserves dollar-quoted strings and complex SQL blocks
    await client.query(sql);
    
    console.log('✅ Role permissions setup completed successfully');
    
  } catch (error) {
    console.error('❌ Error setting up role permissions:', error);
    throw error;
  } finally {
    client.release();
  }
}

// Run if called directly
if (require.main === module) {
  setupRolePermissions()
    .then(() => {
      console.log('✅ Setup completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Setup failed:', error);
      process.exit(1);
    });
}

module.exports = setupRolePermissions;