-- =====================================================
-- MULTI-TENANT SCHOOL MANAGEMENT SUBSCRIPTION SYSTEM
-- =====================================================

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- 1. SUBSCRIPTION PLANS
-- =====================================================

-- Subscription plans table
CREATE TABLE IF NOT EXISTS subscription_plans (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    price_monthly DECIMAL(10,2) NOT NULL,
    price_yearly DECIMAL(10,2),
    max_students INTEGER,
    max_teachers INTEGER,
    max_classes INTEGER,
    features JSONB DEFAULT '{}', -- Feature flags and limits
    is_active BOOLEAN DEFAULT true,
    trial_days INTEGER DEFAULT 30,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- 2. SCHOOL SUBSCRIPTIONS
-- =====================================================

-- School subscriptions table
CREATE TABLE IF NOT EXISTS school_subscriptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
    plan_id UUID NOT NULL REFERENCES subscription_plans(id),
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('trial', 'active', 'suspended', 'cancelled', 'expired')),
    billing_cycle VARCHAR(20) DEFAULT 'monthly' CHECK (billing_cycle IN ('monthly', 'yearly')),
    start_date DATE NOT NULL DEFAULT CURRENT_DATE,
    end_date DATE NOT NULL,
    trial_end_date DATE,
    auto_renew BOOLEAN DEFAULT true,
    current_students INTEGER DEFAULT 0,
    current_teachers INTEGER DEFAULT 0,
    current_classes INTEGER DEFAULT 0,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(school_id)
);

-- =====================================================
-- 3. BILLING AND PAYMENTS
-- =====================================================

-- Billing invoices table
CREATE TABLE IF NOT EXISTS billing_invoices (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
    subscription_id UUID NOT NULL REFERENCES school_subscriptions(id),
    invoice_number VARCHAR(50) UNIQUE NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    tax_amount DECIMAL(10,2) DEFAULT 0,
    total_amount DECIMAL(10,2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'USD',
    billing_period_start DATE NOT NULL,
    billing_period_end DATE NOT NULL,
    due_date DATE NOT NULL,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'overdue', 'cancelled', 'refunded')),
    payment_method VARCHAR(50),
    payment_reference VARCHAR(100),
    paid_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Payment transactions table
CREATE TABLE IF NOT EXISTS payment_transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    invoice_id UUID NOT NULL REFERENCES billing_invoices(id),
    school_id UUID NOT NULL REFERENCES schools(id),
    transaction_id VARCHAR(100) UNIQUE NOT NULL,
    payment_gateway VARCHAR(50) NOT NULL, -- 'stripe', 'paypal', 'razorpay', etc.
    amount DECIMAL(10,2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'USD',
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'cancelled', 'refunded')),
    gateway_response JSONB,
    processed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- 4. USAGE TRACKING
-- =====================================================

-- Usage metrics table
CREATE TABLE IF NOT EXISTS usage_metrics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
    metric_type VARCHAR(50) NOT NULL, -- 'students', 'teachers', 'classes', 'storage', 'api_calls'
    metric_value INTEGER NOT NULL,
    recorded_date DATE NOT NULL DEFAULT CURRENT_DATE,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(school_id, metric_type, recorded_date)
);

-- Feature usage tracking
CREATE TABLE IF NOT EXISTS feature_usage (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id),
    feature_name VARCHAR(100) NOT NULL,
    usage_count INTEGER DEFAULT 1,
    last_used_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- 5. TENANT CONFIGURATION
-- =====================================================

-- Tenant settings table (enhanced school settings)
CREATE TABLE IF NOT EXISTS tenant_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
    setting_category VARCHAR(50) NOT NULL, -- 'academic', 'billing', 'security', 'features'
    setting_key VARCHAR(100) NOT NULL,
    setting_value JSONB NOT NULL,
    is_system_setting BOOLEAN DEFAULT false,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(school_id, setting_category, setting_key)
);

-- =====================================================
-- 6. INDEXES FOR PERFORMANCE
-- =====================================================

-- Subscription plans indexes
CREATE INDEX IF NOT EXISTS idx_subscription_plans_active ON subscription_plans(is_active);
CREATE INDEX IF NOT EXISTS idx_subscription_plans_price ON subscription_plans(price_monthly, price_yearly);

