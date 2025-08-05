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
import { Class } from './Class';
import { Term } from './Term';
import { FeeStructure } from './FeeStructure';

@Entity('academic_years')
@Index(['schoolId'])
@Index(['isCurrent'])
export class AcademicYear extends BaseEntity {
  @Column({ type: 'varchar', length: 100 })
  name!: string;

  @Column({ type: 'date', name: 'start_date' })
  startDate!: Date;

  @Column({ type: 'date', name: 'end_date' })
  endDate!: Date;

  @Column({ type: 'boolean', default: false, name: 'is_current' })
  isCurrent!: boolean;

  // Relationships
  @Column({ type: 'uuid', name: 'school_id' })
  schoolId!: string;

  @ManyToOne(() => School, school => school.academicYears, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'school_id' })
  school!: School;

  @OneToMany(() => Class, classEntity => classEntity.academicYear)
  classes!: Class[];

  @OneToMany(() => Term, term => term.academicYear)
  terms!: Term[];

  @OneToMany(() => FeeStructure, feeStructure => feeStructure.academicYear)
  feeStructures!: FeeStructure[];

  // Virtual fields
  get displayName(): string {
    if (!this.startDate || !this.endDate) {
      return this.name;
    }
    return `${this.name} (${this.startDate.getFullYear()}-${this.endDate.getFullYear()})`;
  }

  get isCurrentPeriod(): boolean {
    if (!this.startDate || !this.endDate) {
      return false;
    }
    const now = new Date();
    return now >= this.startDate && now <= this.endDate;
  }
}