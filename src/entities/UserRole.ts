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
@Index(['isActive'])
export class UserRole extends BaseEntity {
  @Column({ type: 'uuid' })
  userId!: string;

  @Column({ type: 'uuid' })
  roleId!: string;

  @Column({ type: 'uuid', nullable: true })
  schoolId!: string | null;

  @Column({ type: 'uuid', nullable: true })
  assignedBy!: string | null;

  @Column({ type: 'timestamptz', nullable: true })
  assignedAt!: Date | null;

  @Column({ type: 'timestamptz', nullable: true })
  expiresAt!: Date | null;

  @Column({ type: 'boolean', default: true })
  isActive!: boolean;

  // Relationships
  @ManyToOne(() => User, user => user.userRoles, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user!: User;

  @ManyToOne(() => Role, role => role.userRoles, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'roleId' })
  role!: Role;

  @ManyToOne(() => School, { nullable: true, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'schoolId' })
  school!: School | null;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'assignedBy' })
  assignedByUser!: User | null;
}