-- School subscriptions indexes
CREATE INDEX IF NOT EXISTS idx_school_subscriptions_school_id ON school_subscriptions(school_id);
CREATE INDEX IF NOT EXISTS idx_school_subscriptions_status ON school_subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_school_subscriptions_end_date ON school_subscriptions(end_date);
CREATE INDEX IF NOT EXISTS idx_school_subscriptions_trial_end ON school_subscriptions(trial_end_date);

-- Billing indexes
CREATE INDEX IF NOT EXISTS idx_billing_invoices_school_id ON billing_invoices(school_id);
CREATE INDEX IF NOT EXISTS idx_billing_invoices_status ON billing_invoices(status);
CREATE INDEX IF NOT EXISTS idx_billing_invoices_due_date ON billing_invoices(due_date);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_status ON payment_transactions(status);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_gateway ON payment_transactions(payment_gateway);

-- Usage tracking indexes
CREATE INDEX IF NOT EXISTS idx_usage_metrics_school_date ON usage_metrics(school_id, recorded_date);
CREATE INDEX IF NOT EXISTS idx_usage_metrics_type ON usage_metrics(metric_type);
CREATE INDEX IF NOT EXISTS idx_feature_usage_school_feature ON feature_usage(school_id, feature_name);

-- Tenant settings indexes
CREATE INDEX IF NOT EXISTS idx_tenant_settings_school_category ON tenant_settings(school_id, setting_category);

-- =====================================================
-- 7. DEFAULT SUBSCRIPTION PLANS
-- =====================================================

INSERT INTO subscription_plans (name, description, price_monthly, price_yearly, max_students, max_teachers, max_classes, features) VALUES
('Basic', 'Perfect for small schools', 29.99, 299.99, 100, 10, 10, 
 '{"attendance": true, "grades": true, "basic_reports": true, "email_notifications": true, "storage_gb": 5}'
),
('Standard', 'Ideal for medium schools', 79.99, 799.99, 500, 50, 50,
 '{"attendance": true, "grades": true, "advanced_reports": true, "email_notifications": true, "sms_notifications": true, "parent_portal": true, "library_management": true, "fee_management": true, "storage_gb": 25}'
),
('Premium', 'Complete solution for large schools', 149.99, 1499.99, 2000, 200, 100,
 '{"attendance": true, "grades": true, "advanced_reports": true, "email_notifications": true, "sms_notifications": true, "parent_portal": true, "library_management": true, "fee_management": true, "transport_management": true, "inventory_management": true, "api_access": true, "custom_branding": true, "storage_gb": 100}'
),
('Enterprise', 'Unlimited solution for large institutions', 299.99, 2999.99, null, null, null,
 '{"attendance": true, "grades": true, "advanced_reports": true, "email_notifications": true, "sms_notifications": true, "parent_portal": true, "library_management": true, "fee_management": true, "transport_management": true, "inventory_management": true, "api_access": true, "custom_branding": true, "white_labeling": true, "dedicated_support": true, "storage_gb": 500}'
);

-- =====================================================
-- 8. FUNCTIONS AND TRIGGERS
-- =====================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for updated_at
CREATE TRIGGER update_subscription_plans_updated_at BEFORE UPDATE ON subscription_plans FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_school_subscriptions_updated_at BEFORE UPDATE ON school_subscriptions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_billing_invoices_updated_at BEFORE UPDATE ON billing_invoices FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_payment_transactions_updated_at BEFORE UPDATE ON payment_transactions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_feature_usage_updated_at BEFORE UPDATE ON feature_usage FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_tenant_settings_updated_at BEFORE UPDATE ON tenant_settings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to generate invoice numbers
CREATE OR REPLACE FUNCTION generate_invoice_number()
RETURNS TEXT AS $$
DECLARE
    invoice_num TEXT;
    year_month TEXT;
    sequence_num INTEGER;
