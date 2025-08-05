import { BaseEntity } from './base/BaseEntity';
import { User } from './User';
import { Class } from './Class';
import { AcademicYear } from './AcademicYear';
import { TeacherProfile } from './TeacherProfile';
import { StudentProfile } from './StudentProfile';
import { ParentProfile } from './ParentProfile';
export declare class School extends BaseEntity {
    name: string;
    code: string | null;
    address: string | null;
    phone: string | null;
    email: string | null;
    website: string | null;
    logo: string | null;
    subscriptionStatus: string;
    subscriptionExpiresAt: Date | null;
    settings: Record<string, any> | null;
    metadata: Record<string, any> | null;
    users: User[];
    classes: Class[];
    academicYears: AcademicYear[];
    teacherProfiles: TeacherProfile[];
    studentProfiles: StudentProfile[];
    parentProfiles: ParentProfile[];
    get isSubscriptionActive(): boolean;
    get displayName(): string;
}
//# sourceMappingURL=School.d.ts.map