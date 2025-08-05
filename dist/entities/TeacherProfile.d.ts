import { BaseEntity } from './base/BaseEntity';
import { User } from './User';
import { School } from './School';
export declare class TeacherProfile extends BaseEntity {
    userId: string;
    schoolId: string;
    employeeId: string;
    department: string;
    subject: string;
    qualification: string;
    salary: number;
    joinDate: Date;
    emergencyContact: string;
    address: string;
    metadata: Record<string, any>;
    user: User;
    school: School;
    get displayName(): string;
}
//# sourceMappingURL=TeacherProfile.d.ts.map