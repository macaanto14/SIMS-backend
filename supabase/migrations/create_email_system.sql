-- Email Notification System Tables
-- Creates tables for email logging and template management

-- Email logs table
CREATE TABLE IF NOT EXISTS email_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    recipient_email VARCHAR(255) NOT NULL,
    cc_emails TEXT,
    bcc_emails TEXT,
    subject VARCHAR(500) NOT NULL,
    template_name VARCHAR(100),
    message_id VARCHAR(255),
    tracking_id VARCHAR(100),
    status VARCHAR(20) NOT NULL DEFAULT 'sent',
    error_message TEXT,
    template_data JSONB,
    sent_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Email templates table (for dynamic template management)
CREATE TABLE IF NOT EXISTS email_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) UNIQUE NOT NULL,
    subject_template VARCHAR(500) NOT NULL,
    html_template TEXT NOT NULL,
    text_template TEXT,
    description TEXT,
    variables JSONB, -- Available template variables
    is_active BOOLEAN DEFAULT true,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Email queue table (for async email processing)
CREATE TABLE IF NOT EXISTS email_queue (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    recipient_email VARCHAR(255) NOT NULL,
    cc_emails TEXT,
    bcc_emails TEXT,
    subject VARCHAR(500) NOT NULL,
    template_name VARCHAR(100),
    template_data JSONB,
    priority INTEGER DEFAULT 5, -- 1 = highest, 10 = lowest
    max_attempts INTEGER DEFAULT 3,
    attempts INTEGER DEFAULT 0,
    status VARCHAR(20) DEFAULT 'pending', -- pending, processing, sent, failed
    scheduled_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    processed_at TIMESTAMP WITH TIME ZONE,
    error_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Email preferences table (user email preferences)
CREATE TABLE IF NOT EXISTS email_preferences (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    notification_type VARCHAR(100) NOT NULL,
    is_enabled BOOLEAN DEFAULT true,
    frequency VARCHAR(20) DEFAULT 'immediate', -- immediate, daily, weekly, never
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, notification_type)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_email_logs_recipient ON email_logs(recipient_email);
CREATE INDEX IF NOT EXISTS idx_email_logs_sent_at ON email_logs(sent_at);
CREATE INDEX IF NOT EXISTS idx_email_logs_status ON email_logs(status);
CREATE INDEX IF NOT EXISTS idx_email_logs_template ON email_logs(template_name);
CREATE INDEX IF NOT EXISTS idx_email_logs_tracking_id ON email_logs(tracking_id);

CREATE INDEX IF NOT EXISTS idx_email_queue_status ON email_queue(status);
CREATE INDEX IF NOT EXISTS idx_email_queue_scheduled_at ON email_queue(scheduled_at);
CREATE INDEX IF NOT EXISTS idx_email_queue_priority ON email_queue(priority);

CREATE INDEX IF NOT EXISTS idx_email_preferences_user_id ON email_preferences(user_id);
CREATE INDEX IF NOT EXISTS idx_email_preferences_type ON email_preferences(notification_type);

-- Insert default email templates
INSERT INTO email_templates (name, subject_template, html_template, description, variables) VALUES
('system-notification', 'SIMS System Notification - {{action}}', 
 '<h2>System Notification</h2><p>Hello {{userName}},</p><p>Action: {{action}}</p><p>Details: {{details}}</p>',
 'General system notification template',
 '{"userName": "string", "action": "string", "details": "string", "timestamp": "string"}'
),
('school-creation-confirmation', 'Welcome to SIMS - School Registration Confirmed: {{schoolName}}',
 '<h2>Welcome to SIMS!</h2><p>Dear {{adminName}},</p><p>Your school {{schoolName}} has been successfully registered.</p>',
 'School creation confirmation email',
 '{"adminName": "string", "schoolName": "string", "schoolCode": "string", "loginUrl": "string"}'
),
('user-registration-confirmation', 'Welcome to SIMS - Account Created',
 '<h2>Welcome to SIMS!</h2><p>Hello {{userName}},</p><p>Your account has been created with role: {{role}}</p>',
 'User registration confirmation email',
 '{"userName": "string", "role": "string", "schoolName": "string", "loginUrl": "string"}'
),
('password-reset', 'SIMS - Password Reset Request',
 '<h2>Password Reset</h2><p>Hello {{userName}},</p><p>Click here to reset your password: {{resetUrl}}</p>',
 'Password reset email template',
 '{"userName": "string", "resetUrl": "string", "expiresIn": "string"}'
),
('audit-alert', 'SIMS Security Alert - {{alertType}}',
 '<h2>Security Alert</h2><p>Alert Type: {{alertType}}</p><p>Severity: {{severity}}</p><p>Description: {{description}}</p>',
 'Security audit alert template',
 '{"alertType": "string", "severity": "string", "description": "string", "timestamp": "string"}'
);

-- Insert default email preferences for notification types
INSERT INTO email_preferences (user_id, notification_type, is_enabled, frequency)
SELECT 
    u.id,
    notification_type,
    true,
    'immediate'
FROM users u
CROSS JOIN (
    VALUES 
    ('system_notifications'),
    ('security_alerts'),
    ('account_changes'),
    ('school_updates'),
    ('audit_reports')
) AS types(notification_type)
ON CONFLICT (user_id, notification_type) DO NOTHING;

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for updated_at
CREATE TRIGGER update_email_logs_updated_at BEFORE UPDATE ON email_logs FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_email_templates_updated_at BEFORE UPDATE ON email_templates FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_email_queue_updated_at BEFORE UPDATE ON email_queue FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_email_preferences_updated_at BEFORE UPDATE ON email_preferences FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Grant permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON email_logs TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON email_templates TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON email_queue TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON email_preferences TO authenticated;