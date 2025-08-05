"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const database_1 = require("../config/database");
const User_1 = require("../entities/User");
const Role_1 = require("../entities/Role");
const UserRole_1 = require("../entities/UserRole");
const AppError_1 = require("../utils/AppError");
const bcrypt = __importStar(require("bcryptjs"));
const jwt = __importStar(require("jsonwebtoken"));
class AuthService {
    constructor(auditService, rbacService) {
        this.userRepository = database_1.AppDataSource.getRepository(User_1.User);
        this.roleRepository = database_1.AppDataSource.getRepository(Role_1.Role);
        this.userRoleRepository = database_1.AppDataSource.getRepository(UserRole_1.UserRole);
        this.auditService = auditService;
        this.rbacService = rbacService;
    }
    async login(data, ipAddress, userAgent) {
        try {
            const { email, password } = data;
            const user = await this.userRepository.findOne({
                where: { email, isActive: true },
                relations: [
                    'userRoles',
                    'userRoles.role',
                    'userRoles.role.rolePermissions',
                    'userRoles.role.rolePermissions.permission',
                    'school'
                ]
            });
            if (!user) {
                await this.auditService.logAuthEvent('LOGIN', null, {
                    email,
                    reason: 'user_not_found',
                    success: false,
                    ipAddress,
                    userAgent
                });
                throw new AppError_1.AppError('Invalid credentials', 401);
            }
            const isValidPassword = await bcrypt.compare(password, user.password);
            if (!isValidPassword) {
                await this.auditService.logAuthEvent('LOGIN', user.id, {
                    email: user.email,
                    reason: 'invalid_password',
                    success: false,
                    ipAddress,
                    userAgent
                });
                throw new AppError_1.AppError('Invalid credentials', 401);
            }
            const roles = user.userRoles
                .filter(ur => ur.isActive && ur.role.isActive)
                .filter(ur => !ur.expiresAt || ur.expiresAt > new Date())
                .map(ur => ur.role.name);
            const permissions = await this.rbacService.getUserPermissions(user.id);
            const token = this.generateToken({
                userId: user.id,
                email: user.email,
                roles,
                schoolId: user.schoolId || null
            });
            await this.auditService.logAuthEvent('LOGIN', user.id, {
                email: user.email,
                role: roles.join(','),
                schoolId: user.schoolId,
                success: true,
                ipAddress,
                userAgent
            });
            return {
                user,
                token,
                roles,
                permissions
            };
        }
        catch (error) {
            if (error instanceof AppError_1.AppError) {
                throw error;
            }
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            await this.auditService.logAuthEvent('LOGIN', null, {
                email: data.email,
                error: errorMessage,
                reason: 'system_error',
                success: false,
                ipAddress,
                userAgent
            });
            throw new AppError_1.AppError('Login failed', 500);
        }
    }
    async register(data, ipAddress, userAgent) {
        const queryRunner = database_1.AppDataSource.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();
        try {
            const { email, password, firstName, lastName, phone, role, schoolId } = data;
            const existingUser = await this.userRepository.findOne({
                where: { email }
            });
            if (existingUser) {
                await this.auditService.logAuthEvent('REGISTER', null, {
                    email,
                    reason: 'duplicate_email',
                    success: false,
                    ipAddress,
                    userAgent
                });
                throw new AppError_1.AppError('User already exists with this email', 409);
            }
            let roleEntity = null;
            if (role) {
                roleEntity = await this.roleRepository.findOne({
                    where: { name: role, isActive: true }
                });
                if (!roleEntity) {
                    await this.auditService.logAuthEvent('REGISTER', null, {
                        email,
                        role,
                        reason: 'invalid_role',
                        success: false,
                        ipAddress,
                        userAgent
                    });
                    throw new AppError_1.AppError('Invalid role specified', 400);
                }
            }
            const user = this.userRepository.create({
                email,
                password,
                firstName,
                lastName,
                phone,
                schoolId
            });
            const savedUser = await queryRunner.manager.save(user);
            if (roleEntity) {
                const userRole = this.userRoleRepository.create({
                    userId: savedUser.id,
                    roleId: roleEntity.id,
                    schoolId,
                    assignedBy: savedUser.id,
                    assignedAt: new Date()
                });
                await queryRunner.manager.save(userRole);
            }
            await queryRunner.commitTransaction();
            await this.auditService.logAuthEvent('REGISTER', savedUser.id, {
                email: savedUser.email,
                role: role || undefined,
                schoolId: schoolId || null,
                success: true,
                ipAddress,
                userAgent
            });
            const token = this.generateToken({
                userId: savedUser.id,
                email: savedUser.email,
                roles: role ? [role] : [],
                schoolId: schoolId || null
            });
            return {
                user: savedUser,
                token,
                roles: role ? [role] : [],
                permissions: []
            };
        }
        catch (error) {
            await queryRunner.rollbackTransaction();
            if (error instanceof AppError_1.AppError) {
                throw error;
            }
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            await this.auditService.logAuthEvent('REGISTER', null, {
                email: data.email,
                error: errorMessage,
                reason: 'system_error',
                success: false,
                ipAddress,
                userAgent
            });
            throw new AppError_1.AppError('Registration failed', 500);
        }
        finally {
            await queryRunner.release();
        }
    }
    async logout(userId, ipAddress, userAgent) {
        try {
            const user = await this.userRepository.findOne({
                where: { id: userId }
            });
            if (user) {
                await this.auditService.logAuthEvent('LOGOUT', userId, {
                    email: user.email,
                    success: true,
                    ipAddress,
                    userAgent
                });
            }
        }
        catch (error) {
            console.error('Logout logging error:', error);
        }
    }
    async validateToken(token) {
        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            const user = await this.userRepository.findOne({
                where: { id: decoded.userId, isActive: true },
                relations: [
                    'userRoles',
                    'userRoles.role',
                    'userRoles.role.rolePermissions',
                    'userRoles.role.rolePermissions.permission',
                    'school'
                ]
            });
            return user;
        }
        catch (error) {
            return null;
        }
    }
    generateToken(payload) {
        const secret = process.env.JWT_SECRET;
        if (!secret) {
            throw new Error('JWT_SECRET environment variable is not set');
        }
        const expiresIn = process.env.JWT_EXPIRES_IN || '24h';
        const options = {
            expiresIn: expiresIn
        };
        return jwt.sign(payload, secret, options);
    }
    async refreshToken(oldToken) {
        try {
            const decoded = jwt.verify(oldToken, process.env.JWT_SECRET);
            const user = await this.userRepository.findOne({
                where: { id: decoded.userId, isActive: true },
                relations: ['userRoles', 'userRoles.role']
            });
            if (!user) {
                throw new AppError_1.AppError('User not found', 404);
            }
            const roles = user.userRoles
                .filter(ur => ur.isActive)
                .map(ur => ur.role.name);
            return this.generateToken({
                userId: user.id,
                email: user.email,
                roles,
                schoolId: user.schoolId || null
            });
        }
        catch (error) {
            throw new AppError_1.AppError('Invalid token', 401);
        }
    }
}
exports.AuthService = AuthService;
//# sourceMappingURL=AuthService.js.map