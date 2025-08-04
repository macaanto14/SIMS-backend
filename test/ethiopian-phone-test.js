const phoneValidationService = require('../services/phoneValidationService');

console.log('=== Ethiopian Phone Number Validation Tests ===\n');

// Test cases for Ethiopian phone numbers
const testCases = [
  // Valid formats
  '927802065',      // 9 digits starting with 9
  '0927802065',     // 10 digits starting with 09
  '251927802065',   // 12 digits starting with 251
  '+251927802065',  // With + prefix
  '251 92 780 2065', // With spaces
  '251-92-780-2065', // With dashes
  
  // Invalid formats
  '827802065',      // Doesn't start with 9
  '92780206',       // Too short
  '9278020655',     // Too long
  '0827802065',     // Starts with 08 (invalid)
  '252927802065',   // Wrong country code
  '25192780206',    // Wrong length with 251
];

testCases.forEach((phoneNumber, index) => {
  console.log(`Test ${index + 1}: ${phoneNumber}`);
  
  const result = phoneValidationService.validatePhoneNumber(phoneNumber);
  
  if (result.isValid) {
    console.log(`  ✅ Valid`);
    console.log(`  📱 Backend Format: ${result.phoneNumber}`);
    console.log(`  📺 Display Format: ${result.displayNumber}`);
    console.log(`  🌍 Country: ${result.countryCode}`);
    console.log(`  📞 National: ${result.nationalNumber}`);
    console.log(`  🏢 Carrier: ${result.carrier}`);
  } else {
    console.log(`  ❌ Invalid: ${result.error}`);
  }
  
  console.log('');
});

console.log('=== Helper Methods Tests ===\n');

// Test helper methods
const testNumber = '927802065';
console.log(`Original: ${testNumber}`);
console.log(`Clean: ${phoneValidationService.getCleanPhoneNumber(testNumber)}`);
console.log(`Display: ${phoneValidationService.getDisplayNumber(testNumber)}`);
console.log(`Backend Format: ${phoneValidationService.formatPhoneNumber(testNumber, 'backend')}`);
console.log(`Display Format: ${phoneValidationService.formatPhoneNumber(testNumber, 'display')}`);
console.log(`National Format: ${phoneValidationService.formatPhoneNumber(testNumber, 'national')}`);

console.log('\n=== Comprehensive Validation Test ===\n');

const comprehensiveTest = phoneValidationService.validateAndFormatEthiopianNumber('0927802065');
console.log('Input: 0927802065');
console.log('Result:', JSON.stringify(comprehensiveTest, null, 2));