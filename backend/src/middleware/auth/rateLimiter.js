/**
 * Rate Limiting Middleware for OTP Requests
 * Prevents abuse of OTP generation endpoint
 */

const otpService = require('../../services/otp/demoOtpService');

/**
 * Rate limiting middleware for OTP requests
 * Uses the OTP service's rate limiting
 */
function otpRateLimiter(req, res, next) {
    const phoneNumber = req.body.phoneNumber || req.query.phoneNumber;
    
    if (!phoneNumber) {
        return res.status(400).json({
            success: false,
            error: 'PHONE_NUMBER_REQUIRED',
            message: 'Phone number is required'
        });
    }
    
    const rateLimit = otpService.checkRateLimit(phoneNumber);
    
    if (!rateLimit.allowed) {
        return res.status(429).json({
            success: false,
            error: 'RATE_LIMIT_EXCEEDED',
            message: 'Too many OTP requests. Please try again later.',
            resetAt: rateLimit.resetAt,
            remainingAttempts: 0
        });
    }
    
    // Add rate limit info to request for response
    req.rateLimitInfo = {
        remainingAttempts: rateLimit.remainingAttempts,
        resetAt: rateLimit.resetAt
    };
    
    next();
}

module.exports = {
    otpRateLimiter
};
