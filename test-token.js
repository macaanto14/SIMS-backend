const jwt = require('jsonwebtoken');
require('dotenv').config();

const testToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiIyNWJkYjY2YS0yOTIwLTQ5NDgtODdiNy0zZjdiYWYzMWI5YzkiLCJlbWFpbCI6InN1cGVyYWRtaW5Ac2ltcy5lZHUiLCJyb2xlcyI6WyJTdXBlciBBZG1pbiJdLCJpYXQiOjE3NTQzOTI4NjYsImV4cCI6MTc1NDQ3OTI2Nn0.nRq4FoQOmWkU6syBqAXCahJAHSuIkFkK3CJyOmBMyY0'; // Replace with your actual token

try {
  console.log('Testing token:', testToken.substring(0, 20) + '...');
  console.log('Token parts:', testToken.split('.').length);
  
  const decoded = jwt.verify(testToken, process.env.JWT_SECRET);
  console.log('✅ Token is valid!');
  console.log('Decoded payload:', decoded);
} catch (error) {
  console.log('❌ Token validation failed:');
  console.log('Error name:', error.name);
  console.log('Error message:', error.message);
}