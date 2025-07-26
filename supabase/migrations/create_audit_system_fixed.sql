-- =====================================================
-- SIMS AUDIT TRAIL SYSTEM - FIXED VERSION
-- =====================================================
-- Comprehensive audit trail system for School Information Management System
-- Tracks all database operations, user activities, and system events
-- 
-- Author: Assistant
-- Version: 1.1.0 (Fixed empty array types)
-- Date: 2025-07-26
-- =====================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =====================================================
-- 1. AUDIT LOGS TABLE
-- =====================================================

-- Main audit logs table for tracking all operations
CREATE TABLE IF NOT EXISTS audit_logs (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    operation_type varchar(20) NOT NULL CHECK (operation_type IN ('CREATE', 'UPDATE', 'DELETE', 'LOGIN', 'LOGOUT', 'ACCESS')),
    table_name varchar(100) NOT NULL,
    record_id uuid,
    user_id uuid,
    user_email varchar(255),
    user_role varchar(50),
    school_id uuid,
    ip_address inet,
    user_agent text,
    module varchar(50),
    action varchar(100),
    description text,
    old_values jsonb,
    new_values jsonb,
    changed_fields text[],
    success boolean DEFAULT true,
    error_message text,
    duration_ms integer,
    request_id varchar(100),
    session_id varchar(100),
    created_at timestamp with time zone DEFAULT now(),
    
    -- Indexes for performance
    CONSTRAINT fk_audit_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
    CONSTRAINT fk_audit_school FOREIGN KEY (school_id) REFERENCES schools(id) ON DELETE SET NULL
);

