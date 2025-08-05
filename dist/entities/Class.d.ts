import { BaseEntity } from './base/BaseEntity';
import { School } from './School';
import { AcademicYear } from './AcademicYear';
import { StudentProfile } from './StudentProfile';
export declare class Class extends BaseEntity {
    name: string;
    section: string | null;
    grade: string | null;
    capacity: number;
    description: string | null;
    metadata: Record<string, any> | null;
    schoolId: string;
    academicYearId: string;
    school: School;
    academicYear: AcademicYear;
    students: StudentProfile[];
    get fullName(): string;
    get displayName(): string;
    get currentEnrollment(): number;
    get availableSpots(): number;
}
//# sourceMappingURL=Class.d.ts.map