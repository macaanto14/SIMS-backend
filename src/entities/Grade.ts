import {
  Entity,
  Column,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { BaseEntity } from './base/BaseEntity';
import { StudentProfile } from './StudentProfile';
import { Subject } from './Subject';
import { Term } from './Term';
import { User } from './User';

@Entity('grades')
@Index(['studentId'])
@Index(['subjectId'])
@Index(['termId'])
export class Grade extends BaseEntity {
  @Column({ type: 'uuid', name: 'student_id' })
  studentId!: string;

  @Column({ type: 'uuid', name: 'subject_id' })
  subjectId!: string;

  @Column({ type: 'uuid', name: 'term_id' })
  termId!: string;

  @Column({ type: 'text', name: 'assessment_type' })
  assessmentType!: string;

  @Column({ type: 'text', name: 'assessment_name' })
  assessmentName!: string;

  @Column({ type: 'numeric', name: 'marks_obtained' })
  marksObtained!: number;

  @Column({ type: 'numeric', name: 'total_marks' })
  totalMarks!: number;

  @Column({ type: 'text', nullable: true })
  grade!: string | null;

  @Column({ type: 'text', nullable: true })
  remarks!: string | null;

  @Column({ type: 'uuid', name: 'assessed_by' })
  assessedBy!: string;

  @Column({ type: 'date', name: 'assessment_date' })
  assessmentDate!: Date;

  // Relationships
  @ManyToOne(() => StudentProfile, student => student.grades)
  @JoinColumn({ name: 'student_id' })
  student!: StudentProfile;

  @ManyToOne(() => Subject, subject => subject.grades)
  @JoinColumn({ name: 'subject_id' })
  subject!: Subject;

  @ManyToOne(() => Term, term => term.grades)
  @JoinColumn({ name: 'term_id' })
  term!: Term;

  @ManyToOne(() => User, user => user.assessedGrades)
  @JoinColumn({ name: 'assessed_by' })
  assessedByUser!: User;

  // Virtual fields
  get percentage(): number {
    return this.totalMarks > 0 ? (this.marksObtained / this.totalMarks) * 100 : 0;
  }

  get isPassing(): boolean {
    return this.percentage >= 50; // Assuming 50% is passing
  }
}