"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.errorHandler = void 0;
const AppError_1 = require("../utils/AppError");
const errorHandler = (error, req, res, next) => {
    let appError = error;
    if (!(error instanceof AppError_1.AppError)) {
        if (error.name === 'ValidationError') {
            appError = new AppError_1.AppError(error.message, 400, 'VALIDATION_ERROR');
        }
        else if (error.name === 'CastError') {
            appError = new AppError_1.AppError('Invalid data format', 400, 'VALIDATION_ERROR');
        }
        else {
            appError = new AppError_1.AppError(process.env.NODE_ENV === 'production' ? 'Internal server error' : error.message, 500, 'INTERNAL_ERROR');
        }
    }
    const response = {
        success: false,
        message: appError.message,
        code: appError.code || 'INTERNAL_ERROR',
        timestamp: new Date().toISOString()
    };
    return res.status(appError.statusCode || 500).json(response);
};
exports.errorHandler = errorHandler;
//# sourceMappingURL=errorHandler.js.map