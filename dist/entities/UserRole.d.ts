import { BaseEntity } from './base/BaseEntity';
import { User } from './User';
import { Role } from './Role';
import { School } from './School';
export declare class UserRole extends BaseEntity {
    userId: string;
    roleId: string;
    schoolId: string;
    assignedBy: string;
    assignedAt: Date;
    expiresAt: Date;
    metadata: Record<string, any>;
    user: User;
    role: Role;
    school: School;
    assignedByUser: User;
}
//# sourceMappingURL=UserRole.d.ts.map