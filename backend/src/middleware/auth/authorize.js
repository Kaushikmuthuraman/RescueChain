/**
 * Role-Based Access Control Middleware
 * Authorizes users based on their role (userType)
 */

/**
 * Authorize middleware - checks if user has required role(s)
 * @param {string|string[]} allowedRoles - Single role or array of allowed roles
 * @returns {Function} Express middleware function
 */
function authorize(allowedRoles) {
    return (req, res, next) => {
        // Ensure user is authenticated (should be called after authenticate middleware)
        if (!req.user) {
            return res.status(401).json({
                success: false,
                error: 'AUTHENTICATION_REQUIRED',
                message: 'Authentication required'
            });
        }
        
        const userRole = req.user.userType || req.user.role;
        
        // Convert single role to array for consistent checking
        const roles = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];
        
        // Check if user's role is in allowed roles
        if (!roles.includes(userRole)) {
            return res.status(403).json({
                success: false,
                error: 'FORBIDDEN',
                message: `Access denied. Required role: ${roles.join(' or ')}`
            });
        }
        
        next();
    };
}

/**
 * Authorize only victims
 */
function authorizeVictim(req, res, next) {
    return authorize('victim')(req, res, next);
}

/**
 * Authorize only organizations (NGO, DDMA, SDMA)
 */
function authorizeOrganization(req, res, next) {
    return authorize(['ngo', 'ddma', 'sdma'])(req, res, next);
}

/**
 * Authorize only SDMA (highest privilege)
 */
function authorizeSDMA(req, res, next) {
    return authorize('sdma')(req, res, next);
}

/**
 * Authorize SDMA or DDMA
 */
function authorizeSDMAOrDDMA(req, res, next) {
    return authorize(['sdma', 'ddma'])(req, res, next);
}

/**
 * Authorize NGO or DDMA or SDMA (all organizations)
 */
function authorizeNGOOrDDMAOrSDMA(req, res, next) {
    return authorize(['ngo', 'ddma', 'sdma'])(req, res, next);
}

module.exports = {
    authorize,
    authorizeVictim,
    authorizeOrganization,
    authorizeSDMA,
    authorizeSDMAOrDDMA,
    authorizeNGOOrDDMAOrSDMA
};
