import {
  Entity,
  Column,
  ManyToOne,
  OneToMany,
  JoinColumn,
  Index,
} from 'typeorm';
import { BaseEntity } from './base/BaseEntity';
import { AcademicYear } from './AcademicYear';
import { Grade } from './Grade';

@Entity('terms')
@Index(['academicYearId'])
@Index(['isCurrent'])
export class Term extends BaseEntity {
  @Column({ type: 'uuid', name: 'academic_year_id' })
  academicYearId!: string;

  @Column({ type: 'varchar', length: 100 })
  name!: string;

  @Column({ type: 'date', name: 'start_date' })
  startDate!: Date;

  @Column({ type: 'date', name: 'end_date' })
  endDate!: Date;

  @Column({ type: 'boolean', default: false, name: 'is_current' })
  isCurrent!: boolean;

  // Relationships
  @ManyToOne(() => AcademicYear, academicYear => academicYear.terms, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'academic_year_id' })
  academicYear!: AcademicYear;

  @OneToMany(() => Grade, grade => grade.term)
  grades!: Grade[];

  // Virtual fields
  get displayName(): string {
    if (!this.startDate || !this.endDate) {
      return this.name;
    }
    return `${this.name} (${this.startDate.toLocaleDateString()} - ${this.endDate.toLocaleDateString()})`;
  }

  get isCurrentPeriod(): boolean {
    if (!this.startDate || !this.endDate) {
      return false;
    }
    const now = new Date();
    return now >= this.startDate && now <= this.endDate;
  }
}