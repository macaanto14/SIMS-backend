import { BaseEntity } from './base/BaseEntity';
import { UserRole } from './UserRole';
import { RolePermission } from './RolePermission';
export declare class Role extends BaseEntity {
    name: string;
    description: string | null;
    level: string | null;
    priority: number;
    metadata: Record<string, any>;
    userRoles: UserRole[];
    rolePermissions: RolePermission[];
    get displayName(): string;
}
//# sourceMappingURL=Role.d.ts.map