/**
 * Map Routes
 * API endpoints for map visualization
 */

const express = require('express');
const router = express.Router();
const { authenticate } = require('../../middleware/auth/authenticate');
const mapController = require('../../controllers/mapController');

router.use(authenticate);

router.get('/complaints', mapController.getMapComplaints);
router.get('/ngos', mapController.getMapNGOs);
router.get('/nearest-ngos', mapController.getNearestNGOs);

module.exports = router;
