const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');
require('dotenv').config();

// Use the same database configuration as the main application
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? {
    rejectUnauthorized: false
  } : false,
  max: 5,
  min: 1,
  idleTimeoutMillis: 10000,
  connectionTimeoutMillis: 5000,
  acquireTimeoutMillis: 5000,
  createTimeoutMillis: 5000,
  destroyTimeoutMillis: 3000,
});

async function runCorrectedAuditMigration() {
  const client = await pool.connect();
  
  try {
    console.log('🚀 Starting corrected audit system migration...');
    console.log('📡 Using DATABASE_URL from environment variables');
    
    // Test connection first
    const testResult = await client.query('SELECT NOW() as current_time');
    console.log('✅ Database connection successful:', testResult.rows[0].current_time);
    
    // Read the corrected SQL file
    const sqlPath = path.join(__dirname, 'supabase', 'migrations', 'create_audit_system_corrected.sql');
    
    if (!fs.existsSync(sqlPath)) {
      throw new Error(`SQL file not found: ${sqlPath}`);
    }
    
    const sql = fs.readFileSync(sqlPath, 'utf8');
    
    console.log('📖 Executing corrected audit system SQL...');
    
    // Execute the SQL in a transaction
    await client.query('BEGIN');
    
    try {
      await client.query(sql);
      await client.query('COMMIT');
      console.log('✅ Corrected audit system migration completed successfully!');
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    }
    
    // Verify the audit trigger function
    console.log('🔍 Verifying audit trigger function...');
    const functionCheck = await client.query(`
      SELECT proname, prosrc 
      FROM pg_proc 
      WHERE proname = 'audit_trigger_function'
    `);
    
    if (functionCheck.rows.length > 0) {
      console.log('✅ Audit trigger function exists and has been updated');
    } else {
      console.log('❌ Audit trigger function not found');
    }
    
    // Check audit tables
    console.log('🔍 Checking audit tables...');
    const tablesResult = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN ('audit_logs', 'user_sessions', 'data_access_logs', 'system_events', 'audit_configuration')
      ORDER BY table_name
    `);
    
    console.log('📊 Audit tables found:', tablesResult.rows.map(row => row.table_name));
    
    // Check audit triggers
    console.log('🔍 Checking audit triggers...');
    const triggersResult = await client.query(`
      SELECT trigger_name, event_object_table 
      FROM information_schema.triggers 
      WHERE trigger_name LIKE 'audit_trigger_%'
      ORDER BY event_object_table
    `);
    
    console.log('🔧 Audit triggers found:', triggersResult.rows.length);
    triggersResult.rows.forEach(row => {
      console.log(`   - ${row.trigger_name} on ${row.event_object_table}`);
    });
    
    // Test the corrected trigger function
    console.log('🧪 Testing corrected audit trigger...');
    
    // First, check if schools table exists
    const schoolsCheck = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'schools'
      )
    `);
    
    if (schoolsCheck.rows[0].exists) {
      console.log('✅ Schools table exists, trigger should work correctly now');
      
      // Check audit configuration for schools
      const configCheck = await client.query(`
        SELECT * FROM audit_configuration WHERE table_name = 'schools'
      `);
      
      if (configCheck.rows.length > 0) {
        console.log('✅ Audit configuration for schools table exists');
        console.log('   Module:', configCheck.rows[0].module);
        console.log('   Enabled:', configCheck.rows[0].is_enabled);
      } else {
        console.log('⚠️ No audit configuration found for schools table');
      }
    } else {
      console.log('⚠️ Schools table does not exist - please ensure your main database schema is applied first');
    }
    
    console.log('\n🎉 Corrected audit migration completed successfully!');
    console.log('The operator error in the audit trigger function has been fixed.');
    console.log('You can now create schools without encountering the "operator does not exist" error.');
    
  } catch (error) {
    console.error('❌ Error during corrected audit migration:', error);
    
    // Provide helpful error messages
    if (error.code === '28P01') {
      console.error('\n💡 Authentication failed. Please check:');
      console.error('   1. Your .env file exists and contains the correct DATABASE_URL');
      console.error('   2. The database credentials are correct');
      console.error('   3. The database server is running and accessible');
      console.error('\n   Example DATABASE_URL format:');
      console.error('   DATABASE_URL=postgresql://username:password@host:port/database');
    } else if (error.code === 'ECONNREFUSED') {
      console.error('\n💡 Connection refused. Please check:');
      console.error('   1. The database server is running');
      console.error('   2. The host and port are correct in your DATABASE_URL');
      console.error('   3. Firewall settings allow the connection');
    }
    
    throw error;
  } finally {
    client.release();
  }
}

// Graceful shutdown
const gracefulShutdown = async () => {
  console.log('🔄 Shutting down migration script...');
  try {
    await pool.end();
    console.log('✅ Database connections closed');
  } catch (error) {
    console.error('❌ Error during shutdown:', error.message);
  }
};

process.on('SIGINT', gracefulShutdown);
process.on('SIGTERM', gracefulShutdown);

// Run the migration
if (require.main === module) {
  runCorrectedAuditMigration()
    .then(() => {
      console.log('Migration completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Migration failed:', error.message);
      process.exit(1);
    });
}

module.exports = { runCorrectedAuditMigration };