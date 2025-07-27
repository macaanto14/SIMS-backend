const { Pool } = require('pg');
require('dotenv').config();

console.log('🔄 Testing PostgreSQL connection...');
console.log('📍 Database URL:', process.env.DATABASE_URL);

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: false, // Disable SSL for local PostgreSQL
});

async function testConnection() {
  let client;
  try {
    console.log('🔄 Attempting to connect...');
    client = await pool.connect();
    
    console.log('✅ Connection successful!');
    
    // Test basic query
    const result = await client.query('SELECT NOW() as current_time, version() as db_version');
    console.log('⏰ Current time:', result.rows[0].current_time);
    console.log('📊 Database version:', result.rows[0].db_version);
    
    // Test if database exists and has tables
    const tablesResult = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name;
    `);
    
    console.log('📋 Tables in database:', tablesResult.rows.length);
    if (tablesResult.rows.length > 0) {
      console.log('   Tables:', tablesResult.rows.map(row => row.table_name).join(', '));
    } else {
      console.log('   No tables found - database schema needs to be created');
    }
    
    console.log('✅ Database connection test completed successfully!');
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Database connection failed:');
    console.error('   Error:', error.message);
    
    if (error.code === 'ECONNREFUSED') {
      console.error('💡 PostgreSQL server is not running or not accessible');
      console.error('   - Check if PostgreSQL service is started');
      console.error('   - Verify the connection details in .env file');
    } else if (error.code === '3D000') {
      console.error('💡 Database "sims" does not exist');
      console.error('   - Create the database: CREATE DATABASE sims;');
    } else if (error.code === '28P01') {
      console.error('💡 Authentication failed');
      console.error('   - Check username and password in .env file');
    }
    
    process.exit(1);
  } finally {
    if (client) {
      client.release();
    }
    await pool.end();
  }
}

testConnection();