const pool = require('../config/database');

async function fixSMSRateLimitsTable() {
  const client = await pool.connect();
  
  try {
    console.log('🔧 Fixing SMS rate limits table...');
    
    await client.query('BEGIN');
    
    // First, check if the table exists and what its structure is
    const tableCheck = await client.query(`
      SELECT column_name, data_type, column_default, is_nullable
      FROM information_schema.columns 
      WHERE table_name = 'sms_rate_limits' 
      ORDER BY ordinal_position;
    `);
    
    if (tableCheck.rows.length > 0) {
      console.log('📋 Current table structure:');
      tableCheck.rows.forEach(row => {
        console.log(`  ${row.column_name}: ${row.data_type} (default: ${row.column_default}, nullable: ${row.is_nullable})`);
      });
      
      // Drop the existing table
      console.log('🗑️  Dropping existing sms_rate_limits table...');
      await client.query('DROP TABLE IF EXISTS sms_rate_limits CASCADE');
    }
    
    // Check if gen_random_uuid() function exists
    const uuidCheck = await client.query(`
      SELECT EXISTS(
        SELECT 1 FROM pg_proc 
        WHERE proname = 'gen_random_uuid'
      ) as has_gen_random_uuid;
    `);
    
    const hasGenRandomUuid = uuidCheck.rows[0].has_gen_random_uuid;
    console.log(`🔍 gen_random_uuid() function available: ${hasGenRandomUuid}`);
    
    // Enable uuid-ossp extension if gen_random_uuid is not available
    if (!hasGenRandomUuid) {
      console.log('🔧 Enabling uuid-ossp extension...');
      try {
        await client.query('CREATE EXTENSION IF NOT EXISTS "uuid-ossp"');
        console.log('✅ uuid-ossp extension enabled');
      } catch (error) {
        console.log('⚠️  Could not enable uuid-ossp extension, using alternative approach');
      }
    }
    
    // Create the table with proper UUID generation
    console.log('🏗️  Creating new sms_rate_limits table...');
    
    const createTableSQL = hasGenRandomUuid ? `
      CREATE TABLE sms_rate_limits (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        identifier VARCHAR(64) NOT NULL,
        limit_type VARCHAR(10) CHECK (limit_type IN ('phone', 'ip', 'global', 'purpose')),
        purpose VARCHAR(50),
        count INTEGER DEFAULT 0,
        window_start TIMESTAMP,
        expires_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        
        UNIQUE (identifier, limit_type, purpose)
      );
    ` : `
      CREATE TABLE sms_rate_limits (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        identifier VARCHAR(64) NOT NULL,
        limit_type VARCHAR(10) CHECK (limit_type IN ('phone', 'ip', 'global', 'purpose')),
        purpose VARCHAR(50),
        count INTEGER DEFAULT 0,
        window_start TIMESTAMP,
        expires_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        
        UNIQUE (identifier, limit_type, purpose)
      );
    `;
    
    await client.query(createTableSQL);
    
    // Create indexes
    console.log('📊 Creating indexes...');
    await client.query('CREATE INDEX IF NOT EXISTS idx_sms_rate_limits_expires ON sms_rate_limits (expires_at)');
    await client.query('CREATE INDEX IF NOT EXISTS idx_sms_rate_limits_identifier ON sms_rate_limits (identifier, limit_type)');
    await client.query('CREATE INDEX IF NOT EXISTS idx_sms_rate_limits_type_purpose ON sms_rate_limits (limit_type, purpose)');
    
    // Test the table by inserting a test record
    console.log('🧪 Testing table with a sample insert...');
    const testResult = await client.query(`
      INSERT INTO sms_rate_limits (identifier, limit_type, count, window_start, expires_at)
      VALUES ('test_identifier', 'phone', 1, NOW(), NOW() + INTERVAL '15 minutes')
      RETURNING id, identifier, limit_type;
    `);
    
    console.log('✅ Test insert successful:', testResult.rows[0]);
    
    // Clean up test record
    await client.query('DELETE FROM sms_rate_limits WHERE identifier = $1', ['test_identifier']);
    
    await client.query('COMMIT');
    
    console.log('🎉 SMS rate limits table fixed successfully!');
    
    // Verify the fix
    const verifyResult = await client.query(`
      SELECT column_name, data_type, column_default, is_nullable
      FROM information_schema.columns 
      WHERE table_name = 'sms_rate_limits' AND column_name = 'id';
    `);
    
    if (verifyResult.rows.length > 0) {
      const idColumn = verifyResult.rows[0];
      console.log('✅ ID column configuration:');
      console.log(`   Type: ${idColumn.data_type}`);
      console.log(`   Default: ${idColumn.column_default}`);
      console.log(`   Nullable: ${idColumn.is_nullable}`);
    }
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Failed to fix SMS rate limits table:', error);
    throw error;
  } finally {
    client.release();
  }
}

if (require.main === module) {
  fixSMSRateLimitsTable()
    .then(() => {
      console.log('🏁 Fix completed successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Fix failed:', error);
      process.exit(1);
    });
}

module.exports = fixSMSRateLimitsTable;