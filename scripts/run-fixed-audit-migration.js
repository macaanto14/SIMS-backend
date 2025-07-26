const fs = require('fs');
const { Pool } = require('pg');
require('dotenv').config();

console.log('🔧 Running FIXED Audit Trail Migration...');

async function runFixedAuditMigration() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL
  });

  try {
    console.log('📖 Reading fixed SQL migration file...');
    const sqlContent = fs.readFileSync('./supabase/migrations/create_audit_system_fixed.sql', 'utf8');
    
    console.log('🔄 Executing fixed audit system migration...');
    await pool.query(sqlContent);
    
    console.log('✅ Fixed audit system migration completed successfully!');
    
    // Verify the tables were created
    console.log('🔍 Verifying audit tables...');
    const tablesQuery = `
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN ('audit_logs', 'user_sessions', 'data_access_logs', 'system_events', 'audit_configuration')
      ORDER BY table_name;
    `;
    
    const result = await pool.query(tablesQuery);
    console.log('📊 Created audit tables:', result.rows.map(row => row.table_name));
    
    // Check audit configuration
    const configQuery = 'SELECT table_name, module, is_enabled FROM audit_configuration ORDER BY table_name';
    const configResult = await pool.query(configQuery);
    console.log('⚙️ Audit configurations:', configResult.rows.length, 'tables configured');
    
    console.log('🎉 Audit system is ready!');
    
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    if (error.position) {
      console.error('📍 Error position:', error.position);
    }
    process.exit(1);
  } finally {
    await pool.end();
  }
}

runFixedAuditMigration();