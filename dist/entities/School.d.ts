import { BaseEntity } from './base/BaseEntity';
import { User } from './User';
import { Class } from './Class';
import { AcademicYear } from './AcademicYear';
import { TeacherProfile } from './TeacherProfile';
import { StudentProfile } from './StudentProfile';
import { ParentProfile } from './ParentProfile';
import { Subject } from './Subject';
import { FeeStructure } from './FeeStructure';
export declare class School extends BaseEntity {
    name: string;
    code: string;
    address: string | null;
    phone: string | null;
    email: string | null;
    website: string | null;
    logoUrl: string | null;
    description: string | null;
    establishedYear: string | null;
    principalName: string | null;
    principalId: string | null;
    settings: any;
    metadata: any;
    isActive: boolean;
    principal: User | null;
    users: User[];
    classes: Class[];
    academicYears: AcademicYear[];
    teachers: TeacherProfile[];
    students: StudentProfile[];
    parents: ParentProfile[];
    parentProfiles: ParentProfile[];
    subjects: Subject[];
    feeStructures: FeeStructure[];
    get displayName(): string;
}
//# sourceMappingURL=School.d.ts.map