-- Create indexes for audit_logs
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_table_name ON audit_logs(table_name);
CREATE INDEX IF NOT EXISTS idx_audit_logs_operation_type ON audit_logs(operation_type);
CREATE INDEX IF NOT EXISTS idx_audit_logs_school_id ON audit_logs(school_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_module ON audit_logs(module);
CREATE INDEX IF NOT EXISTS idx_audit_logs_success ON audit_logs(success);

-- =====================================================
-- 2. USER SESSIONS TABLE
-- =====================================================

-- Track user login sessions for security audit
CREATE TABLE IF NOT EXISTS user_sessions (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id uuid NOT NULL,
    session_token varchar(255) UNIQUE NOT NULL,
    ip_address inet,
    user_agent text,
    login_at timestamp with time zone DEFAULT now(),
    logout_at timestamp with time zone,
    is_active boolean DEFAULT true,
    last_activity timestamp with time zone DEFAULT now(),
    school_id uuid,
    login_method varchar(50) DEFAULT 'password',
    device_info jsonb,
    location_info jsonb,
    
    CONSTRAINT fk_session_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_session_school FOREIGN KEY (school_id) REFERENCES schools(id) ON DELETE SET NULL
);

-- Create indexes for user_sessions
CREATE INDEX IF NOT EXISTS idx_user_sessions_user_id ON user_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_active ON user_sessions(is_active);
CREATE INDEX IF NOT EXISTS idx_user_sessions_login_at ON user_sessions(login_at DESC);

-- =====================================================
-- 3. DATA ACCESS LOGS TABLE
-- =====================================================

-- Track access to sensitive data
CREATE TABLE IF NOT EXISTS data_access_logs (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id uuid NOT NULL,
    table_name varchar(100) NOT NULL,
    record_id uuid,
    access_type varchar(20) NOT NULL CHECK (access_type IN ('READ', 'export', 'search', 'report')),
    sensitive_fields text[],
    query_type varchar(50),
    result_count integer,
    filters_applied jsonb,
    purpose varchar(100),
    ip_address inet,
    user_agent text,
    school_id uuid,
    created_at timestamp with time zone DEFAULT now(),
    
    CONSTRAINT fk_data_access_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_data_access_school FOREIGN KEY (school_id) REFERENCES schools(id) ON DELETE SET NULL
);

-- Create indexes for data_access_logs
CREATE INDEX IF NOT EXISTS idx_data_access_user_id ON data_access_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_data_access_table_name ON data_access_logs(table_name);
CREATE INDEX IF NOT EXISTS idx_data_access_created_at ON data_access_logs(created_at DESC);

-- =====================================================
-- 4. SYSTEM EVENTS TABLE
-- =====================================================

-- Track system-level events and administrative actions
CREATE TABLE IF NOT EXISTS system_events (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_type varchar(50) NOT NULL,
    event_category varchar(50) NOT NULL,
    severity varchar(20) DEFAULT 'INFO' CHECK (severity IN ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL')),
    title varchar(200) NOT NULL,
    description text,
    details jsonb,
    user_id uuid,
    school_id uuid,
    ip_address inet,
    created_at timestamp with time zone DEFAULT now(),
    
    CONSTRAINT fk_system_event_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
    CONSTRAINT fk_system_event_school FOREIGN KEY (school_id) REFERENCES schools(id) ON DELETE SET NULL
);

-- Create indexes for system_events
CREATE INDEX IF NOT EXISTS idx_system_events_created_at ON system_events(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_system_events_severity ON system_events(severity);
CREATE INDEX IF NOT EXISTS idx_system_events_event_type ON system_events(event_type);

-- =====================================================
-- 5. AUDIT CONFIGURATION TABLE
-- =====================================================

-- Configuration for audit trail behavior per table
CREATE TABLE IF NOT EXISTS audit_configuration (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    table_name varchar(100) UNIQUE NOT NULL,
    module varchar(50) NOT NULL,
    is_enabled boolean DEFAULT true,
    track_reads boolean DEFAULT false,
    track_creates boolean DEFAULT true,
    track_updates boolean DEFAULT true,
    track_deletes boolean DEFAULT true,
    sensitive_fields text[] DEFAULT '{}',
    excluded_fields text[] DEFAULT '{}',
    retention_days integer DEFAULT 365,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- =====================================================
-- 6. AUDIT TRIGGER FUNCTION
-- =====================================================

-- Main trigger function for audit logging
CREATE OR REPLACE FUNCTION audit_trigger_function()
RETURNS trigger AS $$
DECLARE
    audit_config RECORD;
    old_data jsonb;
    new_data jsonb;
    changed_fields text[];
    operation_type varchar(20);
    field_name text;
    current_user_id uuid;
    current_school_id uuid;
BEGIN
    -- Get audit configuration for this table
    SELECT * INTO audit_config 
    FROM audit_configuration 
    WHERE table_name = TG_TABLE_NAME AND is_enabled = true;
    
    -- Skip if audit is disabled for this table
    IF NOT FOUND THEN
        RETURN COALESCE(NEW, OLD);
    END IF;
    
    -- Determine operation type
    IF TG_OP = 'INSERT' THEN
        operation_type := 'CREATE';
        IF NOT audit_config.track_creates THEN
            RETURN NEW;
        END IF;
    ELSIF TG_OP = 'UPDATE' THEN
        operation_type := 'UPDATE';
        IF NOT audit_config.track_updates THEN
            RETURN NEW;
        END IF;
    ELSIF TG_OP = 'DELETE' THEN
        operation_type := 'DELETE';
        IF NOT audit_config.track_deletes THEN
            RETURN OLD;
        END IF;
    END IF;
    
    -- Get current user context (if available)
    BEGIN
        current_user_id := current_setting('audit.user_id')::uuid;
    EXCEPTION WHEN OTHERS THEN
        current_user_id := NULL;
    END;
    
    BEGIN
        current_school_id := current_setting('audit.school_id')::uuid;
    EXCEPTION WHEN OTHERS THEN
        current_school_id := NULL;
    END;
    
    -- Prepare old and new data
    IF TG_OP = 'DELETE' THEN
        old_data := to_jsonb(OLD);
        new_data := NULL;
    ELSIF TG_OP = 'INSERT' THEN
        old_data := NULL;
        new_data := to_jsonb(NEW);
    ELSE -- UPDATE
        old_data := to_jsonb(OLD);
        new_data := to_jsonb(NEW);
        
        -- Identify changed fields
        changed_fields := ARRAY[]::text[];
        FOR field_name IN SELECT jsonb_object_keys(new_data)
        LOOP
            IF old_data->field_name IS DISTINCT FROM new_data->field_name THEN
                changed_fields := array_append(changed_fields, field_name);
            END IF;
        END LOOP;
    END IF;
    
    -- Remove sensitive fields from logged data
    IF audit_config.sensitive_fields IS NOT NULL AND array_length(audit_config.sensitive_fields, 1) > 0 THEN
        FOR field_name IN SELECT unnest(audit_config.sensitive_fields)
        LOOP
            old_data := old_data - field_name;
            new_data := new_data - field_name;
        END LOOP;
    END IF;
    
    -- Remove excluded fields from logged data
    IF audit_config.excluded_fields IS NOT NULL AND array_length(audit_config.excluded_fields, 1) > 0 THEN
        FOR field_name IN SELECT unnest(audit_config.excluded_fields)
        LOOP
            old_data := old_data - field_name;
            new_data := new_data - field_name;
        END LOOP;
    END IF;
    
    -- Insert audit log
    INSERT INTO audit_logs (
        operation_type,
        table_name,
        record_id,
        user_id,
        school_id,
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
        current_user_id,
        current_school_id,
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
-- 8. INITIAL AUDIT CONFIGURATION (FIXED EMPTY ARRAYS)
-- =====================================================

-- Configure audit settings for all main tables with explicit array types
INSERT INTO audit_configuration (table_name, module, track_reads, sensitive_fields, excluded_fields) VALUES
('users', 'users', false, ARRAY['password_hash', 'email']::text[], ARRAY['updated_at']::text[]),
('schools', 'schools', false, ARRAY[]::text[], ARRAY['updated_at']::text[]),
('student_profiles', 'students', false, ARRAY['emergency_contact']::text[], ARRAY['updated_at']::text[]),
('teacher_profiles', 'teachers', false, ARRAY['salary']::text[], ARRAY['updated_at']::text[]),
('parent_profiles', 'parents', false, ARRAY['phone', 'email']::text[], ARRAY['updated_at']::text[]),
('classes', 'academic', false, ARRAY[]::text[], ARRAY['updated_at']::text[]),
('attendance', 'attendance', false, ARRAY[]::text[], ARRAY['updated_at']::text[]),
('grades', 'grades', false, ARRAY[]::text[], ARRAY['updated_at']::text[]),
('fee_payments', 'finance', false, ARRAY[]::text[], ARRAY['updated_at']::text[]),
('expenses', 'finance', false, ARRAY[]::text[], ARRAY['updated_at']::text[]),
('library_issues', 'library', false, ARRAY[]::text[], ARRAY['updated_at']::text[]),
('user_roles', 'users', false, ARRAY[]::text[], ARRAY['updated_at']::text[]),
('announcements', 'communication', false, ARRAY[]::text[], ARRAY['updated_at']::text[]),
('notifications', 'communication', false, ARRAY[]::text[], ARRAY['updated_at']::text[])
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