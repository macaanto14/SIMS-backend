import { BaseEntity } from './base/BaseEntity';
import { School } from './School';
import { AcademicYear } from './AcademicYear';
import { StudentProfile } from './StudentProfile';
import { Attendance } from './Attendance';
import { FeeStructure } from './FeeStructure';
import { Timetable } from './Timetable';
export declare class Class extends BaseEntity {
    schoolId: string;
    academicYearId: string;
    name: string;
    gradeLevel: number;
    section: string | null;
    classTeacherId: string | null;
    maxStudents: number | null;
    roomNumber: string | null;
    isActive: boolean;
    school: School;
    academicYear: AcademicYear;
    students: StudentProfile[];
    attendanceRecords: Attendance[];
    feeStructures: FeeStructure[];
    timetables: Timetable[];
    get displayName(): string;
    get currentEnrollment(): number;
    get hasCapacity(): boolean;
}
//# sourceMappingURL=Class.d.ts.map