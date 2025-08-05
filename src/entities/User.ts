import {
  Entity,
  Column,
  OneToOne,
  OneToMany,
  ManyToOne,
  JoinColumn,
  Index,
  BeforeInsert,
  BeforeUpdate,
} from 'typeorm';
import { BaseEntity } from './base/BaseEntity';
import { School } from './School';
import { StudentProfile } from './StudentProfile';
import { TeacherProfile } from './TeacherProfile';
import { ParentProfile } from './ParentProfile';
import { Attendance } from './Attendance';
import { Grade } from './Grade';
import { FeePayment } from './FeePayment';
import { UserRole } from './UserRole';
import { AuditLog } from './AuditLog';
import * as bcrypt from 'bcryptjs';

@Entity('users')
@Index(['email'], { unique: true })
@Index(['isActive'])
@Index(['schoolId'])
export class User extends BaseEntity {
  @Column({ type: 'varchar', length: 100 })
  firstName!: string;

  @Column({ type: 'varchar', length: 100 })
  lastName!: string;

  @Column({ type: 'varchar', length: 255, unique: true })
  email!: string;

  @Column({ type: 'varchar', length: 255 })
  password!: string;

  @Column({ type: 'varchar', length: 20, nullable: true })
  phone!: string | null;

  @Column({ type: 'text', nullable: true })
  avatar!: string | null;

  @Column({ type: 'boolean', default: false })
  emailVerified!: boolean;

  @Column({ type: 'timestamp', nullable: true })
  emailVerifiedAt!: Date | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  resetPasswordToken!: string | null;

  @Column({ type: 'timestamp', nullable: true })
  resetPasswordExpires!: Date | null;

  @Column({ type: 'timestamp', nullable: true })
  lastLoginAt!: Date | null;

  @Column({ type: 'inet', nullable: true })
  lastLoginIp!: string | null;

  @Column({ type: 'jsonb', nullable: true })
  preferences!: any;

  @Column({ type: 'jsonb', nullable: true })
  metadata!: any;

  @Column({ type: 'uuid', nullable: true })
  schoolId!: string | null;

  @Column({ type: 'boolean', default: true })
  isActive!: boolean;

  // Relationships
  @ManyToOne(() => School, school => school.users, { nullable: true })
  @JoinColumn({ name: 'schoolId' })
  school!: School | null;

  @OneToMany(() => UserRole, userRole => userRole.user)
  userRoles!: UserRole[];

  @OneToMany(() => AuditLog, auditLog => auditLog.user)
  auditLogs!: AuditLog[];

  @OneToOne(() => StudentProfile, student => student.user)
  studentProfile!: StudentProfile;

  @OneToOne(() => TeacherProfile, teacher => teacher.user)
  teacherProfile!: TeacherProfile;

  @OneToOne(() => ParentProfile, parent => parent.user)
  parentProfile!: ParentProfile;

  @OneToMany(() => Attendance, attendance => attendance.markedByUser)
  markedAttendance!: Attendance[];

  @OneToMany(() => Grade, grade => grade.assessedByUser)
  assessedGrades!: Grade[];

  @OneToMany(() => FeePayment, payment => payment.receivedByUser)
  receivedPayments!: FeePayment[];

  // Password hashing hooks
  @BeforeInsert()
  @BeforeUpdate()
  async hashPassword() {
    if (this.password && !this.password.startsWith('$2')) {
      this.password = await bcrypt.hash(this.password, 12);
    }
  }

  // Password validation method
  async validatePassword(password: string): Promise<boolean> {
    return bcrypt.compare(password, this.password);
  }

  // Virtual fields
  get fullName(): string {
    return `${this.firstName} ${this.lastName}`;
  }

  get displayName(): string {
    return `${this.fullName}`;
  }

  // Compatibility getters for legacy code
  get lastLogin(): Date | null {
    return this.lastLoginAt;
  }

  set lastLogin(value: Date | null) {
    this.lastLoginAt = value;
  }
}