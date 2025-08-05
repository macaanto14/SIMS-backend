export declare class AppError extends Error {
    readonly statusCode: number;
    readonly code: string;
    readonly details: any;
    readonly timestamp: string;
    readonly isOperational: boolean;
    constructor(message: string, statusCode?: number, code?: string, details?: any);
    toJSON(): {
        name: string;
        message: string;
        statusCode: number;
        code: string;
        details: any;
        timestamp: string;
        stack: string | undefined;
    };
}
export declare class ValidationError extends AppError {
    constructor(message: string, details?: any);
}
export declare class AuthenticationError extends AppError {
    constructor(message?: string, details?: any);
}
export declare class AuthorizationError extends AppError {
    constructor(message?: string, details?: any);
}
export declare class NotFoundError extends AppError {
    constructor(resource?: string, identifier?: string | null);
}
export declare class ConflictError extends AppError {
    constructor(message?: string, details?: any);
}
export declare class DatabaseError extends AppError {
    readonly originalError: Error | null;
    constructor(message: string, originalError?: Error | null);
}
//# sourceMappingURL=AppError.d.ts.map