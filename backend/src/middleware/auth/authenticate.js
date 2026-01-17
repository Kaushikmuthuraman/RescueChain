/**
 * Authentication Middleware
 * Verifies JWT tokens for protected routes
 */

const { verifyToken } = require('../../utils/jwt');

/**
 * Authenticate JWT token middleware
 * Verifies token and attaches user info to request
 */
function authenticate(req, res, next) {
    // Get token from header
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({
            success: false,
            error: 'AUTHENTICATION_REQUIRED',
            message: 'Authentication token required'
        });
    }
    
    const token = authHeader.substring(7); // Remove 'Bearer ' prefix
    
    // Verify token
    const decoded = verifyToken(token);
    
    if (!decoded) {
        return res.status(401).json({
            success: false,
            error: 'INVALID_TOKEN',
            message: 'Invalid or expired token'
        });
    }
    
    // Attach user info to request
    req.user = {
        userId: decoded.userId,
        phoneNumber: decoded.phoneNumber,
        userType: decoded.userType, // Role: 'victim', 'ngo', 'ddma', 'sdma'
        role: decoded.role || decoded.userType // Alias for clarity
    };
    
    next();
}

/**
 * Optional authentication - doesn't fail if no token
 * Useful for routes that work with or without auth
 */
function optionalAuthenticate(req, res, next) {
    const authHeader = req.headers.authorization;
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
        const token = authHeader.substring(7);
        const decoded = verifyToken(token);
        
        if (decoded) {
            req.user = {
                userId: decoded.userId,
                phoneNumber: decoded.phoneNumber,
                userType: decoded.userType
            };
        }
    }
    
    next();
}

module.exports = {
    authenticate,
    optionalAuthenticate
};
