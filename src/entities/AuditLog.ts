import {
  Entity,
  Column,
  ManyToOne,
  JoinColumn,
  Index,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  BeforeInsert,
} from 'typeorm';
import { User } from './User';
import { School } from './School';
import { v4 as uuidv4 } from 'uuid';

export enum OperationType {
  CREATE = 'CREATE',
  UPDATE = 'UPDATE',
  DELETE = 'DELETE',
  LOGIN = 'LOGIN',
  LOGOUT = 'LOGOUT',
  ACCESS = 'ACCESS',
}

@Entity('audit_logs')
@Index(['operationType'])
@Index(['tableName'])
@Index(['userId'])
@Index(['schoolId'])
@Index(['createdAt'])
export class AuditLog {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({
    name: 'operation_type',
    type: 'enum',
    enum: OperationType,
  })
  operationType!: OperationType;

  @Column({ name: 'table_name', type: 'varchar', length: 100 })
  tableName!: string;

  @Column({ name: 'record_id', type: 'uuid', nullable: true })
  recordId!: string | null;

  @Column({ name: 'user_email', type: 'varchar', length: 255, nullable: true })
  userEmail!: string | null;

  @Column({ name: 'user_role', type: 'varchar', length: 100, nullable: true })
  userRole!: string | null;

  @Column({ name: 'ip_address', type: 'inet', nullable: true })
  ipAddress!: string | null;

  @Column({ name: 'user_agent', type: 'text', nullable: true })
  userAgent!: string | null;

  @Column({ type: 'varchar', length: 100, nullable: true })
  module!: string | null;

  @Column({ type: 'varchar', length: 100, nullable: true })
  action!: string | null;

  @Column({ type: 'text', nullable: true })
  description!: string | null;

  @Column({ name: 'old_values', type: 'jsonb', nullable: true })
  oldValues!: Record<string, any> | null;

  @Column({ name: 'new_values', type: 'jsonb', nullable: true })
  newValues!: Record<string, any> | null;

  @Column({ name: 'changed_fields', type: 'text', array: true, nullable: true })
  changedFields!: string[] | null;

  @Column({ type: 'boolean', default: true })
  success!: boolean;

  @Column({ name: 'error_message', type: 'text', nullable: true })
  errorMessage!: string | null;

  @Column({ name: 'duration_ms', type: 'integer', nullable: true })
  durationMs!: number | null;

  @Column({ name: 'request_id', type: 'varchar', length: 100, nullable: true })
  requestId!: string | null;

  @Column({ name: 'session_id', type: 'varchar', length: 100, nullable: true })
  sessionId!: string | null;

  @Column({ name: 'school_name', type: 'varchar', length: 255, nullable: true })
  schoolName!: string | null;

  @Column({ name: 'fields_changed', type: 'integer', default: 0 })
  fieldsChanged!: number;

  @CreateDateColumn({
    type: 'timestamptz',
    default: () => 'CURRENT_TIMESTAMP',
  })
  createdAt!: Date;

  // Relationships
  @Column({ name: 'user_id', type: 'uuid', nullable: true })
  userId!: string | null;

  @Column({ name: 'school_id', type: 'uuid', nullable: true })
  schoolId!: string | null;

  @ManyToOne(() => User, user => user.auditLogs, { nullable: true })
  @JoinColumn({ name: 'user_id' })
  user!: User | null;

  @ManyToOne(() => School, { nullable: true })
  @JoinColumn({ name: 'school_id' })
  school!: School | null;

  @BeforeInsert()
  generateId() {
    if (!this.id) {
      this.id = uuidv4();
    }
  }
}