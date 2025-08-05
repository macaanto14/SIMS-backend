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
export declare class TimetableService extends BaseRepository<Timetable> {
    private timetableRepository;
    constructor();
    findByClassId(classId: string): Promise<Timetable[]>;
    findByTeacherId(teacherId: string): Promise<Timetable[]>;
    findByDayAndTime(dayOfWeek: number, startTime: string, endTime: string): Promise<Timetable[]>;
    checkTeacherAvailability(teacherId: string, dayOfWeek: number, startTime: string, endTime: string, excludeId?: string): Promise<boolean>;
    getWeeklySchedule(classId: string): Promise<WeeklySchedule>;
}
export {};
//# sourceMappingURL=TimetableService.d.ts.map