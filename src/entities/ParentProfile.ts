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
  @Column({ type: 'uuid' })
  userId!: string;

  @Column({ type: 'uuid' })
  schoolId!: string;

  @Column({ type: 'varchar', length: 50 })
  relationship!: string; // father, mother, guardian

  @Column({ type: 'varchar', length: 100, nullable: true })
  occupation!: string | null;

  @Column({ type: 'varchar', length: 20, nullable: true })
  phone!: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  email!: string | null;

  @Column({ type: 'text', nullable: true })
  address!: string | null;

  @Column({ type: 'varchar', length: 20, nullable: true })
  emergencyContact!: string | null;

  @Column({ type: 'jsonb', nullable: true })
  metadata!: Record<string, any> | null;

  // Relationships
  @ManyToOne(() => User, user => user.parentProfile)
  @JoinColumn({ name: 'user_id' })
  user!: User;

  @ManyToOne(() => School, school => school.parentProfiles)
  @JoinColumn({ name: 'school_id' })
  school!: School;

  // Virtual fields
  get displayName(): string {
    return `${this.relationship} - ${this.user?.fullName || 'Unknown'}`;
  }
}