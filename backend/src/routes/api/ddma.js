/**
 * DDMA Routes
 * API endpoints for DDMA portal
 */

const express = require('express');
const router = express.Router();
const { authenticate } = require('../../middleware/auth/authenticate');
const ddmaController = require('../../controllers/ddma/ddmaController');

// All routes require authentication
router.use(authenticate);

// Get complaints grouped by area
router.get('/complaints/by-area', ddmaController.getComplaintsByArea);

// Get complaints for a specific area
router.get('/complaints/by-area/:location', ddmaController.getComplaintsForArea);

// Get list of NGOs for coordination
router.get('/ngos', ddmaController.getNGOs);

module.exports = router;
