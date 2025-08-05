import {
  Entity,
  Column,
  OneToMany,
  Index,
  Unique,
  PrimaryGeneratedColumn,
  CreateDateColumn,
} from 'typeorm';
import { RolePermission } from './RolePermission';

@Entity('permissions')
@Unique(['module', 'action'])
@Index(['module'])
export class Permission {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'text' })
  module!: string;

  @Column({ type: 'text' })
  action!: string;

  @Column({ type: 'text', nullable: true })
  description!: string | null;

  @CreateDateColumn({
    type: 'timestamptz',
    default: () => 'CURRENT_TIMESTAMP',
  })
  createdAt!: Date;

  // Relationships
  @OneToMany(() => RolePermission, rolePermission => rolePermission.permission)
  rolePermissions!: RolePermission[];

  // Virtual fields
  get displayName(): string {
    return `${this.module}.${this.action}`;
  }
}