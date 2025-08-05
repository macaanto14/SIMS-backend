import {
  Entity,
  Column,
  ManyToOne,
  OneToMany,
  JoinColumn,
  Index,
} from 'typeorm';
import { BaseEntity } from './base/BaseEntity';
import { User } from './User';
import { School } from './School';
import { Attendance } from './Attendance';
import { Grade } from './Grade';
import { Timetable } from './Timetable';

@Entity('teacher_profiles')
@Index(['schoolId'])
@Index(['isActive'])
export class TeacherProfile extends BaseEntity {
  @Column({ type: 'uuid', name: 'user_id' })
  userId!: string;

  @Column({ type: 'uuid', name: 'school_id' })
  schoolId!: string;

  @Column({ type: 'varchar', length: 50, name: 'employee_id' })
  employeeId!: string;

  @Column({ type: 'date', name: 'hire_date' })
  hireDate!: Date;

  @Column({ type: 'varchar', length: 100, nullable: true })
  department!: string | null;

  @Column({ type: 'varchar', length: 100, nullable: true })
  specialization!: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  qualification!: string | null;

  @Column({ type: 'integer', default: 0, name: 'experience_years' })
  experienceYears!: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  salary!: number | null;

  @Column({ type: 'varchar', length: 20, nullable: true, name: 'emergency_contact' })
  emergencyContact!: string | null;

  @Column({ type: 'text', nullable: true })
  address!: string | null;

  @Column({ type: 'boolean', default: true })
  isActive!: boolean;

  // Relationships
  @ManyToOne(() => User, user => user.teacherProfile, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user!: User;

  @ManyToOne(() => School, school => school.teachers, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'school_id' })
  school!: School;

  @OneToMany(() => Attendance, attendance => attendance.markedByUser)
  markedAttendance!: Attendance[];

  @OneToMany(() => Grade, grade => grade.assessedByUser)
  assessedGrades!: Grade[];

  @OneToMany(() => Timetable, timetable => timetable.teacher)
  timetables!: Timetable[];

  // Virtual fields
  get fullName(): string {
    return `${this.user.firstName} ${this.user.lastName}`;
  }

  get displayName(): string {
    return `${this.fullName} (${this.employeeId})`;
  }
}