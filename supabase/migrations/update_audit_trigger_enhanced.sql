-- =====================================================
-- ENHANCED AUDIT TRIGGER FUNCTION WITH SESSION VARIABLES
-- =====================================================

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
    current_user_email text;
    current_user_role text;
    current_ip_address text;
    current_user_agent text;
    current_request_id text;
    record_id_value uuid;
    school_name_value text;
    duration_start_time bigint;
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
    
    -- Get current user context from session variables (if available)
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
    
    BEGIN
        current_user_email := current_setting('audit.user_email');
    EXCEPTION WHEN OTHERS THEN
        current_user_email := NULL;
    END;
    
    BEGIN
        current_user_role := current_setting('audit.user_role');
    EXCEPTION WHEN OTHERS THEN
        current_user_role := NULL;
    END;
    
    BEGIN
        current_ip_address := current_setting('audit.ip_address');
    EXCEPTION WHEN OTHERS THEN
        current_ip_address := NULL;
    END;
    
    BEGIN
        current_user_agent := current_setting('audit.user_agent');
    EXCEPTION WHEN OTHERS THEN
        current_user_agent := NULL;
    END;
    
    BEGIN
        current_request_id := current_setting('audit.request_id');
    EXCEPTION WHEN OTHERS THEN
        current_request_id := NULL;
    END;
    
    -- Extract record ID using proper record field access
    BEGIN
        IF TG_OP = 'DELETE' THEN
            record_id_value := (to_jsonb(OLD)->>'id')::uuid;
        ELSE
            record_id_value := (to_jsonb(NEW)->>'id')::uuid;
        END IF;
    EXCEPTION WHEN OTHERS THEN
        record_id_value := NULL;
    END;
    
    -- Get school name if this is a schools table operation or if we have school_id
    BEGIN
        IF TG_TABLE_NAME = 'schools' THEN
            IF TG_OP = 'DELETE' THEN
                school_name_value := OLD.name;
            ELSE
                school_name_value := NEW.name;
            END IF;
        ELSIF current_school_id IS NOT NULL THEN
            SELECT name INTO school_name_value FROM schools WHERE id = current_school_id;
        END IF;
    EXCEPTION WHEN OTHERS THEN
        school_name_value := NULL;
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
    
    -- Insert enhanced audit log with session context
    INSERT INTO audit_logs (
        operation_type,
        table_name,
        record_id,
        user_id,
        user_email,
        user_role,
        school_id,
        school_name,
        ip_address,
        user_agent,
        request_id,
        old_values,
        new_values,
        changed_fields,
        fields_changed,
        module,
        action,
        description,
        success,
        duration_ms,
        created_at
    ) VALUES (
        operation_type,
        TG_TABLE_NAME,
        record_id_value,
        current_user_id,
        current_user_email,
        current_user_role,
        current_school_id,
        school_name_value,
        current_ip_address,
        current_user_agent,
        current_request_id,
        old_data,
        new_data,
        changed_fields,
        COALESCE(array_length(changed_fields, 1), 0),
        audit_config.module,
        TG_OP || '_' || TG_TABLE_NAME,
        operation_type || ' operation on ' || TG_TABLE_NAME,
        true,
        NULL, -- Duration will be calculated by application if needed
        now()
    );
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- UPDATE AUDIT_LOGS TABLE STRUCTURE
-- =====================================================

-- Add missing columns to audit_logs table if they don't exist
DO $$ 
BEGIN
    -- Add user_email column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'audit_logs' AND column_name = 'user_email') THEN
        ALTER TABLE audit_logs ADD COLUMN user_email text;
    END IF;
    
    -- Add user_role column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'audit_logs' AND column_name = 'user_role') THEN
        ALTER TABLE audit_logs ADD COLUMN user_role text;
    END IF;
    
    -- Add school_name column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'audit_logs' AND column_name = 'school_name') THEN
        ALTER TABLE audit_logs ADD COLUMN school_name text;
    END IF;
    
    -- Add ip_address column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'audit_logs' AND column_name = 'ip_address') THEN
        ALTER TABLE audit_logs ADD COLUMN ip_address inet;
    END IF;
    
    -- Add user_agent column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'audit_logs' AND column_name = 'user_agent') THEN
        ALTER TABLE audit_logs ADD COLUMN user_agent text;
    END IF;
    
    -- Add request_id column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'audit_logs' AND column_name = 'request_id') THEN
        ALTER TABLE audit_logs ADD COLUMN request_id text;
    END IF;
    
    -- Add fields_changed column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'audit_logs' AND column_name = 'fields_changed') THEN
        ALTER TABLE audit_logs ADD COLUMN fields_changed integer DEFAULT 0;
    END IF;
    
    -- Add success column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'audit_logs' AND column_name = 'success') THEN
        ALTER TABLE audit_logs ADD COLUMN success boolean DEFAULT true;
    END IF;
    
    -- Add error_message column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'audit_logs' AND column_name = 'error_message') THEN
        ALTER TABLE audit_logs ADD COLUMN error_message text;
    END IF;
    
    -- Add duration_ms column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'audit_logs' AND column_name = 'duration_ms') THEN
        ALTER TABLE audit_logs ADD COLUMN duration_ms integer;
    END IF;
END $$;

-- Create indexes for new columns
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_email ON audit_logs(user_email);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_role ON audit_logs(user_role);
CREATE INDEX IF NOT EXISTS idx_audit_logs_school_name ON audit_logs(school_name);
CREATE INDEX IF NOT EXISTS idx_audit_logs_ip_address ON audit_logs(ip_address);
CREATE INDEX IF NOT EXISTS idx_audit_logs_request_id ON audit_logs(request_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_success ON audit_logs(success);

COMMENT ON FUNCTION audit_trigger_function() IS 'Enhanced audit trigger function that captures user context from PostgreSQL session variables';