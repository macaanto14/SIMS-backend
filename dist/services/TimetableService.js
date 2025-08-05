"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TimetableService = void 0;
const database_1 = require("../config/database");
const Timetable_1 = require("../entities/Timetable");
const BaseRepository_1 = require("../repositories/BaseRepository");
class TimetableService extends BaseRepository_1.BaseRepository {
    constructor() {
        const repository = database_1.AppDataSource.getRepository(Timetable_1.Timetable);
        super(repository);
        this.timetableRepository = repository;
    }
    async findByClassId(classId) {
        return this.timetableRepository.find({
            where: { classId, isActive: true },
            relations: ['subject', 'teacher', 'teacher.user'],
            order: { dayOfWeek: 'ASC', startTime: 'ASC' }
        });
    }
    async findByTeacherId(teacherId) {
        return this.timetableRepository.find({
            where: { teacherId, isActive: true },
            relations: ['class', 'subject'],
            order: { dayOfWeek: 'ASC', startTime: 'ASC' }
        });
    }
    async findByDayAndTime(dayOfWeek, startTime, endTime) {
        return this.timetableRepository
            .createQueryBuilder('timetable')
            .where('timetable.dayOfWeek = :dayOfWeek', { dayOfWeek })
            .andWhere('timetable.isActive = true')
            .andWhere('(timetable.startTime <= :startTime AND timetable.endTime > :startTime) OR ' +
            '(timetable.startTime < :endTime AND timetable.endTime >= :endTime) OR ' +
            '(timetable.startTime >= :startTime AND timetable.endTime <= :endTime)', { startTime, endTime })
            .leftJoinAndSelect('timetable.class', 'class')
            .leftJoinAndSelect('timetable.subject', 'subject')
            .leftJoinAndSelect('timetable.teacher', 'teacher')
            .getMany();
    }
    async checkTeacherAvailability(teacherId, dayOfWeek, startTime, endTime, excludeId) {
        const query = this.timetableRepository
            .createQueryBuilder('timetable')
            .where('timetable.teacherId = :teacherId', { teacherId })
            .andWhere('timetable.dayOfWeek = :dayOfWeek', { dayOfWeek })
            .andWhere('timetable.isActive = true')
            .andWhere('(timetable.startTime <= :startTime AND timetable.endTime > :startTime) OR ' +
            '(timetable.startTime < :endTime AND timetable.endTime >= :endTime) OR ' +
            '(timetable.startTime >= :startTime AND timetable.endTime <= :endTime)', { startTime, endTime });
        if (excludeId) {
            query.andWhere('timetable.id != :excludeId', { excludeId });
        }
        const conflictingSlots = await query.getCount();
        return conflictingSlots === 0;
    }
    async getWeeklySchedule(classId) {
        const timetable = await this.findByClassId(classId);
        const schedule = {
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
exports.TimetableService = TimetableService;
//# sourceMappingURL=TimetableService.js.map