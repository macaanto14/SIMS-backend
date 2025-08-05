import { Request, Response, NextFunction } from 'express';
import { UserService } from '../services/UserService';
import { AuditService } from '../services/AuditService';
import { RBACService } from '../services/RBACService';
export declare class AuthMiddleware {
    private userService;
    private auditService;
    private rbacService;
    constructor(userService: UserService, auditService: AuditService, rbacService: RBACService);
    authenticate: (req: Request, res: Response, next: NextFunction) => Promise<void>;
    requireRole: (requiredRoles: string | string[]) => (req: Request, res: Response, next: NextFunction) => Promise<void>;
    requirePermission: (module: string, action: string) => (req: Request, res: Response, next: NextFunction) => Promise<void>;
    requireSchoolAccess: (req: Request, res: Response, next: NextFunction) => Promise<void>;
}
//# sourceMappingURL=auth.d.ts.map