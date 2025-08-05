import { BaseEntity } from './base/BaseEntity';
import { StudentProfile } from './StudentProfile';
import { Subject } from './Subject';
import { Term } from './Term';
import { User } from './User';
export declare class Grade extends BaseEntity {
    studentId: string;
    subjectId: string;
    termId: string;
    assessmentType: string;
    assessmentName: string;
    marksObtained: number;
    totalMarks: number;
    grade: string | null;
    remarks: string | null;
    assessedBy: string;
    assessmentDate: Date;
    student: StudentProfile;
    subject: Subject;
    term: Term;
    assessedByUser: User;
    get percentage(): number;
    get isPassing(): boolean;
}
//# sourceMappingURL=Grade.d.ts.map