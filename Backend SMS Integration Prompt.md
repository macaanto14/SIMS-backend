## Backend SMS Integration Prompt
### Overview
Implement a comprehensive SMS verification system for a Node.js/Express backend that supports authentication flows (registration, login, password reset, 2FA) with Twilio integration, including security, rate limiting, analytics, and internationalization.

### Required API Endpoints
The frontend expects these endpoints to be implemented:

1. 1.
   POST /sms/send-verification - Send SMS verification code
2. 2.
   POST /sms/verify-code - Verify SMS code
3. 3.
   POST /auth/login-sms - Login with SMS verification
4. 4.
   POST /auth/reset-password-sms - Reset password with SMS
### 1. Backend Integration Requirements Core SMS Controller ( controllers/smsController.js )

// Expected request/response formats based on frontend:

// POST /sms/send-verification
// Request body:
{
  "phoneNumber": "+251927802065",
  "purpose": "registration|login|password_reset|two_factor",
  "twilioConfig": {
    "accountSid": "...",
    "authToken": "...",
    "serviceSid": "..."
  }
}

// Response:
{
  "account_sid": "AC131789d6616539423cfee4038cc9d8dc",
  "sid": "VE...",
  "service_sid": "xxxxxxxxxxxxxxx",
  "to": "+251927802065",
  "channel": "sms",
  "status": "pending",
  "valid": false,
  "date_created": "2024-01-01T00:00:00Z",
  "date_updated": "2024-01-01T00:00:00Z"
}

// POST /sms/verify-code
// Request body:
{
  "phoneNumber": "+251927802065",
  "code": "123456",
  "purpose": "registration|login|password_reset|two_factor",
  "twilioConfig": {...}
}

// Response:
{
  "account_sid": "xxxxxxxx",
  "sid": "VE...",
  "service_sid": "xxxxxxxx",
  "to": "+251927802065",
  "channel": "sms",
  "status": "approved",
  "valid": true,
  "date_created": "2024-01-01T00:00:00Z",
  "date_updated": "2024-01-01T00:00:00Z"
}

Authentication Integration
Update existing auth endpoints to support SMS:

- POST /auth/login-sms - Login using verified phone number
- POST /auth/register - Support SMS verification in registration flow
- POST /auth/reset-password-sms - Reset password using SMS verification
### 2. Environment Variables Setup
Create .env file with secure Twilio configuration:

# Twilio Configuration
TWILIO_ACCOUNT_SID=your_account_sid_here
TWILIO_AUTH_TOKEN=your_auth_token_here
TWILIO_VERIFY_SERVICE_SID=your_service_sid_here

# SMS Rate Limiting
SMS_RATE_LIMIT_WINDOW=900000  # 15 minutes in milliseconds
SMS_RATE_LIMIT_MAX_ATTEMPTS=5  # Max SMS per window per phone
SMS_RATE_LIMIT_GLOBAL_MAX=1000  # Global SMS limit per window

# SMS Analytics
ENABLE_SMS_ANALYTICS=true
ANALYTICS_DB_URL=your_analytics_db_url

# Internationalization
DEFAULT_COUNTRY_CODE=ET  # Ethiopia
SUPPORTED_COUNTRIES=ET,US,GB,CA,AU  # Comma-separated country codes


### 3. Rate Limiting Implementation
Implement multi-level rate limiting:
 Phone Number Level Rate Limiting

 // services/rateLimitService.js
class RateLimitService {
  // Limit SMS per phone number (5 SMS per 15 minutes)
  async checkPhoneRateLimit(phoneNumber) {
    // Implementation with Redis or in-memory store
  }
  
  // Global rate limiting (1000 SMS per 15 minutes across all users)
  async checkGlobalRateLimit() {
    // Implementation
  }
  
  // Purpose-specific limits (e.g., registration vs login)
  async checkPurposeRateLimit(phoneNumber, purpose) {
    // Implementation
  }
}

Middleware Implementation

// middleware/smsRateLimit.js
const smsRateLimit = async (req, res, next) => {
  const { phoneNumber, purpose } = req.body;
  
  try {
    // Check multiple rate limit layers
    await rateLimitService.checkPhoneRateLimit(phoneNumber);
    await rateLimitService.checkGlobalRateLimit();
    await rateLimitService.checkPurposeRateLimit(phoneNumber, purpose);
    
    next();
  } catch (error) {
    res.status(429).json({
      success: false,
      message: 'Rate limit exceeded. Please try again later.',
      retryAfter: error.retryAfter
    });
  }
};

### 4. Analytics Implementation SMS Analytics Schema

// models/SMSAnalytics.js
const smsAnalyticsSchema = {
  id: 'UUID',
  phoneNumber: 'STRING (hashed for privacy)',
  purpose: 'ENUM(registration, login, password_reset, two_factor)',
  status: 'ENUM(sent, delivered, failed, verified, expired)',
  twilioSid: 'STRING',
  countryCode: 'STRING',
  carrier: 'STRING',
  cost: 'DECIMAL',
  timestamp: 'DATETIME',
  responseTime: 'INTEGER', // milliseconds
  errorCode: 'STRING',
  errorMessage: 'TEXT',
  userAgent: 'STRING',
  ipAddress: 'STRING (hashed)',
  sessionId: 'STRING'
};

Analytics Service

// services/analyticsService.js
class SMSAnalyticsService {
  async trackSMSSent(data) {
    // Track SMS sending attempts
  }
  
  async trackSMSDelivered(twilioWebhook) {
    // Track delivery status from Twilio webhooks
  }
  
  async trackSMSVerified(data) {
    // Track successful verifications
  }
  
  async generateAnalyticsReport(dateRange, filters) {
    // Generate success/failure rates, costs, etc.
  }
  
