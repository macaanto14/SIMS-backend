"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TeacherService = void 0;
const database_1 = require("../config/database");
const TeacherProfile_1 = require("../entities/TeacherProfile");
const User_1 = require("../entities/User");
const BaseRepository_1 = require("../repositories/BaseRepository");
class TeacherService extends BaseRepository_1.BaseRepository {
    constructor() {
        const repository = database_1.AppDataSource.getRepository(TeacherProfile_1.TeacherProfile);
        super(repository);
        this.teacherRepository = repository;
        this.userRepository = database_1.AppDataSource.getRepository(User_1.User);
    }
    async findBySchoolId(schoolId) {
        return this.teacherRepository.find({
            where: { schoolId, isActive: true },
            relations: ['user', 'school'],
            order: { hireDate: 'DESC' }
        });
    }
    async findByEmployeeId(employeeId) {
        return this.teacherRepository.findOne({
            where: { employeeId },
            relations: ['user', 'school']
        });
    }
    async findBySpecialization(schoolId, specialization) {
        return this.teacherRepository.find({
            where: { schoolId, specialization, isActive: true },
            relations: ['user', 'school'],
            order: { user: { firstName: 'ASC' } }
        });
    }
    async createTeacher(userData, teacherData) {
        const user = this.userRepository.create(userData);
        const savedUser = await this.userRepository.save(user);
        const teacher = this.teacherRepository.create({
            ...teacherData,
            userId: savedUser.id
        });
        return this.teacherRepository.save(teacher);
    }
    async updateTeacher(id, userData, teacherData) {
        const teacher = await this.teacherRepository.findOne({
            where: { id },
            relations: ['user']
        });
        if (!teacher) {
            throw new Error('Teacher not found');
        }
        if (userData && Object.keys(userData).length > 0) {
            await this.userRepository.update(teacher.userId, userData);
        }
        if (teacherData && Object.keys(teacherData).length > 0) {
            await this.teacherRepository.update(id, teacherData);
        }
        return this.teacherRepository.findOne({
            where: { id },
            relations: ['user', 'school']
        });
    }
    async deleteTeacher(id) {
        await this.teacherRepository.update(id, { isActive: false });
    }
    async getTeacherStatistics(schoolId) {
        const teachers = await this.findBySchoolId(schoolId);
        const specializationDistribution = teachers.reduce((acc, teacher) => {
            const specialization = teacher.specialization || 'General';
            acc[specialization] = (acc[specialization] || 0) + 1;
            return acc;
        }, {});
        const experienceDistribution = teachers.reduce((acc, teacher) => {
            const experience = teacher.experienceYears || 0;
            const expGroup = experience < 2 ? 'Fresher' : experience < 5 ? '2-5 years' : experience < 10 ? '5-10 years' : '10+ years';
            acc[expGroup] = (acc[expGroup] || 0) + 1;
            return acc;
        }, {});
        return {
            totalTeachers: teachers.length,
            activeTeachers: teachers.filter(t => t.isActive).length,
            specializationDistribution,
            experienceDistribution,
            averageExperience: teachers.length > 0
                ? teachers.reduce((sum, t) => sum + (t.experienceYears || 0), 0) / teachers.length
                : 0
        };
    }
}
exports.TeacherService = TeacherService;
//# sourceMappingURL=TeacherService.js.map