import { BaseEntity } from './base/BaseEntity';
import { User } from './User';
import { School } from './School';
import { Attendance } from './Attendance';
import { Grade } from './Grade';
import { Timetable } from './Timetable';
export declare class TeacherProfile extends BaseEntity {
    userId: string;
    schoolId: string;
    employeeId: string;
    hireDate: Date;
    department: string | null;
    specialization: string | null;
    qualification: string | null;
    experienceYears: number;
    salary: number | null;
    emergencyContact: string | null;
    address: string | null;
    isActive: boolean;
    user: User;
    school: School;
    markedAttendance: Attendance[];
    assessedGrades: Grade[];
    timetables: Timetable[];
    get fullName(): string;
    get displayName(): string;
}
//# sourceMappingURL=TeacherProfile.d.ts.map