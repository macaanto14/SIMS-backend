import { UserRepository } from '../repositories/UserRepository';
import { User } from '../entities/User';
import { CreateUserDto, UpdateUserDto, UserQueryDto } from '../dto/UserDto';
import { AppError } from '../utils/AppError';
import { AuditService } from './AuditService';

export class UserService {
  constructor(
    private userRepository: UserRepository,
    private auditService: AuditService
  ) {}

  async createUser(userData: any, createdBy?: string): Promise<User> {
    const user = await this.userRepository.create(userData);
    
    if (createdBy) {
      await this.auditService.logCreate('users', user.id, user, createdBy);
    }
    
    return user;
  }

  async updateUser(id: string, updateData: any, updatedBy?: string): Promise<User> {
    const existingUser = await this.userRepository.findById(id);
    if (!existingUser) {
      throw new AppError('User not found', 404);
    }

    const updatedUser = await this.userRepository.update(id, updateData);
    if (!updatedUser) {
      throw new AppError('Failed to update user', 500);
    }

    if (updatedBy) {
      await this.auditService.logUpdate('users', id, existingUser, updatedUser, updatedBy);
    }

    return updatedUser;
  }

  async deleteUser(id: string, deletedBy?: string): Promise<void> {
    const user = await this.userRepository.findById(id);
    if (!user) {
      throw new AppError('User not found', 404);
    }

    await this.userRepository.softDelete(id);
    
    if (deletedBy) {
      await this.auditService.logDelete('users', id, user, deletedBy);
    }
  }

  async getUserById(id: string): Promise<User> {
    const user = await this.userRepository.findById(id);
    if (!user) {
      throw new AppError('User not found', 404);
    }
    return user;
  }

  async getUserByEmail(email: string): Promise<User> {
    const user = await this.userRepository.findByEmail(email);
    if (!user) {
      throw new AppError('User not found', 404);
    }
    return user;
  }

  async getUsers(query: UserQueryDto): Promise<{ users: User[]; total: number; page: number; limit: number }> {
    const { page = 1, limit = 10, schoolId, role } = query;

    let users: User[];
    let total: number;

    if (role) {
      users = await this.userRepository.findByRole(role, schoolId);
      total = users.length;
      users = users.slice((page - 1) * limit, page * limit);
    } else if (schoolId) {
      [users, total] = await this.userRepository.findBySchool(schoolId, { page, limit });
    } else {
      [users, total] = await this.userRepository.findAndCount({
        skip: (page - 1) * limit,
        take: limit,
        order: { createdAt: 'DESC' },
      });
    }

    return { users, total, page, limit };
  }

  async validateUserPassword(email: string, password: string): Promise<User> {
    const user = await this.userRepository.findByEmail(email);
    if (!user) {
      throw new AppError('Invalid credentials', 401);
    }

    const isValidPassword = await user.validatePassword(password);
    if (!isValidPassword) {
      throw new AppError('Invalid credentials', 401);
    }

    return user;
  }

  async findById(id: string): Promise<User | null> {
    return this.userRepository.findById(id);
  }
}
