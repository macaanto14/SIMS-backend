/**
 * Email System Setup Script
 * 
 * Sets up the email notification system including database tables,
 * templates, and configuration validation
 */

const pool = require('../config/database');
const fs = require('fs').promises;
const path = require('path');

async function setupEmailSystem() {
  const client = await pool.connect();
  
  try {
    console.log('🔧 Setting up email notification system...');
    
    // Create templates directory if it doesn't exist
    const templatesDir = path.join(__dirname, '../src/templates/email');
    try {
      await fs.access(templatesDir);
    } catch {
      await fs.mkdir(templatesDir, { recursive: true });
      console.log('✅ Created email templates directory');
    }
    
    // Run email system migration
    const migrationPath = path.join(__dirname, '../supabase/migrations/create_email_system.sql');
    const migrationSQL = await fs.readFile(migrationPath, 'utf8');
    
    await client.query(migrationSQL);
    console.log('✅ Email system database tables created');
    
    // Create email templates
    await createEmailTemplates(templatesDir);
    console.log('✅ Email templates created');
    
    // Verify email configuration
    const requiredEnvVars = [
      'SMTP_HOST',
      'SMTP_PORT',
      'SMTP_USER',
      'SMTP_PASSWORD',
      'SMTP_FROM'
    ];
    
    const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);
    
    if (missingVars.length > 0) {
      console.log('⚠️  Missing email configuration variables:');
      missingVars.forEach(varName => {
        console.log(`   - ${varName}`);
      });
      console.log('   Please update your .env file with SMTP settings');
    } else {
      console.log('✅ Email configuration verified');
    }
    
    // Test email service initialization
    try {
      const emailService = require('../src/services/emailService');
      console.log('✅ Email service initialized successfully');
    } catch (error) {
      console.log('⚠️  Email service initialization failed:', error.message);
    }
    
    console.log('\n🎉 Email notification system setup completed!');
    console.log('\nNext steps:');
    console.log('1. Update your .env file with SMTP configuration');
    console.log('2. Test email sending with: node scripts/test-email-system.js');
    console.log('3. Customize email templates in src/templates/email/');
    
  } catch (error) {
    console.error('❌ Error setting up email system:', error);
    throw error;
  } finally {
    client.release();
  }
}

