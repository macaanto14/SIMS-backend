import {
  Entity,
  Column,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { BaseEntity } from './base/BaseEntity';
import { Class } from './Class';
import { Subject } from './Subject';
import { TeacherProfile } from './TeacherProfile';

@Entity('timetables')
@Index(['classId'])
@Index(['subjectId'])
@Index(['teacherId'])
@Index(['dayOfWeek'])
@Index(['isActive'])
export class Timetable extends BaseEntity {
  @Column({ type: 'uuid', name: 'class_id' })
  classId!: string;

  @Column({ type: 'uuid', name: 'subject_id' })
  subjectId!: string;

  @Column({ type: 'uuid', name: 'teacher_id' })
  teacherId!: string;

  @Column({ type: 'integer', name: 'day_of_week' })
  dayOfWeek!: number; // 1-7 (Monday to Sunday)

  @Column({ type: 'time', name: 'start_time' })
  startTime!: string;

  @Column({ type: 'time', name: 'end_time' })
  endTime!: string;

  @Column({ type: 'text', nullable: true, name: 'room_number' })
  roomNumber!: string | null;

  @Column({ type: 'boolean', default: true, name: 'is_active' })
  isActive!: boolean;

  // Relationships
  @ManyToOne(() => Class, classEntity => classEntity.timetables)
  @JoinColumn({ name: 'class_id' })
  class!: Class;

  @ManyToOne(() => Subject, subject => subject.timetables)
  @JoinColumn({ name: 'subject_id' })
  subject!: Subject;

  @ManyToOne(() => TeacherProfile, teacher => teacher.timetables)
  @JoinColumn({ name: 'teacher_id' })
  teacher!: TeacherProfile;

  // Virtual fields
  get dayName(): string {
    const days = ['', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    return days[this.dayOfWeek] || 'Unknown';
  }

  get timeSlot(): string {
    return `${this.startTime} - ${this.endTime}`;
  }

  get displayName(): string {
    return `${this.subject.name} - ${this.dayName} ${this.timeSlot}`;
  }
}