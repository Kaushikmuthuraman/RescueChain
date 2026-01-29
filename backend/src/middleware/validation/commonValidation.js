/**
 * Common Validation Utilities
 * Reusable validation functions for input validation across the application
 * Demo-safe: Validations are explainable and don't expose sensitive information
 */

const { AppError } = require('../errorHandler');

/**
 * Validates phone number format
 * @param {string} phoneNumber - Phone number to validate
 * @returns {boolean} True if valid
 */
function isValidPhoneNumber(phoneNumber) {
    if (!phoneNumber || typeof phoneNumber !== 'string') {
        return false;
    }
    // Allow formats: +91-9876543210, +91 9876543210, 9876543210, +919876543210
    const phoneRegex = /^(\+?\d{1,3}[-.\s]?)?\d{10}$/;
    return phoneRegex.test(phoneNumber.trim());
}

/**
 * Validates email format
 * @param {string} email - Email to validate
 * @returns {boolean} True if valid
 */
function isValidEmail(email) {
    if (!email || typeof email !== 'string') {
        return false;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email.trim());
}

/**
 * Validates username format (alphanumeric + underscore, 3-50 chars)
 * @param {string} username - Username to validate
 * @returns {boolean} True if valid
 */
function isValidUsername(username) {
    if (!username || typeof username !== 'string') {
        return false;
    }
    const usernameRegex = /^[a-zA-Z0-9_]{3,50}$/;
    return usernameRegex.test(username.trim());
}

/**
 * Validates password strength (min 8 chars, at least one letter and one number)
 * @param {string} password - Password to validate
 * @returns {boolean} True if valid
 */
function isValidPassword(password) {
    if (!password || typeof password !== 'string') {
        return false;
    }
    // Min 8 characters, at least one letter and one number
    const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d@$!%*#?&]{8,}$/;
    return passwordRegex.test(password);
}

/**
 * Validates UUID format
 * @param {string} uuid - UUID to validate
 * @returns {boolean} True if valid
 */
function isValidUUID(uuid) {
    if (!uuid || typeof uuid !== 'string') {
        return false;
    }
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    return uuidRegex.test(uuid);
}

/**
 * Validates urgency level
 * @param {string} urgencyLevel - Urgency level to validate
 * @returns {boolean} True if valid
 */
function isValidUrgencyLevel(urgencyLevel) {
    const validLevels = ['low', 'medium', 'high', 'critical'];
    return validLevels.includes(urgencyLevel);
}

/**
 * Validates complaint status
 * @param {string} status - Status to validate
 * @returns {boolean} True if valid
 */
function isValidComplaintStatus(status) {
    const validStatuses = ['submitted', 'accepted', 'arriving', 'in_progress', 'resolved', 'fake_information'];
    return validStatuses.includes(status);
}

/**
 * Validates donation status
 * @param {string} status - Status to validate
 * @returns {boolean} True if valid
 */
function isValidDonationStatus(status) {
    const validStatuses = ['pending', 'completed', 'failed', 'refunded'];
    return validStatuses.includes(status);
}

/**
 * Validates user type
 * @param {string} userType - User type to validate
 * @returns {boolean} True if valid
 */
function isValidUserType(userType) {
    const validTypes = ['victim', 'ngo', 'ddma', 'sdma'];
    return validTypes.includes(userType);
}

/**
 * Validates latitude (-90 to 90)
 * @param {number} latitude - Latitude to validate
 * @returns {boolean} True if valid
 */
function isValidLatitude(latitude) {
    if (latitude === null || latitude === undefined) return true; // Optional field
    const lat = parseFloat(latitude);
    return !isNaN(lat) && lat >= -90 && lat <= 90;
}

/**
 * Validates longitude (-180 to 180)
 * @param {number} longitude - Longitude to validate
 * @returns {boolean} True if valid
 */
function isValidLongitude(longitude) {
    if (longitude === null || longitude === undefined) return true; // Optional field
    const lon = parseFloat(longitude);
    return !isNaN(lon) && lon >= -180 && lon <= 180;
}

/**
 * Validates positive number
 * @param {number} value - Number to validate
 * @returns {boolean} True if valid
 */
