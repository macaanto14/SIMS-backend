import { Repository, QueryRunner } from 'typeorm';
import { AppDataSource } from '../config/database';
import { User } from '../entities/User';
import { Role } from '../entities/Role';
import { UserRole } from '../entities/UserRole';
import { AuditService } from '../services/AuditService';
import { RBACService, UserPermission } from './RBACService';
import { AppError } from '../utils/AppError';
import * as bcrypt from 'bcryptjs';
import * as jwt from 'jsonwebtoken';

export interface LoginData {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone?: string;
  role?: string;
  schoolId?: string;
}

export interface AuthResult {
  user: User;
  token: string;
  roles: string[];
  permissions: UserPermission[];
}

interface TokenPayload {
  userId: string;
  email: string;
  roles: string[];
  schoolId?: string | null;
}

export class AuthService {
  private userRepository: Repository<User>;
  private roleRepository: Repository<Role>;
  private userRoleRepository: Repository<UserRole>;
  private auditService: AuditService;
  private rbacService: RBACService;

  constructor(auditService: AuditService, rbacService: RBACService) {
    this.userRepository = AppDataSource.getRepository(User);
    this.roleRepository = AppDataSource.getRepository(Role);
    this.userRoleRepository = AppDataSource.getRepository(UserRole);
    this.auditService = auditService;
    this.rbacService = rbacService;
  }

  async login(data: LoginData, ipAddress?: string, userAgent?: string): Promise<AuthResult> {
    try {
      const { email, password } = data;

      // Find user with relations
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
        throw new AppError('Invalid credentials', 401);
      }

      // Verify password
      const isValidPassword = await bcrypt.compare(password, user.password);
      if (!isValidPassword) {
        await this.auditService.logAuthEvent('LOGIN', user.id, {
          email: user.email,
          reason: 'invalid_password',
          success: false,
          ipAddress,
          userAgent
        });
        throw new AppError('Invalid credentials', 401);
      }

      // Get user roles and permissions
      const roles = user.userRoles
        .filter((ur: UserRole) => ur.isActive)
        .filter((ur: UserRole) => !ur.expiresAt || ur.expiresAt > new Date())
        .map((ur: UserRole) => ur.role.name);

      const permissions = await this.rbacService.getUserPermissions(user.id);

      // Generate token
      const token = this.generateToken({
        userId: user.id,
        email: user.email,
        roles,
        schoolId: user.schoolId || null
      });

      // Log successful login
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

    } catch (error) {
      if (error instanceof AppError) {
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
      
      throw new AppError('Login failed', 500);
    }
  }

  async register(data: RegisterData, ipAddress?: string, userAgent?: string): Promise<AuthResult> {
    const queryRunner = AppDataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const { email, password, firstName, lastName, phone, role, schoolId } = data;

      // Check if user already exists
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
        throw new AppError('User already exists with this email', 409);
      }

      // Validate role if provided
      let roleEntity: Role | null = null;
      if (role) {
        roleEntity = await this.roleRepository.findOne({
          where: { name: role }
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
          throw new AppError('Invalid role specified', 400);
        }
      }

      // Create user
      const user = this.userRepository.create({
        email,
        password, // Will be hashed by entity hook
        firstName,
        lastName,
        phone,
        schoolId
      });

      const savedUser = await queryRunner.manager.save(user);

      // Assign role if provided
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

      // Log successful registration
      await this.auditService.logAuthEvent('REGISTER', savedUser.id, {
        email: savedUser.email,
        role: role || undefined,
        schoolId: schoolId || null,
        success: true,
        ipAddress,
        userAgent
      });

      // Generate token and return auth result
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

    } catch (error) {
      await queryRunner.rollbackTransaction();
      
      if (error instanceof AppError) {
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

      throw new AppError('Registration failed', 500);
    } finally {
      await queryRunner.release();
    }
  }

  async logout(userId: string, ipAddress?: string, userAgent?: string): Promise<void> {
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
    } catch (error) {
      console.error('Logout logging error:', error);
    }
  }

  async validateToken(token: string): Promise<User | null> {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
      
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
    } catch (error) {
      return null;
    }
  }

  private generateToken(payload: TokenPayload): string {
    const secret = process.env.JWT_SECRET;
    if (!secret) {
      throw new Error('JWT_SECRET environment variable is not set');
    }
    
    const expiresIn = process.env.JWT_EXPIRES_IN || '24h';
    

    const options: jwt.SignOptions = {
  expiresIn: expiresIn as jwt.SignOptions['expiresIn']
};

    
    return jwt.sign(payload, secret, options);
  }

  async refreshToken(oldToken: string): Promise<string> {
    try {
      const decoded = jwt.verify(oldToken, process.env.JWT_SECRET!) as any;
      
      const user = await this.userRepository.findOne({
        where: { id: decoded.userId, isActive: true },
        relations: ['userRoles', 'userRoles.role']
      });

      if (!user) {
        throw new AppError('User not found', 404);
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

    } catch (error) {
      throw new AppError('Invalid token', 401);
    }
  }
}