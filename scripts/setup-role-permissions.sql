-- Complete Role-Permissions Mapping for SIMS
-- This script maps all roles to their appropriate permissions

-- First, let's get the role IDs
DO $$
DECLARE
    super_admin_id uuid;
    admin_id uuid;
    teacher_id uuid;
    accountant_id uuid;
    student_id uuid;
    parent_id uuid;
    receptionist_id uuid;
    librarian_id uuid;
BEGIN
    -- Get role IDs
    SELECT id INTO super_admin_id FROM roles WHERE name = 'Super Admin';
    SELECT id INTO admin_id FROM roles WHERE name = 'Admin';
    SELECT id INTO teacher_id FROM roles WHERE name = 'Teacher';
    SELECT id INTO accountant_id FROM roles WHERE name = 'Accountant';
    SELECT id INTO student_id FROM roles WHERE name = 'Student';
    SELECT id INTO parent_id FROM roles WHERE name = 'Parent';
    SELECT id INTO receptionist_id FROM roles WHERE name = 'Receptionist';
    SELECT id INTO librarian_id FROM roles WHERE name = 'Librarian';

    -- Clear existing role permissions to avoid conflicts
    DELETE FROM role_permissions;

    -- SUPER ADMIN - Full system access
    INSERT INTO role_permissions (role_id, permission_id)
    SELECT super_admin_id, id FROM permissions;

    -- ADMIN - School-level administration (all except system management)
    INSERT INTO role_permissions (role_id, permission_id)
    SELECT admin_id, p.id 
    FROM permissions p 
    WHERE p.module != 'system' OR p.action != 'manage_schools';

    -- TEACHER - Academic and student management
    INSERT INTO role_permissions (role_id, permission_id)
    SELECT teacher_id, p.id 
    FROM permissions p 
    WHERE p.module IN ('students', 'attendance', 'grades', 'communication') 
    AND p.action IN ('read', 'create', 'update', 'report', 'mark', 'send');

    -- ACCOUNTANT - Financial management
    INSERT INTO role_permissions (role_id, permission_id)
    SELECT accountant_id, p.id 
    FROM permissions p 
    WHERE p.module IN ('finance', 'students') 
    AND (p.action IN ('create', 'read', 'update', 'collect_fees', 'report') 
         OR (p.module = 'students' AND p.action = 'read'));

    -- STUDENT - Read own academic information
    INSERT INTO role_permissions (role_id, permission_id)
    SELECT student_id, p.id 
    FROM permissions p 
    WHERE p.module IN ('attendance', 'grades', 'communication', 'library') 
    AND p.action = 'read';

    -- PARENT - Read children's academic information
    INSERT INTO role_permissions (role_id, permission_id)
    SELECT parent_id, p.id 
    FROM permissions p 
    WHERE p.module IN ('students', 'attendance', 'grades', 'finance', 'communication') 
    AND p.action = 'read';

    -- RECEPTIONIST - Student admissions and inquiries
    INSERT INTO role_permissions (role_id, permission_id)
    SELECT receptionist_id, p.id 
    FROM permissions p 
    WHERE (p.module = 'students' AND p.action IN ('create', 'read', 'update', 'manage_enrollment'))
    OR (p.module = 'communication' AND p.action IN ('read', 'create', 'send'))
    OR (p.module = 'users' AND p.action IN ('create', 'read'));

    -- LIBRARIAN - Library management
    INSERT INTO role_permissions (role_id, permission_id)
    SELECT librarian_id, p.id 
    FROM permissions p 
    WHERE p.module = 'library' 
    OR (p.module = 'students' AND p.action = 'read')
    OR (p.module = 'communication' AND p.action IN ('read', 'create'));

END $$;

-- Verify the mappings
SELECT 
    r.name as role_name,
    COUNT(rp.permission_id) as permission_count,
    STRING_AGG(DISTINCT p.module, ', ') as modules
FROM roles r
LEFT JOIN role_permissions rp ON r.id = rp.role_id
LEFT JOIN permissions p ON rp.permission_id = p.id
GROUP BY r.id, r.name
ORDER BY r.name;