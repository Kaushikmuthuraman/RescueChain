/**
 * Authentication Routes
 * API endpoints for authentication
 */

const express = require('express');
const router = express.Router();

// Victim authentication
const victimAuthController = require('../../controllers/auth/victimAuthController');
const { validateOTPRequest, validateOTPVerification } = require('../../middleware/validation/victimAuth');
const { otpRateLimiter } = require('../../middleware/auth/rateLimiter');

// Organization authentication
const organizationAuthController = require('../../controllers/auth/organizationAuthController');
const { validateOrganizationLogin } = require('../../middleware/validation/organizationAuth');
const { authenticate } = require('../../middleware/auth/authenticate');

/**
 * Victim OTP Authentication Routes
 */

// Generate OTP
router.post(
    '/victim/otp',
    validateOTPRequest,
    otpRateLimiter,
    victimAuthController.generateOTP
);

// Verify OTP and login/register
router.post(
    '/victim/verify',
    validateOTPVerification,
    victimAuthController.verifyOTP
);

// Get rate limit status
router.get(
    '/victim/rate-limit',
    victimAuthController.getRateLimitStatus
);

/**
 * Organization Authentication Routes (NGO, DDMA, SDMA)
 */

// Login with username and password
router.post(
    '/organization/login',
    validateOrganizationLogin,
    organizationAuthController.login
);

// Get current authenticated organization user
router.get(
    '/organization/me',
    authenticate,
    organizationAuthController.getCurrentUser
);

module.exports = router;
