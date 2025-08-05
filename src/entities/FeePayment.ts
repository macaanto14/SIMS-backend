import {
  Entity,
  Column,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { BaseEntity } from './base/BaseEntity';
import { StudentFee } from './StudentFee';
import { User } from './User';

@Entity('fee_payments')
@Index(['studentFeeId'])
@Index(['paymentDate'])
export class FeePayment extends BaseEntity {
  @Column({ type: 'uuid', name: 'student_fee_id' })
  studentFeeId!: string;

  @Column({ type: 'numeric', name: 'amount_paid' })
  amountPaid!: number;

  @Column({ type: 'text', name: 'payment_method' })
  paymentMethod!: string;

  @Column({ type: 'text', nullable: true, name: 'transaction_reference' })
  transactionReference!: string | null;

  @Column({ type: 'date', name: 'payment_date' })
  paymentDate!: Date;

  @Column({ type: 'uuid', name: 'received_by' })
  receivedBy!: string;

  @Column({ type: 'text', nullable: true })
  notes!: string | null;

  // Relationships
  @ManyToOne(() => StudentFee, studentFee => studentFee.payments)
  @JoinColumn({ name: 'student_fee_id' })
  studentFee!: StudentFee;

  @ManyToOne(() => User, user => user.receivedPayments)
  @JoinColumn({ name: 'received_by' })
  receivedByUser!: User;

  // Virtual fields
  get displayAmount(): string {
    return `${this.amountPaid.toFixed(2)}`;
  }
}