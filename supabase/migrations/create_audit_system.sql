-- =====================================================
-- COMPREHENSIVE AUDIT TRAIL SYSTEM
-- =====================================================
-- This migration creates a complete audit trail system for transparency and accountability
-- Author: Assistant
-- Version: 1.0.0

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- 1. AUDIT LOGS TABLE
-- =====================================================

-- Main audit logs table to track all system operations
CREATE TABLE IF NOT EXISTS audit_logs (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Operation details
  operation_type text NOT NULL CHECK (operation_type IN ('CREATE', 'UPDATE', 'DELETE', 'LOGIN', 'LOGOUT', 'ACCESS', 'EXPORT', 'IMPORT')),
  table_name text NOT NULL,
  record_id uuid,
  
  -- User context
  user_id uuid REFERENCES users(id),
  user_email text,
  user_role text,
  school_id uuid REFERENCES schools(id),
  
  -- Request context
  ip_address inet,
  user_agent text,
  request_id uuid,
  session_id text,
  
  -- Data changes
  old_values jsonb,
  new_values jsonb,
  changed_fields text[],
  
  -- Additional context
  description text,
  module text NOT NULL, -- e.g., 'students', 'attendance', 'finance'
  action text NOT NULL, -- e.g., 'create_student', 'mark_attendance'
  
  -- Metadata
  success boolean DEFAULT true,
  error_message text,
  duration_ms integer,
  
  -- Timestamps
  created_at timestamptz DEFAULT now(),
  
  -- Indexes for performance
  CONSTRAINT audit_logs_operation_check CHECK (operation_type IS NOT NULL),
  CONSTRAINT audit_logs_table_check CHECK (table_name IS NOT NULL)
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_table_name ON audit_logs(table_name);
CREATE INDEX IF NOT EXISTS idx_audit_logs_operation_type ON audit_logs(operation_type);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_audit_logs_school_id ON audit_logs(school_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_module ON audit_logs(module);
CREATE INDEX IF NOT EXISTS idx_audit_logs_record_id ON audit_logs(record_id);

-- =====================================================
-- 2. USER SESSIONS TABLE
-- =====================================================

-- Track user login sessions for security and audit purposes
CREATE TABLE IF NOT EXISTS user_sessions (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  session_token text UNIQUE NOT NULL,
  
  -- Session details
  ip_address inet,
  user_agent text,
  device_info jsonb,
  location_info jsonb,
  
  -- Session lifecycle
  login_at timestamptz DEFAULT now(),
  last_activity_at timestamptz DEFAULT now(),
  logout_at timestamptz,
  expires_at timestamptz NOT NULL,
  
  -- Session status
  is_active boolean DEFAULT true,
  logout_reason text, -- 'manual', 'timeout', 'forced', 'expired'
  
  -- Security flags
  is_suspicious boolean DEFAULT false,
  failed_attempts integer DEFAULT 0,
  
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create indexes for session management
CREATE INDEX IF NOT EXISTS idx_user_sessions_user_id ON user_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_token ON user_sessions(session_token);
CREATE INDEX IF NOT EXISTS idx_user_sessions_active ON user_sessions(is_active);
CREATE INDEX IF NOT EXISTS idx_user_sessions_expires_at ON user_sessions(expires_at);

-- =====================================================
-- 3. DATA ACCESS LOGS TABLE
-- =====================================================

-- Track data access for sensitive information
CREATE TABLE IF NOT EXISTS data_access_logs (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Access details
  user_id uuid NOT NULL REFERENCES users(id),
  accessed_table text NOT NULL,
  accessed_record_id uuid,
  access_type text NOT NULL CHECK (access_type IN ('READ', 'SEARCH', 'EXPORT', 'PRINT')),
  
  -- Query details
  query_type text, -- 'SELECT', 'SEARCH', 'REPORT'
  filters_applied jsonb,
  records_count integer,
  
  -- Context
  module text NOT NULL,
  feature text, -- specific feature within module
  purpose text, -- reason for access
  
  -- Request context
  ip_address inet,
  user_agent text,
  request_id uuid,
  
  -- Timestamps
  accessed_at timestamptz DEFAULT now(),
  
  -- Performance tracking
  duration_ms integer
);

-- Create indexes for data access tracking
CREATE INDEX IF NOT EXISTS idx_data_access_user_id ON data_access_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_data_access_table ON data_access_logs(accessed_table);
CREATE INDEX IF NOT EXISTS idx_data_access_type ON data_access_logs(access_type);
CREATE INDEX IF NOT EXISTS idx_data_access_accessed_at ON data_access_logs(accessed_at);

-- =====================================================
-- 4. SYSTEM EVENTS TABLE
-- =====================================================

-- Track system-level events and administrative actions
CREATE TABLE IF NOT EXISTS system_events (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Event details
  event_type text NOT NULL CHECK (event_type IN ('SYSTEM_START', 'SYSTEM_STOP', 'BACKUP', 'RESTORE', 'MAINTENANCE', 'SECURITY_ALERT', 'CONFIGURATION_CHANGE')),
  event_category text NOT NULL, -- 'SYSTEM', 'SECURITY', 'ADMIN', 'MAINTENANCE'
  severity text NOT NULL CHECK (severity IN ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL')),
  
  -- Event context
  title text NOT NULL,
  description text,
  details jsonb,
  
  -- User context (if applicable)
  triggered_by uuid REFERENCES users(id),
  affected_users uuid[],
  affected_schools uuid[],
  
  -- System context
  server_info jsonb,
  environment text DEFAULT 'production',
  
  -- Resolution
  status text DEFAULT 'OPEN' CHECK (status IN ('OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED')),
  resolved_by uuid REFERENCES users(id),
  resolved_at timestamptz,
  resolution_notes text,
  
  -- Timestamps
  occurred_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create indexes for system events
CREATE INDEX IF NOT EXISTS idx_system_events_type ON system_events(event_type);
CREATE INDEX IF NOT EXISTS idx_system_events_category ON system_events(event_category);
CREATE INDEX IF NOT EXISTS idx_system_events_severity ON system_events(severity);
CREATE INDEX IF NOT EXISTS idx_system_events_occurred_at ON system_events(occurred_at);
CREATE INDEX IF NOT EXISTS idx_system_events_status ON system_events(status);

-- =====================================================
-- 5. AUDIT CONFIGURATION TABLE
-- =====================================================

-- Configure audit settings per module/table
CREATE TABLE IF NOT EXISTS audit_configuration (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Configuration scope
  table_name text NOT NULL UNIQUE,
  module text NOT NULL,
  
  -- Audit settings
  is_enabled boolean DEFAULT true,
  track_creates boolean DEFAULT true,
  track_updates boolean DEFAULT true,
  track_deletes boolean DEFAULT true,
  track_reads boolean DEFAULT false,
  
  -- Data retention
  retention_days integer DEFAULT 2555, -- 7 years default
  
  -- Sensitive fields (to be masked in logs)
  sensitive_fields text[],
  
  -- Excluded fields (not to be logged)
  excluded_fields text[],
  
  -- Configuration metadata
  configured_by uuid REFERENCES users(id),
  configured_at timestamptz DEFAULT now(),
  
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- =====================================================
-- 6. AUDIT TRIGGERS FUNCTION
-- =====================================================

-- Generic function to handle audit logging for any table
CREATE OR REPLACE FUNCTION audit_trigger_function()
RETURNS TRIGGER AS $$
DECLARE
    audit_config RECORD;
    old_data jsonb;
    new_data jsonb;
    changed_fields text[];
    operation_type text;
BEGIN
    -- Get audit configuration for this table
    SELECT * INTO audit_config 
    FROM audit_configuration 
    WHERE table_name = TG_TABLE_NAME AND is_enabled = true;
    
    -- Skip if audit is not configured or disabled
    IF NOT FOUND THEN
        RETURN COALESCE(NEW, OLD);
    END IF;
    
    -- Determine operation type
    IF TG_OP = 'INSERT' THEN
        operation_type := 'CREATE';
        new_data := to_jsonb(NEW);
        old_data := NULL;
        
        -- Skip if create tracking is disabled
        IF NOT audit_config.track_creates THEN
            RETURN NEW;
        END IF;
        
    ELSIF TG_OP = 'UPDATE' THEN
        operation_type := 'UPDATE';
        old_data := to_jsonb(OLD);
        new_data := to_jsonb(NEW);
        
        -- Skip if update tracking is disabled
        IF NOT audit_config.track_updates THEN
            RETURN NEW;
        END IF;
        
        -- Find changed fields
        SELECT array_agg(key) INTO changed_fields
        FROM jsonb_each(old_data) o
        WHERE o.value IS DISTINCT FROM (new_data->o.key);
        
    ELSIF TG_OP = 'DELETE' THEN
        operation_type := 'DELETE';
        old_data := to_jsonb(OLD);
        new_data := NULL;
        
        -- Skip if delete tracking is disabled
        IF NOT audit_config.track_deletes THEN
            RETURN OLD;
        END IF;
    END IF;
    
    -- Insert audit log
    INSERT INTO audit_logs (
        operation_type,
        table_name,
        record_id,
        old_values,
        new_values,
        changed_fields,
        module,
        action,
        description,
        created_at
    ) VALUES (
        operation_type,
        TG_TABLE_NAME,
        COALESCE((NEW->>'id')::uuid, (OLD->>'id')::uuid),
        old_data,
        new_data,
        changed_fields,
        audit_config.module,
        TG_OP || '_' || TG_TABLE_NAME,
        operation_type || ' operation on ' || TG_TABLE_NAME,
        now()
    );
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 7. AUDIT CLEANUP FUNCTION
-- =====================================================

-- Function to clean up old audit logs based on retention policy
CREATE OR REPLACE FUNCTION cleanup_audit_logs()
RETURNS void AS $$
DECLARE
    config_record RECORD;
    deleted_count integer;
BEGIN
    -- Loop through each audit configuration
    FOR config_record IN 
        SELECT table_name, retention_days 
        FROM audit_configuration 
        WHERE is_enabled = true AND retention_days > 0
    LOOP
        -- Delete old audit logs for this table
        DELETE FROM audit_logs 
        WHERE table_name = config_record.table_name 
        AND created_at < (now() - (config_record.retention_days || ' days')::interval);
        
        GET DIAGNOSTICS deleted_count = ROW_COUNT;
        
        -- Log cleanup activity
        INSERT INTO system_events (
            event_type,
            event_category,
            severity,
            title,
            description,
            details
        ) VALUES (
            'MAINTENANCE',
            'SYSTEM',
            'LOW',
            'Audit Log Cleanup',
            'Cleaned up old audit logs for table: ' || config_record.table_name,
            jsonb_build_object(
                'table_name', config_record.table_name,
                'retention_days', config_record.retention_days,
                'deleted_count', deleted_count
            )
        );
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 8. INITIAL AUDIT CONFIGURATION
-- =====================================================

-- Configure audit settings for all main tables
INSERT INTO audit_configuration (table_name, module, track_reads, sensitive_fields, excluded_fields) VALUES
('users', 'users', false, ARRAY['password_hash', 'email'], ARRAY['updated_at']),
('schools', 'schools', false, ARRAY[], ARRAY['updated_at']),
('student_profiles', 'students', false, ARRAY['emergency_contact'], ARRAY['updated_at']),
('teacher_profiles', 'teachers', false, ARRAY['salary'], ARRAY['updated_at']),
('parent_profiles', 'parents', false, ARRAY['phone', 'email'], ARRAY['updated_at']),
('classes', 'academic', false, ARRAY[], ARRAY['updated_at']),
('attendance', 'attendance', false, ARRAY[], ARRAY['updated_at']),
('grades', 'grades', false, ARRAY[], ARRAY['updated_at']),
('fee_payments', 'finance', false, ARRAY[], ARRAY['updated_at']),
('expenses', 'finance', false, ARRAY[], ARRAY['updated_at']),
('library_issues', 'library', false, ARRAY[], ARRAY['updated_at']),
('user_roles', 'users', false, ARRAY[], ARRAY['updated_at']),
('announcements', 'communication', false, ARRAY[], ARRAY['updated_at']),
('notifications', 'communication', false, ARRAY[], ARRAY['updated_at'])
ON CONFLICT (table_name) DO NOTHING;

-- =====================================================
-- 9. CREATE AUDIT TRIGGERS FOR MAIN TABLES
-- =====================================================

-- Function to create audit triggers for a table
CREATE OR REPLACE FUNCTION create_audit_trigger(table_name text)
RETURNS void AS $$
BEGIN
    EXECUTE format('
        CREATE TRIGGER audit_trigger_%s
        AFTER INSERT OR UPDATE OR DELETE ON %s
        FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();
    ', table_name, table_name);
END;
$$ LANGUAGE plpgsql;

-- Create audit triggers for main tables
SELECT create_audit_trigger('users');
SELECT create_audit_trigger('schools');
SELECT create_audit_trigger('student_profiles');
SELECT create_audit_trigger('teacher_profiles');
SELECT create_audit_trigger('parent_profiles');
SELECT create_audit_trigger('classes');
SELECT create_audit_trigger('attendance');
SELECT create_audit_trigger('grades');
SELECT create_audit_trigger('fee_payments');
SELECT create_audit_trigger('expenses');
SELECT create_audit_trigger('library_issues');
SELECT create_audit_trigger('user_roles');
SELECT create_audit_trigger('announcements');
SELECT create_audit_trigger('notifications');

-- =====================================================
-- 10. AUDIT VIEWS FOR REPORTING
-- =====================================================

-- View for user activity summary
CREATE OR REPLACE VIEW user_activity_summary AS
SELECT 
    u.id as user_id,
    u.first_name || ' ' || u.last_name as user_name,
    u.email,
    COUNT(al.id) as total_operations,
    COUNT(CASE WHEN al.operation_type = 'CREATE' THEN 1 END) as creates,
    COUNT(CASE WHEN al.operation_type = 'UPDATE' THEN 1 END) as updates,
    COUNT(CASE WHEN al.operation_type = 'DELETE' THEN 1 END) as deletes,
    COUNT(CASE WHEN al.operation_type = 'LOGIN' THEN 1 END) as logins,
    MAX(al.created_at) as last_activity,
    MIN(al.created_at) as first_activity
FROM users u
LEFT JOIN audit_logs al ON u.id = al.user_id
WHERE al.created_at >= (now() - interval '30 days')
GROUP BY u.id, u.first_name, u.last_name, u.email;

-- View for table modification summary
CREATE OR REPLACE VIEW table_modification_summary AS
SELECT 
    table_name,
    module,
    COUNT(*) as total_operations,
    COUNT(CASE WHEN operation_type = 'CREATE' THEN 1 END) as creates,
    COUNT(CASE WHEN operation_type = 'UPDATE' THEN 1 END) as updates,
    COUNT(CASE WHEN operation_type = 'DELETE' THEN 1 END) as deletes,
    COUNT(DISTINCT user_id) as unique_users,
    MAX(created_at) as last_modified,
    MIN(created_at) as first_modified
FROM audit_logs
WHERE created_at >= (now() - interval '30 days')
GROUP BY table_name, module
ORDER BY total_operations DESC;

-- View for recent critical activities
CREATE OR REPLACE VIEW recent_critical_activities AS
SELECT 
    al.id,
    al.operation_type,
    al.table_name,
    al.module,
    u.first_name || ' ' || u.last_name as user_name,
    u.email as user_email,
    s.name as school_name,
    al.description,
    al.created_at,
    al.ip_address
FROM audit_logs al
LEFT JOIN users u ON al.user_id = u.id
LEFT JOIN schools s ON al.school_id = s.id
WHERE al.operation_type IN ('DELETE', 'LOGIN', 'LOGOUT')
   OR al.table_name IN ('users', 'user_roles', 'schools')
   OR al.module IN ('finance', 'grades')
ORDER BY al.created_at DESC
LIMIT 100;

-- =====================================================
-- 11. SCHEDULED CLEANUP JOB
-- =====================================================

-- Note: This would typically be set up as a cron job or scheduled task
-- For PostgreSQL with pg_cron extension:
-- SELECT cron.schedule('audit-cleanup', '0 2 * * *', 'SELECT cleanup_audit_logs();');

COMMENT ON TABLE audit_logs IS 'Comprehensive audit trail for all system operations';
COMMENT ON TABLE user_sessions IS 'User login session tracking for security and audit';
COMMENT ON TABLE data_access_logs IS 'Detailed logging of data access for sensitive information';
COMMENT ON TABLE system_events IS 'System-level events and administrative actions';
COMMENT ON TABLE audit_configuration IS 'Configuration settings for audit trail system';