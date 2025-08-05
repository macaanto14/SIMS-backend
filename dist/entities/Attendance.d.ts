import { BaseEntity } from './base/BaseEntity';
import { StudentProfile } from './StudentProfile';
import { Class } from './Class';
import { User } from './User';
export declare class Attendance extends BaseEntity {
    studentId: string;
    classId: string;
    date: Date;
    status: 'present' | 'absent' | 'late' | 'excused';
    markedBy: string;
    notes: string | null;
    student: StudentProfile;
    class: Class;
    markedByUser: User;
    get isPresent(): boolean;
    get displayStatus(): string;
}
//# sourceMappingURL=Attendance.d.ts.map