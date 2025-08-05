const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: false,
});

async function checkUserRolesTable() {
  let client;
  try {
    client = await pool.connect();
    
    console.log('🔍 Checking user_roles table structure...');
    
    // Check if table exists
    const tableExists = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'user_roles'
      );
    `);
    
    if (!tableExists.rows[0].exists) {
      console.log('❌ user_roles table does not exist!');
      return;
    }
    
    console.log('✅ user_roles table exists');
    
    // Get column information
    const columns = await client.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND table_name = 'user_roles'
      ORDER BY ordinal_position;
    `);
    
    console.log('📋 Columns in user_roles table:');
    columns.rows.forEach(col => {
      console.log(`   - ${col.column_name} (${col.data_type}) ${col.is_nullable === 'NO' ? 'NOT NULL' : 'NULL'}`);
    });
    
    // Check for specific columns we expect
    const expectedColumns = ['user_id', 'role_id', 'school_id'];
    expectedColumns.forEach(colName => {
      const exists = columns.rows.some(col => col.column_name === colName);
      console.log(`   ${exists ? '✅' : '❌'} ${colName}: ${exists ? 'EXISTS' : 'MISSING'}`);
    });
    
  } catch (error) {
    console.error('❌ Error checking table:', error.message);
  } finally {
    if (client) {
      client.release();
    }
    await pool.end();
  }
}

checkUserRolesTable();