import {
  Entity,
  Column,
  ManyToOne,
  OneToMany,
  JoinColumn,
  Index,
} from 'typeorm';
import { BaseEntity } from './base/BaseEntity';
import { User } from './User';
import { School } from './School';
import { Class } from './Class';
import { Attendance } from './Attendance';
import { Grade } from './Grade';
import { StudentFee } from './StudentFee';

@Entity('student_profiles')
@Index(['schoolId'])
@Index(['classId'])
@Index(['isActive'])
export class StudentProfile extends BaseEntity {
  @Column({ type: 'uuid', name: 'user_id' })
  userId!: string;

  @Column({ type: 'uuid', name: 'school_id' })
  schoolId!: string;

  @Column({ type: 'uuid', nullable: true, name: 'class_id' })
  classId!: string | null;

  @Column({ type: 'varchar', length: 50, name: 'student_id' })
  studentId!: string;

  @Column({ type: 'date', name: 'admission_date' })
  admissionDate!: Date;

  @Column({ type: 'date', name: 'date_of_birth' })
  dateOfBirth!: Date;

  @Column({ type: 'varchar', length: 10 })
  gender!: string;

  @Column({ type: 'varchar', length: 5, nullable: true, name: 'blood_group' })
  bloodGroup!: string | null;

  @Column({ type: 'text', nullable: true })
  address!: string | null;

  @Column({ type: 'varchar', length: 100, nullable: true, name: 'guardian_name' })
  guardianName!: string | null;

  @Column({ type: 'varchar', length: 20, nullable: true, name: 'guardian_phone' })
  guardianPhone!: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true, name: 'guardian_email' })
  guardianEmail!: string | null;

  @Column({ type: 'varchar', length: 20, nullable: true, name: 'emergency_contact' })
  emergencyContact!: string | null;

  @Column({ type: 'text', nullable: true, name: 'medical_conditions' })
  medicalConditions!: string | null;

  @Column({ type: 'boolean', default: true })
  isActive!: boolean;

  // Relationships
  @ManyToOne(() => User, user => user.studentProfile, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user!: User;

  @ManyToOne(() => School, school => school.students, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'school_id' })
  school!: School;

  @ManyToOne(() => Class, classEntity => classEntity.students, { nullable: true })
  @JoinColumn({ name: 'class_id' })
  class!: Class | null;

  @OneToMany(() => Attendance, attendance => attendance.student)
  attendanceRecords!: Attendance[];

  @OneToMany(() => Grade, grade => grade.student)
  grades!: Grade[];

  @OneToMany(() => StudentFee, fee => fee.student)
  fees!: StudentFee[];

  // Virtual fields
  get fullName(): string {
    return `${this.user.firstName} ${this.user.lastName}`;
  }

  get age(): number {
    const today = new Date();
    const birthDate = new Date(this.dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    
    return age;
  }
}