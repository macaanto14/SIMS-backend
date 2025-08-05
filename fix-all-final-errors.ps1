# Navigate to project root
Set-Location "C:\Dugsinet\SIMS-backend"

Write-Host "Fixing all compilation errors..." -ForegroundColor Green

# 1. Fix UserService.ts - Remove duplicate methods and fix repository calls
$userServiceContent = @'
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
'@

Write-Host "Writing UserService.ts..." -ForegroundColor Yellow
$userServiceContent | Out-File -FilePath "src\services\UserService.ts" -Encoding UTF8

# 2. Fix AuthService.ts - Fix JWT expiresIn type issue
Write-Host "Fixing AuthService.ts JWT issue..." -ForegroundColor Yellow
$authServiceContent = Get-Content "src\services\AuthService.ts" -Raw

$newGenerateTokenMethod = @'
private generateToken(payload: TokenPayload): string {
    const secret = process.env.JWT_SECRET;
    if (!secret) {
      throw new Error('JWT_SECRET environment variable is not set');
    }
    
    const expiresIn = process.env.JWT_EXPIRES_IN || '24h';
    
    const options: jwt.SignOptions = {
      expiresIn: expiresIn as string
    };
    
    return jwt.sign(payload, secret, options);
  }
'@

$authServiceContent = $authServiceContent -replace 'private generateToken\(payload: TokenPayload\): string \{[\s\S]*?return jwt\.sign\(payload, secret, options\);[\s\S]*?\}', $newGenerateTokenMethod
$authServiceContent | Out-File -FilePath "src\services\AuthService.ts" -Encoding UTF8

# 3. Fix middleware/auth.ts - Fix SchoolContext type issue
Write-Host "Fixing middleware/auth.ts SchoolContext issue..." -ForegroundColor Yellow
$authMiddlewareContent = Get-Content "src\middleware\auth.ts" -Raw
$authMiddlewareContent = $authMiddlewareContent -replace 'userSchoolContexts: schoolContexts,', 'userSchoolContexts: schoolContexts.map(sc => sc.schoolId),'
$authMiddlewareContent | Out-File -FilePath "src\middleware\auth.ts" -Encoding UTF8

Write-Host "All fixes applied. Running build..." -ForegroundColor Green
npm run build
