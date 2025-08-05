"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthController = void 0;
const AppError_1 = require("../utils/AppError");
const response_1 = require("../utils/response");
class AuthController {
    constructor(authService, rbacService, auditService) {
        this.authService = authService;
        this.rbacService = rbacService;
        this.auditService = auditService;
        this.register = async (req, res) => {
            try {
                const { email, password, firstName, lastName, phone, role, schoolId } = req.body;
                const authResult = await this.authService.register({ email, password, firstName, lastName, phone, role, schoolId }, req.ip, req.get('User-Agent'));
                (0, response_1.successResponse)(res, {
                    user: {
                        id: authResult.user.id,
                        email: authResult.user.email,
                        firstName: authResult.user.firstName,
                        lastName: authResult.user.lastName,
                        createdAt: authResult.user.createdAt,
                        roles: authResult.roles,
                        schoolId: authResult.user.schoolId
                    },
                    token: authResult.token
                }, 'User registered successfully', 201);
            }
            catch (error) {
                if (error instanceof AppError_1.AppError) {
                    (0, response_1.errorResponse)(res, error.message, error.statusCode);
                    return;
                }
                console.error('Registration error:', error);
                (0, response_1.errorResponse)(res, 'Registration failed', 500);
            }
        };
        this.login = async (req, res) => {
            try {
                const { email, password } = req.body;
                const authResult = await this.authService.login({ email, password }, req.ip, req.get('User-Agent'));
                (0, response_1.successResponse)(res, {
                    user: {
                        id: authResult.user.id,
                        email: authResult.user.email,
                        firstName: authResult.user.firstName,
                        lastName: authResult.user.lastName,
                        fullName: authResult.user.fullName,
                        roles: authResult.roles,
                        permissions: authResult.permissions.map(p => `${p.module}.${p.action}`),
                        schoolId: authResult.user.schoolId,
                        lastLoginAt: authResult.user.lastLoginAt
                    },
                    token: authResult.token
                }, 'Login successful');
            }
            catch (error) {
                if (error instanceof AppError_1.AppError) {
                    (0, response_1.errorResponse)(res, error.message, error.statusCode);
                    return;
                }
                console.error('Login error:', error);
                (0, response_1.errorResponse)(res, 'Login failed', 500);
            }
        };
        this.logout = async (req, res) => {
            try {
                if (req.user?.id) {
                    await this.authService.logout(req.user.id, req.ip, req.get('User-Agent'));
                }
                (0, response_1.successResponse)(res, null, 'Logout successful');
            }
            catch (error) {
                console.error('Logout error:', error);
                (0, response_1.errorResponse)(res, 'Logout failed', 500);
            }
        };
        this.refreshToken = async (req, res) => {
            try {
                const authHeader = req.headers['authorization'];
                const token = authHeader?.split(' ')[1];
                if (!token) {
                    (0, response_1.errorResponse)(res, 'Token required', 400);
                    return;
                }
                const newToken = await this.authService.refreshToken(token);
                (0, response_1.successResponse)(res, { token: newToken }, 'Token refreshed successfully');
            }
            catch (error) {
                if (error instanceof AppError_1.AppError) {
                    (0, response_1.errorResponse)(res, error.message, error.statusCode);
                    return;
                }
                console.error('Token refresh error:', error);
                (0, response_1.errorResponse)(res, 'Token refresh failed', 500);
            }
        };
        this.getProfile = async (req, res) => {
            try {
                const userId = req.user?.id;
                if (!userId) {
                    (0, response_1.errorResponse)(res, 'User not authenticated', 401);
                    return;
                }
                const roles = await this.rbacService.getUserRoles(userId);
                const permissions = await this.rbacService.getUserPermissions(userId);
                const schoolContexts = await this.rbacService.getUserSchoolContext(userId);
                (0, response_1.successResponse)(res, {
                    user: {
                        id: req.user.id,
                        email: req.user.email,
                        firstName: req.user.firstName,
                        lastName: req.user.lastName,
                        fullName: req.user.fullName,
                        phone: req.user.phone,
                        avatar: req.user.avatar,
                        schoolId: req.user.schoolId,
                        lastLoginAt: req.user.lastLoginAt
                    },
                    roles,
                    permissions: permissions.map(p => p.module + '.' + p.action),
                    schoolContexts
                }, 'Profile retrieved successfully');
            }
            catch (error) {
                console.error('Get profile error:', error);
                (0, response_1.errorResponse)(res, 'Failed to get profile', 500);
            }
        };
    }
}
exports.AuthController = AuthController;
//# sourceMappingURL=AuthController.js.map