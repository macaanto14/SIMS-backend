require('dotenv').config({ path: '.env.local' });
const { Client } = require('pg');
const bcrypt = require('bcryptjs');

async function createSuperAdmin() {
  console.log('🔄 Using DATABASE_URL:', process.env.DATABASE_URL);
  
  const client = new Client({
    connectionString: process.env.DATABASE_URL
  });

  try {
    await client.connect();
    console.log('🔄 Connected to database');

    const email = process.env.SUPER_ADMIN_EMAIL || 'superadmin@sims.edu';
    const password = process.env.SUPER_ADMIN_PASSWORD || 'SuperAdmin@123';
    const hashedPassword = await bcrypt.hash(password, 12);

    // Check if user already exists
    const existingUser = await client.query(
      'SELECT id FROM users WHERE email = $1',
      [email]
    );

    if (existingUser.rows.length > 0) {
      console.log('ℹ️ Super admin user already exists');
      console.log(`📧 Email: ${email}`);
      console.log(`🔑 Password: ${password}`);
      return;
    }

    // Create the super admin user with correct column names (camelCase)
    const result = await client.query(`
      INSERT INTO users (
        id, email, password, "firstName", "lastName", 
        "isActive", "createdAt", "updatedAt"
      ) VALUES (
        gen_random_uuid(), $1, $2, $3, $4, 
        true, now(), now()
      ) RETURNING id, email
    `, [email, hashedPassword, 'Super', 'Admin']);

    console.log('✅ Super admin user created successfully');
    console.log(`📧 Email: ${email}`);
    console.log(`🔑 Password: ${password}`);
    console.log(`🆔 User ID: ${result.rows[0].id}`);

    // Now create the Super Admin role if it doesn't exist
    const existingRole = await client.query(
      'SELECT id FROM roles WHERE name = $1',
      ['Super Admin']
    );

    let roleId;
    if (existingRole.rows.length === 0) {
      const roleResult = await client.query(`
        INSERT INTO roles (
          id, name, description, level, priority, 
          "isActive", "createdAt", "updatedAt"
        ) VALUES (
          gen_random_uuid(), $1, $2, $3, $4,
          true, now(), now()
        ) RETURNING id
      `, ['Super Admin', 'System Super Administrator with full access', 'SYSTEM', 1000]);
      
      roleId = roleResult.rows[0].id;
      console.log('✅ Super Admin role created');
    } else {
      roleId = existingRole.rows[0].id;
      console.log('ℹ️ Super Admin role already exists');
    }

    // Assign the Super Admin role to the user
    const existingUserRole = await client.query(
      'SELECT id FROM user_roles WHERE "userId" = $1 AND "roleId" = $2',
      [result.rows[0].id, roleId]
    );

    if (existingUserRole.rows.length === 0) {
      await client.query(`
        INSERT INTO user_roles (
          id, "userId", "roleId", "isActive", "createdAt", "updatedAt"
        ) VALUES (
          gen_random_uuid(), $1, $2, true, now(), now()
        )
      `, [result.rows[0].id, roleId]);
      
      console.log('✅ Super Admin role assigned to user');
    } else {
      console.log('ℹ️ User already has Super Admin role');
    }

  } catch (error) {
    console.error('❌ Error creating super admin:', error);
    throw error;
  } finally {
    await client.end();
  }
}

// Run the script
if (require.main === module) {
  createSuperAdmin()
    .then(() => {
      console.log('🎉 Super admin creation completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Super admin creation failed:', error);
      process.exit(1);
    });
}

module.exports = createSuperAdmin;