/**
 * Complaints Routes
 * API endpoints for complaint management
 */

const express = require('express');
const router = express.Router();
const { authenticate } = require('../../middleware/auth/authenticate');
const { authorizeVictim, authorizeOrganization } = require('../../middleware/auth/authorize');
const complaintsController = require('../../controllers/complaintsController');

// All routes require authentication
router.use(authenticate);

// Get all complaints
router.get('/', complaintsController.getComplaints);

// Get single complaint
router.get('/:id', complaintsController.getComplaint);

// Create complaint (victims only)
router.post('/', authorizeVictim, complaintsController.createComplaint);

// Update complaint status (organizations only)
router.patch('/:id/status', authorizeOrganization, complaintsController.updateComplaintStatus);

// Assign complaint (DDMA/SDMA only - handled in controller)
router.patch('/:id/assign', complaintsController.assignComplaint);

module.exports = router;
