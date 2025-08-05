import { Repository } from 'typeorm';
import { AppDataSource } from '../config/database';
import { FeeStructure } from '../entities/FeeStructure';
import { StudentFee } from '../entities/StudentFee';
import { FeePayment } from '../entities/FeePayment';
import { BaseRepository } from '../repositories/BaseRepository';

export class FeeService {
  private feeStructureRepository: Repository<FeeStructure>;
  private studentFeeRepository: Repository<StudentFee>;
  private feePaymentRepository: Repository<FeePayment>;

  constructor() {
    this.feeStructureRepository = AppDataSource.getRepository(FeeStructure);
    this.studentFeeRepository = AppDataSource.getRepository(StudentFee);
    this.feePaymentRepository = AppDataSource.getRepository(FeePayment);
  }

  // Fee Structure methods
  async createFeeStructure(feeStructureData: Partial<FeeStructure>): Promise<FeeStructure> {
    const feeStructure = this.feeStructureRepository.create(feeStructureData);
    return this.feeStructureRepository.save(feeStructure);
  }

  async getFeeStructuresBySchool(schoolId: string): Promise<FeeStructure[]> {
    return this.feeStructureRepository.find({
      where: { schoolId, isActive: true },
      relations: ['academicYear', 'class'],
      order: { feeType: 'ASC' }
    });
  }

  // Student Fee methods
  async createStudentFee(studentFeeData: Partial<StudentFee>): Promise<StudentFee> {
    const studentFee = this.studentFeeRepository.create(studentFeeData);
    return this.studentFeeRepository.save(studentFee);
  }

  async getStudentFees(studentId: string): Promise<StudentFee[]> {
    return this.studentFeeRepository.find({
      where: { studentId },
      relations: ['feeStructure', 'payments'],
      order: { dueDate: 'ASC' }
    });
  }

  async getOverdueFees(schoolId: string): Promise<StudentFee[]> {
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

  // Payment methods
  async recordPayment(paymentData: Partial<FeePayment>): Promise<FeePayment> {
    const payment = this.feePaymentRepository.create(paymentData);
    const savedPayment = await this.feePaymentRepository.save(payment);

    // Update student fee status
    await this.updateStudentFeeStatus(paymentData.studentFeeId!);

    return savedPayment;
  }

  private async updateStudentFeeStatus(studentFeeId: string): Promise<void> {
    const studentFee = await this.studentFeeRepository.findOne({
      where: { id: studentFeeId },
      relations: ['payments']
    });

    if (!studentFee) return;

    const totalPaid = studentFee.payments.reduce((sum, payment) => sum + payment.amountPaid, 0);
    
    let status: 'unpaid' | 'partially_paid' | 'paid' | 'overdue';
    if (totalPaid >= studentFee.amount) {
      status = 'paid';
    } else if (totalPaid > 0) {
      status = 'partially_paid';
    } else if (new Date() > studentFee.dueDate) {
      status = 'overdue';
    } else {
      status = 'unpaid';
    }

    await this.studentFeeRepository.update(studentFeeId, { status });
  }

  async getFeeStatistics(schoolId: string): Promise<any> {
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