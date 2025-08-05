const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: false,
});

async function checkUsersTable() {
  let client;
  try {
    client = await pool.connect();
    
    console.log('🔍 Checking users table structure...');
    
    // Check if users table exists
    const tableExists = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'users'
      );
    `);
    
    if (!tableExists.rows[0].exists) {
      console.log('❌ users table does not exist');
      return;
    }
    
    console.log('✅ users table exists');
    
    // Get column information
    const columns = await client.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND table_name = 'users'
      ORDER BY ordinal_position;
    `);
    
    console.log('\n📋 Users table columns:');
    columns.rows.forEach(col => {
      console.log(`   ${col.column_name} (${col.data_type}) - nullable: ${col.is_nullable}`);
    });
    
    // Check specifically for timestamp columns
    const timestampColumns = columns.rows.filter(col => 
      col.column_name.includes('created') || 
      col.column_name.includes('updated') ||
      col.column_name.includes('At')
    );
    
    console.log('\n⏰ Timestamp-related columns:');
    timestampColumns.forEach(col => {
      console.log(`   ${col.column_name} (${col.data_type})`);
    });
    
  } catch (error) {
    console.error('❌ Error checking users table:', error.message);
  } finally {
    if (client) {
      client.release();
    }
    await pool.end();
  }
}

checkUsersTable();