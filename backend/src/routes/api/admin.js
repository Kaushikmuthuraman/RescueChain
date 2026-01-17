/**
 * Admin Routes
 * API endpoints for administrative operations (SDMA only)
 */

const express = require('express');
const router = express.Router();
const { authenticate } = require('../../middleware/auth/authenticate');
const { authorizeSDMA } = require('../../middleware/auth/authorize');
const adminController = require('../../controllers/adminController');
const { asyncHandler } = require('../../middleware/errorHandler');

// All routes require SDMA authentication
router.use(authenticate);
router.use(authorizeSDMA);

// Create organization account
router.post('/organizations', adminController.createOrganization);

// Get all users
router.get('/users', adminController.getUsers);

// Update user status
router.patch('/users/:id/status', adminController.updateUserStatus);

// Get system statistics
router.get('/stats', adminController.getStats);

module.exports = router;
