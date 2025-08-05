import { BaseEntity } from './base/BaseEntity';
import { StudentFee } from './StudentFee';
import { User } from './User';
export declare class FeePayment extends BaseEntity {
    studentFeeId: string;
    amountPaid: number;
    paymentMethod: string;
    transactionReference: string | null;
    paymentDate: Date;
    receivedBy: string;
    notes: string | null;
    studentFee: StudentFee;
    receivedByUser: User;
    get displayAmount(): string;
}
//# sourceMappingURL=FeePayment.d.ts.map