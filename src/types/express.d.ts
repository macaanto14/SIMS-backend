import { UserPermission } from '../services/RBACService';

declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email: string;
        firstName: string;
        lastName: string;
        fullName?: string;
        displayName?: string;
        phone?: string;
        avatar?: string;
        schoolId?: string | null;
        lastLoginAt?: Date;
        roles?: string[];
        permissions?: UserPermission[];
      };
      userPermissions?: UserPermission[];
      schoolId?: string;
    }
  }
}