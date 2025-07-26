/**
 * Email System Test Script
 * 
 * Tests the email notification system functionality
 */

const emailService = require('../src/services/emailService');

async function testEmailSystem() {
  try {
    console.log('🧪 Testing email notification system...');
    
    const testEmail = process.env.TEST_EMAIL || 'test@example.com';
    
    // Test 1: System notification
    console.log('\n1. Testing system notification...');
    await emailService.sendSystemNotification({
      userId: 'test-user-123',
      userEmail: testEmail,
      userName: 'Test User',
      action: 'Email System Test',
      details: 'This is a test of the system notification email template.',
      metadata: { testRun: true }
    });
    console.log('✅ System notification sent');
    
    // Test 2: School creation confirmation
    console.log('\n2. Testing school creation confirmation...');
    await emailService.sendSchoolCreationConfirmation({
      adminEmail: testEmail,
      adminName: 'Test Admin',
      schoolName: 'Test School',
      schoolCode: 'TS001',
      schoolId: 'test-school-123',
      temporaryPassword: 'TempPass123!'
    });
    console.log('✅ School creation confirmation sent');
    
    // Test 3: User registration confirmation
    console.log('\n3. Testing user registration confirmation...');
    await emailService.sendUserRegistrationConfirmation({
      userEmail: testEmail,
      userName: 'New Test User',
      userId: 'new-user-456',
      role: 'Teacher',
      schoolName: 'Test School',
      temporaryPassword: 'NewPass123!',
      activationToken: 'test-activation-token'
    });
    console.log('✅ User registration confirmation sent');
    
    // Test 4: Password reset
    console.log('\n4. Testing password reset email...');
    await emailService.sendPasswordResetEmail({
      userEmail: testEmail,
      userName: 'Test User',
      resetToken: 'test-reset-token-789',
      expiresIn: '1 hour'
    });
    console.log('✅ Password reset email sent');
    
    // Test 5: Audit alert
    console.log('\n5. Testing audit alert...');
    await emailService.sendAuditAlert({
      adminEmails: [testEmail],
      alertType: 'Suspicious Login Activity',
      severity: 'HIGH',
      description: 'Multiple failed login attempts detected',
      details: 'IP: 192.168.1.100, Attempts: 5, Time: ' + new Date().toISOString()
    });
    console.log('✅ Audit alert sent');
    
    // Get email statistics
    console.log('\n6. Getting email statistics...');
    const stats = await emailService.getEmailStats({
      startDate: new Date(Date.now() - 24 * 60 * 60 * 1000), // Last 24 hours
      endDate: new Date()
    });
    console.log('✅ Email statistics:', stats.length, 'records found');
    
    console.log('\n🎉 All email tests completed successfully!');
    console.log(`📧 Check your email at ${testEmail} for test messages.`);
    
  } catch (error) {
    console.error('❌ Email test failed:', error.message);
    throw error;
  }
}

async function main() {
  try {
    await testEmailSystem();
    process.exit(0);
  } catch (error) {
    console.error('Failed to test email system:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = { testEmailSystem };