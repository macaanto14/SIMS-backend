import { Request, Response } from 'express';
import { AuthService } from '../services/AuthService';
import { RBACService } from '../services/RBACService';
import { AuditService } from '../services/AuditService';
import { AppError } from '../utils/AppError';
import { successResponse, errorResponse } from '../utils/response';

export class AuthController {
  constructor(
    private authService: AuthService,
    private rbacService: RBACService,
    private auditService: AuditService
  ) {}

  register = async (req: Request, res: Response): Promise<void> => {
    try {
      const { email, password, firstName, lastName, phone, role, schoolId } = req.body;
      
      const authResult = await this.authService.register(
        { email, password, firstName, lastName, phone, role, schoolId },
        req.ip,
        req.get('User-Agent')
      );

      successResponse(res, {
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

    } catch (error) {
      if (error instanceof AppError) {
        errorResponse(res, error.message, error.statusCode);
        return;
      }
      
      console.error('Registration error:', error);
      errorResponse(res, 'Registration failed', 500);
    }
  };

  login = async (req: Request, res: Response): Promise<void> => {
    try {
      const { email, password } = req.body;
      
      const authResult = await this.authService.login(
        { email, password },
        req.ip,
        req.get('User-Agent')
      );

      successResponse(res, {
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

    } catch (error) {
      if (error instanceof AppError) {
        errorResponse(res, error.message, error.statusCode);
        return;
      }
      
      console.error('Login error:', error);
      errorResponse(res, 'Login failed', 500);
    }
  };

  logout = async (req: Request, res: Response): Promise<void> => {
    try {
      if ((req as any).user?.id) {
        await this.authService.logout(
          (req as any).user.id,
          req.ip,
          req.get('User-Agent')
        );
      }

      successResponse(res, null, 'Logout successful');

    } catch (error) {
      console.error('Logout error:', error);
      errorResponse(res, 'Logout failed', 500);
    }
  };

  refreshToken = async (req: Request, res: Response): Promise<void> => {
    try {
      const authHeader = req.headers['authorization'];
      const token = authHeader?.split(' ')[1];

      if (!token) {
        errorResponse(res, 'Token required', 400);
        return;
      }

      const newToken = await this.authService.refreshToken(token);

      successResponse(res, { token: newToken }, 'Token refreshed successfully');

    } catch (error) {
      if (error instanceof AppError) {
        errorResponse(res, error.message, error.statusCode);
        return;
      }
      
      console.error('Token refresh error:', error);
      errorResponse(res, 'Token refresh failed', 500);
    }
  };

  getProfile = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = (req as any).user?.id;
      if (!userId) {
        errorResponse(res, 'User not authenticated', 401);
        return;
      }

      const roles = await this.rbacService.getUserRoles(userId);
      const permissions = await this.rbacService.getUserPermissions(userId);
      const schoolContexts = await this.rbacService.getUserSchoolContext(userId);

      const user = (req as any).user;
      successResponse(res, {
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          fullName: user.fullName,
          phone: user.phone,
          avatar: user.avatar,
          schoolId: user.schoolId,
          lastLoginAt: user.lastLoginAt
        },
        roles,
        permissions: permissions.map(p => p.module + '.' + p.action),
        schoolContexts
      }, 'Profile retrieved successfully');

    } catch (error) {
      console.error('Get profile error:', error);
      errorResponse(res, 'Failed to get profile', 500);
    }
  };
}