"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createdResponse = exports.paginatedResponse = exports.errorResponse = exports.successResponse = void 0;
const generateRequestId = () => {
    return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
};
const successResponse = (res, data = null, message = 'Success', statusCode = 200, meta = {}) => {
    const response = {
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
exports.successResponse = successResponse;
const errorResponse = (res, message = 'Internal server error', statusCode = 500, errors = null, meta = {}) => {
    const response = {
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
exports.errorResponse = errorResponse;
const paginatedResponse = (res, data, pagination, message = 'Data retrieved successfully', statusCode = 200) => {
    return (0, exports.successResponse)(res, data, message, statusCode, { pagination });
};
exports.paginatedResponse = paginatedResponse;
const createdResponse = (res, data, message = 'Resource created successfully', location = null) => {
    if (location) {
        res.set('Location', location);
    }
    return (0, exports.successResponse)(res, data, message, 201, {
        resourceLocation: location
    });
};
exports.createdResponse = createdResponse;
//# sourceMappingURL=response.js.map