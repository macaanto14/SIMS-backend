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
import { Attendance } from './Attendance';
import { FeeStructure } from './FeeStructure';
import { Timetable } from './Timetable';

@Entity('classes')
@Index(['schoolId'])
@Index(['academicYearId'])
@Index(['isActive'])
export class Class extends BaseEntity {
  @Column({ type: 'uuid', name: 'school_id' })
  schoolId!: string;

  @Column({ type: 'uuid', name: 'academic_year_id' })
  academicYearId!: string;

  @Column({ type: 'varchar', length: 100 })
  name!: string;

  @Column({ type: 'integer', name: 'grade_level' })
  gradeLevel!: number;

  @Column({ type: 'varchar', length: 10, nullable: true })
  section!: string | null;

  @Column({ type: 'uuid', nullable: true, name: 'class_teacher_id' })
  classTeacherId!: string | null;

  @Column({ type: 'integer', nullable: true, name: 'max_students' })
  maxStudents!: number | null;

  @Column({ type: 'varchar', length: 50, nullable: true, name: 'room_number' })
  roomNumber!: string | null;

  @Column({ type: 'boolean', default: true, name: 'is_active' })
  isActive!: boolean;

  // Relationships
  @ManyToOne(() => School, school => school.classes, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'school_id' })
  school!: School;

  @ManyToOne(() => AcademicYear, academicYear => academicYear.classes, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'academic_year_id' })
  academicYear!: AcademicYear;

  @OneToMany(() => StudentProfile, student => student.class)
  students!: StudentProfile[];

  @OneToMany(() => Attendance, attendance => attendance.class)
  attendanceRecords!: Attendance[];

  @OneToMany(() => FeeStructure, feeStructure => feeStructure.class)
  feeStructures!: FeeStructure[];

  @OneToMany(() => Timetable, timetable => timetable.class)
  timetables!: Timetable[];

  // Virtual fields
  get displayName(): string {
    return this.section ? `${this.name} - ${this.section}` : this.name;
  }

  get currentEnrollment(): number {
    return this.students?.filter(student => student.isActive).length || 0;
  }

  get hasCapacity(): boolean {
    if (!this.maxStudents) return true;
    return this.currentEnrollment < this.maxStudents;
  }
}