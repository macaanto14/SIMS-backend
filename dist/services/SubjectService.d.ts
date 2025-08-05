import { Subject } from '../entities/Subject';
import { BaseRepository } from '../repositories/BaseRepository';
export declare class SubjectService extends BaseRepository<Subject> {
    private subjectRepository;
    constructor();
    findBySchoolId(schoolId: string): Promise<Subject[]>;
    findByCode(schoolId: string, code: string): Promise<Subject | null>;
    createSubject(data: Partial<Subject>): Promise<Subject>;
    updateSubject(id: string, data: Partial<Subject>): Promise<Subject>;
    deleteSubject(id: string): Promise<void>;
}
//# sourceMappingURL=SubjectService.d.ts.map