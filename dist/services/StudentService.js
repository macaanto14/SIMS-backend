"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.StudentService = void 0;
const database_1 = require("../config/database");
const StudentProfile_1 = require("../entities/StudentProfile");
const User_1 = require("../entities/User");
const BaseRepository_1 = require("../repositories/BaseRepository");
class StudentService extends BaseRepository_1.BaseRepository {
    constructor() {
        const repository = database_1.AppDataSource.getRepository(StudentProfile_1.StudentProfile);
        super(repository);
        this.studentRepository = repository;
        this.userRepository = database_1.AppDataSource.getRepository(User_1.User);
    }
    async findBySchoolId(schoolId) {
        return this.studentRepository.find({
            where: { schoolId, isActive: true },
            relations: ['user', 'school', 'class'],
            order: { admissionDate: 'DESC' }
        });
    }
    async findByClassId(classId) {
        return this.studentRepository.find({
            where: { class: { id: classId }, isActive: true },
            relations: ['user', 'school', 'class'],
            order: { user: { firstName: 'ASC' } }
        });
    }
    async findByStudentId(studentId) {
        return this.studentRepository.findOne({
            where: { studentId },
            relations: ['user', 'school', 'class']
        });
    }
    async createStudent(userData, studentData) {
        const user = this.userRepository.create(userData);
        const savedUser = await this.userRepository.save(user);
        const student = this.studentRepository.create({
            ...studentData,
            userId: savedUser.id
        });
        return this.studentRepository.save(student);
    }
    async updateStudent(id, userData, studentData) {
        const student = await this.studentRepository.findOne({
            where: { id },
            relations: ['user']
        });
        if (!student) {
            throw new Error('Student not found');
        }
        if (userData && Object.keys(userData).length > 0) {
            await this.userRepository.update(student.userId, userData);
        }
        if (studentData && Object.keys(studentData).length > 0) {
            await this.studentRepository.update(id, studentData);
        }
        return this.studentRepository.findOne({
            where: { id },
            relations: ['user', 'school', 'class']
        });
    }
    async deleteStudent(id) {
        await this.studentRepository.update(id, { isActive: false });
    }
    async getStudentStatistics(schoolId) {
        const students = await this.findBySchoolId(schoolId);
        const genderDistribution = students.reduce((acc, student) => {
            const gender = student.gender || 'unknown';
            acc[gender] = (acc[gender] || 0) + 1;
            return acc;
        }, {});
        const ageDistribution = students.reduce((acc, student) => {
            const age = student.age;
            const ageGroup = age < 6 ? 'Under 6' : age < 12 ? '6-11' : age < 18 ? '12-17' : '18+';
            acc[ageGroup] = (acc[ageGroup] || 0) + 1;
            return acc;
        }, {});
        return {
            totalStudents: students.length,
            activeStudents: students.filter(s => s.isActive).length,
            genderDistribution,
            ageDistribution,
            averageAge: students.length > 0
                ? students.reduce((sum, s) => sum + s.age, 0) / students.length
                : 0
        };
    }
}
exports.StudentService = StudentService;
//# sourceMappingURL=StudentService.js.map