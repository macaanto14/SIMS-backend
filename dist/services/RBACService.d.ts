import { Role } from '../entities/Role';
import { Permission } from '../entities/Permission';
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
export declare class RBACService {
    private userRepository;
    private roleRepository;
    private permissionRepository;
    private userRoleRepository;
    private rolePermissionRepository;
    private permissionCache;
    private readonly CACHE_TTL;
    constructor();
    getUserPermissions(userId: string): Promise<UserPermission[]>;
    hasPermission(userId: string, module: string, action: string, schoolId?: string): Promise<boolean>;
    hasRole(userId: string, roles: string[]): Promise<boolean>;
    getUserRoles(userId: string): Promise<string[]>;
    getUserSchoolContext(userId: string): Promise<SchoolContext[]>;
    assignRole(userId: string, roleId: string, schoolId?: string, assignedBy?: string): Promise<void>;
    removeRole(userId: string, roleId: string, schoolId?: string): Promise<void>;
    createRole(name: string, description?: string): Promise<Role>;
    createPermission(module: string, action: string, description?: string): Promise<Permission>;
    assignPermissionToRole(roleId: string, permissionId: string): Promise<void>;
    clearUserPermissionCache(userId: string): void;
    clearAllPermissionCache(): void;
}
//# sourceMappingURL=RBACService.d.ts.map