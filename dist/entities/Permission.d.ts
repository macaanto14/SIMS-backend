import { RolePermission } from './RolePermission';
export declare class Permission {
    id: string;
    module: string;
    action: string;
    description: string | null;
    createdAt: Date;
    rolePermissions: RolePermission[];
    get displayName(): string;
}
//# sourceMappingURL=Permission.d.ts.map