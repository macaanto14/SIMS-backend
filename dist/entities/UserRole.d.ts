import { BaseEntity } from './base/BaseEntity';
import { User } from './User';
import { Role } from './Role';
import { School } from './School';
export declare class UserRole extends BaseEntity {
    userId: string;
    roleId: string;
    schoolId: string | null;
    assignedBy: string | null;
    assignedAt: Date | null;
    expiresAt: Date | null;
    isActive: boolean;
    user: User;
    role: Role;
    school: School | null;
    assignedByUser: User | null;
}
//# sourceMappingURL=UserRole.d.ts.map