import { Grade } from '../entities/Grade';
import { BaseRepository } from '../repositories/BaseRepository';
export declare class GradeService extends BaseRepository<Grade> {
    private gradeRepository;
    constructor();
    findByStudentId(studentId: string): Promise<Grade[]>;
    findByStudentAndTerm(studentId: string, termId: string): Promise<Grade[]>;
    findBySubjectAndTerm(subjectId: string, termId: string): Promise<Grade[]>;
    calculateTermGPA(studentId: string, termId: string): Promise<number>;
    getClassGradeStatistics(classId: string, termId: string): Promise<any>;
}
//# sourceMappingURL=GradeService.d.ts.map