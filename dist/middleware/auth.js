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
exports.AuthMiddleware = void 0;
const jwt = __importStar(require("jsonwebtoken"));
class AuthMiddleware {
    constructor(userService, auditService, rbacService) {
        this.userService = userService;
        this.auditService = auditService;
        this.rbacService = rbacService;
        this.authenticate = async (req, res, next) => {
            try {
                const authHeader = req.headers['authorization'];
                const token = authHeader?.split(' ')[1];
                if (!token) {
                    res.status(401).json({
                        success: false,
                        message: 'Access token required'
                    });
                    return;
                }
                const decoded = jwt.verify(token, process.env.JWT_SECRET);
                if (!decoded || !decoded.userId) {
                    res.status(401).json({
                        success: false,
                        message: 'Invalid token payload'
                    });
                    return;
                }
                const user = await this.userService.findById(decoded.userId);
                if (!user || !user.isActive) {
                    res.status(401).json({
                        success: false,
                        message: 'User not found or inactive'
                    });
                    return;
                }
                const roles = await this.rbacService.getUserRoles(user.id);
                const permissions = await this.rbacService.getUserPermissions(user.id);
                req.user = {
                    id: user.id,
                    email: user.email,
                    firstName: user.firstName,
                    lastName: user.lastName,
                    schoolId: user.schoolId,
                    roles,
                    permissions,
                    fullName: user.fullName,
                    displayName: user.displayName
                };
                next();
            }
            catch (error) {
                console.error('Token verification error:', error);
                let errorMessage = 'Invalid token';
                let errorDetails = {};
                const jwtError = error;
                if (jwtError.name === 'JsonWebTokenError') {
                    errorMessage = 'Malformed or invalid JWT token';
                    errorDetails = {
                        reason: jwtError.message,
                        tokenStart: req.headers.authorization?.substring(7, 27) + '...'
                    };
                }
                else if (jwtError.name === 'TokenExpiredError') {
                    errorMessage = 'Token has expired';
                    errorDetails = {
                        expiredAt: jwtError.expiredAt
                    };
                }
                else if (jwtError.name === 'NotBeforeError') {
                    errorMessage = 'Token not active yet';
                    errorDetails = {
                        date: jwtError.date
                    };
                }
                res.status(403).json({
                    success: false,
                    error: errorMessage,
                    details: errorDetails
                });
            }
        };
        this.requireRole = (requiredRoles) => {
            const roles = Array.isArray(requiredRoles) ? requiredRoles : [requiredRoles];
            return async (req, res, next) => {
                try {
                    const user = req.user;
                    if (!user || !user.id) {
                        res.status(401).json({
                            success: false,
                            message: 'Authentication required'
                        });
                        return;
                    }
                    const hasRole = await this.rbacService.hasRole(user.id, roles);
                    if (!hasRole) {
                        const userRoles = await this.rbacService.getUserRoles(user.id);
                        await this.auditService.logSystemEvent('ACCESS_DENIED', user.id, {
                            requiredRoles: roles,
                            userRoles,
                            endpoint: req.path,
                            method: req.method,
                            ipAddress: req.ip,
                            userAgent: req.get('User-Agent')
                        });
                        res.status(403).json({
                            success: false,
                            message: 'Insufficient role permissions',
                            required: roles,
                            userRoles
                        });
                        return;
                    }
                    req.userPermissions = await this.rbacService.getUserPermissions(user.id);
                    next();
                }
                catch (error) {
                    console.error('Role check error:', error);
                    res.status(500).json({
                        success: false,
                        message: 'Role check failed'
                    });
                }
            };
        };
        this.requirePermission = (module, action) => {
            return async (req, res, next) => {
                try {
                    const user = req.user;
                    if (!user || !user.id) {
                        res.status(401).json({
                            success: false,
                            message: 'Authentication required'
                        });
                        return;
                    }
                    const schoolId = req.params.schoolId || req.body.schoolId || req.query.schoolId;
                    const hasPermission = await this.rbacService.hasPermission(user.id, module, action, schoolId);
                    if (!hasPermission) {
                        const userRoles = await this.rbacService.getUserRoles(user.id);
                        await this.auditService.logSystemEvent('ACCESS_DENIED', user.id, {
                            requiredPermission: { module, action },
                            userRoles,
                            schoolId,
                            endpoint: req.path,
                            method: req.method,
                            ipAddress: req.ip,
                            userAgent: req.get('User-Agent')
                        });
                        res.status(403).json({
                            success: false,
                            message: 'Insufficient permissions',
                            required: { module, action },
                            userRoles
                        });
                        return;
                    }
                    req.userPermissions = await this.rbacService.getUserPermissions(user.id);
                    next();
                }
                catch (error) {
                    console.error('Permission check error:', error);
                    res.status(500).json({
                        success: false,
                        message: 'Permission check failed'
                    });
                }
            };
        };
        this.requireSchoolAccess = async (req, res, next) => {
            try {
                const user = req.user;
                if (!user || !user.id) {
                    res.status(401).json({
                        success: false,
                        message: 'Authentication required'
                    });
                    return;
                }
                const schoolId = req.params.schoolId || req.body.schoolId || req.query.schoolId;
                if (!schoolId) {
                    res.status(400).json({
                        success: false,
                        message: 'School ID required'
                    });
                    return;
                }
                const isSuperAdmin = await this.rbacService.hasRole(user.id, ['Super Admin']);
                if (!isSuperAdmin) {
                    const schoolContexts = await this.rbacService.getUserSchoolContext(user.id);
                    if (!schoolContexts.some(sc => sc.schoolId === schoolId)) {
                        await this.auditService.logSystemEvent('SCHOOL_ACCESS_DENIED', user.id, {
                            schoolId,
                            userSchoolContexts: schoolContexts.map(sc => sc.schoolId).filter((id) => id !== null),
                            endpoint: req.path,
                            method: req.method,
                            ipAddress: req.ip,
                            userAgent: req.get('User-Agent')
                        });
                        res.status(403).json({
                            success: false,
                            message: 'Access denied to this school',
                            schoolId,
                            userSchoolContexts: schoolContexts
                        });
                        return;
                    }
                }
                req.schoolId = schoolId;
                next();
            }
            catch (error) {
                console.error('School access check error:', error);
                res.status(500).json({
                    success: false,
                    message: 'School access check failed'
                });
            }
        };
    }
}
exports.AuthMiddleware = AuthMiddleware;
//# sourceMappingURL=auth.js.map