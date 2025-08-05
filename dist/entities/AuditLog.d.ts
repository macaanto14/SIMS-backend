import { BaseEntity } from './base/BaseEntity';
import { User } from './User';
import { School } from './School';
export declare enum OperationType {
    CREATE = "CREATE",
    UPDATE = "UPDATE",
    DELETE = "DELETE",
    LOGIN = "LOGIN",
    LOGOUT = "LOGOUT",
    ACCESS = "ACCESS"
}
export declare class AuditLog extends BaseEntity {
    operationType: OperationType;
    tableName: string;
    recordId: string | null;
    userEmail: string | null;
    userRole: string | null;
    ipAddress: string | null;
    userAgent: string | null;
    module: string | null;
    action: string | null;
    description: string | null;
    oldValues: Record<string, any> | null;
    newValues: Record<string, any> | null;
    changedFields: string[] | null;
    success: boolean;
    errorMessage: string | null;
    durationMs: number | null;
    requestId: string | null;
    sessionId: string | null;
    schoolName: string | null;
    fieldsChanged: number;
    userId: string | null;
    schoolId: string | null;
    user: User | null;
    school: School | null;
}
//# sourceMappingURL=AuditLog.d.ts.map