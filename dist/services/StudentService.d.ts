import { StudentProfile } from '../entities/StudentProfile';
import { User } from '../entities/User';
import { BaseRepository } from '../repositories/BaseRepository';
export declare class StudentService extends BaseRepository<StudentProfile> {
    private studentRepository;
    private userRepository;
    constructor();
    findBySchoolId(schoolId: string): Promise<StudentProfile[]>;
    findByClassId(classId: string): Promise<StudentProfile[]>;
    findByStudentId(studentId: string): Promise<StudentProfile | null>;
    createStudent(userData: Partial<User>, studentData: Partial<StudentProfile>): Promise<StudentProfile>;
    updateStudent(id: string, userData: Partial<User>, studentData: Partial<StudentProfile>): Promise<StudentProfile>;
    deleteStudent(id: string): Promise<void>;
    getStudentStatistics(schoolId: string): Promise<any>;
}
//# sourceMappingURL=StudentService.d.ts.map