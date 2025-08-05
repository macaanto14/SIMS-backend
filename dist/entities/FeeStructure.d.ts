import { BaseEntity } from './base/BaseEntity';
import { School } from './School';
import { AcademicYear } from './AcademicYear';
import { Class } from './Class';
import { StudentFee } from './StudentFee';
export declare class FeeStructure extends BaseEntity {
    schoolId: string;
    academicYearId: string;
    classId: string | null;
    feeType: string;
    amount: number;
    frequency: 'monthly' | 'quarterly' | 'annually' | 'one_time';
    dueDateRule: string | null;
    isMandatory: boolean;
    isActive: boolean;
    school: School;
    academicYear: AcademicYear;
    class: Class | null;
    studentFees: StudentFee[];
    get displayName(): string;
}
//# sourceMappingURL=FeeStructure.d.ts.map