/**
 * Photos Routes
 * API endpoints for photo evidence management
 */

const express = require('express');
const router = express.Router();
const { authenticate } = require('../../middleware/auth/authenticate');
const { authorizeOrganization } = require('../../middleware/auth/authorize');
const photosController = require('../../controllers/photosController');
const { asyncHandler } = require('../../middleware/errorHandler');

// All routes require authentication
router.use(authenticate);

// Upload photo (organizations only)
router.post('/', authorizeOrganization, photosController.uploadPhoto);

// Get photos for a complaint
router.get('/complaint/:complaintId', photosController.getComplaintPhotos);

// Get single photo
router.get('/:id', photosController.getPhoto);

module.exports = router;
