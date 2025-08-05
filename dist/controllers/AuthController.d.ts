import { Request, Response } from 'express';
import { AuthService } from '../services/AuthService';
import { RBACService } from '../services/RBACService';
import { AuditService } from '../services/AuditService';
export declare class AuthController {
    private authService;
    private rbacService;
    private auditService;
    constructor(authService: AuthService, rbacService: RBACService, auditService: AuditService);
    register: (req: Request, res: Response) => Promise<void>;
    login: (req: Request, res: Response) => Promise<void>;
    logout: (req: Request, res: Response) => Promise<void>;
    refreshToken: (req: Request, res: Response) => Promise<void>;
    getProfile: (req: Request, res: Response) => Promise<void>;
}
//# sourceMappingURL=AuthController.d.ts.map