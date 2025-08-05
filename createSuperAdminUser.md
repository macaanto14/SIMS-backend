node scripts/create-superadmin.js

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

    // Create the super admin user with password column (not password_hash)
    const result = await client.query(`
      INSERT INTO users (
        id, email, password, first_name, last_name, 
        is_active, created_at, updated_at
      ) VALUES (
        gen_random_uuid(), $1, $2, $3, $4, 
        true, now(), now()
      ) RETURNING id, email
    `, [email, hashedPassword, 'Super', 'Admin']);

    console.log('✅ Super admin user created successfully');
    console.log(`📧 Email: ${email}`);
    console.log(`🔑 Password: ${password}`);
    console.log(`🆔 User ID: ${result.rows[0].id}`);

  } catch (error) {
    console.error('❌ Error creating super admin:', error);
    throw error;
  } finally {
    await client.end();
  }
}

// ... existing code ...