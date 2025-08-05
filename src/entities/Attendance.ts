import {
  Entity,
  Column,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { BaseEntity } from './base/BaseEntity';
import { StudentProfile } from './StudentProfile';
import { Class } from './Class';
import { User } from './User';

@Entity('attendance')
@Index(['studentId', 'date'], { unique: true })
@Index(['classId'])
@Index(['date'])
export class Attendance extends BaseEntity {
  @Column({ type: 'uuid', name: 'student_id' })
  studentId!: string;

  @Column({ type: 'uuid', name: 'class_id' })
  classId!: string;

  @Column({ type: 'date' })
  date!: Date;

  @Column({ type: 'text' })
  status!: 'present' | 'absent' | 'late' | 'excused';

  @Column({ type: 'uuid', name: 'marked_by' })
  markedBy!: string;

  @Column({ type: 'text', nullable: true })
  notes!: string | null;

  // Relationships
  @ManyToOne(() => StudentProfile, student => student.attendanceRecords)
  @JoinColumn({ name: 'student_id' })
  student!: StudentProfile;

  @ManyToOne(() => Class, classEntity => classEntity.attendanceRecords)
  @JoinColumn({ name: 'class_id' })
  class!: Class;

  @ManyToOne(() => User, user => user.markedAttendance)
  @JoinColumn({ name: 'marked_by' })
  markedByUser!: User;

  // Virtual fields
  get isPresent(): boolean {
    return this.status === 'present';
  }

  get displayStatus(): string {
    return this.status.charAt(0).toUpperCase() + this.status.slice(1);
  }
}