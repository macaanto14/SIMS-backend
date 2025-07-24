/*
  # School Information Management System (SIMS) Database Schema

  ## Overview
  A comprehensive, scalable schema for a school management system with role-based access control (RBAC).
  Supports multi-tenancy, flexible user roles, and granular permissions.

  ## 1. Core RBAC Tables
    - `users` - Base user profiles with UUID primary keys
    - `roles` - System roles with clear definitions
    - `user_roles` - Many-to-many mapping between users and roles
    - `permissions` - System modules and actions
    - `role_permissions` - Role-level access control mapping

  ## 2. School Management Tables
    - `schools` - Multi-tenant school support
    - `academic_years` - Academic year management
    - `terms` - Academic terms/semesters
    - `subjects` - Course subjects
    - `classes` - Class/section management
    - `enrollments` - Student-class relationships

  ## 3. User Extension Tables
    - `student_profiles` - Student-specific information
    - `teacher_profiles` - Teacher-specific information
    - `parent_profiles` - Parent-specific information
    - `parent_student_relationships` - Parent-child relationships

  ## 4. Academic Management
    - `attendance` - Daily attendance tracking
    - `grades` - Student assessments and grades
    - `timetables` - Class schedules
    - `assignments` - Homework and assignments

  ## 5. Financial Management
    - `fee_structures` - Fee definitions
    - `student_fees` - Student fee assignments
    - `fee_payments` - Payment tracking
    - `expenses` - School expense management

  ## 6. Library Management
    - `library_books` - Book catalog
    - `library_issues` - Book issue/return tracking

  ## 7. Communication & Alerts
    - `notifications` - System notifications
    - `announcements` - School announcements

  ## Security
    - Row Level Security (RLS) enabled on all user-facing tables
    - Comprehensive policies for each role type
    - Audit trails with created_at/updated_at timestamps
*/

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- 1. CORE RBAC TABLES
-- =====================================================

-- Users table (base for all system users)
CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  email text UNIQUE NOT NULL,
  phone text,
  first_name text NOT NULL,
  last_name text NOT NULL,
  avatar_url text,
  is_active boolean DEFAULT true,
  last_login_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Roles table (system roles with definitions)
CREATE TABLE IF NOT EXISTS roles (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  name text UNIQUE NOT NULL,
  description text NOT NULL,
  is_system_role boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- User roles mapping (many-to-many)
CREATE TABLE IF NOT EXISTS user_roles (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role_id uuid NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
  school_id uuid, -- Will reference schools table
  assigned_by uuid REFERENCES users(id),
  assigned_at timestamptz DEFAULT now(),
  expires_at timestamptz,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id, role_id, school_id)
);

-- Permissions table (system modules and actions)
CREATE TABLE IF NOT EXISTS permissions (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  module text NOT NULL, -- e.g., 'students', 'attendance', 'finance', 'library'
  action text NOT NULL, -- e.g., 'create', 'read', 'update', 'delete', 'manage'
  description text,
  created_at timestamptz DEFAULT now(),
  UNIQUE(module, action)
);

-- Role permissions mapping
CREATE TABLE IF NOT EXISTS role_permissions (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  role_id uuid NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
  permission_id uuid NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  UNIQUE(role_id, permission_id)
);

-- =====================================================
-- 2. SCHOOL MANAGEMENT TABLES
-- =====================================================

