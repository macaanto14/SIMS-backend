"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserRepository = void 0;
const database_1 = require("../config/database");
const User_1 = require("../entities/User");
const BaseRepository_1 = require("./BaseRepository");
class UserRepository extends BaseRepository_1.BaseRepository {
    constructor() {
        super(database_1.AppDataSource.getRepository(User_1.User));
        this.userRoleRepository = database_1.AppDataSource.getRepository('UserRole');
    }
    async findByEmail(email) {
        return this.repository.findOne({
            where: { email, isActive: true },
            relations: ['school', 'userRoles', 'userRoles.role']
        });
    }
    async findBySchool(schoolId, options) {
        const { page, limit } = options;
        return this.repository.findAndCount({
            where: { schoolId, isActive: true },
            skip: (page - 1) * limit,
            take: limit,
            order: { createdAt: 'DESC' },
            relations: ['school', 'userRoles', 'userRoles.role']
        });
    }
    async findByRole(roleName, schoolId) {
        const queryBuilder = this.repository.createQueryBuilder('user')
            .leftJoinAndSelect('user.userRoles', 'userRole')
            .leftJoinAndSelect('userRole.role', 'role')
            .leftJoinAndSelect('user.school', 'school')
            .where('user.isActive = :isActive', { isActive: true })
            .andWhere('userRole.isActive = :userRoleActive', { userRoleActive: true })
            .andWhere('role.name = :roleName', { roleName });
        if (schoolId) {
            queryBuilder.andWhere('user.schoolId = :schoolId', { schoolId });
        }
        return queryBuilder.getMany();
    }
    async updateLastLogin(userId, ipAddress) {
        await this.repository.update(userId, {
            lastLoginAt: new Date(),
            lastLoginIp: ipAddress
        });
    }
    async updatePassword(userId, hashedPassword) {
        await this.repository.update(userId, {
            password: hashedPassword,
            resetPasswordToken: null,
            resetPasswordExpires: null
        });
    }
    async setResetPasswordToken(userId, token, expiresAt) {
        await this.repository.update(userId, {
            resetPasswordToken: token,
            resetPasswordExpires: expiresAt
        });
    }
    async verifyEmail(userId) {
        await this.repository.update(userId, {
            emailVerified: true,
            emailVerifiedAt: new Date()
        });
    }
    async findActiveUsers(schoolId) {
        const where = { isActive: true };
        if (schoolId) {
            where.schoolId = schoolId;
        }
        return this.repository.find({
            where,
            relations: ['school', 'userRoles', 'userRoles.role'],
            order: { createdAt: 'DESC' }
        });
    }
}
exports.UserRepository = UserRepository;
//# sourceMappingURL=UserRepository.js.map