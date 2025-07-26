const fs = require('fs');
const path = require('path');
const pool = require('./config/database'); // Use existing database config

async function runCorrectedAuditMigration() {
  const client = await pool.connect();
  
  try {
    console.log('🚀 Starting corrected audit system migration...');
    
    // Read and execute the corrected SQL file
    const sqlPath = path.join(__dirname, 'supabase', 'migrations', 'create_audit_system_corrected.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');
    
    console.log('📖 Executing corrected audit system SQL...');
    await client.query(sql);
    
    console.log('✅ Corrected audit system migration completed successfully!');
    console.log('The operator error in the audit trigger function has been fixed.');
    
  } catch (error) {
    console.error('❌ Error during migration:', error);
    throw error;
  } finally {
    client.release();
  }
}

runCorrectedAuditMigration()
  .then(() => process.exit(0))
  .catch(() => process.exit(1));