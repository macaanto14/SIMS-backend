"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FeeService = void 0;
const database_1 = require("../config/database");
const FeeStructure_1 = require("../entities/FeeStructure");
const StudentFee_1 = require("../entities/StudentFee");
const FeePayment_1 = require("../entities/FeePayment");
class FeeService {
    constructor() {
        this.feeStructureRepository = database_1.AppDataSource.getRepository(FeeStructure_1.FeeStructure);
        this.studentFeeRepository = database_1.AppDataSource.getRepository(StudentFee_1.StudentFee);
        this.feePaymentRepository = database_1.AppDataSource.getRepository(FeePayment_1.FeePayment);
    }
    async createFeeStructure(feeStructureData) {
        const feeStructure = this.feeStructureRepository.create(feeStructureData);
        return this.feeStructureRepository.save(feeStructure);
    }
    async getFeeStructuresBySchool(schoolId) {
        return this.feeStructureRepository.find({
            where: { schoolId, isActive: true },
            relations: ['academicYear', 'class'],
            order: { feeType: 'ASC' }
        });
    }
    async createStudentFee(studentFeeData) {
        const studentFee = this.studentFeeRepository.create(studentFeeData);
        return this.studentFeeRepository.save(studentFee);
    }
    async getStudentFees(studentId) {
        return this.studentFeeRepository.find({
            where: { studentId },
            relations: ['feeStructure', 'payments'],
            order: { dueDate: 'ASC' }
        });
    }
    async getOverdueFees(schoolId) {
        const currentDate = new Date();
        return this.studentFeeRepository
            .createQueryBuilder('studentFee')
            .leftJoin('studentFee.student', 'student')
            .leftJoin('studentFee.feeStructure', 'feeStructure')
            .where('student.schoolId = :schoolId', { schoolId })
            .andWhere('studentFee.dueDate < :currentDate', { currentDate })
            .andWhere('studentFee.status IN (:...statuses)', { statuses: ['unpaid', 'partially_paid'] })
            .getMany();
    }
    async recordPayment(paymentData) {
        const payment = this.feePaymentRepository.create(paymentData);
        const savedPayment = await this.feePaymentRepository.save(payment);
        await this.updateStudentFeeStatus(paymentData.studentFeeId);
        return savedPayment;
    }
    async updateStudentFeeStatus(studentFeeId) {
        const studentFee = await this.studentFeeRepository.findOne({
            where: { id: studentFeeId },
            relations: ['payments']
        });
        if (!studentFee)
            return;
        const totalPaid = studentFee.payments.reduce((sum, payment) => sum + payment.amountPaid, 0);
        let status;
        if (totalPaid >= studentFee.amount) {
            status = 'paid';
        }
        else if (totalPaid > 0) {
            status = 'partially_paid';
        }
        else if (new Date() > studentFee.dueDate) {
            status = 'overdue';
        }
        else {
            status = 'unpaid';
        }
        await this.studentFeeRepository.update(studentFeeId, { status });
    }
    async getFeeStatistics(schoolId) {
        const totalFees = await this.studentFeeRepository
            .createQueryBuilder('studentFee')
            .leftJoin('studentFee.student', 'student')
            .where('student.schoolId = :schoolId', { schoolId })
            .select('SUM(studentFee.amount)', 'total')
            .getRawOne();
        const paidFees = await this.feePaymentRepository
            .createQueryBuilder('payment')
            .leftJoin('payment.studentFee', 'studentFee')
            .leftJoin('studentFee.student', 'student')
            .where('student.schoolId = :schoolId', { schoolId })
            .select('SUM(payment.amountPaid)', 'total')
            .getRawOne();
        const overdueFees = await this.getOverdueFees(schoolId);
        return {
            totalFees: parseFloat(totalFees.total) || 0,
            paidFees: parseFloat(paidFees.total) || 0,
            pendingFees: (parseFloat(totalFees.total) || 0) - (parseFloat(paidFees.total) || 0),
            overdueFees: overdueFees.length,
            collectionRate: totalFees.total > 0 ? (paidFees.total / totalFees.total) * 100 : 0
        };
    }
}
exports.FeeService = FeeService;
//# sourceMappingURL=FeeService.js.map