function isValidPositiveNumber(value) {
    if (value === null || value === undefined) return true; // Optional field
    const num = parseFloat(value);
    return !isNaN(num) && num > 0;
}

/**
 * Validates non-empty string
 * @param {string} value - String to validate
 * @param {number} minLength - Minimum length (default: 1)
 * @param {number} maxLength - Maximum length (optional)
 * @returns {boolean} True if valid
 */
function isValidNonEmptyString(value, minLength = 1, maxLength = null) {
    if (!value || typeof value !== 'string') {
        return false;
    }
    const trimmed = value.trim();
    if (trimmed.length < minLength) {
        return false;
    }
    if (maxLength && trimmed.length > maxLength) {
        return false;
    }
    return true;
}

/**
 * Validation middleware factory
 * Validates request body/query/params against a schema
 * Demo-safe: Clear, explainable error messages
 */
function validateRequest(schema) {
    return (req, res, next) => {
        const errors = [];
        
        // Validate body
        if (schema.body) {
            Object.keys(schema.body).forEach(field => {
                const rules = schema.body[field];
                const value = req.body[field];
                
                // Required check
                if (rules.required && (value === undefined || value === null || value === '')) {
                    errors.push({
                        field: field,
                        message: `${field} is required`
                    });
                    return;
                }
                
                // Skip validation if field is optional and not provided
                if (!rules.required && (value === undefined || value === null || value === '')) {
                    return;
                }
                
                // Type check
                if (rules.type && value !== undefined && value !== null) {
                    if (rules.type === 'string' && typeof value !== 'string') {
                        errors.push({
                            field: field,
                            message: `${field} must be a string`
                        });
                        return;
                    }
                    if (rules.type === 'number' && typeof value !== 'number' && isNaN(parseFloat(value))) {
                        errors.push({
                            field: field,
                            message: `${field} must be a number`
                        });
                        return;
                    }
                    if (rules.type === 'boolean' && typeof value !== 'boolean') {
                        errors.push({
                            field: field,
                            message: `${field} must be a boolean`
                        });
                        return;
                    }
                }
                
                // Custom validators
                if (rules.validator && value !== undefined && value !== null && value !== '') {
                    const isValid = rules.validator(value);
                    if (!isValid) {
                        errors.push({
                            field: field,
                            message: rules.message || `${field} is invalid`
                        });
                    }
                }
            });
        }
        
        // Validate query params
        if (schema.query) {
            Object.keys(schema.query).forEach(field => {
                const rules = schema.query[field];
                const value = req.query[field];
                
                if (rules.required && !value) {
                    errors.push({
                        field: field,
                        message: `Query parameter ${field} is required`
                    });
                    return;
                }
                
                if (rules.validator && value) {
                    const isValid = rules.validator(value);
                    if (!isValid) {
                        errors.push({
                            field: field,
                            message: rules.message || `Query parameter ${field} is invalid`
                        });
                    }
                }
            });
        }
        
        // Validate params
        if (schema.params) {
            Object.keys(schema.params).forEach(field => {
                const rules = schema.params[field];
                const value = req.params[field];
                
                if (rules.required && !value) {
                    errors.push({
                        field: field,
                        message: `Path parameter ${field} is required`
                    });
                    return;
                }
                
                if (rules.validator && value) {
                    const isValid = rules.validator(value);
                    if (!isValid) {
                        errors.push({
                            field: field,
                            message: rules.message || `Path parameter ${field} is invalid`
                        });
                    }
                }
            });
        }
        
        if (errors.length > 0) {
            return res.status(400).json({
                success: false,
                error: 'VALIDATION_ERROR',
                message: 'Validation failed',
                errors: errors
            });
        }
        
        next();
    };
}

module.exports = {
    isValidPhoneNumber,
    isValidEmail,
    isValidUsername,
    isValidPassword,
    isValidUUID,
    isValidUrgencyLevel,
    isValidComplaintStatus,
    isValidDonationStatus,
    isValidUserType,
    isValidLatitude,
    isValidLongitude,
    isValidPositiveNumber,
    isValidNonEmptyString,
    validateRequest
};
