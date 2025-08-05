import { FeeStructure } from '../entities/FeeStructure';
import { StudentFee } from '../entities/StudentFee';
import { FeePayment } from '../entities/FeePayment';
export declare class FeeService {
    private feeStructureRepository;
    private studentFeeRepository;
    private feePaymentRepository;
    constructor();
    createFeeStructure(feeStructureData: Partial<FeeStructure>): Promise<FeeStructure>;
    getFeeStructuresBySchool(schoolId: string): Promise<FeeStructure[]>;
    createStudentFee(studentFeeData: Partial<StudentFee>): Promise<StudentFee>;
    getStudentFees(studentId: string): Promise<StudentFee[]>;
    getOverdueFees(schoolId: string): Promise<StudentFee[]>;
    recordPayment(paymentData: Partial<FeePayment>): Promise<FeePayment>;
    private updateStudentFeeStatus;
    getFeeStatistics(schoolId: string): Promise<any>;
}
//# sourceMappingURL=FeeService.d.ts.map