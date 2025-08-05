import { BaseEntity } from './base/BaseEntity';
import { School } from './School';
import { Grade } from './Grade';
import { Timetable } from './Timetable';
export declare class Subject extends BaseEntity {
    schoolId: string;
    name: string;
    code: string | null;
    description: string | null;
    isActive: boolean;
    school: School;
    grades: Grade[];
    timetables: Timetable[];
    get displayName(): string;
}
//# sourceMappingURL=Subject.d.ts.map