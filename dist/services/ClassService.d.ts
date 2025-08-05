import { Class } from '../entities/Class';
import { BaseRepository } from '../repositories/BaseRepository';
export declare class ClassService extends BaseRepository<Class> {
    private classRepository;
    constructor();
    findBySchoolId(schoolId: string): Promise<Class[]>;
    findByAcademicYearId(academicYearId: string): Promise<Class[]>;
    findByGradeLevel(schoolId: string, gradeLevel: number): Promise<Class[]>;
    createClass(data: Partial<Class>): Promise<Class>;
    updateClass(id: string, data: Partial<Class>): Promise<Class>;
    deleteClass(id: string): Promise<void>;
    getClassStatistics(schoolId: string): Promise<any>;
}
//# sourceMappingURL=ClassService.d.ts.map