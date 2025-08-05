"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuditService = void 0;
const database_1 = require("../config/database");
const AuditLog_1 = require("../entities/AuditLog");
class AuditService {
    constructor() {
        this.auditRepository = database_1.AppDataSource.getRepository(AuditLog_1.AuditLog);
    }
    async logAuthEvent(action, userId, data) {
        try {
            let operationType;
            switch (action.toUpperCase()) {
                case 'LOGIN':
                    operationType = AuditLog_1.OperationType.LOGIN;
                    break;
                case 'LOGOUT':
                    operationType = AuditLog_1.OperationType.LOGOUT;
                    break;
                case 'REGISTER':
                case 'CREATE':
                    operationType = AuditLog_1.OperationType.CREATE;
                    break;
                default:
                    operationType = AuditLog_1.OperationType.ACCESS;
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
        }
        catch (error) {
            console.error('Failed to log auth event:', error);
        }
    }
    async logSystemEvent(action, userId, data) {
        try {
            const auditLog = this.auditRepository.create({
                operationType: AuditLog_1.OperationType.ACCESS,
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
        }
        catch (error) {
            console.error('Failed to log system event:', error);
        }
    }
    async logCreate(entityType, entityId, newValues, userId) {
        try {
            const auditLog = this.auditRepository.create({
                operationType: AuditLog_1.OperationType.CREATE,
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
        }
        catch (error) {
            console.error('Failed to log create event:', error);
        }
    }
    async logUpdate(entityType, entityId, oldValues, newValues, userId) {
        try {
            const auditLog = this.auditRepository.create({
                operationType: AuditLog_1.OperationType.UPDATE,
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
        }
        catch (error) {
            console.error('Failed to log update event:', error);
        }
    }
    async logDelete(entityType, entityId, oldValues, userId) {
        try {
            const auditLog = this.auditRepository.create({
                operationType: AuditLog_1.OperationType.DELETE,
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
        }
        catch (error) {
            console.error('Failed to log delete event:', error);
        }
    }
    async logDataAccess(userId, resource, action, details) {
        try {
            const auditLog = this.auditRepository.create({
                operationType: AuditLog_1.OperationType.ACCESS,
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
        }
        catch (error) {
            console.error('Failed to log data access event:', error);
        }
    }
    async logDatabaseOperation(data) {
        try {
            let operationType;
            switch (data.operation.toUpperCase()) {
                case 'CREATE':
                case 'INSERT':
                    operationType = AuditLog_1.OperationType.CREATE;
                    break;
                case 'UPDATE':
                    operationType = AuditLog_1.OperationType.UPDATE;
                    break;
                case 'DELETE':
                    operationType = AuditLog_1.OperationType.DELETE;
                    break;
                default:
                    operationType = AuditLog_1.OperationType.ACCESS;
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
        }
        catch (error) {
            console.error('Failed to log database operation:', error);
        }
    }
}
exports.AuditService = AuditService;
//# sourceMappingURL=AuditService.js.map