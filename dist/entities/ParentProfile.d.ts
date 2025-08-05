import { BaseEntity } from './base/BaseEntity';
import { User } from './User';
import { School } from './School';
export declare class ParentProfile extends BaseEntity {
    userId: string;
    schoolId: string;
    occupation: string | null;
    workplace: string | null;
    annualIncome: number | null;
    address: string | null;
    emergencyContact: string | null;
    relationshipToStudent: string | null;
    isActive: boolean;
    user: User;
    school: School;
    get displayName(): string;
}
//# sourceMappingURL=ParentProfile.d.ts.map