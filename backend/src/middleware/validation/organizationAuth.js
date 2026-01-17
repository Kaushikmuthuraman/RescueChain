/**
 * Validation Middleware for Organization Authentication
 * Validates request data for organization login endpoints
 */

/**
 * Validate username format
 * @param {string} username - Username
 * @returns {boolean} True if valid
 */
function isValidUsername(username) {
    if (!username || typeof username !== 'string') {
        return false;
    }
    
    // Username: 3-30 characters, alphanumeric and underscore only
    const usernameRegex = /^[a-zA-Z0-9_]{3,30}$/;
    return usernameRegex.test(username);
}

/**
 * Validate password format
 * @param {string} password - Password
 * @returns {boolean} True if valid
 */
function isValidPassword(password) {
    if (!password || typeof password !== 'string') {
        return false;
    }
    
    // Password: minimum 6 characters
    return password.length >= 6;
}

/**
 * Validate request for organization login
 */
function validateOrganizationLogin(req, res, next) {
    const { username, password } = req.body;
    
    if (!username) {
        return res.status(400).json({
            success: false,
            error: 'USERNAME_REQUIRED',
            message: 'Username is required'
        });
    }
    
    if (!password) {
        return res.status(400).json({
            success: false,
            error: 'PASSWORD_REQUIRED',
            message: 'Password is required'
        });
    }
    
    if (!isValidUsername(username)) {
        return res.status(400).json({
            success: false,
            error: 'INVALID_USERNAME_FORMAT',
            message: 'Username must be 3-30 characters and contain only letters, numbers, and underscores'
        });
    }
    
    if (!isValidPassword(password)) {
        return res.status(400).json({
            success: false,
            error: 'INVALID_PASSWORD_FORMAT',
            message: 'Password must be at least 6 characters'
        });
    }
    
    next();
}

module.exports = {
    validateOrganizationLogin,
    isValidUsername,
    isValidPassword
};
