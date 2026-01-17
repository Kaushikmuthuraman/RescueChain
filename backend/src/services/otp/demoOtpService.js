/**
 * Demo OTP Service for Victims
 * Fixed OTP: 123456 (no SMS/Firebase)
 * Includes rate limiting to prevent abuse
 */

// Fixed demo OTP
const DEMO_OTP = '123456';

// Rate limiting storage (in-memory, use Redis in production)
const otpAttempts = new Map();
const RATE_LIMIT_WINDOW = 15 * 60 * 1000; // 15 minutes
const MAX_ATTEMPTS = 5; // Max 5 attempts per window

/**
 * Clean up old entries from rate limit map
 */
function cleanupRateLimit() {
    const now = Date.now();
    for (const [phone, data] of otpAttempts.entries()) {
        if (now - data.windowStart > RATE_LIMIT_WINDOW) {
            otpAttempts.delete(phone);
        }
    }
}

/**
 * Check if phone number is rate limited
 * @param {string} phoneNumber - Phone number to check
 * @returns {Object} { allowed: boolean, remainingAttempts: number, resetAt: Date }
 */
function checkRateLimit(phoneNumber) {
    cleanupRateLimit();
    
    const now = Date.now();
    const phoneData = otpAttempts.get(phoneNumber);
    
    if (!phoneData) {
        // First attempt for this phone
        otpAttempts.set(phoneNumber, {
            attempts: 1,
            windowStart: now
        });
        return {
            allowed: true,
            remainingAttempts: MAX_ATTEMPTS - 1,
            resetAt: new Date(now + RATE_LIMIT_WINDOW)
        };
    }
    
    // Check if window has expired
    if (now - phoneData.windowStart > RATE_LIMIT_WINDOW) {
        // Reset window
        phoneData.attempts = 1;
        phoneData.windowStart = now;
        return {
            allowed: true,
            remainingAttempts: MAX_ATTEMPTS - 1,
            resetAt: new Date(now + RATE_LIMIT_WINDOW)
        };
    }
    
    // Check if max attempts reached
    if (phoneData.attempts >= MAX_ATTEMPTS) {
        return {
            allowed: false,
            remainingAttempts: 0,
            resetAt: new Date(phoneData.windowStart + RATE_LIMIT_WINDOW)
        };
    }
    
    // Increment attempts
    phoneData.attempts++;
    return {
        allowed: true,
        remainingAttempts: MAX_ATTEMPTS - phoneData.attempts,
        resetAt: new Date(phoneData.windowStart + RATE_LIMIT_WINDOW)
    };
}

/**
 * Record an OTP attempt (for rate limiting)
 * @param {string} phoneNumber - Phone number
 */
function recordAttempt(phoneNumber) {
    const phoneData = otpAttempts.get(phoneNumber);
    if (phoneData) {
        phoneData.attempts++;
    } else {
        otpAttempts.set(phoneNumber, {
            attempts: 1,
            windowStart: Date.now()
        });
    }
}

/**
 * Reset rate limit for a phone number (after successful verification)
 * @param {string} phoneNumber - Phone number
 */
function resetRateLimit(phoneNumber) {
    otpAttempts.delete(phoneNumber);
}

/**
 * Generate OTP (demo - returns fixed OTP)
 * @param {string} phoneNumber - Phone number
 * @returns {string} Fixed demo OTP
 */
function generateOTP(phoneNumber) {
    // In demo mode, always return fixed OTP
    // No SMS sent, no Firebase
    return DEMO_OTP;
}

/**
 * Verify OTP
 * @param {string} phoneNumber - Phone number
 * @param {string} otp - OTP to verify
 * @returns {boolean} True if OTP is correct
 */
function verifyOTP(phoneNumber, otp) {
    // Check rate limit first
    const rateLimit = checkRateLimit(phoneNumber);
    if (!rateLimit.allowed) {
        return {
            valid: false,
            error: 'RATE_LIMIT_EXCEEDED',
            resetAt: rateLimit.resetAt
        };
    }
    
    // Record attempt
    recordAttempt(phoneNumber);
    
    // Verify OTP (fixed demo OTP)
    if (otp === DEMO_OTP) {
        // Reset rate limit on success
        resetRateLimit(phoneNumber);
        return {
            valid: true,
            error: null
        };
    }
    
    // Invalid OTP
    const remaining = checkRateLimit(phoneNumber);
    return {
        valid: false,
        error: 'INVALID_OTP',
        remainingAttempts: remaining.remainingAttempts,
        resetAt: remaining.resetAt
    };
}

/**
 * Get rate limit status for a phone number
 * @param {string} phoneNumber - Phone number
 * @returns {Object} Rate limit status
 */
function getRateLimitStatus(phoneNumber) {
    cleanupRateLimit();
    const phoneData = otpAttempts.get(phoneNumber);
    
    if (!phoneData) {
        return {
            attempts: 0,
            remainingAttempts: MAX_ATTEMPTS,
            resetAt: null
        };
    }
    
    const now = Date.now();
    if (now - phoneData.windowStart > RATE_LIMIT_WINDOW) {
        return {
            attempts: 0,
            remainingAttempts: MAX_ATTEMPTS,
            resetAt: null
        };
    }
    
    return {
        attempts: phoneData.attempts,
        remainingAttempts: MAX_ATTEMPTS - phoneData.attempts,
        resetAt: new Date(phoneData.windowStart + RATE_LIMIT_WINDOW)
    };
}

module.exports = {
    generateOTP,
    verifyOTP,
    checkRateLimit,
    getRateLimitStatus,
    DEMO_OTP,
    MAX_ATTEMPTS,
    RATE_LIMIT_WINDOW
};
