/**
 * Organization Authentication Controller
 * Handles username + password authentication for NGO, DDMA, SDMA
 * Works for both seeded and live accounts
 */

const credentialsModel = require('../../models/credentials');
const { verifyPassword } = require('../../utils/password');
const { generateToken } = require('../../utils/jwt');

/**
 * Login organization (NGO, DDMA, SDMA)
 * POST /api/auth/organization/login
 * Works for both seeded and live accounts
 */
async function login(req, res) {
    try {
        const { username, password } = req.body;
        
        // Find credentials by username (includes user info via JOIN)
        const credentials = await credentialsModel.findByUsername(username);
        
        if (!credentials) {
            return res.status(401).json({
                success: false,
                error: 'INVALID_CREDENTIALS',
                message: 'Invalid username or password'
            });
        }
        
        // Check if user is active
        if (!credentials.user.isActive) {
            return res.status(403).json({
                success: false,
                error: 'ACCOUNT_DISABLED',
                message: 'Account is disabled. Please contact administrator.'
            });
        }
        
        // Verify password
        const passwordValid = await verifyPassword(password, credentials.passwordHash);
        
        if (!passwordValid) {
            return res.status(401).json({
                success: false,
                error: 'INVALID_CREDENTIALS',
                message: 'Invalid username or password'
            });
        }
        
        // Verify user type is an organization (not victim)
        if (credentials.user.userType === 'victim') {
            return res.status(403).json({
                success: false,
                error: 'INVALID_USER_TYPE',
                message: 'This account is registered as a victim. Please use OTP login.'
            });
        }
        
        // Update last login
        await credentialsModel.updateLastLogin(credentials.credentialId);
        
        // Generate JWT token with role (userType)
        const token = generateToken({
            userId: credentials.user.id,
            phoneNumber: credentials.user.phoneNumber,
            userType: credentials.user.userType // Role: 'ngo', 'ddma', or 'sdma'
        });
        
        // Return success with token
        res.json({
            success: true,
            message: 'Login successful',
            data: {
                token,
                user: {
                    id: credentials.user.id,
                    phoneNumber: credentials.user.phoneNumber,
                    name: credentials.user.name,
                    userType: credentials.user.userType, // Role: 'ngo', 'ddma', 'sdma'
                    role: credentials.user.userType, // Alias for clarity
                    isActive: credentials.user.isActive,
                    isSeeded: credentials.user.isSeeded || false
                }
            }
        });
    } catch (error) {
        console.error('Error during organization login:', error);
        res.status(500).json({
            success: false,
            error: 'INTERNAL_ERROR',
            message: 'Failed to process login'
        });
    }
}

/**
 * Get current user info (requires authentication)
 * GET /api/auth/organization/me
 */
async function getCurrentUser(req, res) {
    try {
        // User info is attached by authenticate middleware
        const userId = req.user.userId;
        
        // Fetch full user details from database
        const userModel = require('../../models/user');
        const user = await userModel.findById(userId);
        
        if (!user) {
            return res.status(404).json({
                success: false,
                error: 'USER_NOT_FOUND',
                message: 'User not found'
            });
        }
        
        // Verify it's an organization
        if (user.user_type === 'victim') {
            return res.status(403).json({
                success: false,
                error: 'INVALID_USER_TYPE',
                message: 'This endpoint is for organizations only'
            });
        }
        
        // Get credentials info
        const credentials = await credentialsModel.findByUserId(userId);
        
        res.json({
            success: true,
            data: {
                user: {
                    id: user.id,
                    phoneNumber: user.phone_number,
                    name: user.name,
                    userType: user.user_type, // Role
                    isActive: user.is_active,
                    isSeeded: user.is_seeded || false,
                    createdAt: user.created_at,
                    username: credentials ? credentials.username : null
                }
            }
        });
    } catch (error) {
        console.error('Error getting current user:', error);
        res.status(500).json({
            success: false,
            error: 'INTERNAL_ERROR',
            message: 'Failed to get user information'
        });
    }
}

module.exports = {
    login,
    getCurrentUser
};
