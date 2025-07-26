/**
 * Script to backfill missing audit data
 * Populates null user_email, user_role, school_name, etc. from related tables
 */

const pool = require('../config/database');

async function backfillAuditData() {
  const client = await pool.connect();
  
  try {
    console.log('🔄 Starting audit data backfill...');
    
    await client.query('BEGIN');
    
    // 1. Update user_email and user_role from users table
    console.log('📧 Updating user_email and user_role...');
    const userUpdateResult = await client.query(`
      UPDATE audit_logs 
      SET 
        user_email = u.email,
        user_role = ur.role_name
      FROM users u
      LEFT JOIN user_roles ur ON u.id = ur.user_id
      WHERE audit_logs.user_id = u.id 
        AND (audit_logs.user_email IS NULL OR audit_logs.user_role IS NULL)
    `);
    console.log(`✅ Updated ${userUpdateResult.rowCount} records with user info`);
    
    // 2. Update school_name from schools table
    console.log('🏫 Updating school_name...');
    const schoolUpdateResult = await client.query(`
      UPDATE audit_logs 
      SET school_name = s.name
      FROM schools s
      WHERE audit_logs.school_id = s.id 
        AND audit_logs.school_name IS NULL
    `);
    console.log(`✅ Updated ${schoolUpdateResult.rowCount} records with school names`);
    
    // 3. For schools table operations, extract school_name from new_values or old_values
    console.log('🏫 Extracting school names from schools table operations...');
    const schoolsTableResult = await client.query(`
      UPDATE audit_logs 
      SET school_name = COALESCE(
        new_values->>'name',
        old_values->>'name'
      )
      WHERE table_name = 'schools' 
        AND school_name IS NULL
        AND (new_values->>'name' IS NOT NULL OR old_values->>'name' IS NOT NULL)
    `);
    console.log(`✅ Updated ${schoolsTableResult.rowCount} school records with extracted names`);
    
    // 4. Set default values for remaining null fields
    console.log('🔧 Setting default values for remaining null fields...');
    const defaultsResult = await client.query(`
      UPDATE audit_logs 
      SET 
        success = COALESCE(success, true),
        fields_changed = COALESCE(fields_changed, 0),
        ip_address = COALESCE(ip_address, '127.0.0.1'::inet),
        user_agent = COALESCE(user_agent, 'System'),
        request_id = COALESCE(request_id, 'backfill_' || id::text)
      WHERE success IS NULL 
        OR fields_changed IS NULL 
        OR ip_address IS NULL 
        OR user_agent IS NULL 
        OR request_id IS NULL
    `);
    console.log(`✅ Updated ${defaultsResult.rowCount} records with default values`);
    
    // 5. Calculate fields_changed for UPDATE operations
    console.log('📊 Calculating fields_changed for UPDATE operations...');
    const fieldsChangedResult = await client.query(`
      UPDATE audit_logs 
      SET fields_changed = COALESCE(array_length(changed_fields, 1), 0)
      WHERE operation_type = 'UPDATE' 
        AND changed_fields IS NOT NULL 
        AND (fields_changed IS NULL OR fields_changed = 0)
    `);
    console.log(`✅ Updated ${fieldsChangedResult.rowCount} UPDATE records with fields_changed count`);
    
    await client.query('COMMIT');
    
    // 6. Show summary of current audit data
    console.log('\n📊 Audit Data Summary:');
    
    const summary = await client.query(`
      SELECT 
        COUNT(*) as total_logs,
        COUNT(user_email) as logs_with_user_email,
        COUNT(user_role) as logs_with_user_role,
        COUNT(school_name) as logs_with_school_name,
        COUNT(ip_address) as logs_with_ip_address,
        COUNT(CASE WHEN user_email IS NULL THEN 1 END) as missing_user_email,
        COUNT(CASE WHEN user_role IS NULL THEN 1 END) as missing_user_role,
        COUNT(CASE WHEN school_name IS NULL THEN 1 END) as missing_school_name,
        COUNT(CASE WHEN ip_address IS NULL THEN 1 END) as missing_ip_address
      FROM audit_logs
    `);
    
    const stats = summary.rows[0];
    console.log(`Total audit logs: ${stats.total_logs}`);
    console.log(`Logs with user_email: ${stats.logs_with_user_email} (${stats.missing_user_email} missing)`);
    console.log(`Logs with user_role: ${stats.logs_with_user_role} (${stats.missing_user_role} missing)`);
    console.log(`Logs with school_name: ${stats.logs_with_school_name} (${stats.missing_school_name} missing)`);
    console.log(`Logs with ip_address: ${stats.logs_with_ip_address} (${stats.missing_ip_address} missing)`);
    
    console.log('\n✅ Audit data backfill completed successfully!');
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Error during audit data backfill:', error);
    throw error;
  } finally {
    client.release();
  }
}

async function main() {
  try {
    await backfillAuditData();
    process.exit(0);
  } catch (error) {
    console.error('Failed to backfill audit data:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = { backfillAuditData };