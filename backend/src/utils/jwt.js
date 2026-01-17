/**
 * JWT Utility Functions
 * Token generation and verification for authentication
 */

const jwt = require('jsonwebtoken');

// JWT secret (should be in environment variable in production)
const JWT_SECRET = process.env.JWT_SECRET || 'rescuechain-secret-key-change-in-production';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d'; // 7 days

/**
 * Generate JWT token for user
 * @param {Object} payload - Token payload (user id, phone, user_type/role)
 * @returns {string} JWT token
 */
function generateToken(payload) {
    return jwt.sign(
        {
            userId: payload.userId,
            phoneNumber: payload.phoneNumber,
            userType: payload.userType, // Role: 'victim', 'ngo', 'ddma', 'sdma'
            role: payload.userType // Alias for clarity (role = userType)
        },
        JWT_SECRET,
        {
            expiresIn: JWT_EXPIRES_IN,
            issuer: 'rescuechain',
            audience: 'rescuechain-api'
        }
    );
}

/**
 * Verify JWT token
 * @param {string} token - JWT token to verify
 * @returns {Object} Decoded token payload or null if invalid
 */
function verifyToken(token) {
    try {
        return jwt.verify(token, JWT_SECRET, {
            issuer: 'rescuechain',
            audience: 'rescuechain-api'
        });
    } catch (error) {
        return null;
    }
}

/**
 * Decode token without verification (for debugging)
 * @param {string} token - JWT token
 * @returns {Object} Decoded payload
 */
function decodeToken(token) {
    return jwt.decode(token);
}

module.exports = {
    generateToken,
    verifyToken,
    decodeToken,
    JWT_SECRET,
    JWT_EXPIRES_IN
};
