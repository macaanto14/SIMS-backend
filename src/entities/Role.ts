import {
  Entity,
  Column,
  OneToMany,
  Index,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { UserRole } from './UserRole';
import { RolePermission } from './RolePermission';

@Entity('roles')
@Index(['name'], { unique: true })
export class Role {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'text', unique: true })
  name!: string;

  @Column({ type: 'text' })
  description!: string;

  @Column({ type: 'boolean', default: false })
  isSystemRole!: boolean;

  @CreateDateColumn({
    type: 'timestamptz',
    default: () => 'CURRENT_TIMESTAMP',
  })
  createdAt!: Date;

  @UpdateDateColumn({
    type: 'timestamptz',
    default: () => 'CURRENT_TIMESTAMP',
  })
  updatedAt!: Date;

  // Relationships
  @OneToMany(() => UserRole, userRole => userRole.role)
  userRoles!: UserRole[];

  @OneToMany(() => RolePermission, rolePermission => rolePermission.role)
  rolePermissions!: RolePermission[];

  // Virtual fields
  get displayName(): string {
    return this.name.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  }
}