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
import { Class } from './Class';

@Entity('student_profiles')
@Index(['userId'], { unique: true })
@Index(['schoolId'])
@Index(['classId'])
@Index(['isActive'])
export class StudentProfile extends BaseEntity {
  @Column({ type: 'uuid' })
  userId!: string;

  @Column({ type: 'uuid' })
  schoolId!: string;

  @Column({ type: 'uuid', nullable: true })
  classId!: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  studentId!: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  rollNumber!: string;

  @Column({ type: 'date', nullable: true })
  dateOfBirth!: Date;

  @Column({ type: 'varchar', length: 10, nullable: true })
  gender!: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  bloodGroup!: string;

  @Column({ type: 'varchar', length: 20, nullable: true })
  emergencyContact!: string;

  @Column({ type: 'text', nullable: true })
  address!: string;

  @Column({ type: 'date', nullable: true })
  admissionDate!: Date;

  @Column({ type: 'jsonb', nullable: true })
  metadata!: Record<string, any>;

  // Relationships
  @ManyToOne(() => User, user => user.studentProfile)
  @JoinColumn({ name: 'user_id' })
  user!: User;

  @ManyToOne(() => School, school => school.studentProfiles)
  @JoinColumn({ name: 'school_id' })
  school!: School;

  @ManyToOne(() => Class, classEntity => classEntity.students, { nullable: true })
  @JoinColumn({ name: 'class_id' })
  class!: Class;

  // Virtual fields
  get age(): number | null {
    if (!this.dateOfBirth) return null;
    const today = new Date();
    const birthDate = new Date(this.dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    
    return age;
  }

  get displayName(): string {
    return this.user?.fullName || 'Unknown Student';
  }
}