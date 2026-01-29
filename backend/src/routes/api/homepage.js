/**
 * Homepage Routes
 * Public routes for homepage data (no authentication required)
 */

const express = require('express');
const router = express.Router();
const homepageController = require('../../controllers/homepageController');

// Public routes - no authentication required
router.get('/stats', homepageController.getHomepageStats);
router.get('/ngos', homepageController.getPublicNGOs);

module.exports = router;
