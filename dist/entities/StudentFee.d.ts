import { BaseEntity } from './base/BaseEntity';
import { StudentProfile } from './StudentProfile';
import { FeeStructure } from './FeeStructure';
import { FeePayment } from './FeePayment';
export declare class StudentFee extends BaseEntity {
    studentId: string;
    feeStructureId: string;
    amount: number;
    dueDate: Date;
    status: 'unpaid' | 'partially_paid' | 'paid' | 'overdue' | 'waived';
    student: StudentProfile;
    feeStructure: FeeStructure;
    payments: FeePayment[];
    get isPaid(): boolean;
    get isOverdue(): boolean;
    get totalPaid(): number;
    get remainingAmount(): number;
}
//# sourceMappingURL=StudentFee.d.ts.map