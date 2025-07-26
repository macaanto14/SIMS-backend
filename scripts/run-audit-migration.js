/**
 * Audit System Migration Runner
 * 
 * Executes the comprehensive audit trail system migration
 * to create all necessary tables, triggers, and configurations.
 */

const fs = require('fs');
const path = require('path');
const pool = require('../config/database');

async function runAuditMigration() {
  console.log('🚀 Starting Audit System Migration...\n');
  
  let client;
  try {
    // Read the migration file
    const migrationPath = path.join(__dirname, '../supabase/migrations/create_audit_system.sql');
    console.log('📖 Reading migration file:', migrationPath);
    
    if (!fs.existsSync(migrationPath)) {
      throw new Error(`Migration file not found: ${migrationPath}`);
    }
    
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
    console.log('✅ Migration file loaded successfully\n');
    
    // Connect to database
    console.log('🔌 Connecting to database...');
    client = await pool.connect();
    console.log('✅ Database connection established\n');
    
    // Start transaction
    console.log('🔄 Starting migration transaction...');
    await client.query('BEGIN');
    
    // Execute migration
    console.log('⚡ Executing audit system migration...');
    console.log('   This may take a few moments...\n');
    
    await client.query(migrationSQL);
    
    // Commit transaction
    await client.query('COMMIT');
    console.log('✅ Migration transaction committed successfully\n');
    
    // Verify migration success
    console.log('🔍 Verifying migration results...');
    
    const verificationQueries = [
      {
        name: 'Audit Logs Table',
        query: "SELECT COUNT(*) as count FROM information_schema.tables WHERE table_name = 'audit_logs'"
      },
      {
        name: 'User Sessions Table',
        query: "SELECT COUNT(*) as count FROM information_schema.tables WHERE table_name = 'user_sessions'"
      },
      {
        name: 'Data Access Logs Table',
        query: "SELECT COUNT(*) as count FROM information_schema.tables WHERE table_name = 'data_access_logs'"
      },
      {
        name: 'System Events Table',
        query: "SELECT COUNT(*) as count FROM information_schema.tables WHERE table_name = 'system_events'"
      },
      {
        name: 'Audit Configuration Table',
        query: "SELECT COUNT(*) as count FROM information_schema.tables WHERE table_name = 'audit_configuration'"
      },
      {
        name: 'Audit Configuration Records',
        query: "SELECT COUNT(*) as count FROM audit_configuration"
      },
      {
        name: 'Audit Triggers',
        query: "SELECT COUNT(*) as count FROM information_schema.triggers WHERE trigger_name LIKE 'audit_trigger_%'"
      }
    ];
    
    for (const verification of verificationQueries) {
      try {
        const result = await client.query(verification.query);
        const count = parseInt(result.rows[0].count);
        console.log(`   ✅ ${verification.name}: ${count > 0 ? '✓' : '✗'} (${count})`);
      } catch (error) {
        console.log(`   ❌ ${verification.name}: Error - ${error.message}`);
      }
    }
    
    console.log('\n🎉 Audit System Migration Completed Successfully!');
    console.log('\n📋 Migration Summary:');
    console.log('   • Audit Logs Table - Tracks all system operations');
    console.log('   • User Sessions Table - Manages user login sessions');
    console.log('   • Data Access Logs Table - Tracks sensitive data access');
    console.log('   • System Events Table - Logs system-level events');
    console.log('   • Audit Configuration Table - Manages audit settings');
    console.log('   • Audit Triggers - Automatic logging for database changes');
    console.log('   • Audit Views - Pre-built reporting views');
    console.log('   • Cleanup Functions - Automated log retention management');
    
    console.log('\n🔧 Next Steps:');
    console.log('   1. Update server.js to include audit middleware and routes');
    console.log('   2. Test audit endpoints using the API documentation');
    console.log('   3. Configure audit retention policies as needed');
    console.log('   4. Integrate audit helpers into existing controllers');
    
  } catch (error) {
    console.error('\n❌ Migration Failed:', error.message);
    
    if (client) {
      try {
        await client.query('ROLLBACK');
        console.log('🔄 Transaction rolled back');
      } catch (rollbackError) {
        console.error('❌ Rollback failed:', rollbackError.message);
      }
    }
    
    console.log('\n🔧 Troubleshooting:');
    console.log('   • Check database connection settings');
    console.log('   • Verify database permissions');
    console.log('   • Ensure all referenced tables exist');
    console.log('   • Check for syntax errors in migration file');
    
    process.exit(1);
  } finally {
    if (client) {
      client.release();
      console.log('\n🔌 Database connection released');
    }
  }
}

// Handle process termination
process.on('SIGINT', () => {
  console.log('\n⚠️ Migration interrupted by user');
  process.exit(1);
});

process.on('SIGTERM', () => {
  console.log('\n⚠️ Migration terminated');
  process.exit(1);
});

// Run migration
if (require.main === module) {
  runAuditMigration()
    .then(() => {
      console.log('\n✨ Migration script completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n💥 Migration script failed:', error.message);
      process.exit(1);
    });
}

module.exports = { runAuditMigration };