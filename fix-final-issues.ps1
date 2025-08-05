# Navigate to the services directory
Set-Location "C:\Dugsinet\SIMS-backend\src\services"

# Create the AuditService.ts file
$auditServiceContent = @"
import { AppDataSource } from '../config/database';
import { AuditLog } from '../entities/AuditLog';

export interface AuthEventData {
  email?: string;
  role?: string;
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
}

export class AuditService {
  private auditRepository = AppDataSource.getRepository(AuditLog);

  async logAuthEvent(action: string, userId: string | null, data: AuthEventData): Promise<void> {
    try {
      const auditLog = this.auditRepository.create({
        action,
        userId,
        entityType: 'auth',
        entityId: null,
        oldValues: null,
        newValues: data,
        ipAddress: data.ipAddress,
        userAgent: data.userAgent,
        timestamp: new Date()
      });

      await this.auditRepository.save(auditLog);
    } catch (error) {
      console.error('Failed to log auth event:', error);
    }
  }

  async logSystemEvent(action: string, userId: string | null, data: SystemEventData): Promise<void> {
    try {
      const auditLog = this.auditRepository.create({
        action,
        userId,
        entityType: 'system',
        entityId: null,
        oldValues: null,
        newValues: data,
        ipAddress: data.ipAddress,
        userAgent: data.userAgent,
        timestamp: new Date()
      });

      await this.auditRepository.save(auditLog);
    } catch (error) {
      console.error('Failed to log system event:', error);
    }
  }

  async logCreate(entityType: string, entityId: string, newValues: any, userId: string): Promise<void> {
    try {
      const auditLog = this.auditRepository.create({
        action: 'CREATE',
        userId,
        entityType,
        entityId,
        oldValues: null,
        newValues,
        timestamp: new Date()
      });

      await this.auditRepository.save(auditLog);
    } catch (error) {
      console.error('Failed to log create event:', error);
    }
  }

  async logUpdate(entityType: string, entityId: string, oldValues: any, newValues: any, userId: string): Promise<void> {
    try {
      const auditLog = this.auditRepository.create({
        action: 'UPDATE',
        userId,
        entityType,
        entityId,
        oldValues,
        newValues,
        timestamp: new Date()
      });

      await this.auditRepository.save(auditLog);
    } catch (error) {
      console.error('Failed to log update event:', error);
    }
  }

  async logDelete(entityType: string, entityId: string, oldValues: any, userId: string): Promise<void> {
    try {
      const auditLog = this.auditRepository.create({
        action: 'DELETE',
        userId,
        entityType,
        entityId,
        oldValues,
        newValues: null,
        timestamp: new Date()
      });

      await this.auditRepository.save(auditLog);
    } catch (error) {
      console.error('Failed to log delete event:', error);
    }
  }

  async logDataAccess(userId: string, resource: string, action: string, details?: any): Promise<void> {
    try {
      const auditLog = this.auditRepository.create({
        action: `DATA_ACCESS_`${action.toUpperCase()}`,
        userId,
        entityType: 'data_access',
        entityId: resource,
        oldValues: null,
        newValues: details,
        timestamp: new Date()
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
      const auditLog = this.auditRepository.create({
        action: `DB_`${data.operation.toUpperCase()}`,
        userId: data.userId || null,
        entityType: 'database',
        entityId: data.table,
        oldValues: null,
        newValues: data.details,
        timestamp: new Date()
      });

      await this.auditRepository.save(auditLog);
    } catch (error) {
      console.error('Failed to log database operation:', error);
    }
  }
}
"@

# Write the AuditService.ts file
$auditServiceContent | Out-File -FilePath "AuditService.ts" -Encoding UTF8
Write-Host "Created AuditService.ts"

# Navigate back to project root
Set-Location "C:\Dugsinet\SIMS-backend"

# Run the build
Write-Host "Running npm run build..."
npm run build