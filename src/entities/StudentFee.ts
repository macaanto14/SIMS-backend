import {
  Entity,
  Column,
  ManyToOne,
  OneToMany,
  JoinColumn,
  Index,
} from 'typeorm';
import { BaseEntity } from './base/BaseEntity';
import { StudentProfile } from './StudentProfile';
import { FeeStructure } from './FeeStructure';
import { FeePayment } from './FeePayment';

@Entity('student_fees')
@Index(['studentId'])
@Index(['feeStructureId'])
@Index(['status'])
export class StudentFee extends BaseEntity {
  @Column({ type: 'uuid', name: 'student_id' })
  studentId!: string;

  @Column({ type: 'uuid', name: 'fee_structure_id' })
  feeStructureId!: string;

  @Column({ type: 'numeric' })
  amount!: number;

  @Column({ type: 'date', name: 'due_date' })
  dueDate!: Date;

  @Column({ type: 'text', default: 'unpaid' })
  status!: 'unpaid' | 'partially_paid' | 'paid' | 'overdue' | 'waived';

  // Relationships
  @ManyToOne(() => StudentProfile, student => student.fees)
  @JoinColumn({ name: 'student_id' })
  student!: StudentProfile;

  @ManyToOne(() => FeeStructure, feeStructure => feeStructure.studentFees)
  @JoinColumn({ name: 'fee_structure_id' })
  feeStructure!: FeeStructure;

  @OneToMany(() => FeePayment, payment => payment.studentFee)
  payments!: FeePayment[];

  // Virtual fields
  get isPaid(): boolean {
    return this.status === 'paid';
  }

  get isOverdue(): boolean {
    return this.status === 'overdue' || (this.status === 'unpaid' && new Date() > this.dueDate);
  }

  get totalPaid(): number {
    return this.payments?.reduce((sum, payment) => sum + payment.amountPaid, 0) || 0;
  }

  get remainingAmount(): number {
    return Math.max(0, this.amount - this.totalPaid);
  }
}