  async getSuccessRateByCountry() {
    // Country-specific success rates
  }
  
  async getCostAnalytics() {
    // SMS cost tracking and optimization
  }
}

Analytics Dashboard Endpoints

// GET /analytics/sms/summary
// GET /analytics/sms/success-rates
// GET /analytics/sms/costs
// GET /analytics/sms/countries
// GET /analytics/sms/failures

### 5. Internationalization Support Phone Number Validation Service

// services/phoneValidationService.js
class PhoneValidationService {
  constructor() {
    this.supportedCountries = {
      'ET': { code: '+251', regex: /^\+251[79]\d{8}$/, format: '+251 XX XXX XXXX' },
      'US': { code: '+1', regex: /^\+1[2-9]\d{9}$/, format: '+1 XXX XXX XXXX' },
      'GB': { code: '+44', regex: /^\+44[1-9]\d{8,9}$/, format: '+44 XXXX XXXXXX' },
      'CA': { code: '+1', regex: /^\+1[2-9]\d{9}$/, format: '+1 XXX XXX XXXX' },
      'AU': { code: '+61', regex: /^\+61[2-9]\d{8}$/, format: '+61 X XXXX XXXX' }
    };
  }
  
  validatePhoneNumber(phoneNumber, countryCode = 'ET') {
    // Validate against country-specific patterns
  }
  
  formatPhoneNumber(phoneNumber, countryCode = 'ET') {
    // Format for display
  }
  
  detectCountryFromPhone(phoneNumber) {
    // Auto-detect country from phone number
  }
  
  getSupportedCountries() {
    // Return list of supported countries
  }
}


Localization for SMS Messages

// config/smsMessages.js
const smsMessages = {
  'en': {
    'registration': 'Your verification code is: {code}. Valid for 10 minutes.',
    'login': 'Your login code is: {code}. Valid for 5 minutes.',
    'password_reset': 'Your password reset code is: {code}. Valid for 15 minutes.',
    'two_factor': 'Your 2FA code is: {code}. Valid for 5 minutes.'
  },
  'am': { // Amharic for Ethiopia
    'registration': 'የማረጋገጫ ኮድዎ: {code}። ለ10 ደቂቃ ይቆያል።',
    // ... other messages
  }
};

### 6. Security Enhancements Security Middleware

// middleware/smsSecurityMiddleware.js
const smsSecurityMiddleware = {
  // Validate Twilio webhook signatures
  validateTwilioWebhook: (req, res, next) => {
    // Verify webhook authenticity
  },
  
  // Sanitize phone numbers
  sanitizePhoneNumber: (req, res, next) => {
    // Clean and validate phone number input
  },
  
  // Prevent SMS bombing
  preventSMSBombing: async (req, res, next) => {
    // Additional security checks
  }
};

### 7. Database Schema SMS Verification Tracking

CREATE TABLE sms_verifications (
  id UUID PRIMARY KEY,
  phone_number_hash VARCHAR(64) NOT NULL,
  purpose ENUM('registration', 'login', 'password_reset', 'two_factor'),
  twilio_sid VARCHAR(100),
  status ENUM('pending', 'verified', 'expired', 'failed'),
  attempts INTEGER DEFAULT 0,
  max_attempts INTEGER DEFAULT 3,
  expires_at TIMESTAMP,
  verified_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  INDEX idx_phone_purpose (phone_number_hash, purpose),
  INDEX idx_status_expires (status, expires_at)
);

CREATE TABLE sms_rate_limits (
  id UUID PRIMARY KEY,
  identifier VARCHAR(64) NOT NULL, -- phone hash or IP hash
  limit_type ENUM('phone', 'ip', 'global'),
  purpose VARCHAR(50),
  count INTEGER DEFAULT 0,
  window_start TIMESTAMP,
  expires_at TIMESTAMP,
  
  UNIQUE KEY unique_limit (identifier, limit_type, purpose),
  INDEX idx_expires (expires_at)
);

### 8. Implementation Checklist Phase 1: Core SMS Functionality
- Set up Twilio SDK integration
- Implement SMS sending endpoint
- Implement SMS verification endpoint
- Add environment variable configuration
- Create basic rate limiting Phase 2: Authentication Integration
- Update login endpoint for SMS support
- Update registration flow with SMS verification
- Implement SMS-based password reset
- Add 2FA SMS support Phase 3: Security & Rate Limiting
- Implement multi-level rate limiting
- Add SMS bombing prevention
- Implement webhook signature validation
- Add phone number sanitization Phase 4: Analytics & Monitoring
- Create analytics database schema
- Implement SMS tracking service
- Add Twilio webhook handlers for delivery status
- Create analytics dashboard endpoints
- Add cost tracking and optimization Phase 5: Internationalization
- Implement phone number validation for multiple countries
- Add country-specific formatting
- Implement message localization
- Add country detection from phone numbers
- Create country-specific rate limits
### 9. Testing Strategy Unit Tests
- SMS service functionality
- Phone number validation
- Rate limiting logic
- Analytics tracking Integration Tests
- Twilio API integration
- Database operations
- Authentication flows
- Webhook handling Load Tests
- Rate limiting under high load
- SMS sending performance
- Database performance with analytics
### 10. Monitoring & Alerts Key Metrics to Monitor
- SMS success/failure rates
- Response times
- Rate limit violations
- Cost per SMS
- Country-specific performance
- Security incidents Alert Thresholds
- SMS failure rate > 5%
- Response time > 2 seconds
- Rate limit violations > 100/hour
- Daily SMS cost > budget threshold
- Webhook delivery failures
This comprehensive implementation will provide a robust, secure, and scalable SMS verification system that meets all your requirements for backend integration, security, analytics, and internationalization.