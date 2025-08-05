import { UserRepository } from '../repositories/UserRepository';
import { User } from '../entities/User';
import { UserQueryDto } from '../dto/UserDto';
import { AuditService } from './AuditService';
export declare class UserService {
    private userRepository;
    private auditService;
    constructor(userRepository: UserRepository, auditService: AuditService);
    createUser(userData: any, createdBy?: string): Promise<User>;
    updateUser(id: string, updateData: any, updatedBy?: string): Promise<User>;
    deleteUser(id: string, deletedBy?: string): Promise<void>;
    getUserById(id: string): Promise<User>;
    getUserByEmail(email: string): Promise<User>;
    getUsers(query: UserQueryDto): Promise<{
        users: User[];
        total: number;
        page: number;
        limit: number;
    }>;
    validateUserPassword(email: string, password: string): Promise<User>;
    findById(id: string): Promise<User | null>;
}
//# sourceMappingURL=UserService.d.ts.map