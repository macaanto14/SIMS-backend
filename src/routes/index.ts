import express, { Request, Response } from 'express';
import { AuthController } from '../controllers/AuthController';
import { AuthService } from '../services/AuthService';
import { AuditService } from '../services/AuditService';
import { RBACService } from '../services/RBACService';
import { UserService } from '../services/UserService';
import { UserRepository } from '../repositories/UserRepository';
import { AuthMiddleware } from '../middleware/auth';

const router = express.Router();

// Initialize services
const auditService = new AuditService();
const rbacService = new RBACService();
const authService = new AuthService(auditService, rbacService);
const userRepository = new UserRepository();
const userService = new UserService(userRepository, auditService);

// Initialize middleware
const authMiddleware = new AuthMiddleware(userService, auditService, rbacService);

// Initialize controllers
const authController = new AuthController(authService, rbacService, auditService);

// Health check route
router.get('/health', (req: Request, res: Response) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    service: 'SIMS Backend API'
  });
});

// Authentication routes
router.post('/auth/register', authController.register);
router.post('/auth/login', authController.login);
router.post('/auth/logout', authMiddleware.authenticate, authController.logout);
router.post('/auth/refresh', authController.refreshToken);
router.get('/auth/profile', authMiddleware.authenticate, authController.getProfile);

// API documentation route
router.get('/docs', (req: Request, res: Response) => {
  res.redirect('/api-docs');
});

export default router;