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
import { StudentProfile } from './StudentProfile';

@Entity('classes')
@Index(['schoolId'])
@Index(['academicYearId'])
@Index(['isActive'])
export class Class extends BaseEntity {
  @Column({ type: 'varchar', length: 100 })
  name!: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  section!: string | null;

  @Column({ type: 'varchar', length: 50, nullable: true })
  grade!: string | null;

  @Column({ type: 'integer', default: 0 })
  capacity!: number;

  @Column({ type: 'text', nullable: true })
  description!: string | null;

  @Column({ type: 'jsonb', nullable: true })
  metadata!: Record<string, any> | null;

  // Foreign keys
  @Column({ type: 'uuid' })
  schoolId!: string;

  @Column({ type: 'uuid' })
  academicYearId!: string;

  // Relationships
  @ManyToOne(() => School, school => school.classes)
  @JoinColumn({ name: 'school_id' })
  school!: School;

  @ManyToOne(() => AcademicYear, academicYear => academicYear.classes)
  @JoinColumn({ name: 'academic_year_id' })
  academicYear!: AcademicYear;

  @OneToMany(() => StudentProfile, student => student.class)
  students!: StudentProfile[];

  // Virtual fields
  get fullName(): string {
    return this.section ? `${this.name} - ${this.section}` : this.name;
  }

  get displayName(): string {
    return this.fullName;
  }

  get currentEnrollment(): number {
    return this.students?.length || 0;
  }

  get availableSpots(): number {
    return Math.max(0, this.capacity - this.currentEnrollment);
  }
}