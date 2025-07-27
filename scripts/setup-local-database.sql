-- =====================================================
-- SIMS LOCAL POSTGRESQL SETUP
-- =====================================================
-- Complete database setup for local PostgreSQL instance
-- Run this script after creating the 'sims' database
-- =====================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =====================================================
-- CORE TABLES
-- =====================================================

-- Schools table (must be created first due to foreign key dependencies)
CREATE TABLE IF NOT EXISTS schools (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    name varchar(255) NOT NULL,
    code varchar(50) UNIQUE NOT NULL,
    address text,
    phone varchar(20),
    email varchar(255),
    website varchar(255),
    logo_url varchar(500),
    is_active boolean DEFAULT true,
    subscription_status varchar(20) DEFAULT 'trial',
    trial_ends_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- Users table
CREATE TABLE IF NOT EXISTS users (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    email varchar(255) UNIQUE NOT NULL,
    password varchar(255) NOT NULL,
    first_name varchar(100) NOT NULL,
    last_name varchar(100) NOT NULL,
    role varchar(50) NOT NULL CHECK (role IN ('super_admin', 'school_admin', 'teacher', 'student', 'parent')),
    school_id uuid,
    is_active boolean DEFAULT true,
    email_verified boolean DEFAULT false,
    last_login timestamp with time zone,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    
    CONSTRAINT fk_user_school FOREIGN KEY (school_id) REFERENCES schools(id) ON DELETE SET NULL
);

-- Academic Years table
CREATE TABLE IF NOT EXISTS academic_years (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    school_id uuid NOT NULL,
    name varchar(100) NOT NULL,
    start_date date NOT NULL,
    end_date date NOT NULL,
    is_current boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    
    CONSTRAINT fk_academic_year_school FOREIGN KEY (school_id) REFERENCES schools(id) ON DELETE CASCADE
);

-- Classes table
CREATE TABLE IF NOT EXISTS classes (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    school_id uuid NOT NULL,
    academic_year_id uuid NOT NULL,
    name varchar(100) NOT NULL,
    grade_level integer NOT NULL,
    section varchar(10),
    class_teacher_id uuid,
    max_students integer DEFAULT 30,
    room_number varchar(20),
    is_active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    
    CONSTRAINT fk_class_school FOREIGN KEY (school_id) REFERENCES schools(id) ON DELETE CASCADE,
    CONSTRAINT fk_class_academic_year FOREIGN KEY (academic_year_id) REFERENCES academic_years(id) ON DELETE CASCADE,
    CONSTRAINT fk_class_teacher FOREIGN KEY (class_teacher_id) REFERENCES users(id) ON DELETE SET NULL
);

-- Student Profiles table
CREATE TABLE IF NOT EXISTS student_profiles (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id uuid NOT NULL,
    student_id varchar(50) UNIQUE NOT NULL,
    class_id uuid,
    admission_date date,
    date_of_birth date,
    gender varchar(10),
    address text,
    parent_contact varchar(20),
    emergency_contact varchar(20),
    medical_info text,
    is_active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    
    CONSTRAINT fk_student_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_student_class FOREIGN KEY (class_id) REFERENCES classes(id) ON DELETE SET NULL
);

-- =====================================================
-- SUBSCRIPTION SYSTEM
-- =====================================================

-- Subscription Plans table
CREATE TABLE IF NOT EXISTS subscription_plans (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    name varchar(100) NOT NULL,
    description text,
    price numeric(10,2) NOT NULL,
    currency varchar(3) DEFAULT 'USD',
    billing_cycle varchar(20) NOT NULL CHECK (billing_cycle IN ('monthly', 'yearly')),
    max_students integer,
    max_teachers integer,
    max_classes integer,
    features jsonb DEFAULT '{}',
    is_active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- School Subscriptions table
CREATE TABLE IF NOT EXISTS school_subscriptions (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    school_id uuid NOT NULL,
    plan_id uuid NOT NULL,
    status varchar(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended', 'cancelled')),
    start_date date NOT NULL,
    end_date date NOT NULL,
    auto_renew boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    
    CONSTRAINT fk_subscription_school FOREIGN KEY (school_id) REFERENCES schools(id) ON DELETE CASCADE,
    CONSTRAINT fk_subscription_plan FOREIGN KEY (plan_id) REFERENCES subscription_plans(id) ON DELETE RESTRICT
);

-- =====================================================
-- AUDIT SYSTEM (Essential for SIMS)
-- =====================================================

-- Audit Logs table
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
    school_name text,
    fields_changed integer DEFAULT 0,
    
    CONSTRAINT fk_audit_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
    CONSTRAINT fk_audit_school FOREIGN KEY (school_id) REFERENCES schools(id) ON DELETE SET NULL
);

-- Audit Configuration table
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
-- EMAIL SYSTEM
-- =====================================================

-- Email Templates table
CREATE TABLE IF NOT EXISTS email_templates (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name varchar(100) UNIQUE NOT NULL,
    subject varchar(255) NOT NULL,
    body_html text NOT NULL,
    body_text text,
    variables jsonb DEFAULT '{}',
    is_active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- Email Queue table
CREATE TABLE IF NOT EXISTS email_queue (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    recipient_email varchar(255) NOT NULL,
    cc_emails text,
    bcc_emails text,
    subject varchar(255) NOT NULL,
    template_name varchar(100),
    template_data jsonb,
    priority integer DEFAULT 5,
    max_attempts integer DEFAULT 3,
    attempts integer DEFAULT 0,
    status varchar(20) DEFAULT 'pending',
    scheduled_at timestamp with time zone DEFAULT now(),
    processed_at timestamp with time zone,
    error_message text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- Email Logs table
CREATE TABLE IF NOT EXISTS email_logs (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    recipient_email varchar(255) NOT NULL,
    cc_emails text,
    bcc_emails text,
    subject varchar(255) NOT NULL,
    template_name varchar(100),
    message_id varchar(255),
    tracking_id varchar(255),
    status varchar(20) NOT NULL DEFAULT 'sent',
    error_message text,
    template_data jsonb,
    sent_at timestamp with time zone DEFAULT now(),
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- =====================================================
-- INDEXES FOR PERFORMANCE
-- =====================================================

-- Users indexes
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_school_id ON users(school_id);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);

-- Audit logs indexes
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_table_name ON audit_logs(table_name);
CREATE INDEX IF NOT EXISTS idx_audit_logs_school_id ON audit_logs(school_id);

-- Classes indexes
CREATE INDEX IF NOT EXISTS idx_classes_school_id ON classes(school_id);
CREATE INDEX IF NOT EXISTS idx_classes_academic_year_id ON classes(academic_year_id);

-- Student profiles indexes
CREATE INDEX IF NOT EXISTS idx_student_profiles_user_id ON student_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_student_profiles_class_id ON student_profiles(class_id);

-- =====================================================
-- INITIAL DATA
-- =====================================================

-- Insert default subscription plans
INSERT INTO subscription_plans (name, description, price, billing_cycle, max_students, max_teachers, max_classes, features) VALUES
('Basic', 'Basic plan for small schools', 29.99, 'monthly', 100, 10, 10, '{"reports": true, "email_support": true}'),
('Standard', 'Standard plan for medium schools', 59.99, 'monthly', 500, 50, 50, '{"reports": true, "email_support": true, "phone_support": true, "advanced_analytics": true}'),
('Premium', 'Premium plan for large schools', 99.99, 'monthly', 1000, 100, 100, '{"reports": true, "email_support": true, "phone_support": true, "advanced_analytics": true, "custom_branding": true, "api_access": true}')
ON CONFLICT (name) DO NOTHING;

-- Insert audit configuration for core tables
INSERT INTO audit_configuration (table_name, module, track_reads, track_creates, track_updates, track_deletes) VALUES
('users', 'User Management', false, true, true, true),
('schools', 'School Management', false, true, true, true),
('student_profiles', 'Student Management', false, true, true, true),
('classes', 'Class Management', false, true, true, true),
('academic_years', 'Academic Management', false, true, true, true)
ON CONFLICT (table_name) DO NOTHING;

-- =====================================================
-- SUCCESS MESSAGE
-- =====================================================

DO $$
BEGIN
    RAISE NOTICE '✅ SIMS Local Database Setup Complete!';
    RAISE NOTICE '📊 Tables created: schools, users, academic_years, classes, student_profiles';
    RAISE NOTICE '💳 Subscription system: subscription_plans, school_subscriptions';
    RAISE NOTICE '📋 Audit system: audit_logs, audit_configuration';
    RAISE NOTICE '📧 Email system: email_templates, email_queue, email_logs';
    RAISE NOTICE '🔍 Performance indexes created';
    RAISE NOTICE '📝 Initial data inserted';
    RAISE NOTICE '';
    RAISE NOTICE '🚀 Next steps:';
    RAISE NOTICE '1. Update your .env file with local database URL';
    RAISE NOTICE '2. Run: node scripts/test-local-connection.js';
    RAISE NOTICE '3. Create super admin: node scripts/create-super-admin.js';
END $$;