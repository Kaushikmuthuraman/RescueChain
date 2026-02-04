/**
 * Stats API Routes
 * KPI metrics for dashboards
 */

const express = require('express');
const router = express.Router();
const statsController = require('../../controllers/statsController');
const { authenticate, optionalAuthenticate } = require('../../middleware/auth/authenticate');
const { authorizeSDMA } = require('../../middleware/auth/authorize');

// KPI metrics endpoint - works with or without auth
// Authenticated users get role-filtered data
// Unauthenticated users get system-wide data
router.get('/kpi', optionalAuthenticate, statsController.getKPIMetrics);

// Severity distribution (requires auth for role-based filtering)
router.get('/severity', optionalAuthenticate, statsController.getSeverityDistribution);

// SDMA analytics endpoints - require SDMA role
router.get(
    '/complaint-heatmap',
    authenticate,
    authorizeSDMA,
    statsController.getComplaintHeatmap
);

router.get(
    '/ngo-performance',
    authenticate,
    authorizeSDMA,
    statsController.getNGOPerformanceTrends
);

router.get(
    '/response-time-distribution',
    authenticate,
    authorizeSDMA,
    statsController.getResponseTimeDistribution
);

router.get(
    '/high-risk-zones',
    authenticate,
    authorizeSDMA,
    statsController.getHighRiskZones
);

module.exports = router;
