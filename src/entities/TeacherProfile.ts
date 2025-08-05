import {
  Entity,
  Column,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { BaseEntity } from './base/BaseEntity';
import { User } from './User';
import { School } from './School';

@Entity('teacher_profiles')
@Index(['userId'], { unique: true })
@Index(['schoolId'])
@Index(['isActive'])
export class TeacherProfile extends BaseEntity {
  @Column({ type: 'uuid' })
  userId!: string;

  @Column({ type: 'uuid' })
  schoolId!: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  employeeId!: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  department!: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  subject!: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  qualification!: string;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  salary!: number;

  @Column({ type: 'date', nullable: true })
  joinDate!: Date;

  @Column({ type: 'varchar', length: 20, nullable: true })
  emergencyContact!: string;

  @Column({ type: 'text', nullable: true })
  address!: string;

  @Column({ type: 'jsonb', nullable: true })
  metadata!: Record<string, any>;

  // Relationships
  @ManyToOne(() => User, user => user.teacherProfile)
  @JoinColumn({ name: 'user_id' })
  user!: User;

  @ManyToOne(() => School, school => school.teacherProfiles)
  @JoinColumn({ name: 'school_id' })
  school!: School;

  // Virtual fields
  get displayName(): string {
    return this.user?.fullName || 'Unknown Teacher';
  }
}