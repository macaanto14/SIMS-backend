import {
  Entity,
  Column,
  ManyToOne,
  OneToMany,
  JoinColumn,
  Index,
} from 'typeorm';
import { BaseEntity } from './base/BaseEntity';
import { School } from './School';
import { Grade } from './Grade';
import { Timetable } from './Timetable';

@Entity('subjects')
@Index(['schoolId'])
@Index(['isActive'])
export class Subject extends BaseEntity {
  @Column({ type: 'uuid', name: 'school_id' })
  schoolId!: string;

  @Column({ type: 'varchar', length: 100 })
  name!: string;

  @Column({ type: 'varchar', length: 20, nullable: true })
  code!: string | null;

  @Column({ type: 'text', nullable: true })
  description!: string | null;

  @Column({ type: 'boolean', default: true, name: 'is_active' })
  isActive!: boolean;

  // Relationships
  @ManyToOne(() => School, school => school.subjects, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'school_id' })
  school!: School;

  @OneToMany(() => Grade, grade => grade.subject)
  grades!: Grade[];

  @OneToMany(() => Timetable, timetable => timetable.subject)
  timetables!: Timetable[];

  // Virtual fields
  get displayName(): string {
    return this.code ? `${this.name} (${this.code})` : this.name;
  }
}