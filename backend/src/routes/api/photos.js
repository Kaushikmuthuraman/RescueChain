/**
 * Photos Routes
 * API endpoints for photo evidence management
 */

const express = require('express');
const router = express.Router();
const { authenticate } = require('../../middleware/auth/authenticate');
const { authorizeOrganization } = require('../../middleware/auth/authorize');
const photosController = require('../../controllers/photosController');
const upload = require('../../middleware/upload/multerConfig');

// All routes require authentication
router.use(authenticate);

// Upload photo (organizations only) - expects multipart/form-data with 'photo' field
router.post('/', authorizeOrganization, upload.single('photo'), photosController.uploadPhoto);

// Get photos for a complaint
router.get('/complaint/:complaintId', photosController.getComplaintPhotos);

// Get single photo
router.get('/:id', photosController.getPhoto);

module.exports = router;
