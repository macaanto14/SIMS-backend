"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ClassService = void 0;
const database_1 = require("../config/database");
const Class_1 = require("../entities/Class");
const BaseRepository_1 = require("../repositories/BaseRepository");
class ClassService extends BaseRepository_1.BaseRepository {
    constructor() {
        const repository = database_1.AppDataSource.getRepository(Class_1.Class);
        super(repository);
        this.classRepository = repository;
    }
    async findBySchoolId(schoolId) {
        return this.classRepository.find({
            where: { schoolId, isActive: true },
            relations: ['school', 'academicYear', 'students'],
            order: { gradeLevel: 'ASC', name: 'ASC' }
        });
    }
    async findByAcademicYearId(academicYearId) {
        return this.classRepository.find({
            where: { academicYearId, isActive: true },
            relations: ['school', 'academicYear', 'students'],
            order: { gradeLevel: 'ASC', name: 'ASC' }
        });
    }
    async findByGradeLevel(schoolId, gradeLevel) {
        return this.classRepository.find({
            where: { schoolId, gradeLevel, isActive: true },
            relations: ['school', 'academicYear', 'students'],
            order: { name: 'ASC' }
        });
    }
    async createClass(data) {
        const classEntity = this.classRepository.create(data);
        return this.classRepository.save(classEntity);
    }
    async updateClass(id, data) {
        await this.classRepository.update(id, data);
        const classEntity = await this.classRepository.findOne({
            where: { id },
            relations: ['school', 'academicYear', 'students']
        });
        if (!classEntity) {
            throw new Error('Class not found');
        }
        return classEntity;
    }
    async deleteClass(id) {
        await this.classRepository.update(id, { isActive: false });
    }
    async getClassStatistics(schoolId) {
        const classes = await this.findBySchoolId(schoolId);
        return {
            totalClasses: classes.length,
            totalStudents: classes.reduce((sum, cls) => sum + cls.currentEnrollment, 0),
            averageClassSize: classes.length > 0
                ? classes.reduce((sum, cls) => sum + cls.currentEnrollment, 0) / classes.length
                : 0,
            gradeDistribution: classes.reduce((acc, cls) => {
                acc[cls.gradeLevel] = (acc[cls.gradeLevel] || 0) + 1;
                return acc;
            }, {})
        };
    }
}
exports.ClassService = ClassService;
//# sourceMappingURL=ClassService.js.map