BEGIN
    year_month := TO_CHAR(NOW(), 'YYYYMM');
    
    SELECT COALESCE(MAX(CAST(SUBSTRING(invoice_number FROM 8) AS INTEGER)), 0) + 1
    INTO sequence_num
    FROM billing_invoices
    WHERE invoice_number LIKE 'INV' || year_month || '%';
    
    invoice_num := 'INV' || year_month || LPAD(sequence_num::TEXT, 4, '0');
    
    RETURN invoice_num;
END;
$$ LANGUAGE plpgsql;

-- Function to check subscription limits
CREATE OR REPLACE FUNCTION check_subscription_limits(
    p_school_id UUID,
    p_resource_type VARCHAR(50),
    p_increment INTEGER DEFAULT 1
)
RETURNS BOOLEAN AS $$
DECLARE
    current_count INTEGER;
    max_allowed INTEGER;
    subscription_record RECORD;
BEGIN
    -- Get current subscription and plan details
    SELECT ss.*, sp.max_students, sp.max_teachers, sp.max_classes
    INTO subscription_record
    FROM school_subscriptions ss
    JOIN subscription_plans sp ON ss.plan_id = sp.id
    WHERE ss.school_id = p_school_id AND ss.status IN ('trial', 'active');
    
    IF NOT FOUND THEN
        RETURN FALSE; -- No active subscription
    END IF;
    
    -- Get current count based on resource type
    CASE p_resource_type
        WHEN 'students' THEN
            current_count := subscription_record.current_students;
            max_allowed := subscription_record.max_students;
        WHEN 'teachers' THEN
            current_count := subscription_record.current_teachers;
            max_allowed := subscription_record.max_teachers;
        WHEN 'classes' THEN
            current_count := subscription_record.current_classes;
            max_allowed := subscription_record.max_classes;
        ELSE
            RETURN FALSE; -- Unknown resource type
    END CASE;
    
    -- Check if adding increment would exceed limit (null means unlimited)
    IF max_allowed IS NULL THEN
        RETURN TRUE; -- Unlimited
    END IF;
    
    RETURN (current_count + p_increment) <= max_allowed;
END;
$$ LANGUAGE plpgsql;

-- Function to update usage metrics
CREATE OR REPLACE FUNCTION update_usage_metrics(
    p_school_id UUID,
    p_metric_type VARCHAR(50),
    p_metric_value INTEGER
)
RETURNS VOID AS $$
BEGIN
    INSERT INTO usage_metrics (school_id, metric_type, metric_value, recorded_date)
    VALUES (p_school_id, p_metric_type, p_metric_value, CURRENT_DATE)
    ON CONFLICT (school_id, metric_type, recorded_date)
    DO UPDATE SET 
        metric_value = p_metric_value,
        created_at = NOW();
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 9. VIEWS FOR REPORTING
-- =====================================================

-- Subscription overview view
CREATE OR REPLACE VIEW subscription_overview AS
SELECT 
    s.id as school_id,
    s.name as school_name,
    s.code as school_code,
    ss.status as subscription_status,
    sp.name as plan_name,
    sp.price_monthly,
    sp.price_yearly,
    ss.billing_cycle,
    ss.start_date,
    ss.end_date,
    ss.trial_end_date,
    ss.current_students,
    ss.current_teachers,
    ss.current_classes,
    sp.max_students,
    sp.max_teachers,
    sp.max_classes,
    CASE 
        WHEN ss.status = 'trial' AND ss.trial_end_date < CURRENT_DATE THEN 'Trial Expired'
        WHEN ss.status = 'active' AND ss.end_date < CURRENT_DATE THEN 'Subscription Expired'
        WHEN ss.status = 'trial' THEN CONCAT('Trial (', (ss.trial_end_date - CURRENT_DATE), ' days left)')
        WHEN ss.status = 'active' THEN CONCAT('Active (', (ss.end_date - CURRENT_DATE), ' days left)')
        ELSE UPPER(ss.status)
    END as status_display
FROM schools s
LEFT JOIN school_subscriptions ss ON s.id = ss.school_id
LEFT JOIN subscription_plans sp ON ss.plan_id = sp.id;

-- Grant permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON subscription_plans TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON school_subscriptions TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON billing_invoices TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON payment_transactions TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON usage_metrics TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON feature_usage TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON tenant_settings TO authenticated;
GRANT SELECT ON subscription_overview TO authenticated;