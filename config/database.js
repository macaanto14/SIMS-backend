const { Pool } = require('pg');
require('dotenv').config();

// Create a more robust connection configuration for Supabase
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  },
  // Reduced pool size for Supabase stability
  max: 5, // Much smaller pool size
  min: 1, // Keep at least 1 connection
  idleTimeoutMillis: 10000, // 10 seconds - shorter idle timeout
  connectionTimeoutMillis: 5000, // 5 seconds - shorter connection timeout
  acquireTimeoutMillis: 5000,
  createTimeoutMillis: 5000,
  destroyTimeoutMillis: 3000,
  reapIntervalMillis: 1000,
  createRetryIntervalMillis: 100,
  // Additional Supabase-specific settings
  keepAlive: false, // Disable keep-alive for pooler
  statement_timeout: 30000, // 30 second statement timeout
  query_timeout: 30000, // 30 second query timeout
});

// Enhanced error handling
pool.on('connect', (client) => {
  console.log('✅ New client connected to PostgreSQL database');
  // Set session timeout for this connection
  client.query('SET statement_timeout = 30000');
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

// Simple connection test without keeping connection open
const testConnection = async () => {
  let client;
  try {
    console.log('🔄 Testing database connection...');
    client = await pool.connect();
    const result = await client.query('SELECT NOW() as current_time');
    console.log('✅ Database connection successful:', result.rows[0].current_time);
    return true;
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
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