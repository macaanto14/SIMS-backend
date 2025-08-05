import { Repository } from 'typeorm';
import { AppDataSource } from '../config/database';
import { Timetable } from '../entities/Timetable';
import { BaseRepository } from '../repositories/BaseRepository';

interface WeeklySchedule {
  [key: string]: any[];
  Monday: any[];
  Tuesday: any[];
  Wednesday: any[];
  Thursday: any[];
  Friday: any[];
  Saturday: any[];
  Sunday: any[];
}

export class TimetableService extends BaseRepository<Timetable> {
  private timetableRepository: Repository<Timetable>;

  constructor() {
    const repository = AppDataSource.getRepository(Timetable);
    super(repository);
    this.timetableRepository = repository;
  }

  async findByClassId(classId: string): Promise<Timetable[]> {
    return this.timetableRepository.find({
      where: { classId, isActive: true },
      relations: ['subject', 'teacher', 'teacher.user'],
      order: { dayOfWeek: 'ASC', startTime: 'ASC' }
    });
  }

  async findByTeacherId(teacherId: string): Promise<Timetable[]> {
    return this.timetableRepository.find({
      where: { teacherId, isActive: true },
      relations: ['class', 'subject'],
      order: { dayOfWeek: 'ASC', startTime: 'ASC' }
    });
  }

  async findByDayAndTime(dayOfWeek: number, startTime: string, endTime: string): Promise<Timetable[]> {
    return this.timetableRepository
      .createQueryBuilder('timetable')
      .where('timetable.dayOfWeek = :dayOfWeek', { dayOfWeek })
      .andWhere('timetable.isActive = true')
      .andWhere(
        '(timetable.startTime <= :startTime AND timetable.endTime > :startTime) OR ' +
        '(timetable.startTime < :endTime AND timetable.endTime >= :endTime) OR ' +
        '(timetable.startTime >= :startTime AND timetable.endTime <= :endTime)',
        { startTime, endTime }
      )
      .leftJoinAndSelect('timetable.class', 'class')
      .leftJoinAndSelect('timetable.subject', 'subject')
      .leftJoinAndSelect('timetable.teacher', 'teacher')
      .getMany();
  }

  async checkTeacherAvailability(teacherId: string, dayOfWeek: number, startTime: string, endTime: string, excludeId?: string): Promise<boolean> {
    const query = this.timetableRepository
      .createQueryBuilder('timetable')
      .where('timetable.teacherId = :teacherId', { teacherId })
      .andWhere('timetable.dayOfWeek = :dayOfWeek', { dayOfWeek })
      .andWhere('timetable.isActive = true')
      .andWhere(
        '(timetable.startTime <= :startTime AND timetable.endTime > :startTime) OR ' +
        '(timetable.startTime < :endTime AND timetable.endTime >= :endTime) OR ' +
        '(timetable.startTime >= :startTime AND timetable.endTime <= :endTime)',
        { startTime, endTime }
      );

    if (excludeId) {
      query.andWhere('timetable.id != :excludeId', { excludeId });
    }

    const conflictingSlots = await query.getCount();
    return conflictingSlots === 0;
  }

  async getWeeklySchedule(classId: string): Promise<WeeklySchedule> {
    const timetable = await this.findByClassId(classId);
    
    const schedule: WeeklySchedule = {
      Monday: [],
      Tuesday: [],
      Wednesday: [],
      Thursday: [],
      Friday: [],
      Saturday: [],
      Sunday: []
    };

    const dayNames = ['', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

    timetable.forEach(slot => {
      const dayName = dayNames[slot.dayOfWeek];
      if (schedule[dayName]) {
        schedule[dayName].push({
          id: slot.id,
          subject: slot.subject.name,
          teacher: `${slot.teacher.user.firstName} ${slot.teacher.user.lastName}`,
          startTime: slot.startTime,
          endTime: slot.endTime,
          roomNumber: slot.roomNumber
        });
      }
    });

    return schedule;
  }
}