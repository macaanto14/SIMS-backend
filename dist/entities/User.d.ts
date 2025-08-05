import { BaseEntity } from './base/BaseEntity';
import { School } from './School';
import { UserRole } from './UserRole';
import { TeacherProfile } from './TeacherProfile';
import { StudentProfile } from './StudentProfile';
import { ParentProfile } from './ParentProfile';
import { AuditLog } from './AuditLog';
export declare class User extends BaseEntity {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    phone: string | null;
    avatar: string | null;
    emailVerified: boolean;
    emailVerifiedAt: Date | null;
    resetPasswordToken: string | null;
    resetPasswordExpires: Date | null;
    lastLoginAt: Date | null;
    lastLoginIp: string | null;
    preferences: Record<string, any> | null;
    metadata: Record<string, any> | null;
    schoolId: string | null;
    school: School | null;
    userRoles: UserRole[];
    teacherProfile: TeacherProfile[];
    studentProfile: StudentProfile[];
    parentProfile: ParentProfile[];
    auditLogs: AuditLog[];
    get fullName(): string;
    get displayName(): string;
    hashPassword(): Promise<void>;
    validatePassword(password: string): Promise<boolean>;
    toJSON(): Omit<this, "generateId" | "updateTimestamp" | "password" | "resetPasswordToken" | "hashPassword" | "fullName" | "displayName" | "validatePassword" | "toJSON">;
}
//# sourceMappingURL=User.d.ts.map