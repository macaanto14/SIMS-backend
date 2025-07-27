const pool = require('../config/database');

async function fixUsersTable() {
  const client = await pool.connect();
  
  try {
    console.log('🔧 Checking and fixing users table structure...');
    
    // Check current structure of users table
    const columnsResult = await client.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_name = 'users' 
      AND table_schema = 'public'
      ORDER BY ordinal_position;
    `);
    
    console.log('📋 Current users table columns:');
    columnsResult.rows.forEach(row => {
      console.log(`  - ${row.column_name}: ${row.data_type} (nullable: ${row.is_nullable})`);
    });
    
    // Check if password_hash column exists
    const hasPasswordHash = columnsResult.rows.some(row => row.column_name === 'password_hash');
    const hasPassword = columnsResult.rows.some(row => row.column_name === 'password');
    
    if (!hasPasswordHash && hasPassword) {
      console.log('🔄 Renaming password column to password_hash...');
      await client.query('ALTER TABLE users RENAME COLUMN password TO password_hash;');
      console.log('✅ Password column renamed to password_hash');
    } else if (!hasPasswordHash && !hasPassword) {
      console.log('🔄 Adding password_hash column...');
      await client.query('ALTER TABLE users ADD COLUMN password_hash varchar(255) NOT NULL DEFAULT \'\';');
      console.log('✅ Password_hash column added');
    } else if (hasPasswordHash) {
      console.log('✅ password_hash column already exists');
    }
    
    // Check if last_login_at column exists (needed for login update)
    const hasLastLoginAt = columnsResult.rows.some(row => row.column_name === 'last_login_at');
    if (!hasLastLoginAt) {
      console.log('🔄 Adding last_login_at column...');
      await client.query('ALTER TABLE users ADD COLUMN last_login_at timestamp with time zone;');
      console.log('✅ last_login_at column added');
    }
    
    // Verify final structure
    const finalResult = await client.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'users' 
      AND table_schema = 'public'
      AND column_name IN ('password_hash', 'last_login_at')
      ORDER BY column_name;
    `);
    
    console.log('📋 Required columns verified:');
    finalResult.rows.forEach(row => {
      console.log(`  ✅ ${row.column_name}: ${row.data_type}`);
    });
    
  } catch (error) {
    console.error('❌ Error fixing users table:', error);
    throw error;
  } finally {
    client.release();
  }
}

// Run if called directly
if (require.main === module) {
  fixUsersTable()
    .then(() => {
      console.log('✅ Users table fix completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Users table fix failed:', error);
      process.exit(1);
    });
}

module.exports = fixUsersTable;