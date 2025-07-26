const fs = require('fs');
const { Pool } = require('pg');
require('dotenv').config();

async function runAuditMigration() {
  console.log('🚀 Starting Audit System Migration...');
  
  // Create database pool
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });
  
  let client;
  try {
    // Read migration file
    const migrationSQL = fs.readFileSync('./supabase/migrations/create_audit_system.sql', 'utf8');
    console.log('📖 Migration file loaded successfully');
    
    // Connect to database
    client = await pool.connect();
    console.log('🔌 Connected to database');
    
    // Execute migration
    console.log('⚡ Executing audit system migration...');
    await client.query(migrationSQL);
    console.log('✅ Migration executed successfully');
    
    // Verify tables were created
    const verifyQuery = `
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_name IN ('audit_logs', 'user_sessions', 'data_access_logs', 'system_events', 'audit_configuration')
      ORDER BY table_name
    `;
    
    const result = await client.query(verifyQuery);
    console.log('📋 Created tables:', result.rows.map(r => r.table_name).join(', '));
    
    // Check audit configuration
    const configResult = await client.query('SELECT COUNT(*) as count FROM audit_configuration');
    console.log('⚙️ Audit configurations created:', configResult.rows[0].count);
    
    console.log('🎉 Audit System Migration Completed Successfully!');
    
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    if (error.detail) console.error('Details:', error.detail);
    process.exit(1);
  } finally {
    if (client) client.release();
    await pool.end();
  }
}

runAuditMigration();