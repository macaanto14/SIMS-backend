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

@Entity('academic_years')
@Index(['schoolId'])
@Index(['isCurrent'])
export class AcademicYear extends BaseEntity {
  @Column({ type: 'varchar', length: 100 })
  name!: string;

  @Column({ type: 'date', nullable: true })
  startDate?: Date;

  @Column({ type: 'date', nullable: true })
  endDate?: Date;

  @Column({ type: 'boolean', default: false })
  isCurrent!: boolean;

  @Column({ type: 'jsonb', default: {} })
  metadata!: Record<string, any>;

  // Relationships
  @Column({ type: 'uuid' })
  schoolId!: string;

  @ManyToOne(() => School, school => school.academicYears, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'school_id' })
  school!: School;

  @OneToMany(() => Class, classEntity => classEntity.academicYear)
  classes!: Class[];

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