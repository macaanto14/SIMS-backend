const pool = require('../config/database');

async function fixSMSVerificationsTable() {
  const client = await pool.connect();
  
  try {
    console.log('🔧 Fixing SMS verifications table...');
    
    await client.query('BEGIN');
    
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
        console.log('⚠️  Could not enable uuid-ossp extension, will use manual UUID generation');
      }
    }
    
    // Check current table structure
    const tableCheck = await client.query(`
      SELECT column_name, data_type, column_default, is_nullable
      FROM information_schema.columns 
      WHERE table_name = 'sms_verifications' 
      ORDER BY ordinal_position;
    `);
    
    if (tableCheck.rows.length > 0) {
      console.log('📋 Current sms_verifications table structure:');
      tableCheck.rows.forEach(row => {
        console.log(`  ${row.column_name}: ${row.data_type} (default: ${row.column_default}, nullable: ${row.is_nullable})`);
      });
      
      // Check if the ID column has proper default
      const idColumn = tableCheck.rows.find(row => row.column_name === 'id');
      if (idColumn && (!idColumn.column_default || idColumn.column_default === 'null')) {
        console.log('⚠️  ID column missing proper UUID default, fixing...');
        
        // Update the default value for the id column
        const uuidFunction = hasGenRandomUuid ? 'gen_random_uuid()' : 'uuid_generate_v4()';
        await client.query(`
          ALTER TABLE sms_verifications 
          ALTER COLUMN id SET DEFAULT ${uuidFunction};
        `);
        
        console.log(`✅ Updated ID column default to ${uuidFunction}`);
      }
    }
    
    // Check existing constraints
    const constraintCheck = await client.query(`
      SELECT constraint_name, constraint_type
      FROM information_schema.table_constraints 
      WHERE table_name = 'sms_verifications' AND constraint_type = 'UNIQUE';
    `);
    
    console.log('📋 Current unique constraints:');
    if (constraintCheck.rows.length === 0) {
      console.log('  No unique constraints found');
    } else {
      constraintCheck.rows.forEach(row => {
        console.log(`  ${row.constraint_name}: ${row.constraint_type}`);
      });
    }
    
    // Check if the unique constraint already exists
    const uniqueConstraintCheck = await client.query(`
      SELECT tc.constraint_name
      FROM information_schema.table_constraints tc
      JOIN information_schema.key_column_usage kcu ON tc.constraint_name = kcu.constraint_name
      WHERE tc.table_name = 'sms_verifications' 
        AND tc.constraint_type = 'UNIQUE'
        AND kcu.column_name IN ('phone_number_hash', 'purpose')
      GROUP BY tc.constraint_name
      HAVING COUNT(*) = 2;
    `);
    
    if (uniqueConstraintCheck.rows.length > 0) {
      console.log('✅ Unique constraint on (phone_number_hash, purpose) already exists');
    } else {
      console.log('🔧 Adding unique constraint on (phone_number_hash, purpose)...');
      
      // First, remove any duplicate records that might prevent the unique constraint
      console.log('🧹 Cleaning up potential duplicate records...');
      await client.query(`
        DELETE FROM sms_verifications 
        WHERE id NOT IN (
          SELECT DISTINCT ON (phone_number_hash, purpose) id
          FROM sms_verifications
          ORDER BY phone_number_hash, purpose, createdAt DESC
        );
      `);
      
      // Add the unique constraint
      await client.query(`
        ALTER TABLE sms_verifications 
        ADD CONSTRAINT unique_phone_purpose 
        UNIQUE (phone_number_hash, purpose);
      `);
      
      console.log('✅ Unique constraint added successfully');
    }
    
    // Verify the constraint exists
    const verifyConstraint = await client.query(`
      SELECT constraint_name, constraint_type
      FROM information_schema.table_constraints 
      WHERE table_name = 'sms_verifications' 
        AND constraint_type = 'UNIQUE'
        AND constraint_name = 'unique_phone_purpose';
    `);
    
    if (verifyConstraint.rows.length > 0) {
      console.log('✅ Unique constraint verification successful');
    } else {
      throw new Error('Failed to create unique constraint');
    }
    
    // Helper function to generate UUID manually if needed
    const generateUUID = () => {
      return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        const r = Math.random() * 16 | 0;
        const v = c == 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
      });
    };
    
    // Test the ON CONFLICT clause with explicit UUID generation
    console.log('🧪 Testing ON CONFLICT clause...');
    const testPhoneHash = 'test_phone_hash_' + Date.now();
    const testPurpose = 'registration';
    const testUuid1 = generateUUID();
    
    // First insert with explicit UUID
    await client.query(`
      INSERT INTO sms_verifications (id, phone_number_hash, purpose, status, expires_at)
      VALUES ($1, $2, $3, 'pending', NOW() + INTERVAL '10 minutes')
    `, [testUuid1, testPhoneHash, testPurpose]);
    
    // Second insert with ON CONFLICT (should update)
    const testUuid2 = generateUUID();
    const conflictResult = await client.query(`
      INSERT INTO sms_verifications (id, phone_number_hash, purpose, twilio_sid, status, expires_at)
      VALUES ($1, $2, $3, 'test_sid_123', 'pending', NOW() + INTERVAL '10 minutes')
      ON CONFLICT (phone_number_hash, purpose) 
      DO UPDATE SET 
        twilio_sid = EXCLUDED.twilio_sid,
        status = 'pending',
        attempts = 0,
        expires_at = NOW() + INTERVAL '10 minutes',
        updatedAt = NOW()
      RETURNING id, twilio_sid;
    `, [testUuid2, testPhoneHash, testPurpose]);
    
    console.log('✅ ON CONFLICT test successful:', conflictResult.rows[0]);
    
    // Clean up test records
    await client.query('DELETE FROM sms_verifications WHERE phone_number_hash = $1', [testPhoneHash]);
    
    await client.query('COMMIT');
    
    console.log('🎉 SMS verifications table fixed successfully!');
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Failed to fix SMS verifications table:', error);
    throw error;
  } finally {
    client.release();
  }
}

if (require.main === module) {
  fixSMSVerificationsTable()
    .then(() => {
      console.log('🏁 Fix completed successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Fix failed:', error);
      process.exit(1);
    });
}

module.exports = fixSMSVerificationsTable;