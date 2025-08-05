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

@Entity('parent_profiles')
@Index(['userId'])
@Index(['schoolId'])
export class ParentProfile extends BaseEntity {
  @Column({ type: 'uuid', name: 'user_id' })
  userId!: string;

  @Column({ type: 'uuid', name: 'school_id' })
  schoolId!: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  occupation!: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  workplace!: string | null;

  @Column({ type: 'decimal', precision: 12, scale: 2, nullable: true, name: 'annual_income' })
  annualIncome!: number | null;

  @Column({ type: 'text', nullable: true })
  address!: string | null;

  @Column({ type: 'varchar', length: 20, nullable: true, name: 'emergency_contact' })
  emergencyContact!: string | null;

  @Column({ type: 'varchar', length: 50, nullable: true, name: 'relationship_to_student' })
  relationshipToStudent!: string | null;

  @Column({ type: 'boolean', default: true })
  isActive!: boolean;

  // Relationships
  @ManyToOne(() => User, user => user.parentProfile)
  @JoinColumn({ name: 'user_id' })
  user!: User;

  @ManyToOne(() => School, school => school.parentProfiles)
  @JoinColumn({ name: 'school_id' })
  school!: School;

  // Virtual fields
  get displayName(): string {
    return this.user?.fullName || 'Unknown Parent';
  }
}