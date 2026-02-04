/**
 * Central Error Handler Middleware
 * Handles all errors in a consistent format
 */

/**
 * Custom error class for application errors
 */
class AppError extends Error {
    /**
     * @param {string} message - Human-readable message (demo-safe)
     * @param {number} statusCode - HTTP status code
     * @param {string} errorCode - Stable, safe error code (e.g. AUTHENTICATION_REQUIRED)
     * @param {Object} [meta] - Optional non-sensitive metadata for observability
     */
    constructor(message, statusCode, errorCode, meta = {}) {
        super(message);
        this.statusCode = statusCode;
        this.errorCode = errorCode || 'INTERNAL_ERROR';
        this.isOperational = true;
        this.meta = meta;
        
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
    const meta = err.meta && typeof err.meta === 'object' ? err.meta : {};
    
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
    
    // Demo-safe error messages: Clear, explainable, no sensitive data exposure
    // Don't expose internal errors in production
    const isDevelopment = process.env.NODE_ENV === 'development';
    const isDemo = process.env.NODE_ENV === 'demo' || isDevelopment;
    
    if (!isDemo && statusCode === 500) {
        message = 'Internal server error. Please try again later or contact support.';
    }
    
    // Build error response with explainable information
    const errorResponse = {
        success: false,
        error: errorCode,
        message: message
    };
    
    // Add helpful hints for common errors (demo-safe)
    if (errorCode === 'VALIDATION_ERROR' && err.errors) {
        errorResponse.errors = err.errors;
        errorResponse.hint = 'Please check the validation errors above and correct your input.';
    }
    
    if (errorCode === 'RATE_LIMIT_EXCEEDED') {
        errorResponse.hint = 'Rate limiting protects the system from abuse. Please wait before trying again.';
    }
    
    if (errorCode === 'INVALID_TOKEN' || errorCode === 'TOKEN_EXPIRED') {
        errorResponse.hint = 'Your session may have expired. Please log in again.';
    }
    
    if (errorCode === 'DUPLICATE_ENTRY') {
        errorResponse.hint = 'This record already exists. Use a different identifier or update the existing record.';
    }
    
    // Add meta if explicitly provided and demo-safe (non-sensitive)
    if (Object.keys(meta).length > 0) {
        errorResponse.meta = meta;
    }
    
    // Add development/debugging info only in development
    if (isDevelopment) {
        errorResponse.debug = {
            stack: err.stack,
            details: {
                name: err.name,
                code: err.code,
                statusCode: statusCode
            }
        };
    }
    
    // Send error response
    res.status(statusCode).json(errorResponse);
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
