"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GradeService = void 0;
const database_1 = require("../config/database");
const Grade_1 = require("../entities/Grade");
const BaseRepository_1 = require("../repositories/BaseRepository");
class GradeService extends BaseRepository_1.BaseRepository {
    constructor() {
        const repository = database_1.AppDataSource.getRepository(Grade_1.Grade);
        super(repository);
        this.gradeRepository = repository;
    }
    async findByStudentId(studentId) {
        return this.gradeRepository.find({
            where: { studentId },
            relations: ['subject', 'term', 'assessedByUser'],
            order: { assessmentDate: 'DESC' }
        });
    }
    async findByStudentAndTerm(studentId, termId) {
        return this.gradeRepository.find({
            where: { studentId, termId },
            relations: ['subject', 'assessedByUser'],
            order: { subject: { name: 'ASC' } }
        });
    }
    async findBySubjectAndTerm(subjectId, termId) {
        return this.gradeRepository.find({
            where: { subjectId, termId },
            relations: ['student', 'assessedByUser'],
            order: { student: { user: { firstName: 'ASC' } } }
        });
    }
    async calculateTermGPA(studentId, termId) {
        const grades = await this.findByStudentAndTerm(studentId, termId);
        if (grades.length === 0)
            return 0;
        const totalPoints = grades.reduce((sum, grade) => sum + grade.percentage, 0);
        return totalPoints / grades.length;
    }
    async getClassGradeStatistics(classId, termId) {
        const grades = await this.gradeRepository
            .createQueryBuilder('grade')
            .leftJoin('grade.student', 'student')
            .leftJoin('student.class', 'class')
            .leftJoin('grade.subject', 'subject')
            .where('class.id = :classId', { classId })
            .andWhere('grade.termId = :termId', { termId })
            .select([
            'subject.name as subjectName',
            'AVG(grade.marksObtained / grade.totalMarks * 100) as averagePercentage',
            'MAX(grade.marksObtained / grade.totalMarks * 100) as highestPercentage',
            'MIN(grade.marksObtained / grade.totalMarks * 100) as lowestPercentage',
            'COUNT(*) as totalStudents'
        ])
            .groupBy('subject.id, subject.name')
            .getRawMany();
        return grades;
    }
}
exports.GradeService = GradeService;
//# sourceMappingURL=GradeService.js.map