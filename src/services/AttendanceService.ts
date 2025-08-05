import { Repository } from 'typeorm';
import { AppDataSource } from '../config/database';
import { Attendance } from '../entities/Attendance';
import { BaseRepository } from '../repositories/BaseRepository';

export class AttendanceService extends BaseRepository<Attendance> {
  private attendanceRepository: Repository<Attendance>;

  constructor() {
    const repository = AppDataSource.getRepository(Attendance);
    super(repository);
    this.attendanceRepository = repository;
  }

  async findByStudentId(studentId: string): Promise<Attendance[]> {
    return this.attendanceRepository.find({
      where: { studentId },
      relations: ['student', 'class', 'markedByUser'],
      order: { date: 'DESC' }
    });
  }

  async findByClassAndDate(classId: string, date: Date): Promise<Attendance[]> {
    return this.attendanceRepository.find({
      where: { classId, date },
      relations: ['student', 'markedByUser'],
      order: { student: { user: { firstName: 'ASC' } } }
    });
  }

  async markAttendance(attendanceData: {
    studentId: string;
    classId: string;
    date: Date;
    status: 'present' | 'absent' | 'late' | 'excused';
    markedBy: string;
    notes?: string;
  }): Promise<Attendance> {
    const existingAttendance = await this.attendanceRepository.findOne({
      where: {
        studentId: attendanceData.studentId,
        date: attendanceData.date
      }
    });

    if (existingAttendance) {
      await this.attendanceRepository.update(existingAttendance.id, {
        status: attendanceData.status,
        notes: attendanceData.notes,
        markedBy: attendanceData.markedBy
      });
      const updatedAttendance = await this.findById(existingAttendance.id);
      if (!updatedAttendance) {
        throw new Error('Failed to retrieve updated attendance record');
      }
      return updatedAttendance;
    }

    return this.create(attendanceData);
  }

  async getAttendanceStatistics(classId: string, startDate: Date, endDate: Date): Promise<any> {
    const attendance = await this.attendanceRepository
      .createQueryBuilder('attendance')
      .leftJoin('attendance.student', 'student')
      .leftJoin('student.user', 'user')
      .where('attendance.classId = :classId', { classId })
      .andWhere('attendance.date BETWEEN :startDate AND :endDate', { startDate, endDate })
      .select([
        'student.id as studentId',
        'user.firstName as firstName',
        'user.lastName as lastName',
        'COUNT(*) as totalDays',
        'SUM(CASE WHEN attendance.status = \'present\' THEN 1 ELSE 0 END) as presentDays',
        'SUM(CASE WHEN attendance.status = \'absent\' THEN 1 ELSE 0 END) as absentDays',
        'SUM(CASE WHEN attendance.status = \'late\' THEN 1 ELSE 0 END) as lateDays'
      ])
      .groupBy('student.id, user.firstName, user.lastName')
      .getRawMany();

    return attendance.map(record => ({
      ...record,
      attendancePercentage: record.totalDays > 0 ? (record.presentDays / record.totalDays) * 100 : 0
    }));
  }
}