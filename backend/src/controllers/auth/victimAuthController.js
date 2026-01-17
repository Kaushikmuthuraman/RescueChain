/**
 * Victim Authentication Controller
 * Handles OTP-based authentication for victims
 */

const otpService = require('../../services/otp/demoOtpService');
const { generateToken } = require('../../utils/jwt');
const userModel = require('../../models/user');

/**
 * Generate OTP for victim
 * POST /api/auth/victim/otp
 */
async function generateOTP(req, res) {
    try {
        const phoneNumber = req.normalizedPhone;
        
        // Generate OTP (demo - returns fixed OTP)
        const otp = otpService.generateOTP(phoneNumber);
        
        // Get rate limit info
        const rateLimitInfo = req.rateLimitInfo || otpService.getRateLimitStatus(phoneNumber);
        
        // In demo mode, return OTP directly (no SMS)
        res.json({
            success: true,
            message: 'OTP generated successfully',
            data: {
                // In production, don't return OTP. Only return in demo mode
                otp: otpService.DEMO_OTP, // Demo only - remove in production
                phoneNumber: phoneNumber,
                expiresIn: '10 minutes', // Demo message
                rateLimit: {
                    remainingAttempts: rateLimitInfo.remainingAttempts,
                    resetAt: rateLimitInfo.resetAt
                }
            }
        });
    } catch (error) {
        console.error('Error generating OTP:', error);
        res.status(500).json({
            success: false,
            error: 'INTERNAL_ERROR',
            message: 'Failed to generate OTP'
        });
    }
}

/**
 * Verify OTP and authenticate victim
 * POST /api/auth/victim/verify
 * - If phone exists → login
 * - If phone doesn't exist → auto-create victim account
 */
async function verifyOTP(req, res) {
    try {
        const phoneNumber = req.normalizedPhone;
        const otp = req.body.otp;
        
        // Verify OTP
        const verification = otpService.verifyOTP(phoneNumber, otp);
        
        if (!verification.valid) {
            if (verification.error === 'RATE_LIMIT_EXCEEDED') {
                return res.status(429).json({
                    success: false,
                    error: 'RATE_LIMIT_EXCEEDED',
                    message: 'Too many OTP verification attempts. Please try again later.',
                    resetAt: verification.resetAt
                });
            }
            
            // Invalid OTP
            return res.status(400).json({
                success: false,
                error: 'INVALID_OTP',
                message: 'Invalid OTP. Please try again.',
                remainingAttempts: verification.remainingAttempts,
                resetAt: verification.resetAt
            });
        }
        
        // OTP is valid - check if user exists
        let user = await userModel.findByPhoneNumber(phoneNumber);
        let isNewUser = false;
        
        if (!user) {
            // Auto-create victim account
            user = await userModel.createVictim(phoneNumber);
            isNewUser = true;
        } else {
            // User exists - verify it's a victim
            if (user.user_type !== 'victim') {
                return res.status(403).json({
                    success: false,
                    error: 'INVALID_USER_TYPE',
                    message: 'This phone number is registered as an organization account. Please use organization login.'
                });
            }
            
            // Update last login
            await userModel.updateLastLogin(user.id);
        }
        
        // Generate JWT token
        const token = generateToken({
            userId: user.id,
            phoneNumber: user.phone_number,
            userType: user.user_type
        });
        
        // Return success with token
        res.json({
            success: true,
            message: isNewUser ? 'Account created and logged in' : 'Login successful',
            data: {
                token,
                user: {
                    id: user.id,
                    phoneNumber: user.phone_number,
                    name: user.name,
                    userType: user.user_type,
                    isActive: user.is_active
                }
            }
        });
    } catch (error) {
        console.error('Error verifying OTP:', error);
        res.status(500).json({
            success: false,
            error: 'INTERNAL_ERROR',
            message: 'Failed to verify OTP'
        });
    }
}

/**
 * Get rate limit status
 * GET /api/auth/victim/rate-limit?phoneNumber=...
 */
async function getRateLimitStatus(req, res) {
    try {
        const phoneNumber = req.query.phoneNumber;
        
        if (!phoneNumber) {
            return res.status(400).json({
                success: false,
                error: 'PHONE_NUMBER_REQUIRED',
                message: 'Phone number is required'
            });
        }
        
        const status = otpService.getRateLimitStatus(phoneNumber);
        
        res.json({
            success: true,
            data: {
                attempts: status.attempts,
                remainingAttempts: status.remainingAttempts,
                maxAttempts: otpService.MAX_ATTEMPTS,
                resetAt: status.resetAt,
                windowMinutes: Math.round(otpService.RATE_LIMIT_WINDOW / 60000)
            }
        });
    } catch (error) {
        console.error('Error getting rate limit status:', error);
        res.status(500).json({
            success: false,
            error: 'INTERNAL_ERROR',
            message: 'Failed to get rate limit status'
        });
    }
}

module.exports = {
    generateOTP,
    verifyOTP,
    getRateLimitStatus
};
