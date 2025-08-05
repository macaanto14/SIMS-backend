import { BaseEntity } from './base/BaseEntity';
import { School } from './School';
import { Class } from './Class';
import { Term } from './Term';
import { FeeStructure } from './FeeStructure';
export declare class AcademicYear extends BaseEntity {
    name: string;
    startDate: Date;
    endDate: Date;
    isCurrent: boolean;
    schoolId: string;
    school: School;
    classes: Class[];
    terms: Term[];
    feeStructures: FeeStructure[];
    get displayName(): string;
    get isCurrentPeriod(): boolean;
}
//# sourceMappingURL=AcademicYear.d.ts.map