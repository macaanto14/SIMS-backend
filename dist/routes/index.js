"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const AuthController_1 = require("../controllers/AuthController");
const AuthService_1 = require("../services/AuthService");
const AuditService_1 = require("../services/AuditService");
const RBACService_1 = require("../services/RBACService");
const UserService_1 = require("../services/UserService");
const UserRepository_1 = require("../repositories/UserRepository");
const auth_1 = require("../middleware/auth");
const router = express_1.default.Router();
const auditService = new AuditService_1.AuditService();
const rbacService = new RBACService_1.RBACService();
const authService = new AuthService_1.AuthService(auditService, rbacService);
const userRepository = new UserRepository_1.UserRepository();
const userService = new UserService_1.UserService(userRepository, auditService);
const authMiddleware = new auth_1.AuthMiddleware(userService, auditService, rbacService);
const authController = new AuthController_1.AuthController(authService, rbacService, auditService);
router.get('/health', (req, res) => {
    res.json({
        status: 'OK',
        timestamp: new Date().toISOString(),
        service: 'SIMS Backend API'
    });
});
router.post('/auth/register', authController.register);
router.post('/auth/login', authController.login);
router.post('/auth/logout', authMiddleware.authenticate, authController.logout);
router.post('/auth/refresh', authController.refreshToken);
router.get('/auth/profile', authMiddleware.authenticate, authController.getProfile);
router.get('/docs', (req, res) => {
    res.redirect('/api-docs');
});
exports.default = router;
//# sourceMappingURL=index.js.map