import { UserRole } from './UserRole';
import { RolePermission } from './RolePermission';
export declare class Role {
    id: string;
    name: string;
    description: string | null;
    level: string | null;
    priority: number;
    metadata: any;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
    userRoles: UserRole[];
    rolePermissions: RolePermission[];
    get displayName(): string;
}
//# sourceMappingURL=Role.d.ts.map