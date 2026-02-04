/**
 * SDMA Routes
 * API endpoints for SDMA portal
 */

const express = require('express');
const router = express.Router();
const { authenticate } = require('../../middleware/auth/authenticate');
const { authorizeSDMA } = require('../../middleware/auth/authorize');
const sdmaController = require('../../controllers/sdma/sdmaController');

// All routes require SDMA authentication
router.use(authenticate);
router.use(authorizeSDMA);

// Get system overview
router.get('/overview', sdmaController.getSystemOverview);

// Get all complaints (full visibility)
router.get('/complaints', sdmaController.getAllComplaints);

// Get donation analytics
router.get('/donations/analytics', sdmaController.getDonationAnalytics);

// Get all donations (with amounts visible to SDMA)
router.get('/donations', sdmaController.getAllDonations);

// Get audit timeline/blockchain logs
router.get('/audit-timeline', sdmaController.getAuditTimeline);

// Exports (CSV/PDF)
router.get('/export/complaints', sdmaController.exportComplaints);
router.get('/export/donations', sdmaController.exportDonations);
router.get('/export/ngo-performance', sdmaController.exportNGOPerformance);

module.exports = router;