async function createEmailTemplates(templatesDir) {
  const templates = {
    'system-notification.hbs': `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{{systemName}} - System Notification</title>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #2563eb; color: white; padding: 20px; text-align: center; }
        .content { padding: 20px; background: #f9fafb; }
        .footer { padding: 20px; text-align: center; color: #666; font-size: 12px; }
        .button { display: inline-block; padding: 12px 24px; background: #2563eb; color: white; text-decoration: none; border-radius: 4px; }
        .alert { padding: 15px; margin: 10px 0; border-radius: 4px; }
        .alert-info { background: #dbeafe; border-left: 4px solid #2563eb; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>{{systemName}} System Notification</h1>
        </div>
        <div class="content">
            <h2>Hello {{userName}},</h2>
            <div class="alert alert-info">
                <strong>Action:</strong> {{action}}<br>
                <strong>Time:</strong> {{timestamp}}
            </div>
            <p><strong>Details:</strong></p>
            <p>{{details}}</p>
            {{#if metadata}}
            <p><strong>Additional Information:</strong></p>
            <pre>{{metadata}}</pre>
            {{/if}}
        </div>
        <div class="footer">
            <p>This is an automated message from {{systemName}}.</p>
            <p>If you have questions, contact us at <a href="mailto:{{supportEmail}}">{{supportEmail}}</a></p>
        </div>
    </div>
</body>
</html>`,

    'school-creation-confirmation.hbs': `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Welcome to {{systemName}} - School Registration Confirmed</title>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #059669; color: white; padding: 20px; text-align: center; }
        .content { padding: 20px; background: #f9fafb; }
        .footer { padding: 20px; text-align: center; color: #666; font-size: 12px; }
        .button { display: inline-block; padding: 12px 24px; background: #059669; color: white; text-decoration: none; border-radius: 4px; margin: 10px 0; }
        .info-box { background: #ecfdf5; border: 1px solid #059669; padding: 15px; border-radius: 4px; margin: 15px 0; }
        .credentials { background: #fef3c7; border: 1px solid #f59e0b; padding: 15px; border-radius: 4px; margin: 15px 0; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🎉 Welcome to {{systemName}}!</h1>
        </div>
        <div class="content">
            <h2>Dear {{adminName}},</h2>
            <p>Congratulations! Your school has been successfully registered in our School Information Management System.</p>
            
            <div class="info-box">
                <h3>School Information</h3>
                <p><strong>School Name:</strong> {{schoolName}}</p>
                <p><strong>School Code:</strong> {{schoolCode}}</p>
                <p><strong>School ID:</strong> {{schoolId}}</p>
            </div>
            
            {{#if temporaryPassword}}
            <div class="credentials">
                <h3>⚠️ Login Credentials</h3>
                <p><strong>Email:</strong> {{adminEmail}}</p>
                <p><strong>Temporary Password:</strong> {{temporaryPassword}}</p>
                <p><em>Please change your password after first login for security.</em></p>
            </div>
            {{/if}}
            
            <p>You can now access your school's dashboard and begin managing your institution's information.</p>
            
            <div style="text-align: center;">
                <a href="{{loginUrl}}" class="button">Access Your Dashboard</a>
            </div>
            
            <h3>Next Steps:</h3>
            <ul>
                <li>Log in to your dashboard</li>
                <li>Complete your school profile</li>
                <li>Add staff and student information</li>
                <li>Configure system settings</li>
            </ul>
        </div>
        <div class="footer">
            <p>Welcome to the {{systemName}} family!</p>
            <p>Need help? Contact us at <a href="mailto:{{supportEmail}}">{{supportEmail}}</a></p>
        </div>
    </div>
</body>
</html>`,

    'user-registration-confirmation.hbs': `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Welcome to {{systemName}} - Account Created</title>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #7c3aed; color: white; padding: 20px; text-align: center; }
        .content { padding: 20px; background: #f9fafb; }
        .footer { padding: 20px; text-align: center; color: #666; font-size: 12px; }
        .button { display: inline-block; padding: 12px 24px; background: #7c3aed; color: white; text-decoration: none; border-radius: 4px; margin: 10px 0; }
        .info-box { background: #f3e8ff; border: 1px solid #7c3aed; padding: 15px; border-radius: 4px; margin: 15px 0; }
        .credentials { background: #fef3c7; border: 1px solid #f59e0b; padding: 15px; border-radius: 4px; margin: 15px 0; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Welcome to {{systemName}}!</h1>
        </div>
        <div class="content">
            <h2>Hello {{userName}},</h2>
            <p>Your account has been successfully created in our School Information Management System.</p>
            
            <div class="info-box">
                <h3>Account Information</h3>
                <p><strong>Name:</strong> {{userName}}</p>
                <p><strong>Role:</strong> {{role}}</p>
                <p><strong>School:</strong> {{schoolName}}</p>
                <p><strong>User ID:</strong> {{userId}}</p>
            </div>
            
            {{#if temporaryPassword}}
            <div class="credentials">
                <h3>⚠️ Login Credentials</h3>
                <p><strong>Email:</strong> {{userEmail}}</p>
                <p><strong>Temporary Password:</strong> {{temporaryPassword}}</p>
                <p><em>Please change your password after first login for security.</em></p>
            </div>
            {{/if}}
            
            {{#if activationToken}}
            <p>Before you can log in, please activate your account by clicking the button below:</p>
            <div style="text-align: center;">
                <a href="{{activationUrl}}" class="button">Activate Account</a>
            </div>
            {{else}}
            <p>You can now log in to access the system:</p>
            <div style="text-align: center;">
                <a href="{{loginUrl}}" class="button">Log In</a>
            </div>
            {{/if}}
        </div>
        <div class="footer">
            <p>Welcome to {{systemName}}!</p>
            <p>Need help? Contact us at <a href="mailto:{{supportEmail}}">{{supportEmail}}</a></p>
        </div>
    </div>
</body>
</html>`,

    'password-reset.hbs': `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{{systemName}} - Password Reset Request</title>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #dc2626; color: white; padding: 20px; text-align: center; }
        .content { padding: 20px; background: #f9fafb; }
        .footer { padding: 20px; text-align: center; color: #666; font-size: 12px; }
        .button { display: inline-block; padding: 12px 24px; background: #dc2626; color: white; text-decoration: none; border-radius: 4px; margin: 10px 0; }
        .warning { background: #fef2f2; border: 1px solid #dc2626; padding: 15px; border-radius: 4px; margin: 15px 0; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🔒 Password Reset Request</h1>
        </div>
        <div class="content">
            <h2>Hello {{userName}},</h2>
            <p>We received a request to reset your password for your {{systemName}} account.</p>
            
            <div class="warning">
                <p><strong>⚠️ Security Notice:</strong></p>
                <p>If you did not request this password reset, please ignore this email and contact our support team immediately.</p>
            </div>
            
            <p>To reset your password, click the button below:</p>
            
            <div style="text-align: center;">
                <a href="{{resetUrl}}" class="button">Reset Password</a>
            </div>
            
            <p><strong>Important:</strong> This link will expire in {{expiresIn}}. If you need a new reset link, please request another password reset.</p>
            
            <p>If the button doesn't work, copy and paste this link into your browser:</p>
            <p style="word-break: break-all; background: #f3f4f6; padding: 10px; border-radius: 4px;">{{resetUrl}}</p>
        </div>
        <div class="footer">
            <p>This is an automated security message from {{systemName}}.</p>
            <p>Need help? Contact us at <a href="mailto:{{supportEmail}}">{{supportEmail}}</a></p>
        </div>
    </div>
</body>
</html>`,

    'audit-alert.hbs': `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{{systemName}} - Security Alert</title>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #dc2626; color: white; padding: 20px; text-align: center; }
        .content { padding: 20px; background: #f9fafb; }
        .footer { padding: 20px; text-align: center; color: #666; font-size: 12px; }
        .alert { padding: 15px; margin: 15px 0; border-radius: 4px; }
        .alert-high { background: #fef2f2; border-left: 4px solid #dc2626; }
        .alert-medium { background: #fef3c7; border-left: 4px solid #f59e0b; }
        .alert-low { background: #f0f9ff; border-left: 4px solid #0ea5e9; }
        .details { background: #f3f4f6; padding: 15px; border-radius: 4px; margin: 15px 0; font-family: monospace; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🚨 Security Alert</h1>
        </div>
        <div class="content">
            <h2>Security Alert Notification</h2>
            
            <div class="alert alert-{{#if (eq severity 'HIGH')}}high{{else}}{{#if (eq severity 'MEDIUM')}}medium{{else}}low{{/if}}{{/if}}">
                <h3>{{alertType}}</h3>
                <p><strong>Severity:</strong> {{severity}}</p>
                <p><strong>Time:</strong> {{timestamp}}</p>
                <p><strong>Description:</strong> {{description}}</p>
            </div>
            
            {{#if details}}
            <h3>Alert Details:</h3>
            <div class="details">{{details}}</div>
            {{/if}}
            
            <h3>Recommended Actions:</h3>
            <ul>
                <li>Review the alert details carefully</li>
                <li>Check system logs for additional information</li>
                <li>Take appropriate security measures if needed</li>
                <li>Contact IT support if you need assistance</li>
            </ul>
        </div>
        <div class="footer">
            <p>This is an automated security alert from {{systemName}}.</p>
            <p>For immediate assistance, contact us at <a href="mailto:{{supportEmail}}">{{supportEmail}}</a></p>
        </div>
    </div>
</body>
</html>`
  };

  for (const [filename, content] of Object.entries(templates)) {
    const filePath = path.join(templatesDir, filename);
    await fs.writeFile(filePath, content.trim());
  }
}

async function main() {
  try {
    await setupEmailSystem();
    process.exit(0);
  } catch (error) {
    console.error('Failed to setup email system:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = { setupEmailSystem };