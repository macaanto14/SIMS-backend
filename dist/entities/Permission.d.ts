import { BaseEntity } from './base/BaseEntity';
import { RolePermission } from './RolePermission';
export declare class Permission extends BaseEntity {
    module: string;
    action: string;
    description: string | null;
    metadata: Record<string, any>;
    rolePermissions: RolePermission[];
    get displayName(): string;
}
//# sourceMappingURL=Permission.d.ts.map