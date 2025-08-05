import { Repository } from 'typeorm';
import { AppDataSource } from '../config/database';
import { User } from '../entities/User';
import { Role } from '../entities/Role';
import { Permission } from '../entities/Permission';
import { UserRole } from '../entities/UserRole';
import { RolePermission } from '../entities/RolePermission';

export interface UserPermission {
  module: string;
  action: string;
  schoolId?: string | null;
  roleName: string;
}

export interface SchoolContext {
  schoolId: string | null;
  schoolName: string;
  roleName: string;
}

export class RBACService {
  private userRepository: Repository<User>;
  private roleRepository: Repository<Role>;
  private permissionRepository: Repository<Permission>;
  private userRoleRepository: Repository<UserRole>;
  private rolePermissionRepository: Repository<RolePermission>;
  
  // Cache for user permissions
  private permissionCache = new Map<string, { permissions: UserPermission[]; timestamp: number }>();
  private readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutes

  constructor() {
    this.userRepository = AppDataSource.getRepository(User);
    this.roleRepository = AppDataSource.getRepository(Role);
    this.permissionRepository = AppDataSource.getRepository(Permission);
    this.userRoleRepository = AppDataSource.getRepository(UserRole);
    this.rolePermissionRepository = AppDataSource.getRepository(RolePermission);
  }

  async getUserPermissions(userId: string): Promise<UserPermission[]> {
    const cacheKey = `user_permissions_${userId}`;
    const cached = this.permissionCache.get(cacheKey);
    
    if (cached && Date.now() - cached.timestamp < this.CACHE_TTL) {
      return cached.permissions;
    }

    const userRoles = await this.userRoleRepository.find({
      where: { 
        userId, 
        isActive: true 
      },
      relations: [
        'role',
        'role.rolePermissions',
        'role.rolePermissions.permission',
        'school'
      ]
    });

    const permissions: UserPermission[] = [];

    for (const userRole of userRoles) {
      // Check if role assignment is still valid
      if (userRole.expiresAt && userRole.expiresAt < new Date()) continue;

      for (const rolePermission of userRole.role.rolePermissions || []) {
        permissions.push({
          module: rolePermission.permission.module,
          action: rolePermission.permission.action,
          schoolId: userRole.schoolId || null,
          roleName: userRole.role.name
        });
      }
    }

    // Cache the permissions
    this.permissionCache.set(cacheKey, {
      permissions,
      timestamp: Date.now()
    });

    return permissions;
  }

  async hasPermission(userId: string, module: string, action: string, schoolId?: string): Promise<boolean> {
    const permissions = await this.getUserPermissions(userId);
    
    return permissions.some(perm => {
      const moduleMatch = perm.module === module;
      const actionMatch = perm.action === action;
      const schoolMatch = !schoolId || !perm.schoolId || perm.schoolId === schoolId;
      
      return moduleMatch && actionMatch && schoolMatch;
    });
  }

  async hasRole(userId: string, roles: string[]): Promise<boolean> {
    const permissions = await this.getUserPermissions(userId);
    const userRoles = [...new Set(permissions.map(perm => perm.roleName))];
    
    return roles.some(role => userRoles.includes(role));
  }

  async getUserRoles(userId: string): Promise<string[]> {
    const permissions = await this.getUserPermissions(userId);
    return [...new Set(permissions.map(perm => perm.roleName))];
  }

  async getUserSchoolContext(userId: string): Promise<SchoolContext[]> {
    const userRoles = await this.userRoleRepository.find({
      where: { 
        userId, 
        isActive: true 
      },
      relations: ['role', 'school']
    });

    return userRoles
      .filter(ur => !ur.expiresAt || ur.expiresAt > new Date())
      .map(ur => ({
        schoolId: ur.schoolId || null,
        schoolName: ur.school?.name || 'System',
        roleName: ur.role.name
      }));
  }

  async assignRole(userId: string, roleId: string, schoolId?: string, assignedBy?: string): Promise<void> {
    // Check if assignment already exists
    const existingAssignment = await this.userRoleRepository.findOne({
      where: { userId, roleId, schoolId }
    });

    if (existingAssignment) {
      // Reactivate if inactive
      if (!existingAssignment.isActive) {
        await this.userRoleRepository.update(existingAssignment.id, {
          isActive: true,
          assignedBy,
          assignedAt: new Date(),
          expiresAt: undefined // Use undefined instead of null
        });
      }
      return;
    }

    // Create new role assignment
    const userRole = this.userRoleRepository.create({
      userId,
      roleId,
      schoolId,
      assignedBy,
      assignedAt: new Date()
    });

    await this.userRoleRepository.save(userRole);
    
    // Clear cache
    this.clearUserPermissionCache(userId);
  }

  async removeRole(userId: string, roleId: string, schoolId?: string): Promise<void> {
    const assignment = await this.userRoleRepository.findOne({
      where: { userId, roleId, schoolId }
    });

    if (assignment) {
      await this.userRoleRepository.update(assignment.id, {
        isActive: false
      });
      
      // Clear cache
      this.clearUserPermissionCache(userId);
    }
  }

  async createRole(name: string, description?: string): Promise<Role> {
    const role = this.roleRepository.create({
      name,
      description: description || ''
    });

    return this.roleRepository.save(role);
  }

  async createPermission(module: string, action: string, description?: string): Promise<Permission> {
    const permission = this.permissionRepository.create({
      module,
      action,
      description
    });

    return this.permissionRepository.save(permission);
  }

  async assignPermissionToRole(roleId: string, permissionId: string): Promise<void> {
    const existingAssignment = await this.rolePermissionRepository.findOne({
      where: { roleId, permissionId }
    });

    if (!existingAssignment) {
      const rolePermission = this.rolePermissionRepository.create({
        roleId,
        permissionId
      });

      await this.rolePermissionRepository.save(rolePermission);
    }
  }

  clearUserPermissionCache(userId: string): void {
    const cacheKey = `user_permissions_${userId}`;
    this.permissionCache.delete(cacheKey);
  }

  clearAllPermissionCache(): void {
    this.permissionCache.clear();
  }
}