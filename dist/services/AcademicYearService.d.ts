import { AcademicYear } from '../entities/AcademicYear';
import { BaseRepository } from '../repositories/BaseRepository';
export declare class AcademicYearService extends BaseRepository<AcademicYear> {
    private academicYearRepository;
    constructor();
    findBySchoolId(schoolId: string): Promise<AcademicYear[]>;
    findCurrentBySchoolId(schoolId: string): Promise<AcademicYear | null>;
    setCurrentAcademicYear(schoolId: string, academicYearId: string): Promise<AcademicYear>;
    createAcademicYear(data: Partial<AcademicYear>): Promise<AcademicYear>;
    updateAcademicYear(id: string, data: Partial<AcademicYear>): Promise<AcademicYear>;
    deleteAcademicYear(id: string): Promise<void>;
}
//# sourceMappingURL=AcademicYearService.d.ts.map