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

const generateRequestId = (): string => {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
};

export const successResponse = <T = any>(
  res: Response,
  data: T | null = null,
  message: string = 'Success',
  statusCode: number = 200,
  meta: Record<string, any> = {}
): Response => {
  const response: ApiResponse<T> = {
    success: true,
    message,
    data,
    meta: {
      timestamp: new Date().toISOString(),
      requestId: res.locals.requestId || generateRequestId(),
      ...meta
    }
  };

  return res.status(statusCode).json(response);
};

export const errorResponse = (
  res: Response,
  message: string = 'Internal server error',
  statusCode: number = 500,
  errors: any = null,
  meta: Record<string, any> = {}
): Response => {
  const response: ApiResponse = {
    success: false,
    message,
    data: null,
    meta: {
      timestamp: new Date().toISOString(),
      requestId: res.locals.requestId || generateRequestId(),
      ...meta
    }
  };

  if (errors) {
    response.errors = Array.isArray(errors) ? errors : [errors];
  }

  return res.status(statusCode).json(response);
};

export const paginatedResponse = <T = any>(
  res: Response,
  data: T[],
  pagination: PaginationMeta,
  message: string = 'Data retrieved successfully',
  statusCode: number = 200
): Response => {
  return successResponse(res, data, message, statusCode, { pagination });
};

export const createdResponse = <T = any>(
  res: Response,
  data: T,
  message: string = 'Resource created successfully',
  location: string | null = null
): Response => {
  if (location) {
    res.set('Location', location);
  }

  return successResponse(res, data, message, 201, {
    resourceLocation: location
  });
};