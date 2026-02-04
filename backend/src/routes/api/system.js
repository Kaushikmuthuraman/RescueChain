/**
 * System / observability routes
 */

const express = require('express');
const router = express.Router();
const { authenticate } = require('../../middleware/auth/authenticate');
const { authorizeSDMA } = require('../../middleware/auth/authorize');
const systemController = require('../../controllers/systemController');

// Public-ish health endpoint (no auth) – safe payload
router.get('/health', systemController.getSystemHealth);

// Admin/SDMA-only issues endpoint for operational visibility
router.get(
    '/issues',
    authenticate,
    authorizeSDMA,
    systemController.getRecentIssues
);

module.exports = router;

