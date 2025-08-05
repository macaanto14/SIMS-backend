import {
  Entity,
  Column,
  OneToMany,
  ManyToOne,
  JoinColumn,
  Index,
  BeforeInsert,
  BeforeUpdate,
} from 'typeorm';
import { BaseEntity } from './base/BaseEntity';
import { School } from './School';
import { UserRole } from './UserRole';
import { TeacherProfile } from './TeacherProfile';
import { StudentProfile } from './StudentProfile';
import { ParentProfile } from './ParentProfile';
import { AuditLog } from './AuditLog';
import * as bcrypt from 'bcryptjs';

@Entity('users')
@Index(['email'], { unique: true })
@Index(['isActive'])
@Index(['schoolId'])
export class User extends BaseEntity {
  @Column({ type: 'varchar', length: 255, unique: true })
  email!: string;

  @Column({ name: 'password_hash', type: 'text' })
  password!: string;

  @Column({ name: 'first_name', type: 'text' })
  firstName!: string;

  @Column({ name: 'last_name', type: 'text' })
  lastName!: string;

  @Column({ type: 'text', nullable: true })
  phone!: string | null;

  @Column({ name: 'avatar_url', type: 'text', nullable: true })
  avatar!: string | null;

  @Column({ name: 'is_active', type: 'boolean', default: true })
  isActive!: boolean;

  @Column({ name: 'last_login_at', type: 'timestamptz', nullable: true })
  lastLoginAt!: Date | null;

  @Column({ name: 'created_at', type: 'timestamptz', default: () => 'now()' })
  createdAt!: Date;

  @Column({ name: 'updated_at', type: 'timestamptz', default: () => 'now()' })
  updatedAt!: Date;

  // Relationships
  @Column({ type: 'uuid', nullable: true })
  schoolId!: string | null;

  @ManyToOne(() => School, school => school.users, { nullable: true })
  @JoinColumn({ name: 'school_id' })
  school!: School | null;

  @OneToMany(() => UserRole, userRole => userRole.user, { cascade: true })
  userRoles!: UserRole[];

  @OneToMany(() => TeacherProfile, profile => profile.user)
  teacherProfile!: TeacherProfile[];

  @OneToMany(() => StudentProfile, profile => profile.user)
  studentProfile!: StudentProfile[];

  @OneToMany(() => ParentProfile, profile => profile.user)
  parentProfile!: ParentProfile[];

  @OneToMany(() => AuditLog, auditLog => auditLog.user)
  auditLogs!: AuditLog[];

  // Virtual fields
  get fullName(): string {
    return `${this.firstName} ${this.lastName}`.trim();
  }

  get displayName(): string {
    return this.fullName || this.email;
  }

  // Password hashing
  @BeforeInsert()
  @BeforeUpdate()
  async hashPassword() {
    if (this.password && !this.password.startsWith('$2')) {
      this.password = await bcrypt.hash(this.password, 12);
    }
  }

  // Methods
  async validatePassword(password: string): Promise<boolean> {
    return bcrypt.compare(password, this.password);
  }

  toJSON() {
    const { password, ...result } = this;
    return result;
  }
}