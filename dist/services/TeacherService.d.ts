import { TeacherProfile } from '../entities/TeacherProfile';
import { User } from '../entities/User';
import { BaseRepository } from '../repositories/BaseRepository';
export declare class TeacherService extends BaseRepository<TeacherProfile> {
    private teacherRepository;
    private userRepository;
    constructor();
    findBySchoolId(schoolId: string): Promise<TeacherProfile[]>;
    findByEmployeeId(employeeId: string): Promise<TeacherProfile | null>;
    findBySpecialization(schoolId: string, specialization: string): Promise<TeacherProfile[]>;
    createTeacher(userData: Partial<User>, teacherData: Partial<TeacherProfile>): Promise<TeacherProfile>;
    updateTeacher(id: string, userData: Partial<User>, teacherData: Partial<TeacherProfile>): Promise<TeacherProfile>;
    deleteTeacher(id: string): Promise<void>;
    getTeacherStatistics(schoolId: string): Promise<any>;
}
//# sourceMappingURL=TeacherService.d.ts.map