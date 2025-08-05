import { BaseEntity } from './base/BaseEntity';
import { School } from './School';
import { Class } from './Class';
export declare class AcademicYear extends BaseEntity {
    name: string;
    startDate: Date;
    endDate: Date;
    isCurrent: boolean;
    metadata: Record<string, any>;
    schoolId: string;
    school: School;
    classes: Class[];
    get displayName(): string;
    get isCurrentPeriod(): boolean;
}
//# sourceMappingURL=AcademicYear.d.ts.map