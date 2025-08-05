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
@Index(['isActive'])
export class Role {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', length: 100, unique: true })
  name!: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  description!: string | null;

  @Column({ type: 'varchar', length: 50, nullable: true })
  level!: string | null;

  @Column({ type: 'integer', default: 0 })
  priority!: number;

  @Column({ type: 'jsonb', default: '{}' })
  metadata!: any;

  @Column({ type: 'boolean', default: true })
  isActive!: boolean;

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