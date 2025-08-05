const { Pool } = require('pg');
require('dotenv').config();

console.log('🔄 Creating fresh database pool for debug server...');

// Create a fresh connection pool for debug server
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: false,
  max: 5, // Smaller pool for debug
  min: 1,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
  acquireTimeoutMillis: 10000,
  createTimeoutMillis: 10000,
  destroyTimeoutMillis: 5000,
  reapIntervalMillis: 1000,
  createRetryIntervalMillis: 200,
});

// Enhanced error handling
pool.on('connect', (client) => {
  console.log('✅ Debug server: New client connected to PostgreSQL');
});

pool.on('error', (err, client) => {
  console.error('❌ Debug server: Unexpected error on idle client:', err.message);
});

// Test connection immediately
const testConnection = async () => {
  let client;
  try {
    console.log('🔄 Debug server: Testing database connection...');
    client = await pool.connect();
    const result = await client.query('SELECT NOW() as current_time');
    console.log('✅ Debug server: Database connection successful:', result.rows[0].current_time);
    return true;
  } catch (error) {
    console.error('❌ Debug server: Database connection failed:', error.message);
    return false;
  } finally {
    if (client) {
      client.release();
    }
  }
};

// Test connection on startup
testConnection();

module.exports = pool;