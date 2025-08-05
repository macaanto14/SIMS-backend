import {
  Entity,
  Column,
  ManyToOne,
  OneToMany,
  JoinColumn,
  Index,
} from 'typeorm';
import { BaseEntity } from './base/BaseEntity';
import { School } from './School';
import { AcademicYear } from './AcademicYear';
import { Class } from './Class';
import { StudentFee } from './StudentFee';

@Entity('fee_structures')
@Index(['schoolId'])
@Index(['academicYearId'])
@Index(['isActive'])
export class FeeStructure extends BaseEntity {
  @Column({ type: 'uuid', name: 'school_id' })
  schoolId!: string;

  @Column({ type: 'uuid', name: 'academic_year_id' })
  academicYearId!: string;

  @Column({ type: 'uuid', nullable: true, name: 'class_id' })
  classId!: string | null;

  @Column({ type: 'text', name: 'fee_type' })
  feeType!: string;

  @Column({ type: 'numeric' })
  amount!: number;

  @Column({ type: 'text', default: 'monthly' })
  frequency!: 'monthly' | 'quarterly' | 'annually' | 'one_time';

  @Column({ type: 'text', nullable: true, name: 'due_date_rule' })
  dueDateRule!: string | null;

  @Column({ type: 'boolean', default: true, name: 'is_mandatory' })
  isMandatory!: boolean;

  @Column({ type: 'boolean', default: true, name: 'is_active' })
  isActive!: boolean;

  // Relationships
  @ManyToOne(() => School, school => school.feeStructures)
  @JoinColumn({ name: 'school_id' })
  school!: School;

  @ManyToOne(() => AcademicYear, academicYear => academicYear.feeStructures)
  @JoinColumn({ name: 'academic_year_id' })
  academicYear!: AcademicYear;

  @ManyToOne(() => Class, classEntity => classEntity.feeStructures, { nullable: true })
  @JoinColumn({ name: 'class_id' })
  class!: Class | null;

  @OneToMany(() => StudentFee, studentFee => studentFee.feeStructure)
  studentFees!: StudentFee[];

  // Virtual fields
  get displayName(): string {
    return `${this.feeType} - ${this.amount}`;
  }
}