const pool = require('../config/database');
const fs = require('fs');
const path = require('path');

async function setupSMSSystem() {
  const client = await pool.connect();
  
  try {
    console.log('🚀 Setting up SMS system...');
    
    // Read and execute SMS database schema
    const schemaPath = path.join(__dirname, '..', 'smsDb.sql');
    const schema = fs.readFileSync(schemaPath, 'utf8');
    
    await client.query('BEGIN');
    
    // Execute schema
    await client.query(schema);
    
    // Create analytics table
    await client.query(`
      CREATE TABLE IF NOT EXISTS sms_analytics (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        phone_number_hash VARCHAR(64),
        purpose VARCHAR(20) CHECK (purpose IN ('registration', 'login', 'password_reset', 'two_factor')),
        status VARCHAR(20) CHECK (status IN ('sent', 'delivered', 'failed', 'verified', 'expired')),
        twilio_sid VARCHAR(100),
        country_code VARCHAR(2),
        carrier VARCHAR(50),
        cost DECIMAL(10,4),
        timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        response_time INTEGER,
        error_code VARCHAR(20),
        error_message TEXT,
        user_agent TEXT,
        ip_address_hash VARCHAR(64),
        session_id VARCHAR(100),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
      
      CREATE INDEX IF NOT EXISTS idx_sms_analytics_timestamp ON sms_analytics (timestamp);
      CREATE INDEX IF NOT EXISTS idx_sms_analytics_phone ON sms_analytics (phone_number_hash);
      CREATE INDEX IF NOT EXISTS idx_sms_analytics_purpose ON sms_analytics (purpose);
      CREATE INDEX IF NOT EXISTS idx_sms_analytics_status ON sms_analytics (status);
    `);
    
    await client.query('COMMIT');
    
    console.log('✅ SMS database schema created successfully');
    console.log('📊 SMS analytics table created');
    console.log('🔍 Database indexes created');
    
    // Test Twilio configuration
    if (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN) {
      console.log('✅ Twilio configuration found');
    } else {
      console.log('⚠️  Twilio configuration missing. Please set TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN');
    }
    
    console.log('🎉 SMS system setup completed successfully!');
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ SMS system setup failed:', error);
    throw error;
  } finally {
    client.release();
  }
}

if (require.main === module) {
  setupSMSSystem()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}

module.exports = setupSMSSystem;