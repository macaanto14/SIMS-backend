const { Pool } = require('pg');
require('dotenv').config();

async function checkAuditTables() {
  console.log('🔍 Checking Audit System Tables...');
  
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });
  
  let client;
  try {
    client = await pool.connect();
    console.log('🔌 Connected to database');
    
    // Check if audit tables exist
    const tablesQuery = `
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_name IN ('audit_logs', 'user_sessions', 'data_access_logs', 'system_events', 'audit_configuration')
      ORDER BY table_name
    `;
    
    const tablesResult = await client.query(tablesQuery);
    console.log('📋 Audit tables found:', tablesResult.rows.length);
    tablesResult.rows.forEach(row => console.log('  ✅', row.table_name));
    
    if (tablesResult.rows.length === 5) {
      console.log('🎉 All audit tables are present!');
      
      // Check audit configuration
      try {
        const configResult = await client.query('SELECT COUNT(*) as count FROM audit_configuration');
        console.log('⚙️ Audit configurations:', configResult.rows[0].count);
      } catch (e) {
        console.log('⚠️ Could not check audit configuration');
      }
      
      // Check triggers
      try {
        const triggersResult = await client.query(`
          SELECT trigger_name, event_object_table 
          FROM information_schema.triggers 
          WHERE trigger_name LIKE 'audit_trigger_%'
        `);
        console.log('🔧 Audit triggers:', triggersResult.rows.length);
      } catch (e) {
        console.log('⚠️ Could not check audit triggers');
      }
      
    } else {
      console.log('❌ Some audit tables are missing. Migration may have failed.');
    }
    
  } catch (error) {
    console.error('❌ Error checking audit tables:', error.message);
  } finally {
    if (client) client.release();
    await pool.end();
  }
}

checkAuditTables();