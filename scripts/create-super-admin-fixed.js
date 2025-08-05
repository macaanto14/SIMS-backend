const pool = require('../config/database');
const { hashPassword } = require('../utils/helpers');
require('dotenv').config();

async function createSuperAdmin() {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    // Super Admin credentials
    const superAdminData = {
      email: process.env.SUPER_ADMIN_EMAIL || 'superadmin@sims.edu',
      password: process.env.SUPER_ADMIN_PASSWORD || 'SuperAdmin@123',
      firstName: 'Super',
      lastName: 'Administrator'
    };
    
    console.log('🔧 Creating Super Admin user...');
    
    // Check if Super Admin already exists
    const existingUser = await client.query(
      'SELECT id FROM users WHERE email = $1',
      [superAdminData.email]
    );
    
    let userId;
    
    if (existingUser.rows.length > 0) {
      userId = existingUser.rows[0].id;
      console.log('✅ Super Admin user already exists');
    } else {
      // Hash password
      const hashedPassword = await hashPassword(superAdminData.password);
      
      // Create Super Admin user - using 'password' instead of 'password_hash'
      const userResult = await client.query(
        `INSERT INTO users (email, password, "firstName", "lastName", active) 
         VALUES ($1, $2, $3, $4, true) RETURNING id`,
        [superAdminData.email, hashedPassword, superAdminData.firstName, superAdminData.lastName]
      );
      
      userId = userResult.rows[0].id;
      console.log('✅ Super Admin user created successfully');
    }
    
    // Get Super Admin role ID
    const roleResult = await client.query(
      "SELECT id FROM roles WHERE name = 'Super Admin'"
    );
    
    if (roleResult.rows.length === 0) {
      throw new Error('Super Admin role not found. Please run the role setup migration first.');
    }
    
    const superAdminRoleId = roleResult.rows[0].id;
    
    // Check if role assignment already exists
    const existingRole = await client.query(
      'SELECT id FROM user_roles WHERE "userId" = $1 AND "roleId" = $2',
      [userId, superAdminRoleId]
    );
    
    if (existingRole.rows.length === 0) {
      // Assign Super Admin role - using camelCase column names
      await client.query(
        `INSERT INTO user_roles ("userId", "roleId", "assignedBy", active) 
         VALUES ($1, $2, $1, true)`,
        [userId, superAdminRoleId]
      );
      console.log('✅ Super Admin role assigned successfully');
    } else {
      console.log('✅ Super Admin role already assigned');
    }
    
    await client.query('COMMIT');
    
    console.log('\n🎉 Super Admin Setup Complete!');
    console.log('📧 Email:', superAdminData.email);
    console.log('🔑 Password:', superAdminData.password);
    console.log('\n⚠️  Please change the default password after first login!');
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Error creating Super Admin:', error.message);
    throw error;
  } finally {
    client.release();
  }
}

// Run if called directly
if (require.main === module) {
  createSuperAdmin()
    .then(() => {
      console.log('✅ Super Admin setup completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Super Admin setup failed:', error);
      process.exit(1);
    });
}

module.exports = createSuperAdmin;