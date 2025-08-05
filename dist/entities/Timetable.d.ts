import { BaseEntity } from './base/BaseEntity';
import { Class } from './Class';
import { Subject } from './Subject';
import { TeacherProfile } from './TeacherProfile';
export declare class Timetable extends BaseEntity {
    classId: string;
    subjectId: string;
    teacherId: string;
    dayOfWeek: number;
    startTime: string;
    endTime: string;
    roomNumber: string | null;
    isActive: boolean;
    class: Class;
    subject: Subject;
    teacher: TeacherProfile;
    get dayName(): string;
    get timeSlot(): string;
    get displayName(): string;
}
//# sourceMappingURL=Timetable.d.ts.map