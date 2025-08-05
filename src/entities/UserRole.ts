import {
  Entity,
  Column,
  ManyToOne,
  JoinColumn,
  Index,
  Unique,
} from 'typeorm';
import { BaseEntity } from './base/BaseEntity';
import { User } from './User';
import { Role } from './Role';
import { School } from './School';

@Entity('user_roles')
@Unique(['userId', 'roleId', 'schoolId'])
@Index(['userId'])
@Index(['roleId'])
@Index(['schoolId'])
export class UserRole extends BaseEntity {
  @Column({ name: 'user_id', type: 'uuid' })
  userId!: string;

  @Column({ name: 'role_id', type: 'uuid' })
  roleId!: string;

  @Column({ name: 'school_id', type: 'uuid', nullable: true })
  schoolId!: string;

  @Column({ name: 'assigned_by', type: 'uuid', nullable: true })
  assignedBy!: string;

  @Column({ name: 'assigned_at', type: 'timestamptz', nullable: true })
  assignedAt!: Date;

  @Column({ name: 'expires_at', type: 'timestamptz', nullable: true })
  expiresAt!: Date;

  // Relationships
  @ManyToOne(() => User, user => user.userRoles, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user!: User;

  @ManyToOne(() => Role, role => role.userRoles, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'role_id' })
  role!: Role;

  @ManyToOne(() => School, { nullable: true, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'school_id' })
  school!: School;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'assigned_by' })
  assignedByUser!: User;
}