import { AppDataSource } from '../config/database';
import { AuditLog, OperationType } from '../entities/AuditLog';

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
  requiredPermission?: { module: string; action: string };
  schoolId?: string;
  userSchoolContexts?: string[];
  endpoint?: string;
  method?: string;
}

export class AuditService {
  private auditRepository = AppDataSource.getRepository(AuditLog);

  async logAuthEvent(action: string, userId: string | null, data: AuthEventData): Promise<void> {
    try {
      // Map auth actions to valid OperationType values
      let operationType: OperationType;
      switch (action.toUpperCase()) {
        case 'LOGIN':
          operationType = OperationType.LOGIN;
          break;
        case 'LOGOUT':
          operationType = OperationType.LOGOUT;
          break;
        case 'REGISTER':
        case 'CREATE':
          operationType = OperationType.CREATE;
          break;
        default:
          operationType = OperationType.ACCESS;
      }

      const auditLog = this.auditRepository.create({
        operationType,
        tableName: 'auth',
        recordId: null,
        userId,
        userEmail: data.email || null,
        userRole: data.role || null,
        ipAddress: data.ipAddress || null,
        userAgent: data.userAgent || null,
        module: 'auth',
        action: action,
        description: `Auth event: ${action}`,
        oldValues: null,
        newValues: data,
        success: data.success,
        errorMessage: data.error || null
      });

      await this.auditRepository.save(auditLog);
    } catch (error) {
      console.error('Failed to log auth event:', error);
    }
  }

  async logSystemEvent(action: string, userId: string | null, data: SystemEventData): Promise<void> {
    try {
      const auditLog = this.auditRepository.create({
        operationType: OperationType.ACCESS,
        tableName: 'system',
        recordId: null,
        userId,
        ipAddress: data.ipAddress || null,
        userAgent: data.userAgent || null,
        module: data.resource || 'system',
        action: action,
        description: `System event: ${action}`,
        oldValues: null,
        newValues: data,
        success: true
      });

      await this.auditRepository.save(auditLog);
    } catch (error) {
      console.error('Failed to log system event:', error);
    }
  }

  async logCreate(entityType: string, entityId: string, newValues: any, userId: string): Promise<void> {
    try {
      const auditLog = this.auditRepository.create({
        operationType: OperationType.CREATE,
        tableName: entityType,
        recordId: entityId,
        userId,
        module: entityType,
        action: 'CREATE',
        description: `Created ${entityType} record`,
        oldValues: null,
        newValues,
        success: true
      });

      await this.auditRepository.save(auditLog);
    } catch (error) {
      console.error('Failed to log create event:', error);
    }
  }

  async logUpdate(entityType: string, entityId: string, oldValues: any, newValues: any, userId: string): Promise<void> {
    try {
      const auditLog = this.auditRepository.create({
        operationType: OperationType.UPDATE,
        tableName: entityType,
        recordId: entityId,
        userId,
        module: entityType,
        action: 'UPDATE',
        description: `Updated ${entityType} record`,
        oldValues,
        newValues,
        success: true
      });

      await this.auditRepository.save(auditLog);
    } catch (error) {
      console.error('Failed to log update event:', error);
    }
  }

  async logDelete(entityType: string, entityId: string, oldValues: any, userId: string): Promise<void> {
    try {
      const auditLog = this.auditRepository.create({
        operationType: OperationType.DELETE,
        tableName: entityType,
        recordId: entityId,
        userId,
        module: entityType,
        action: 'DELETE',
        description: `Deleted ${entityType} record`,
        oldValues,
        newValues: null,
        success: true
      });

      await this.auditRepository.save(auditLog);
    } catch (error) {
      console.error('Failed to log delete event:', error);
    }
  }

  async logDataAccess(userId: string, resource: string, action: string, details?: any): Promise<void> {
    try {
      const auditLog = this.auditRepository.create({
        operationType: OperationType.ACCESS,
        tableName: resource,
        recordId: null,
        userId,
        module: resource,
        action: `DATA_ACCESS_${action.toUpperCase()}`,
        description: `Data access: ${action} on ${resource}`,
        oldValues: null,
        newValues: details,
        success: true
      });

      await this.auditRepository.save(auditLog);
    } catch (error) {
      console.error('Failed to log data access event:', error);
    }
  }

  async logDatabaseOperation(data: {
    operation: string;
    table: string;
    userId?: string;
    details?: any;
  }): Promise<void> {
    try {
      // Map database operations to valid OperationType values
      let operationType: OperationType;
      switch (data.operation.toUpperCase()) {
        case 'CREATE':
        case 'INSERT':
          operationType = OperationType.CREATE;
          break;
        case 'UPDATE':
          operationType = OperationType.UPDATE;
          break;
        case 'DELETE':
          operationType = OperationType.DELETE;
          break;
        default:
          operationType = OperationType.ACCESS;
      }

      const auditLog = this.auditRepository.create({
        operationType,
        tableName: data.table,
        recordId: null,
        userId: data.userId || null,
        module: 'database',
        action: `DB_${data.operation.toUpperCase()}`,
        description: `Database operation: ${data.operation} on ${data.table}`,
        oldValues: null,
        newValues: data.details,
        success: true
      });

      await this.auditRepository.save(auditLog);
    } catch (error) {
      console.error('Failed to log database operation:', error);
    }
  }
}
