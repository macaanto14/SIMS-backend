const pool = require('../config/database');

async function setupRBACTables() {
  const client = await pool.connect();
  
  try {
    console.log('🔧 Setting up RBAC tables (roles, permissions, role_permissions, user_roles)...');
    
    // Create the missing RBAC tables
    const rbacSQL = `
      -- Create roles table
      CREATE TABLE IF NOT EXISTS roles (
        id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        name text NOT NULL UNIQUE,
        description text NOT NULL,
        is_system_role boolean DEFAULT false,
        created_at timestamp with time zone DEFAULT now(),
        updated_at timestamp with time zone DEFAULT now()
      );

      -- Create permissions table
      CREATE TABLE IF NOT EXISTS permissions (
        id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        module text NOT NULL,
        action text NOT NULL,
        description text,
        created_at timestamp with time zone DEFAULT now(),
        UNIQUE(module, action)
      );

      -- Create role_permissions table
      CREATE TABLE IF NOT EXISTS role_permissions (
        id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        role_id uuid NOT NULL,
        permission_id uuid NOT NULL,
        created_at timestamp with time zone DEFAULT now(),
        UNIQUE(role_id, permission_id),
        CONSTRAINT role_permissions_role_id_fkey FOREIGN KEY (role_id) REFERENCES roles(id),
        CONSTRAINT role_permissions_permission_id_fkey FOREIGN KEY (permission_id) REFERENCES permissions(id)
      );

      -- Create user_roles table
      CREATE TABLE IF NOT EXISTS user_roles (
        id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        user_id uuid NOT NULL,
        role_id uuid NOT NULL,
        school_id uuid,
        assigned_by uuid,
        assigned_at timestamp with time zone DEFAULT now(),
        expires_at timestamp with time zone,
        is_active boolean DEFAULT true,
        created_at timestamp with time zone DEFAULT now(),
        updated_at timestamp with time zone DEFAULT now(),
        UNIQUE(user_id, role_id, school_id),
        CONSTRAINT user_roles_user_id_fkey FOREIGN KEY (user_id) REFERENCES users(id),
        CONSTRAINT user_roles_role_id_fkey FOREIGN KEY (role_id) REFERENCES roles(id),
        CONSTRAINT user_roles_assigned_by_fkey FOREIGN KEY (assigned_by) REFERENCES users(id),
        CONSTRAINT fk_user_roles_school_id FOREIGN KEY (school_id) REFERENCES schools(id)
      );
    `;
    
    await client.query(rbacSQL);
    console.log('✅ RBAC tables structure created');
    
    // Insert basic roles (check if they exist first)
    const rolesData = [
      ['Super Admin', 'System administrator with full access', true],
      ['School Admin', 'School administrator with school-level access', false],
      ['Teacher', 'Teacher with academic management access', false],
      ['Student', 'Student with read-only access to own data', false],
      ['Parent', 'Parent with read access to children data', false]
    ];
    
    for (const [name, description, isSystemRole] of rolesData) {
      await client.query(`
        INSERT INTO roles (name, description, is_system_role) 
        VALUES ($1, $2, $3) 
        ON CONFLICT (name) DO NOTHING
      `, [name, description, isSystemRole]);
    }
    console.log('✅ Basic roles inserted');

    // Insert basic permissions (check if they exist first)
    const permissionsData = [
      ['users', 'create', 'Create new users'],
      ['users', 'read', 'View user information'],
      ['users', 'update', 'Update user information'],
      ['users', 'delete', 'Delete users'],
      ['schools', 'create', 'Create new schools'],
      ['schools', 'read', 'View school information'],
      ['schools', 'update', 'Update school information'],
      ['schools', 'delete', 'Delete schools'],
      ['students', 'create', 'Create student profiles'],
      ['students', 'read', 'View student information'],
      ['students', 'update', 'Update student information'],
      ['students', 'delete', 'Delete student profiles'],
      ['classes', 'create', 'Create classes'],
      ['classes', 'read', 'View class information'],
      ['classes', 'update', 'Update class information'],
      ['classes', 'delete', 'Delete classes'],
      ['academic', 'create', 'Create academic records'],
      ['academic', 'read', 'View academic information'],
      ['academic', 'update', 'Update academic records'],
      ['academic', 'delete', 'Delete academic records']
    ];
    
    for (const [module, action, description] of permissionsData) {
      await client.query(`
        INSERT INTO permissions (module, action, description) 
        VALUES ($1, $2, $3) 
        ON CONFLICT (module, action) DO NOTHING
      `, [module, action, description]);
    }
    console.log('✅ Basic permissions inserted');

    // Create indexes for performance
    const indexSQL = `
      CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON user_roles(user_id);
      CREATE INDEX IF NOT EXISTS idx_user_roles_role_id ON user_roles(role_id);
      CREATE INDEX IF NOT EXISTS idx_user_roles_school_id ON user_roles(school_id);
      CREATE INDEX IF NOT EXISTS idx_role_permissions_role_id ON role_permissions(role_id);
      CREATE INDEX IF NOT EXISTS idx_role_permissions_permission_id ON role_permissions(permission_id);
    `;
    
    await client.query(indexSQL);
    console.log('✅ Performance indexes created');
    
    // Verify tables exist
    const result = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN ('roles', 'permissions', 'role_permissions', 'user_roles')
      ORDER BY table_name;
    `);
    
    console.log('📋 RBAC tables verified:', result.rows.map(row => row.table_name).join(', '));
    
  } catch (error) {
    console.error('❌ Error setting up RBAC tables:', error);
    throw error;
  } finally {
    client.release();
  }
}

// Run if called directly
if (require.main === module) {
  setupRBACTables()
    .then(() => {
      console.log('✅ RBAC setup completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ RBAC setup failed:', error);
      process.exit(1);
    });
}

module.exports = setupRBACTables;