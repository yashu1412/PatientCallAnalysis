"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.errorMiddleware = void 0;
const logger_1 = require("../utils/logger");
const errorMiddleware = (err, _req, res, _next) => {
    const statusCode = err.statusCode || 500;
    const message = err.message || "Internal Server Error";
    logger_1.logger.error("Unhandled error", { message, stack: err.stack });
    res.status(statusCode).json({
        success: false,
        error: message,
    });
};
exports.errorMiddleware = errorMiddleware;
