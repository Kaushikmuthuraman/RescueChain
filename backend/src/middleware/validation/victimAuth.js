/**
 * Validation Middleware for Victim Authentication
 * Validates request data for OTP endpoints
 */

/**
 * Validate phone number format
 * @param {string} phone - Phone number
 * @returns {boolean} True if valid
 */
function isValidPhoneNumber(phone) {
    if (!phone || typeof phone !== 'string') {
        return false;
    }
    
    // Remove spaces, dashes, and plus signs for validation
    const cleaned = phone.replace(/[\s\-+]/g, '');
    
    // Indian phone number: 10 digits, optionally with country code (91)
    // Format: +91-XXXXXXXXXX or 91XXXXXXXXXX or XXXXXXXXXX
    const phoneRegex = /^(\+?91)?[6-9]\d{9}$/;
    
    return phoneRegex.test(cleaned);
}

/**
 * Validate OTP format
 * @param {string} otp - OTP code
 * @returns {boolean} True if valid
 */
function isValidOTP(otp) {
    if (!otp || typeof otp !== 'string') {
        return false;
    }
    
    // OTP should be 6 digits
    return /^\d{6}$/.test(otp);
}

/**
 * Validate request for OTP generation
 */
function validateOTPRequest(req, res, next) {
    const { phoneNumber } = req.body;
    
    if (!phoneNumber) {
        return res.status(400).json({
            success: false,
            error: 'PHONE_NUMBER_REQUIRED',
            message: 'Phone number is required'
        });
    }
    
    if (!isValidPhoneNumber(phoneNumber)) {
        return res.status(400).json({
            success: false,
            error: 'INVALID_PHONE_NUMBER',
            message: 'Invalid phone number format. Please use Indian phone number format.'
        });
    }
    
    // Normalize phone number (store with +91 prefix)
    req.normalizedPhone = normalizePhoneNumber(phoneNumber);
    
    next();
}

/**
 * Validate request for OTP verification
 */
function validateOTPVerification(req, res, next) {
    const { phoneNumber, otp } = req.body;
    
    if (!phoneNumber) {
        return res.status(400).json({
            success: false,
            error: 'PHONE_NUMBER_REQUIRED',
            message: 'Phone number is required'
        });
    }
    
    if (!otp) {
        return res.status(400).json({
            success: false,
            error: 'OTP_REQUIRED',
            message: 'OTP is required'
        });
    }
    
    if (!isValidPhoneNumber(phoneNumber)) {
        return res.status(400).json({
            success: false,
            error: 'INVALID_PHONE_NUMBER',
            message: 'Invalid phone number format'
        });
    }
    
    if (!isValidOTP(otp)) {
        return res.status(400).json({
            success: false,
            error: 'INVALID_OTP_FORMAT',
            message: 'OTP must be 6 digits'
        });
    }
    
    // Normalize phone number
    req.normalizedPhone = normalizePhoneNumber(phoneNumber);
    
    next();
}

/**
 * Normalize phone number to standard format
 * @param {string} phone - Phone number
 * @returns {string} Normalized phone number
 */
function normalizePhoneNumber(phone) {
    // Remove spaces, dashes
    let cleaned = phone.replace(/[\s\-]/g, '');
    
    // Add +91 if not present
    if (cleaned.startsWith('91') && cleaned.length === 12) {
        return '+' + cleaned;
    } else if (cleaned.startsWith('+91')) {
        return cleaned;
    } else if (cleaned.length === 10) {
        return '+91-' + cleaned;
    }
    
    return phone; // Return as-is if can't normalize
}

module.exports = {
    validateOTPRequest,
    validateOTPVerification,
    isValidPhoneNumber,
    isValidOTP,
    normalizePhoneNumber
};
