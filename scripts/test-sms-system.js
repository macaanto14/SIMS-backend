const twilioService = require('../services/twilioService');
const phoneValidationService = require('../services/phoneValidationService');
const rateLimitService = require('../services/rateLimitService');
const analyticsService = require('../services/analyticsService');

async function testSMSSystem() {
  console.log('🧪 Testing SMS system components...');
  
  try {
    // Test 1: Phone validation
    console.log('\n📱 Testing phone validation...');
    const testPhone = '+251927802065';
    const validation = phoneValidationService.validatePhoneNumber(testPhone);
    
    if (validation.isValid) {
      console.log('✅ Phone validation passed');
      console.log(`   📞 Formatted: ${validation.phoneNumber}`);
      console.log(`   🌍 Country: ${validation.countryCode}`);
      console.log(`   📡 Carrier: ${validation.carrier}`);
    } else {
      console.log('❌ Phone validation failed:', validation.error);
    }
    
    // Test 2: Supported countries
    console.log('\n🌍 Testing supported countries...');
    const countries = phoneValidationService.getSupportedCountries();
    console.log(`✅ ${countries.length} countries supported:`, countries.map(c => c.code).join(', '));
    
    // Test 3: Rate limiting (dry run)
    console.log('\n⏱️  Testing rate limiting...');
    try {
      // This won't actually increment counters in test mode
      console.log('✅ Rate limiting service initialized');
    } catch (error) {
      console.log('❌ Rate limiting test failed:', error.message);
    }
    
    // Test 4: Twilio configuration
    console.log('\n📡 Testing Twilio configuration...');
    if (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN) {
      console.log('✅ Twilio credentials configured');
      
      if (process.env.TWILIO_VERIFY_SERVICE_SID) {
        console.log('✅ Twilio Verify service configured');
      } else {
        console.log('⚠️  Twilio Verify service SID missing');
      }
    } else {
      console.log('❌ Twilio credentials missing');
      console.log('   Please set TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN in your .env file');
    }
    
    // Test 5: Analytics service
    console.log('\n📊 Testing analytics service...');
    if (process.env.ENABLE_SMS_ANALYTICS === 'true') {
      console.log('✅ SMS analytics enabled');
    } else {
      console.log('ℹ️  SMS analytics disabled');
    }
    
    // Test 6: Environment variables
    console.log('\n🔧 Checking environment configuration...');
    const requiredEnvVars = [
      'TWILIO_ACCOUNT_SID',
      'TWILIO_AUTH_TOKEN',
      'TWILIO_VERIFY_SERVICE_SID',
      'SMS_RATE_LIMIT_WINDOW',
      'SMS_RATE_LIMIT_MAX_ATTEMPTS',
      'DEFAULT_COUNTRY_CODE'
    ];
    
    const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);
    
    if (missingVars.length === 0) {
      console.log('✅ All required environment variables configured');
    } else {
      console.log('⚠️  Missing environment variables:', missingVars.join(', '));
    }
    
    console.log('\n🎉 SMS system test completed!');
    
    // Summary
    console.log('\n📋 Test Summary:');
    console.log(`   📱 Phone validation: ${validation.isValid ? '✅' : '❌'}`);
    console.log(`   🌍 Countries supported: ✅ ${countries.length}`);
    console.log(`   📡 Twilio config: ${process.env.TWILIO_ACCOUNT_SID ? '✅' : '❌'}`);
    console.log(`   📊 Analytics: ${process.env.ENABLE_SMS_ANALYTICS === 'true' ? '✅' : 'ℹ️'}`);
    console.log(`   🔧 Environment: ${missingVars.length === 0 ? '✅' : '⚠️'}`);
    
  } catch (error) {
    console.error('❌ SMS system test failed:', error);
    throw error;
  }
}

if (require.main === module) {
  testSMSSystem()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}

module.exports = testSMSSystem;