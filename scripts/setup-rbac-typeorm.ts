import 'reflect-metadata';
import { AppDataSource } from '../src/config/database';
import { Role } from '../src/entities/Role';
import { Permission } from '../src/entities/Permission';
import { RolePermission } from '../src/entities/RolePermission';
import { User } from '../src/entities/User';
import { UserRole } from '../src/entities/UserRole';

async function setupRBAC() {
  try {
    console.log('🔄 Initializing database connection...');
    await AppDataSource.initialize();

    const roleRepository = AppDataSource.getRepository(Role);
    const permissionRepository = AppDataSource.getRepository(Permission);
    const rolePermissionRepository = AppDataSource.getRepository(RolePermission);
    const userRepository = AppDataSource.getRepository(User);
    const userRoleRepository = AppDataSource.getRepository(UserRole);

    console.log('🔄 Setting up roles...');
    
    // Create roles
    const roles = [
      { name: 'Super Admin', description: 'Full system access', isSystemRole: true },
      { name: 'School Admin', description: 'School-level administration', isSystemRole: false },
      { name: 'Principal', description: 'School principal', isSystemRole: false },
      { name: 'Teacher', description: 'Teaching staff', isSystemRole: false },
      { name: 'Student', description: 'Student access', isSystemRole: false },
      { name: 'Parent', description: 'Parent/Guardian access', isSystemRole: false }
    ];

    const createdRoles = [];
    for (const roleData of roles) {
      let role = await roleRepository.findOne({ where: { name: roleData.name } });
      if (!role) {
        role = roleRepository.create(roleData);
        role = await roleRepository.save(role);
        console.log(`✅ Created role: ${role.name}`);
      } else {
        console.log(`ℹ️ Role already exists: ${role.name}`);
      }
      createdRoles.push(role);
    }

    console.log('🔄 Setting up permissions...');
    
    // Create permissions
    const permissions = [
      // User management
      { module: 'users', action: 'create', description: 'Create users' },
      { module: 'users', action: 'read', description: 'View users' },
      { module: 'users', action: 'update', description: 'Update users' },
      { module: 'users', action: 'delete', description: 'Delete users' },
      
      // School management
      { module: 'schools', action: 'create', description: 'Create schools' },
      { module: 'schools', action: 'read', description: 'View schools' },
      { module: 'schools', action: 'update', description: 'Update schools' },
      { module: 'schools', action: 'delete', description: 'Delete schools' },
      
      // Academic management
      { module: 'academic', action: 'create', description: 'Create academic records' },
      { module: 'academic', action: 'read', description: 'View academic records' },
      { module: 'academic', action: 'update', description: 'Update academic records' },
      { module: 'academic', action: 'delete', description: 'Delete academic records' },
      
      // Audit access
      { module: 'audit', action: 'read', description: 'View audit logs' },
      { module: 'audit', action: 'export', description: 'Export audit logs' },
      
      // System administration
      { module: 'system', action: 'admin', description: 'System administration' },
      { module: 'system', action: 'config', description: 'System configuration' }
    ];

    const createdPermissions = [];
    for (const permData of permissions) {
      let permission = await permissionRepository.findOne({ 
        where: { module: permData.module, action: permData.action } 
      });
      if (!permission) {
        permission = permissionRepository.create(permData);
        permission = await permissionRepository.save(permission);
        console.log(`✅ Created permission: ${permission.module}.${permission.action}`);
      } else {
        console.log(`ℹ️ Permission already exists: ${permission.module}.${permission.action}`);
      }
      createdPermissions.push(permission);
    }

    console.log('🔄 Assigning permissions to roles...');
    
    // Role-Permission mappings
    const rolePermissionMappings = {
      'Super Admin': createdPermissions.map(p => p.id), // All permissions
      'School Admin': createdPermissions.filter(p => 
        ['users', 'academic', 'audit'].includes(p.module)
      ).map(p => p.id),
      'Principal': createdPermissions.filter(p => 
        ['users', 'academic'].includes(p.module) && p.action !== 'delete'
      ).map(p => p.id),
      'Teacher': createdPermissions.filter(p => 
        p.module === 'academic' && ['read', 'update'].includes(p.action)
      ).map(p => p.id),
      'Student': createdPermissions.filter(p => 
        p.module === 'academic' && p.action === 'read'
      ).map(p => p.id),
      'Parent': createdPermissions.filter(p => 
        p.module === 'academic' && p.action === 'read'
      ).map(p => p.id)
    };

    for (const [roleName, permissionIds] of Object.entries(rolePermissionMappings)) {
      const role = createdRoles.find(r => r.name === roleName);
      if (!role) continue;

      for (const permissionId of permissionIds) {
        const existing = await rolePermissionRepository.findOne({
          where: { roleId: role.id, permissionId }
        });

        if (!existing) {
          const rolePermission = rolePermissionRepository.create({
            roleId: role.id,
            permissionId
          });
          await rolePermissionRepository.save(rolePermission);
        }
      }
      console.log(`✅ Assigned permissions to role: ${roleName}`);
    }

    console.log('🔄 Creating Super Admin user...');
    
    // Create Super Admin user
    const superAdminEmail = process.env.SUPER_ADMIN_EMAIL || 'superadmin@sims.edu';
    const superAdminPassword = process.env.SUPER_ADMIN_PASSWORD || 'SuperAdmin@123';

    let superAdminUser = await userRepository.findOne({ 
      where: { email: superAdminEmail } 
    });

    if (!superAdminUser) {
      superAdminUser = userRepository.create({
        email: superAdminEmail,
        password: superAdminPassword, // Will be hashed by entity hook
        firstName: 'Super',
        lastName: 'Admin',
        emailVerified: true,
        emailVerifiedAt: new Date()
      });
      superAdminUser = await userRepository.save(superAdminUser);
      console.log(`✅ Created Super Admin user: ${superAdminEmail}`);
    } else {
      console.log(`ℹ️ Super Admin user already exists: ${superAdminEmail}`);
    }

    // Assign Super Admin role
    const superAdminRole = createdRoles.find(r => r.name === 'Super Admin');
    if (superAdminRole) {
      const existingAssignment = await userRoleRepository.findOne({
        where: { userId: superAdminUser.id, roleId: superAdminRole.id }
      });

      if (!existingAssignment) {
        const userRole = userRoleRepository.create({
          userId: superAdminUser.id,
          roleId: superAdminRole.id,
          assignedBy: superAdminUser.id,
          assignedAt: new Date()
        });
        await userRoleRepository.save(userRole);
        console.log(`✅ Assigned Super Admin role to user`);
      } else {
        console.log(`ℹ️ Super Admin role already assigned`);
      }
    }

    console.log('✅ RBAC setup completed successfully!');
    console.log(`📧 Super Admin Email: ${superAdminEmail}`);
    console.log(`🔑 Super Admin Password: ${superAdminPassword}`);

  } catch (error) {
    console.error('❌ RBAC setup failed:', error);
    throw error;
  } finally {
    if (AppDataSource.isInitialized) {
      await AppDataSource.destroy();
    }
  }
}

// Run the setup
if (require.main === module) {
  setupRBAC()
    .then(() => {
      console.log('🎉 Setup completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Setup failed:', error);
      process.exit(1);
    });
}

export default setupRBAC;