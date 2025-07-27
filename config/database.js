const { Pool } = require('pg');
require('dotenv').config();

// Create a connection configuration for local PostgreSQL
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  // Disable SSL for local PostgreSQL
  ssl: false,
  // Connection pool settings for local development
  max: 10, // Maximum number of clients in the pool
  min: 2, // Minimum number of clients in the pool
  idleTimeoutMillis: 30000, // 30 seconds
  connectionTimeoutMillis: 10000, // 10 seconds
  acquireTimeoutMillis: 10000,
  createTimeoutMillis: 10000,
  destroyTimeoutMillis: 5000,
  reapIntervalMillis: 1000,
  createRetryIntervalMillis: 200,
});

// Enhanced error handling
pool.on('connect', (client) => {
  console.log('✅ New client connected to PostgreSQL database');
});

pool.on('acquire', (client) => {
  console.log('🔄 Client acquired from pool');
});

pool.on('remove', (client) => {
  console.log('🗑️ Client removed from pool');
});

pool.on('error', (err, client) => {
  console.error('❌ Unexpected error on idle client:', err.message);
  // Don't exit process, let the app handle the error gracefully
});

// Simple connection test
const testConnection = async () => {
  let client;
  try {
    console.log('🔄 Testing database connection...');
    client = await pool.connect();
    const result = await client.query('SELECT NOW() as current_time, version() as db_version');
    console.log('✅ Database connection successful:', result.rows[0].current_time);
    console.log('📊 Database version:', result.rows[0].db_version);
    return true;
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    console.error('💡 Make sure PostgreSQL is running and the database "sims" exists');
    return false;
  } finally {
    if (client) {
      client.release();
    }
  }
};

// Test connection on startup
testConnection();

// Graceful shutdown
const gracefulShutdown = async () => {
  console.log('🔄 Gracefully shutting down database connections...');
  try {
    await pool.end();
    console.log('✅ Database connections closed');
  } catch (error) {
    console.error('❌ Error during shutdown:', error.message);
  }
};

process.on('SIGINT', gracefulShutdown);
process.on('SIGTERM', gracefulShutdown);

module.exports = pool;