"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SubjectService = void 0;
const database_1 = require("../config/database");
const Subject_1 = require("../entities/Subject");
const BaseRepository_1 = require("../repositories/BaseRepository");
class SubjectService extends BaseRepository_1.BaseRepository {
    constructor() {
        const repository = database_1.AppDataSource.getRepository(Subject_1.Subject);
        super(repository);
        this.subjectRepository = repository;
    }
    async findBySchoolId(schoolId) {
        return this.subjectRepository.find({
            where: { schoolId, isActive: true },
            relations: ['school'],
            order: { name: 'ASC' }
        });
    }
    async findByCode(schoolId, code) {
        return this.subjectRepository.findOne({
            where: { schoolId, code },
            relations: ['school']
        });
    }
    async createSubject(data) {
        const subject = this.subjectRepository.create(data);
        return this.subjectRepository.save(subject);
    }
    async updateSubject(id, data) {
        await this.subjectRepository.update(id, data);
        const subject = await this.subjectRepository.findOne({
            where: { id },
            relations: ['school']
        });
        if (!subject) {
            throw new Error('Subject not found');
        }
        return subject;
    }
    async deleteSubject(id) {
        await this.subjectRepository.update(id, { isActive: false });
    }
}
exports.SubjectService = SubjectService;
//# sourceMappingURL=SubjectService.js.map