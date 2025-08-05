import { Request, Response, NextFunction } from 'express';
import * as jwt from 'jsonwebtoken';
import { UserService } from '../services/UserService';
import { AuditService } from '../services/AuditService';
import { RBACService } from '../services/RBACService';
import { AppError } from '../utils/AppError';

interface JWTError extends Error {
  name: string;
  message: string;
  expiredAt?: Date;
  date?: Date;
}

export class AuthMiddleware {
  constructor(
    private userService: UserService,
    private auditService: AuditService,
    private rbacService: RBACService
  ) {}

  authenticate = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
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

      // Verify JWT token
      const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
      
      if (!decoded || !decoded.userId) {
        res.status(401).json({
          success: false,
          message: 'Invalid token payload'
        });
        return;
      }

      // Get user from database
      const user = await this.userService.findById(decoded.userId);
      
      if (!user || !user.isActive) {
        res.status(401).json({
          success: false,
          message: 'User not found or inactive'
        });
        return;
      }

      // Get user roles and permissions
      const roles = await this.rbacService.getUserRoles(user.id);
      const permissions = await this.rbacService.getUserPermissions(user.id);

      (req as any).user = {
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
    } catch (error) {
      console.error('Token verification error:', error);
      
      let errorMessage = 'Invalid token';
      let errorDetails: any = {};

      const jwtError = error as JWTError;

      if (jwtError.name === 'JsonWebTokenError') {
        errorMessage = 'Malformed or invalid JWT token';
        errorDetails = {
          reason: jwtError.message,
          tokenStart: req.headers.authorization?.substring(7, 27) + '...'
        };
      } else if (jwtError.name === 'TokenExpiredError') {
        errorMessage = 'Token has expired';
        errorDetails = {
          expiredAt: jwtError.expiredAt
        };
      } else if (jwtError.name === 'NotBeforeError') {
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

  requireRole = (requiredRoles: string | string[]) => {
    const roles = Array.isArray(requiredRoles) ? requiredRoles : [requiredRoles];
    
    return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
      try {
        const user = (req as any).user;
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
          
          // Log access denied
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
        
        (req as any).userPermissions = await this.rbacService.getUserPermissions(user.id);
        next();
        
      } catch (error) {
        console.error('Role check error:', error);
        res.status(500).json({
          success: false,
          message: 'Role check failed'
        });
      }
    };
  };

  requirePermission = (module: string, action: string) => {
    return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
      try {
        const user = (req as any).user;
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
          
          // Log access denied
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
        
        (req as any).userPermissions = await this.rbacService.getUserPermissions(user.id);
        next();
        
      } catch (error) {
        console.error('Permission check error:', error);
        res.status(500).json({
          success: false,
          message: 'Permission check failed'
        });
      }
    };
  };

  requireSchoolAccess = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const user = (req as any).user;
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

      // Check if user is super admin (has access to all schools)
      const isSuperAdmin = await this.rbacService.hasRole(user.id, ['Super Admin']);        
      
      if (!isSuperAdmin) {
        const schoolContexts = await this.rbacService.getUserSchoolContext(user.id);        
        
        if (!schoolContexts.some(sc => sc.schoolId === schoolId)) {
          // Log access denied
          await this.auditService.logSystemEvent('SCHOOL_ACCESS_DENIED', user.id, {
            schoolId,
            userSchoolContexts: schoolContexts.map(sc => sc.schoolId).filter((id): id is string => id !== null),
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

      (req as any).schoolId = schoolId;
      next();
      
    } catch (error) {
      console.error('School access check error:', error);
      res.status(500).json({
        success: false,
        message: 'School access check failed'
      });
    }
  };
}
