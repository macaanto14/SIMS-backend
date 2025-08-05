"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserService = void 0;
const AppError_1 = require("../utils/AppError");
class UserService {
    constructor(userRepository, auditService) {
        this.userRepository = userRepository;
        this.auditService = auditService;
    }
    async createUser(userData, createdBy) {
        const user = await this.userRepository.create(userData);
        if (createdBy) {
            await this.auditService.logCreate('users', user.id, user, createdBy);
        }
        return user;
    }
    async updateUser(id, updateData, updatedBy) {
        const existingUser = await this.userRepository.findById(id);
        if (!existingUser) {
            throw new AppError_1.AppError('User not found', 404);
        }
        const updatedUser = await this.userRepository.update(id, updateData);
        if (!updatedUser) {
            throw new AppError_1.AppError('Failed to update user', 500);
        }
        if (updatedBy) {
            await this.auditService.logUpdate('users', id, existingUser, updatedUser, updatedBy);
        }
        return updatedUser;
    }
    async deleteUser(id, deletedBy) {
        const user = await this.userRepository.findById(id);
        if (!user) {
            throw new AppError_1.AppError('User not found', 404);
        }
        await this.userRepository.softDelete(id);
        if (deletedBy) {
            await this.auditService.logDelete('users', id, user, deletedBy);
        }
    }
    async getUserById(id) {
        const user = await this.userRepository.findById(id);
        if (!user) {
            throw new AppError_1.AppError('User not found', 404);
        }
        return user;
    }
    async getUserByEmail(email) {
        const user = await this.userRepository.findByEmail(email);
        if (!user) {
            throw new AppError_1.AppError('User not found', 404);
        }
        return user;
    }
    async getUsers(query) {
        const { page = 1, limit = 10, schoolId, role } = query;
        let users;
        let total;
        if (role) {
            users = await this.userRepository.findByRole(role, schoolId);
            total = users.length;
            users = users.slice((page - 1) * limit, page * limit);
        }
        else if (schoolId) {
            [users, total] = await this.userRepository.findBySchool(schoolId, { page, limit });
        }
        else {
            [users, total] = await this.userRepository.findAndCount({
                skip: (page - 1) * limit,
                take: limit,
                order: { createdAt: 'DESC' },
            });
        }
        return { users, total, page, limit };
    }
    async validateUserPassword(email, password) {
        const user = await this.userRepository.findByEmail(email);
        if (!user) {
            throw new AppError_1.AppError('Invalid credentials', 401);
        }
        const isValidPassword = await user.validatePassword(password);
        if (!isValidPassword) {
            throw new AppError_1.AppError('Invalid credentials', 401);
        }
        return user;
    }
    async findById(id) {
        return this.userRepository.findById(id);
    }
}
exports.UserService = UserService;
//# sourceMappingURL=UserService.js.map