import { User } from '../entities/User';
import { BaseRepository } from './BaseRepository';
export declare class UserRepository extends BaseRepository<User> {
    private userRoleRepository;
    constructor();
    findByEmail(email: string): Promise<User | null>;
    findBySchool(schoolId: string, options: {
        page: number;
        limit: number;
    }): Promise<[User[], number]>;
    findByRole(roleName: string, schoolId?: string): Promise<User[]>;
    updateLastLogin(userId: string, ipAddress?: string): Promise<void>;
    updatePassword(userId: string, hashedPassword: string): Promise<void>;
    setResetPasswordToken(userId: string, token: string, expiresAt: Date): Promise<void>;
    verifyEmail(userId: string): Promise<void>;
    findActiveUsers(schoolId?: string): Promise<User[]>;
}
//# sourceMappingURL=UserRepository.d.ts.map