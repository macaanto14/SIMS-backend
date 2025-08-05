/**
 * Script to run the complete audit enhancement
 * 1. Updates the audit trigger function
 * 2. Backfills existing audit data
 * 3. Tests the enhanced audit system
 */

const pool = require('../config/database');
const fs = require('fs').promises;
const path = require('path');
const { backfillAuditData } = require('./backfill-audit-data');

async function runAuditEnhancement() {
  const client = await pool.connect();
  
  try {
    console.log('🚀 Starting audit system enhancement...');
    
    // 1. Read and execute the enhanced audit trigger SQL
    console.log('📝 Updating audit trigger function...');
    const sqlPath = path.join(__dirname, '..', 'supabase', 'migrations', 'update_audit_trigger_enhanced.sql');
    const sql = await fs.readFile(sqlPath, 'utf8');
    
    await client.query(sql);
    console.log('✅ Audit trigger function updated successfully');
    
    // 2. Backfill existing audit data
    console.log('\n🔄 Backfilling existing audit data...');
    await backfillAuditData();
    
    // 3. Test the enhanced audit system
    console.log('\n🧪 Testing enhanced audit system...');
    await testEnhancedAuditSystem(client);
    
    console.log('\n🎉 Audit system enhancement completed successfully!');
    
  } catch (error) {
    console.error('❌ Error during audit enhancement:', error);
    throw error;
  } finally {
    client.release();
  }
}

async function testEnhancedAuditSystem(client) {
  try {
    // Set test audit context
    await client.query("SELECT set_config('audit.user_id', 'test-user-123', false)");
    await client.query("SELECT set_config('audit.user_email', 'test@example.com', false)");
    await client.query("SELECT set_config('audit.user_role', 'Admin', false)");
    await client.query("SELECT set_config('audit.school_id', 'test-school-456', false)");
    await client.query("SELECT set_config('audit.ip_address', '192.168.1.100', false)");
    await client.query("SELECT set_config('audit.user_agent', 'Test-Agent/1.0', false)");
    await client.query("SELECT set_config('audit.request_id', 'test-req-789', false)");
    
    // Count audit logs before test
    const beforeCount = await client.query('SELECT COUNT(*) FROM audit_logs');
    const initialCount = parseInt(beforeCount.rows[0].count);
    
    // Test with schools table if it exists
    const schoolsExists = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = 'schools'
      )
    `);
    
    if (schoolsExists.rows[0].exists) {
      // Insert a test school
      await client.query(`
        INSERT INTO schools (name, code, address, phone, email) 
        VALUES ('Test Audit School', 'TAS001', '123 Test St', '555-0123', 'test@school.com')
      `);
      
      console.log('✅ Test school created');
    } else {
      console.log('⚠️  Schools table not found, skipping school test');
    }
    
    // Count audit logs after test
    const afterCount = await client.query('SELECT COUNT(*) FROM audit_logs');
    const finalCount = parseInt(afterCount.rows[0].count);
    
    if (finalCount > initialCount) {
      // Check the latest audit log
      const latestLog = await client.query(`
        SELECT 
          operation_type, table_name, user_email, user_role, 
          school_name, ip_address, user_agent, request_id,
          success, fields_changed
        FROM audit_logs 
        ORDER BY createdAt DESC 
        LIMIT 1
      `);
      
      const log = latestLog.rows[0];
      console.log('📋 Latest audit log:');
      console.log(`   Operation: ${log.operation_type} on ${log.table_name}`);
      console.log(`   User: ${log.user_email} (${log.user_role})`);
      console.log(`   School: ${log.school_name || 'N/A'}`);
      console.log(`   IP: ${log.ip_address}`);
      console.log(`   User Agent: ${log.user_agent}`);
      console.log(`   Request ID: ${log.request_id}`);
      console.log(`   Success: ${log.success}`);
      console.log(`   Fields Changed: ${log.fields_changed}`);
      
      if (log.user_email && log.ip_address && log.request_id) {
        console.log('✅ Enhanced audit system is working correctly!');
      } else {
        console.log('⚠️  Some audit fields are still missing');
      }
    } else {
      console.log('⚠️  No new audit logs created during test');
    }
    
    // Clean up test data
    if (schoolsExists.rows[0].exists) {
      await client.query("DELETE FROM schools WHERE name = 'Test Audit School'");
      console.log('🧹 Test data cleaned up');
    }
    
  } catch (error) {
    console.error('❌ Error during audit system test:', error);
    throw error;
  }
}

async function main() {
  try {
    await runAuditEnhancement();
    process.exit(0);
  } catch (error) {
    console.error('Failed to enhance audit system:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = { runAuditEnhancement };