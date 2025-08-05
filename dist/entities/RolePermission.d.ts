import { BaseEntity } from './base/BaseEntity';
import { Role } from './Role';
import { Permission } from './Permission';
export declare class RolePermission extends BaseEntity {
    roleId: string;
    permissionId: string;
    metadata: Record<string, any>;
    role: Role;
    permission: Permission;
}
//# sourceMappingURL=RolePermission.d.ts.map