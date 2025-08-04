const phoneValidationService = require('./services/phoneValidationService');

console.log('=== Testing Updated Phone Validation ===\n');

// Test the validation service directly
const testNumbers = [
  '927802065',      // Should work
  '0927802065',     // Should work  
  '251927802065',   // Should work
  '+251927802065',  // Should work
  '827802065',      // Should fail
];

testNumbers.forEach(number => {
  console.log(`Testing: ${number}`);
  const result = phoneValidationService.validatePhoneNumber(number);
  console.log(`Result: ${result.isValid ? '✅ Valid' : '❌ Invalid'}`);
  if (result.isValid) {
    console.log(`Backend format: ${result.phoneNumber}`);
  } else {
    console.log(`Error: ${result.error}`);
  }
  console.log('---');
});

console.log('\n=== Testing Express Validator Integration ===');
console.log('The validation middleware has been updated to use our custom Ethiopian phone validator.');
console.log('You can now test the API endpoints with Ethiopian phone numbers.');