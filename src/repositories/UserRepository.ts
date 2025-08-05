import { Repository } from 'typeorm';
import { AppDataSource } from '../config/database';
import { User } from '../entities/User';
import { BaseRepository } from './BaseRepository';

export class UserRepository extends BaseRepository<User> {
  private userRoleRepository: Repository<any>;

  constructor() {
    super(AppDataSource.getRepository(User));
    this.userRoleRepository = AppDataSource.getRepository('UserRole');
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.repository.findOne({
      where: { email, isActive: true },
      relations: ['school', 'userRoles', 'userRoles.role']
    });
  }

  async findBySchool(schoolId: string, options: { page: number; limit: number }): Promise<[User[], number]> {
    const { page, limit } = options;
    
    return this.repository.findAndCount({
      where: { schoolId, isActive: true },
      skip: (page - 1) * limit,
      take: limit,
      order: { createdAt: 'DESC' },
      relations: ['school', 'userRoles', 'userRoles.role']
    });
  }

  async findByRole(roleName: string, schoolId?: string): Promise<User[]> {
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

  async updateLastLogin(userId: string, ipAddress?: string): Promise<void> {
    await this.repository.update(userId, {
      lastLoginAt: new Date()
    });
  }

  async updatePassword(userId: string, hashedPassword: string): Promise<void> {
    await this.repository.update(userId, {
      password: hashedPassword
    });
  }

  async setResetPasswordToken(userId: string, token: string, expiresAt: Date): Promise<void> {
    // Note: These fields don't exist in the current User entity
    // If needed, they should be added to the User entity first
    console.warn('Reset password token functionality requires additional User entity fields');
  }

  async verifyEmail(userId: string): Promise<void> {
    // Note: These fields don't exist in the current User entity
    // If needed, they should be added to the User entity first
    console.warn('Email verification functionality requires additional User entity fields');
  }

  async findActiveUsers(schoolId?: string): Promise<User[]> {
    const where: any = { isActive: true };
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