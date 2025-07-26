@echo off
echo Running Audit System Migration...
echo.

node -e "
const fs = require('fs');
const { Pool } = require('pg');
require('dotenv').config();

async function runMigration() {
  console.log('🚀 Starting Audit System Migration...');
  
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });
  
  try {
    const migrationSQL = fs.readFileSync('./supabase/migrations/create_audit_system.sql', 'utf8');
    console.log('📖 Migration file loaded');
    
    const client = await pool.connect();
    console.log('🔌 Connected to database');
    
    await client.query('BEGIN');
    console.log('⚡ Executing migration...');
    
    await client.query(migrationSQL);
    await client.query('COMMIT');
    
    console.log('✅ Migration completed successfully!');
    
    // Verify tables
    const tables = await client.query(`
      SELECT table_name FROM information_schema.tables 
      WHERE table_name IN ('audit_logs', 'user_sessions', 'data_access_logs', 'system_events', 'audit_configuration')
    `);
    
    console.log('📋 Created tables:', tables.rows.map(r => r.table_name).join(', '));
    
    client.release();
    await pool.end();
    
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    process.exit(1);
  }
}

runMigration();
"

echo.
echo Migration completed!
pause