/**
 * Central Error Handler Middleware
 * Handles all errors in a consistent format
 */

/**
 * Custom error class for application errors
 */
class AppError extends Error {
    constructor(message, statusCode, errorCode) {
        super(message);
        this.statusCode = statusCode;
        this.errorCode = errorCode || 'INTERNAL_ERROR';
        this.isOperational = true;
        
        Error.captureStackTrace(this, this.constructor);
    }
}

/**
 * Central error handler middleware
 * Must be the last middleware in the chain
 */
function errorHandler(err, req, res, next) {
    // Log error
    console.error('Error:', {
        message: err.message,
        stack: err.stack,
        url: req.originalUrl,
        method: req.method,
        ip: req.ip,
        user: req.user ? req.user.userId : 'anonymous'
    });
    
    // Default error
    let statusCode = err.statusCode || 500;
    let errorCode = err.errorCode || 'INTERNAL_ERROR';
    let message = err.message || 'Internal server error';
    
    // Handle known error types
    if (err.name === 'ValidationError') {
        statusCode = 400;
        errorCode = 'VALIDATION_ERROR';
        message = err.message || 'Validation error';
    } else if (err.name === 'UnauthorizedError' || err.name === 'JsonWebTokenError') {
        statusCode = 401;
        errorCode = 'INVALID_TOKEN';
        message = 'Invalid or expired token';
    } else if (err.name === 'TokenExpiredError') {
        statusCode = 401;
        errorCode = 'TOKEN_EXPIRED';
        message = 'Token has expired';
    } else if (err.code === '23505') { // PostgreSQL unique violation
        statusCode = 409;
        errorCode = 'DUPLICATE_ENTRY';
        message = 'Duplicate entry. This record already exists.';
    } else if (err.code === '23503') { // PostgreSQL foreign key violation
        statusCode = 400;
        errorCode = 'FOREIGN_KEY_VIOLATION';
        message = 'Invalid reference. Related record does not exist.';
    } else if (err.code === '23502') { // PostgreSQL not null violation
        statusCode = 400;
        errorCode = 'REQUIRED_FIELD_MISSING';
        message = 'Required field is missing.';
    } else if (err instanceof AppError) {
        // Use AppError properties
        statusCode = err.statusCode;
        errorCode = err.errorCode;
        message = err.message;
    }
    
    // Don't expose internal errors in production
    if (process.env.NODE_ENV === 'production' && statusCode === 500) {
        message = 'Internal server error';
    }
    
    // Send error response
    res.status(statusCode).json({
        success: false,
        error: errorCode,
        message: message,
        ...(process.env.NODE_ENV === 'development' && {
            stack: err.stack,
            details: err
        })
    });
}

/**
 * Async error wrapper - catches errors in async route handlers
 * @param {Function} fn - Async route handler function
 * @returns {Function} Wrapped function
 */
function asyncHandler(fn) {
    return (req, res, next) => {
        Promise.resolve(fn(req, res, next)).catch(next);
    };
}

/**
 * 404 Not Found handler
 */
function notFoundHandler(req, res, next) {
    const error = new AppError(
        `Route ${req.originalUrl} not found`,
        404,
        'NOT_FOUND'
    );
    next(error);
}

module.exports = {
    AppError,
    errorHandler,
    asyncHandler,
    notFoundHandler
};
