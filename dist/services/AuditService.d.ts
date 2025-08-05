export interface AuthEventData {
    email?: string;
    role?: string;
    roles?: string[];
    schoolId?: string | null;
    reason?: string;
    success: boolean;
    ipAddress?: string;
    userAgent?: string;
    error?: string;
}
export interface SystemEventData {
    resource?: string;
    action?: string;
    details?: any;
    ipAddress?: string;
    userAgent?: string;
    reason?: string;
    requiredRoles?: string[];
    userRoles?: string[];
    requiredPermission?: {
        module: string;
        action: string;
    };
    schoolId?: string;
    userSchoolContexts?: string[];
    endpoint?: string;
    method?: string;
}
export declare class AuditService {
    private auditRepository;
    logAuthEvent(action: string, userId: string | null, data: AuthEventData): Promise<void>;
    logSystemEvent(action: string, userId: string | null, data: SystemEventData): Promise<void>;
    logCreate(entityType: string, entityId: string, newValues: any, userId: string): Promise<void>;
    logUpdate(entityType: string, entityId: string, oldValues: any, newValues: any, userId: string): Promise<void>;
    logDelete(entityType: string, entityId: string, oldValues: any, userId: string): Promise<void>;
    logDataAccess(userId: string, resource: string, action: string, details?: any): Promise<void>;
    logDatabaseOperation(data: {
        operation: string;
        table: string;
        userId?: string;
        details?: any;
    }): Promise<void>;
}
//# sourceMappingURL=AuditService.d.ts.map