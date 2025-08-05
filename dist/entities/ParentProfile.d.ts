import { BaseEntity } from './base/BaseEntity';
import { User } from './User';
import { School } from './School';
export declare class ParentProfile extends BaseEntity {
    userId: string;
    schoolId: string;
    relationship: string;
    occupation: string | null;
    phone: string | null;
    email: string | null;
    address: string | null;
    emergencyContact: string | null;
    metadata: Record<string, any> | null;
    user: User;
    school: School;
    get displayName(): string;
}
//# sourceMappingURL=ParentProfile.d.ts.map