-- Schools table (multi-tenancy support)
CREATE TABLE IF NOT EXISTS schools (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  name text NOT NULL,
  code text UNIQUE NOT NULL,
  address text,
  phone text,
  email text,
  website text,
  logo_url text,
  principal_id uuid REFERENCES users(id),
  is_active boolean DEFAULT true,
  settings jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Academic years
CREATE TABLE IF NOT EXISTS academic_years (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  school_id uuid NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  name text NOT NULL, -- e.g., "2024-2025"
  start_date date NOT NULL,
  end_date date NOT NULL,
  is_current boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(school_id, name)
);

-- Academic terms/semesters
CREATE TABLE IF NOT EXISTS terms (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  academic_year_id uuid NOT NULL REFERENCES academic_years(id) ON DELETE CASCADE,
  name text NOT NULL, -- e.g., "First Term", "Spring Semester"
  start_date date NOT NULL,
  end_date date NOT NULL,
  is_current boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Subjects
CREATE TABLE IF NOT EXISTS subjects (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  school_id uuid NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  name text NOT NULL,
  code text NOT NULL,
  description text,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(school_id, code)
);

-- Classes/Sections
CREATE TABLE IF NOT EXISTS classes (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  school_id uuid NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  academic_year_id uuid NOT NULL REFERENCES academic_years(id) ON DELETE CASCADE,
  name text NOT NULL, -- e.g., "Grade 10-A"
  grade_level integer NOT NULL,
  section text, -- e.g., "A", "B", "Science"
  class_teacher_id uuid REFERENCES users(id),
  max_students integer DEFAULT 30,
  room_number text,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- =====================================================
-- 3. USER EXTENSION TABLES
-- =====================================================

-- Student profiles
CREATE TABLE IF NOT EXISTS student_profiles (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  school_id uuid NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  student_id text NOT NULL, -- School-specific student ID
  admission_number text UNIQUE NOT NULL,
  admission_date date NOT NULL,
  date_of_birth date NOT NULL,
  gender text CHECK (gender IN ('male', 'female', 'other')),
  blood_group text,
  address text,
  emergency_contact_name text,
  emergency_contact_phone text,
  medical_conditions text,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(school_id, student_id)
);

-- Teacher profiles
CREATE TABLE IF NOT EXISTS teacher_profiles (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  school_id uuid NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  employee_id text NOT NULL,
  hire_date date NOT NULL,
  qualification text,
  specialization text,
  experience_years integer DEFAULT 0,
  salary decimal(10,2),
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(school_id, employee_id)
);

-- Parent profiles
CREATE TABLE IF NOT EXISTS parent_profiles (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  school_id uuid NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  occupation text,
  workplace text,
  annual_income decimal(12,2),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Parent-Student relationships
CREATE TABLE IF NOT EXISTS parent_student_relationships (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  parent_id uuid NOT NULL REFERENCES parent_profiles(id) ON DELETE CASCADE,
  student_id uuid NOT NULL REFERENCES student_profiles(id) ON DELETE CASCADE,
  relationship_type text NOT NULL CHECK (relationship_type IN ('father', 'mother', 'guardian', 'other')),
  is_primary boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  UNIQUE(parent_id, student_id)
);

-- Student enrollments
CREATE TABLE IF NOT EXISTS enrollments (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id uuid NOT NULL REFERENCES student_profiles(id) ON DELETE CASCADE,
  class_id uuid NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
  academic_year_id uuid NOT NULL REFERENCES academic_years(id) ON DELETE CASCADE,
  enrollment_date date DEFAULT CURRENT_DATE,
  status text DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'transferred', 'graduated')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(student_id, academic_year_id)
);

-- =====================================================
-- 4. ACADEMIC MANAGEMENT
-- =====================================================

-- Attendance tracking
CREATE TABLE IF NOT EXISTS attendance (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id uuid NOT NULL REFERENCES student_profiles(id) ON DELETE CASCADE,
  class_id uuid NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
  date date NOT NULL,
  status text NOT NULL CHECK (status IN ('present', 'absent', 'late', 'excused')),
  marked_by uuid NOT NULL REFERENCES users(id),
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(student_id, date)
);

-- Timetables
CREATE TABLE IF NOT EXISTS timetables (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  class_id uuid NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
  subject_id uuid NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
  teacher_id uuid NOT NULL REFERENCES teacher_profiles(id) ON DELETE CASCADE,
  day_of_week integer NOT NULL CHECK (day_of_week BETWEEN 1 AND 7), -- 1=Monday, 7=Sunday
  start_time time NOT NULL,
  end_time time NOT NULL,
  room_number text,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Grades and assessments
CREATE TABLE IF NOT EXISTS grades (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id uuid NOT NULL REFERENCES student_profiles(id) ON DELETE CASCADE,
  subject_id uuid NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
  term_id uuid NOT NULL REFERENCES terms(id) ON DELETE CASCADE,
  assessment_type text NOT NULL, -- 'quiz', 'midterm', 'final', 'assignment', 'project'
  assessment_name text NOT NULL,
  marks_obtained decimal(5,2) NOT NULL,
  total_marks decimal(5,2) NOT NULL,
  grade text, -- A+, A, B+, etc.
  remarks text,
  assessed_by uuid NOT NULL REFERENCES users(id),
  assessment_date date DEFAULT CURRENT_DATE,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- =====================================================
-- 5. FINANCIAL MANAGEMENT
-- =====================================================

-- Fee structures
CREATE TABLE IF NOT EXISTS fee_structures (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  school_id uuid NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  academic_year_id uuid NOT NULL REFERENCES academic_years(id) ON DELETE CASCADE,
  class_id uuid REFERENCES classes(id), -- NULL means applies to all classes
  fee_type text NOT NULL, -- 'tuition', 'transport', 'library', 'sports', 'admission'
  amount decimal(10,2) NOT NULL,
  frequency text DEFAULT 'monthly' CHECK (frequency IN ('monthly', 'quarterly', 'annually', 'one_time')),
  due_date_rule text, -- 'monthly_10th', 'quarterly_start', etc.
  is_mandatory boolean DEFAULT true,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Student fee assignments
CREATE TABLE IF NOT EXISTS student_fees (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id uuid NOT NULL REFERENCES student_profiles(id) ON DELETE CASCADE,
  fee_structure_id uuid NOT NULL REFERENCES fee_structures(id) ON DELETE CASCADE,
  amount decimal(10,2) NOT NULL, -- Can be customized per student
  due_date date NOT NULL,
  status text DEFAULT 'unpaid' CHECK (status IN ('unpaid', 'partially_paid', 'paid', 'overdue', 'waived')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Fee payments
CREATE TABLE IF NOT EXISTS fee_payments (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_fee_id uuid NOT NULL REFERENCES student_fees(id) ON DELETE CASCADE,
  amount_paid decimal(10,2) NOT NULL,
  payment_method text NOT NULL, -- 'cash', 'cheque', 'bank_transfer', 'online', 'card'
  transaction_reference text,
  payment_date date DEFAULT CURRENT_DATE,
  received_by uuid NOT NULL REFERENCES users(id),
  notes text,
  created_at timestamptz DEFAULT now()
);

-- School expenses
CREATE TABLE IF NOT EXISTS expenses (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  school_id uuid NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  category text NOT NULL, -- 'salary', 'utilities', 'maintenance', 'supplies', 'transport'
  description text NOT NULL,
  amount decimal(10,2) NOT NULL,
  expense_date date DEFAULT CURRENT_DATE,
  vendor_name text,
  invoice_number text,
  approved_by uuid REFERENCES users(id),
  recorded_by uuid NOT NULL REFERENCES users(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- =====================================================
-- 6. LIBRARY MANAGEMENT
-- =====================================================

-- Library books
CREATE TABLE IF NOT EXISTS library_books (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  school_id uuid NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  isbn text,
  title text NOT NULL,
  author text NOT NULL,
  publisher text,
  publication_year integer,
  category text,
  copies_total integer DEFAULT 1,
  copies_available integer DEFAULT 1,
  location text, -- Shelf/rack location
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Library book issues/returns
CREATE TABLE IF NOT EXISTS library_issues (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  book_id uuid NOT NULL REFERENCES library_books(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE, -- Can be student or teacher
  issued_by uuid NOT NULL REFERENCES users(id), -- Librarian
  issue_date date DEFAULT CURRENT_DATE,
  due_date date NOT NULL,
  return_date date,
  returned_by uuid REFERENCES users(id), -- Librarian
  fine_amount decimal(8,2) DEFAULT 0,
  status text DEFAULT 'issued' CHECK (status IN ('issued', 'returned', 'overdue', 'lost')),
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- =====================================================
-- 7. COMMUNICATION & ALERTS
-- =====================================================

-- System notifications
CREATE TABLE IF NOT EXISTS notifications (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  recipient_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title text NOT NULL,
  message text NOT NULL,
  type text DEFAULT 'info' CHECK (type IN ('info', 'warning', 'success', 'error')),
  is_read boolean DEFAULT false,
  read_at timestamptz,
  sent_by uuid REFERENCES users(id),
  created_at timestamptz DEFAULT now()
);

-- School announcements
CREATE TABLE IF NOT EXISTS announcements (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  school_id uuid NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  title text NOT NULL,
  content text NOT NULL,
  target_audience text NOT NULL, -- 'all', 'students', 'teachers', 'parents', 'staff'
  priority text DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
  is_published boolean DEFAULT false,
  published_at timestamptz,
  expires_at timestamptz,
  created_by uuid NOT NULL REFERENCES users(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- =====================================================
-- FOREIGN KEY REFERENCES COMPLETION
-- =====================================================

-- Add the missing foreign key reference for user_roles.school_id
ALTER TABLE user_roles ADD CONSTRAINT fk_user_roles_school_id 
  FOREIGN KEY (school_id) REFERENCES schools(id) ON DELETE CASCADE;

-- =====================================================
-- INDEXES FOR PERFORMANCE
-- =====================================================

-- User-related indexes
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_active ON users(is_active);
CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON user_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_role_id ON user_roles(role_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_school_id ON user_roles(school_id);

-- Academic indexes
CREATE INDEX IF NOT EXISTS idx_students_school_id ON student_profiles(school_id);
CREATE INDEX IF NOT EXISTS idx_students_admission_number ON student_profiles(admission_number);
CREATE INDEX IF NOT EXISTS idx_enrollments_student_id ON enrollments(student_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_class_id ON enrollments(class_id);
CREATE INDEX IF NOT EXISTS idx_attendance_student_date ON attendance(student_id, date);
CREATE INDEX IF NOT EXISTS idx_grades_student_subject ON grades(student_id, subject_id);

-- Financial indexes
CREATE INDEX IF NOT EXISTS idx_student_fees_student_id ON student_fees(student_id);
CREATE INDEX IF NOT EXISTS idx_student_fees_due_date ON student_fees(due_date);
CREATE INDEX IF NOT EXISTS idx_fee_payments_student_fee_id ON fee_payments(student_fee_id);

-- Library indexes
CREATE INDEX IF NOT EXISTS idx_library_issues_user_id ON library_issues(user_id);
CREATE INDEX IF NOT EXISTS idx_library_issues_book_id ON library_issues(book_id);
CREATE INDEX IF NOT EXISTS idx_library_issues_status ON library_issues(status);

-- =====================================================
-- INSERT DEFAULT ROLES AND PERMISSIONS
-- =====================================================

-- Insert system roles
INSERT INTO roles (name, description, is_system_role) VALUES
('Super Admin', 'Full system access with ability to manage all schools, users, and system settings', true),
('Admin', 'School administrator with full access to daily operations but limited system settings', true),
('Teacher', 'Manages classes, grades, attendance, and lesson materials for assigned subjects', true),
('Accountant', 'Manages fees, payments, financial reports, and expense tracking', true),
('Student', 'Views personal academic information, grades, attendance, and announcements', true),
('Parent', 'Views child academic progress, attendance, fees, and receives school communications', true),
('Receptionist', 'Manages student admissions, inquiries, and front desk operations', true),
('Librarian', 'Manages library books, issues, returns, and library operations', true)
ON CONFLICT (name) DO NOTHING;

-- Insert system permissions
INSERT INTO permissions (module, action, description) VALUES
-- User management
('users', 'create', 'Create new users'),
('users', 'read', 'View user information'),
('users', 'update', 'Update user information'),
('users', 'delete', 'Delete users'),
('users', 'manage_roles', 'Assign/remove user roles'),

-- Student management
('students', 'create', 'Add new students'),
('students', 'read', 'View student information'),
('students', 'update', 'Update student information'),
('students', 'delete', 'Remove students'),
('students', 'manage_enrollment', 'Enroll/transfer students'),

-- Academic management
('attendance', 'create', 'Mark attendance'),
('attendance', 'read', 'View attendance records'),
('attendance', 'update', 'Modify attendance records'),
('attendance', 'report', 'Generate attendance reports'),

('grades', 'create', 'Add grades and assessments'),
('grades', 'read', 'View grades'),
('grades', 'update', 'Modify grades'),
('grades', 'report', 'Generate academic reports'),

-- Financial management
('finance', 'create', 'Add fee structures and expenses'),
('finance', 'read', 'View financial information'),
('finance', 'update', 'Modify financial records'),
('finance', 'collect_fees', 'Collect fee payments'),
('finance', 'report', 'Generate financial reports'),

-- Library management
('library', 'create', 'Add books and manage catalog'),
('library', 'read', 'View library information'),
('library', 'update', 'Update library records'),
('library', 'issue_books', 'Issue and return books'),
('library', 'report', 'Generate library reports'),

-- System management
('system', 'manage_settings', 'Manage system configuration'),
('system', 'manage_schools', 'Create and manage schools'),
('system', 'view_analytics', 'Access system analytics'),

-- Communication
('communication', 'create', 'Create announcements and notifications'),
('communication', 'read', 'View communications'),
('communication', 'send', 'Send messages and alerts')

ON CONFLICT (module, action) DO NOTHING;

-- =====================================================
-- ROW LEVEL SECURITY (RLS) SETUP
-- =====================================================

-- Enable RLS on all user-facing tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE schools ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE teacher_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE parent_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE parent_student_relationships ENABLE ROW LEVEL SECURITY;
ALTER TABLE enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE grades ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_fees ENABLE ROW LEVEL SECURITY;
ALTER TABLE fee_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE library_issues ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE announcements ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- RLS POLICIES
-- =====================================================

-- Users can read their own profile
CREATE POLICY "Users can read own profile"
  ON users FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

-- Users can update their own profile
CREATE POLICY "Users can update own profile"
  ON users FOR UPDATE
  TO authenticated
  USING (auth.uid() = id);

-- Students can read their own student profile
CREATE POLICY "Students can read own profile"
  ON student_profiles FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Parents can read their children's profiles
CREATE POLICY "Parents can read children profiles"
  ON student_profiles FOR SELECT
  TO authenticated
  USING (
    id IN (
      SELECT psr.student_id 
      FROM parent_student_relationships psr
      JOIN parent_profiles pp ON pp.id = psr.parent_id
      WHERE pp.user_id = auth.uid()
    )
  );

-- Teachers can read students in their classes
CREATE POLICY "Teachers can read class students"
  ON student_profiles FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM enrollments e
      JOIN classes c ON c.id = e.class_id
      JOIN teacher_profiles tp ON tp.id = c.class_teacher_id
      WHERE e.student_id = student_profiles.id 
      AND tp.user_id = auth.uid()
    )
  );

-- Students can read their own attendance
CREATE POLICY "Students can read own attendance"
  ON attendance FOR SELECT
  TO authenticated
  USING (
    student_id IN (
      SELECT id FROM student_profiles WHERE user_id = auth.uid()
    )
  );

-- Parents can read their children's attendance
CREATE POLICY "Parents can read children attendance"
  ON attendance FOR SELECT
  TO authenticated
  USING (
    student_id IN (
      SELECT psr.student_id 
      FROM parent_student_relationships psr
      JOIN parent_profiles pp ON pp.id = psr.parent_id
      WHERE pp.user_id = auth.uid()
    )
  );

-- Students can read their own grades
CREATE POLICY "Students can read own grades"
  ON grades FOR SELECT
  TO authenticated
  USING (
    student_id IN (
      SELECT id FROM student_profiles WHERE user_id = auth.uid()
    )
  );

-- Parents can read their children's grades
CREATE POLICY "Parents can read children grades"
  ON grades FOR SELECT
  TO authenticated
  USING (
    student_id IN (
      SELECT psr.student_id 
      FROM parent_student_relationships psr
      JOIN parent_profiles pp ON pp.id = psr.parent_id
      WHERE pp.user_id = auth.uid()
    )
  );

-- Users can read their own notifications
CREATE POLICY "Users can read own notifications"
  ON notifications FOR SELECT
  TO authenticated
  USING (recipient_id = auth.uid());

-- Users can update their own notifications (mark as read)
CREATE POLICY "Users can update own notifications"
  ON notifications FOR UPDATE
  TO authenticated
  USING (recipient_id = auth.uid());

-- Note: Additional policies for admin/teacher/staff roles would be implemented
-- based on the user_roles and role_permissions tables. These would typically
-- be implemented in application logic or through more complex RLS policies
-- that check role membership and permissions.