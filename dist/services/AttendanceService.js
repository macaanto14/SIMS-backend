"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AttendanceService = void 0;
const database_1 = require("../config/database");
const Attendance_1 = require("../entities/Attendance");
const BaseRepository_1 = require("../repositories/BaseRepository");
class AttendanceService extends BaseRepository_1.BaseRepository {
    constructor() {
        const repository = database_1.AppDataSource.getRepository(Attendance_1.Attendance);
        super(repository);
        this.attendanceRepository = repository;
    }
    async findByStudentId(studentId) {
        return this.attendanceRepository.find({
            where: { studentId },
            relations: ['student', 'class', 'markedByUser'],
            order: { date: 'DESC' }
        });
    }
    async findByClassAndDate(classId, date) {
        return this.attendanceRepository.find({
            where: { classId, date },
            relations: ['student', 'markedByUser'],
            order: { student: { user: { firstName: 'ASC' } } }
        });
    }
    async markAttendance(attendanceData) {
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
    async getAttendanceStatistics(classId, startDate, endDate) {
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
exports.AttendanceService = AttendanceService;
//# sourceMappingURL=AttendanceService.js.map