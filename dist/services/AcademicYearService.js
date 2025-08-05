"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AcademicYearService = void 0;
const database_1 = require("../config/database");
const AcademicYear_1 = require("../entities/AcademicYear");
const BaseRepository_1 = require("../repositories/BaseRepository");
class AcademicYearService extends BaseRepository_1.BaseRepository {
    constructor() {
        const repository = database_1.AppDataSource.getRepository(AcademicYear_1.AcademicYear);
        super(repository);
        this.academicYearRepository = repository;
    }
    async findBySchoolId(schoolId) {
        return this.academicYearRepository.find({
            where: { schoolId },
            relations: ['school', 'classes', 'terms'],
            order: { startDate: 'DESC' }
        });
    }
    async findCurrentBySchoolId(schoolId) {
        return this.academicYearRepository.findOne({
            where: { schoolId, isCurrent: true },
            relations: ['school', 'classes', 'terms']
        });
    }
    async setCurrentAcademicYear(schoolId, academicYearId) {
        await this.academicYearRepository.update({ schoolId }, { isCurrent: false });
        await this.academicYearRepository.update({ id: academicYearId, schoolId }, { isCurrent: true });
        const academicYear = await this.academicYearRepository.findOne({
            where: { id: academicYearId },
            relations: ['school', 'classes', 'terms']
        });
        if (!academicYear) {
            throw new Error('Academic year not found');
        }
        return academicYear;
    }
    async createAcademicYear(data) {
        const academicYear = this.academicYearRepository.create(data);
        return this.academicYearRepository.save(academicYear);
    }
    async updateAcademicYear(id, data) {
        await this.academicYearRepository.update(id, data);
        const academicYear = await this.academicYearRepository.findOne({
            where: { id },
            relations: ['school', 'classes', 'terms']
        });
        if (!academicYear) {
            throw new Error('Academic year not found');
        }
        return academicYear;
    }
    async deleteAcademicYear(id) {
        const result = await this.academicYearRepository.delete(id);
        if (result.affected === 0) {
            throw new Error('Academic year not found');
        }
    }
}
exports.AcademicYearService = AcademicYearService;
//# sourceMappingURL=AcademicYearService.js.map