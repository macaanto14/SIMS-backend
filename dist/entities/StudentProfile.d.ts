import { BaseEntity } from './base/BaseEntity';
import { User } from './User';
import { School } from './School';
import { Class } from './Class';
export declare class StudentProfile extends BaseEntity {
    userId: string;
    schoolId: string;
    classId: string;
    studentId: string;
    rollNumber: string;
    dateOfBirth: Date;
    gender: string;
    bloodGroup: string;
    emergencyContact: string;
    address: string;
    admissionDate: Date;
    metadata: Record<string, any>;
    user: User;
    school: School;
    class: Class;
    get age(): number | null;
    get displayName(): string;
}
//# sourceMappingURL=StudentProfile.d.ts.map