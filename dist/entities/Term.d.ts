import { BaseEntity } from './base/BaseEntity';
import { AcademicYear } from './AcademicYear';
import { Grade } from './Grade';
export declare class Term extends BaseEntity {
    academicYearId: string;
    name: string;
    startDate: Date;
    endDate: Date;
    isCurrent: boolean;
    academicYear: AcademicYear;
    grades: Grade[];
    get displayName(): string;
    get isCurrentPeriod(): boolean;
}
//# sourceMappingURL=Term.d.ts.map