import { BaseEntity } from './base/BaseEntity';
import { User } from './User';
import { School } from './School';
import { Class } from './Class';
import { Attendance } from './Attendance';
import { Grade } from './Grade';
import { StudentFee } from './StudentFee';
export declare class StudentProfile extends BaseEntity {
    userId: string;
    schoolId: string;
    classId: string | null;
    studentId: string;
    admissionDate: Date;
    dateOfBirth: Date;
    gender: string;
    bloodGroup: string | null;
    address: string | null;
    guardianName: string | null;
    guardianPhone: string | null;
    guardianEmail: string | null;
    emergencyContact: string | null;
    medicalConditions: string | null;
    isActive: boolean;
    user: User;
    school: School;
    class: Class | null;
    attendanceRecords: Attendance[];
    grades: Grade[];
    fees: StudentFee[];
    get fullName(): string;
    get age(): number;
}
//# sourceMappingURL=StudentProfile.d.ts.map