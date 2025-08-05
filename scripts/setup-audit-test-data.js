/**
 * Script to set up proper test data for audit system testing
 * Creates test user, role, school, and user_role relationships
 */

const pool = require('../config/database');

async function setupAuditTestData() {
  const client = await pool.connect();
  
  try {
    console.log('🔧 Setting up audit test data...');
    
    await client.query('BEGIN');
    
    // 1. Create test user if not exists
    const testUserId = 'test-user-123';
    const userResult = await client.query(`
      INSERT INTO users (id, email, first_name, last_name, is_active)
      VALUES ($1, 'test@example.com', 'Test', 'User', true)
      ON CONFLICT (id) DO UPDATE SET
        email = EXCLUDED.email,
        first_name = EXCLUDED.first_name,
        last_name = EXCLUDED.last_name
      RETURNING id
    `, [testUserId]);
    console.log('✅ Test user created/updated');
    
    // 2. Create test school if not exists
    const testSchoolId = 'test-school-456';
    const schoolResult = await client.query(`
      INSERT INTO schools (id, name, code, address, phone, email, is_active)
      VALUES ($1, 'Test Audit School', 'TAS001', '123 Test Street', '555-0123', 'admin@testschool.com', true)
      ON CONFLICT (id) DO UPDATE SET
        name = EXCLUDED.name,
        code = EXCLUDED.code
      RETURNING id
    `, [testSchoolId]);
    console.log('✅ Test school created/updated');
    
    // 3. Ensure Admin role exists
    const adminRoleResult = await client.query(`
      INSERT INTO roles (name, description, is_system_role)
      VALUES ('Admin', 'System Administrator', true)
      ON CONFLICT (name) DO UPDATE SET
        description = EXCLUDED.description
      RETURNING id
    `);
    const adminRoleId = adminRoleResult.rows[0].id;
    console.log('✅ Admin role ensured');
    
    // 4. Create user_role relationship
    await client.query(`
      INSERT INTO user_roles (user_id, role_id, school_id, is_active)
      VALUES ($1, $2, $3, true)
      ON CONFLICT (user_id, role_id, school_id) DO UPDATE SET
        is_active = true
    `, [testUserId, adminRoleId, testSchoolId]);
    console.log('✅ User role assignment created');
    
    await client.query('COMMIT');
    
    // 5. Test the audit system with proper data
    console.log('\n🧪 Testing audit system with proper test data...');
    
    // Set audit context with existing IDs
    await client.query(`SELECT set_config('audit.user_id', '${testUserId}', false)`);
    await client.query("SELECT set_config('audit.user_email', 'test@example.com', false)");
    await client.query("SELECT set_config('audit.user_role', 'Admin', false)");
    await client.query(`SELECT set_config('audit.school_id', '${testSchoolId}', false)`);
    await client.query("SELECT set_config('audit.ip_address', '192.168.1.100', false)");
    await client.query("SELECT set_config('audit.user_agent', 'Test-Agent/1.0', false)");
    await client.query("SELECT set_config('audit.request_id', 'test-req-789', false)");
    
    // Perform a test operation
    await client.query(`
      UPDATE schools 
      SET address = '456 Updated Test Street' 
      WHERE id = $1
    `, [testSchoolId]);
    
    // Check the latest audit log
    const latestLog = await client.query(`
      SELECT 
        operation_type, table_name, user_email, user_role, 
        school_name, ip_address, user_agent, request_id,
        success, fields_changed, createdAt
      FROM audit_logs 
      ORDER BY createdAt DESC 
      LIMIT 1
    `);
    
    if (latestLog.rows.length > 0) {
      const log = latestLog.rows[0];
      console.log('\n📋 Latest audit log with proper test data:');
      console.log(`   Operation: ${log.operation_type} on ${log.table_name}`);
      console.log(`   User: ${log.user_email} (${log.user_role})`);
      console.log(`   School: ${log.school_name || 'N/A'}`);
      console.log(`   IP: ${log.ip_address}`);
      console.log(`   User Agent: ${log.user_agent}`);
      console.log(`   Request ID: ${log.request_id}`);
      console.log(`   Success: ${log.success}`);
      console.log(`   Fields Changed: ${log.fields_changed}`);
      
      // Check if all fields are properly populated
      const missingFields = [];
      if (!log.user_email) missingFields.push('user_email');
      if (!log.user_role) missingFields.push('user_role');
      if (!log.school_name) missingFields.push('school_name');
      if (!log.ip_address) missingFields.push('ip_address');
      
      if (missingFields.length === 0) {
        console.log('\n🎉 All audit fields are properly populated!');
      } else {
        console.log(`\n⚠️  Missing fields: ${missingFields.join(', ')}`);
      }
    } else {
      console.log('\n⚠️  No audit logs found');
    }
    
    console.log('\n✅ Audit test data setup completed!');
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Error setting up audit test data:', error);
    throw error;
  } finally {
    client.release();
  }
}

async function main() {
  try {
    await setupAuditTestData();
    process.exit(0);
  } catch (error) {
    console.error('Failed to setup audit test data:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = { setupAuditTestData };