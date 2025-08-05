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
import { Subject } from './Subject';
import { FeeStructure } from './FeeStructure';

@Entity('schools')
@Index(['isActive'])
@Index(['code'], { unique: true })
export class School extends BaseEntity {
  @Column({ type: 'varchar', length: 255 })
  name!: string;

  @Column({ type: 'varchar', length: 50 })
  code!: string;

  @Column({ type: 'text', nullable: true })
  address!: string | null;

  @Column({ type: 'varchar', length: 20, nullable: true })
  phone!: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  email!: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  website!: string | null;

  @Column({ type: 'text', nullable: true })
  logoUrl!: string | null;

  @Column({ type: 'text', nullable: true })
  description!: string | null;

  @Column({ type: 'varchar', length: 100, nullable: true })
  establishedYear!: string | null;

  @Column({ type: 'varchar', length: 100, nullable: true })
  principalName!: string | null;

  @Column({ type: 'uuid', nullable: true })
  principalId!: string | null;

  @Column({ type: 'jsonb', default: '{}' })
  settings!: any;

  @Column({ type: 'jsonb', default: '{}' })
  metadata!: any;

  @Column({ type: 'boolean', default: true })
  isActive!: boolean;

  // Relationships
  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'principalId' })
  principal!: User | null;

  @OneToMany(() => User, user => user.school)
  users!: User[];

  @OneToMany(() => Class, classEntity => classEntity.school)
  classes!: Class[];

  @OneToMany(() => AcademicYear, academicYear => academicYear.school)
  academicYears!: AcademicYear[];

  @OneToMany(() => TeacherProfile, teacher => teacher.school)
  teachers!: TeacherProfile[];

  @OneToMany(() => StudentProfile, student => student.school)
  students!: StudentProfile[];

  @OneToMany(() => ParentProfile, parent => parent.school)
  parents!: ParentProfile[];

  @OneToMany(() => ParentProfile, parent => parent.school)
  parentProfiles!: ParentProfile[];

  @OneToMany(() => Subject, subject => subject.school)
  subjects!: Subject[];

  @OneToMany(() => FeeStructure, feeStructure => feeStructure.school)
  feeStructures!: FeeStructure[];

  // Virtual fields
  get displayName(): string {
    return this.name;
  }
}