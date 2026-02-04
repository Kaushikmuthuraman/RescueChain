/**
 * Blockchain Routes
 * API endpoints for blockchain audit log queries
 */

const express = require('express');
const router = express.Router();
const { authenticate } = require('../../middleware/auth/authenticate');
const blockchainController = require('../../controllers/blockchainController');

// All routes require authentication
router.use(authenticate);

// Get blockchain audit logs for a complaint
router.get('/audit/:complaintId', blockchainController.getComplaintAuditLogs);

module.exports = router;
