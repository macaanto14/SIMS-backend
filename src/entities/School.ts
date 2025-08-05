import {
  Entity,
  Column,
  OneToMany,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { BaseEntity } from './base/BaseEntity';
import { User } from './User';
import { Class } from './Class';
import { AcademicYear } from './AcademicYear';
import { TeacherProfile } from './TeacherProfile';
import { StudentProfile } from './StudentProfile';
import { ParentProfile } from './ParentProfile';

@Entity('schools')
@Index(['isActive'])
export class School extends BaseEntity {
  @Column({ type: 'text' })
  name!: string;

  @Column({ type: 'text', unique: true })
  code!: string;

  @Column({ type: 'text', nullable: true })
  address!: string | null;

  @Column({ type: 'text', nullable: true })
  phone!: string | null;

  @Column({ type: 'text', nullable: true })
  email!: string | null;

  @Column({ type: 'text', nullable: true })
  website!: string | null;

  @Column({ name: 'logo_url', type: 'text', nullable: true })
  logoUrl!: string | null;

  @Column({ name: 'principal_id', type: 'uuid', nullable: true })
  principalId!: string | null;

  @Column({ name: 'is_active', type: 'boolean', default: true })
  isActive!: boolean;

  @Column({ type: 'jsonb', default: '{}' })
  settings!: Record<string, any>;

  // Relationships
  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'principal_id' })
  principal!: User | null;

  @OneToMany(() => User, user => user.school)
  users!: User[];

  @OneToMany(() => Class, classEntity => classEntity.school)
  classes!: Class[];

  @OneToMany(() => AcademicYear, academicYear => academicYear.school)
  academicYears!: AcademicYear[];

  @OneToMany(() => TeacherProfile, profile => profile.school)
  teacherProfiles!: TeacherProfile[];

  @OneToMany(() => StudentProfile, profile => profile.school)
  studentProfiles!: StudentProfile[];

  @OneToMany(() => ParentProfile, profile => profile.school)
  parentProfiles!: ParentProfile[];

  // Virtual fields
  get displayName(): string {
    return this.name;
  }
}