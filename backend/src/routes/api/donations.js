/**
 * Donations Routes
 * API endpoints for donation management
 */

const express = require('express');
const router = express.Router();
const { authenticate } = require('../../middleware/auth/authenticate');
const { authorizeOrganization } = require('../../middleware/auth/authorize');
const donationsController = require('../../controllers/donationsController');
const { asyncHandler } = require('../../middleware/errorHandler');

// All routes require authentication
router.use(authenticate);

// Get all donations
router.get('/', donationsController.getDonations);

// Get single donation
router.get('/:id', donationsController.getDonation);

// Create donation (any authenticated user)
router.post('/', donationsController.createDonation);

// Update donation status (organizations only)
router.patch('/:id/status', authorizeOrganization, donationsController.updateDonationStatus);

module.exports = router;
