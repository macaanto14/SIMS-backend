import { Attendance } from '../entities/Attendance';
import { BaseRepository } from '../repositories/BaseRepository';
export declare class AttendanceService extends BaseRepository<Attendance> {
    private attendanceRepository;
    constructor();
    findByStudentId(studentId: string): Promise<Attendance[]>;
    findByClassAndDate(classId: string, date: Date): Promise<Attendance[]>;
    markAttendance(attendanceData: {
        studentId: string;
        classId: string;
        date: Date;
        status: 'present' | 'absent' | 'late' | 'excused';
        markedBy: string;
        notes?: string;
    }): Promise<Attendance>;
    getAttendanceStatistics(classId: string, startDate: Date, endDate: Date): Promise<any>;
}
//# sourceMappingURL=AttendanceService.d.ts.map