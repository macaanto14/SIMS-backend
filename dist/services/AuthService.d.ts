import { User } from '../entities/User';
import { AuditService } from '../services/AuditService';
import { RBACService, UserPermission } from './RBACService';
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
export declare class AuthService {
    private userRepository;
    private roleRepository;
    private userRoleRepository;
    private auditService;
    private rbacService;
    constructor(auditService: AuditService, rbacService: RBACService);
    login(data: LoginData, ipAddress?: string, userAgent?: string): Promise<AuthResult>;
    register(data: RegisterData, ipAddress?: string, userAgent?: string): Promise<AuthResult>;
    logout(userId: string, ipAddress?: string, userAgent?: string): Promise<void>;
    validateToken(token: string): Promise<User | null>;
    private generateToken;
    refreshToken(oldToken: string): Promise<string>;
}
//# sourceMappingURL=AuthService.d.ts.map