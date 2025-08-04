CREATE TABLE IF NOT EXISTS sms_verifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phone_number_hash VARCHAR(64) NOT NULL,
  purpose VARCHAR(20) CHECK (purpose IN ('registration', 'login', 'password_reset', 'two_factor')),
  twilio_sid VARCHAR(100),
  status VARCHAR(10) CHECK (status IN ('pending', 'verified', 'expired', 'failed')),
  attempts INTEGER DEFAULT 0,
  max_attempts INTEGER DEFAULT 3,
  expires_at TIMESTAMP,
  verified_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
 
  UNIQUE (phone_number_hash, purpose)
);

CREATE TABLE IF NOT EXISTS sms_rate_limits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  identifier VARCHAR(64) NOT NULL, -- phone hash or IP hash
  limit_type VARCHAR(10) CHECK (limit_type IN ('phone', 'ip', 'global', 'purpose')),
  purpose VARCHAR(50),
  count INTEGER DEFAULT 0,
  window_start TIMESTAMP,
  expires_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  UNIQUE (identifier, limit_type, purpose)
);

-- Add the missing analytics table
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

-- Indexes
CREATE INDEX IF NOT EXISTS idx_expires ON sms_rate_limits (expires_at);
CREATE INDEX IF NOT EXISTS idx_phone_purpose ON sms_verifications (phone_number_hash, purpose);
CREATE INDEX IF NOT EXISTS idx_status_expires ON sms_verifications (status, expires_at);
CREATE INDEX IF NOT EXISTS idx_sms_analytics_timestamp ON sms_analytics (timestamp);
CREATE INDEX IF NOT EXISTS idx_sms_analytics_phone ON sms_analytics (phone_number_hash);
CREATE INDEX IF NOT EXISTS idx_sms_analytics_purpose ON sms_analytics (purpose);
CREATE INDEX IF NOT EXISTS idx_sms_analytics_status ON sms_analytics (status);