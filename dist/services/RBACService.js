"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RBACService = void 0;
const database_1 = require("../config/database");
const User_1 = require("../entities/User");
const Role_1 = require("../entities/Role");
const Permission_1 = require("../entities/Permission");
const UserRole_1 = require("../entities/UserRole");
const RolePermission_1 = require("../entities/RolePermission");
class RBACService {
    constructor() {
        this.permissionCache = new Map();
        this.CACHE_TTL = 5 * 60 * 1000;
        this.userRepository = database_1.AppDataSource.getRepository(User_1.User);
        this.roleRepository = database_1.AppDataSource.getRepository(Role_1.Role);
        this.permissionRepository = database_1.AppDataSource.getRepository(Permission_1.Permission);
        this.userRoleRepository = database_1.AppDataSource.getRepository(UserRole_1.UserRole);
        this.rolePermissionRepository = database_1.AppDataSource.getRepository(RolePermission_1.RolePermission);
    }
    async getUserPermissions(userId) {
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
        const permissions = [];
        for (const userRole of userRoles) {
            if (!userRole.role.isActive)
                continue;
            if (userRole.expiresAt && userRole.expiresAt < new Date())
                continue;
            for (const rolePermission of userRole.role.rolePermissions || []) {
                if (!rolePermission.permission.isActive)
                    continue;
                permissions.push({
                    module: rolePermission.permission.module,
                    action: rolePermission.permission.action,
                    schoolId: userRole.schoolId,
                    roleName: userRole.role.name
                });
            }
        }
        this.permissionCache.set(cacheKey, {
            permissions,
            timestamp: Date.now()
        });
        return permissions;
    }
    async hasPermission(userId, module, action, schoolId) {
        const permissions = await this.getUserPermissions(userId);
        return permissions.some(perm => {
            const moduleMatch = perm.module === module;
            const actionMatch = perm.action === action;
            const schoolMatch = !schoolId || !perm.schoolId || perm.schoolId === schoolId;
            return moduleMatch && actionMatch && schoolMatch;
        });
    }
    async hasRole(userId, roles) {
        const permissions = await this.getUserPermissions(userId);
        const userRoles = [...new Set(permissions.map(perm => perm.roleName))];
        return roles.some(role => userRoles.includes(role));
    }
    async getUserRoles(userId) {
        const permissions = await this.getUserPermissions(userId);
        return [...new Set(permissions.map(perm => perm.roleName))];
    }
    async getUserSchoolContext(userId) {
        const userRoles = await this.userRoleRepository.find({
            where: {
                userId,
                isActive: true
            },
            relations: ['role', 'school']
        });
        return userRoles
            .filter(ur => ur.role.isActive)
            .filter(ur => !ur.expiresAt || ur.expiresAt > new Date())
            .map(ur => ({
            schoolId: ur.schoolId,
            schoolName: ur.school?.name || 'System',
            roleName: ur.role.name
        }));
    }
    async assignRole(userId, roleId, schoolId, assignedBy) {
        const existingAssignment = await this.userRoleRepository.findOne({
            where: { userId, roleId, schoolId }
        });
        if (existingAssignment) {
            if (!existingAssignment.isActive) {
                await this.userRoleRepository.update(existingAssignment.id, {
                    isActive: true,
                    assignedBy,
                    assignedAt: new Date(),
                    expiresAt: undefined
                });
            }
            return;
        }
        const userRole = this.userRoleRepository.create({
            userId,
            roleId,
            schoolId,
            assignedBy,
            assignedAt: new Date()
        });
        await this.userRoleRepository.save(userRole);
        this.clearUserPermissionCache(userId);
    }
    async removeRole(userId, roleId, schoolId) {
        const assignment = await this.userRoleRepository.findOne({
            where: { userId, roleId, schoolId }
        });
        if (assignment) {
            await this.userRoleRepository.update(assignment.id, {
                isActive: false
            });
            this.clearUserPermissionCache(userId);
        }
    }
    async createRole(name, description, level) {
        const role = this.roleRepository.create({
            name,
            description,
            level
        });
        return this.roleRepository.save(role);
    }
    async createPermission(module, action, description) {
        const permission = this.permissionRepository.create({
            module,
            action,
            description
        });
        return this.permissionRepository.save(permission);
    }
    async assignPermissionToRole(roleId, permissionId) {
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
    clearUserPermissionCache(userId) {
        const cacheKey = `user_permissions_${userId}`;
        this.permissionCache.delete(cacheKey);
    }
    clearAllPermissionCache() {
        this.permissionCache.clear();
    }
}
exports.RBACService = RBACService;
//# sourceMappingURL=RBACService.js.map