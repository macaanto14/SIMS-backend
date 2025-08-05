import { Response } from 'express';
export interface ApiResponse<T = any> {
    success: boolean;
    message: string;
    data: T | null;
    meta: {
        timestamp: string;
        requestId: string;
        [key: string]: any;
    };
    errors?: any[];
}
export interface PaginationMeta {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    itemsPerPage: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
    itemsInCurrentPage: number;
}
export declare const successResponse: <T = any>(res: Response, data?: T | null, message?: string, statusCode?: number, meta?: Record<string, any>) => Response;
export declare const errorResponse: (res: Response, message?: string, statusCode?: number, errors?: any, meta?: Record<string, any>) => Response;
export declare const paginatedResponse: <T = any>(res: Response, data: T[], pagination: PaginationMeta, message?: string, statusCode?: number) => Response;
export declare const createdResponse: <T = any>(res: Response, data: T, message?: string, location?: string | null) => Response;
//# sourceMappingURL=response.d.ts.map