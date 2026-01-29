/**
 * Complaints Routes
 * API endpoints for complaint management
 */

const express = require('express');
const router = express.Router();
const { authenticate } = require('../../middleware/auth/authenticate');
const { authorizeVictim, authorizeOrganization } = require('../../middleware/auth/authorize');
const complaintsController = require('../../controllers/complaintsController');
const { validateCreateComplaint, validateStatusUpdate } = require('../../middleware/validation/complaints');
const upload = require('../../middleware/upload/multerConfig');

// All routes require authentication
router.use(authenticate);

// Get all complaints
router.get('/', complaintsController.getComplaints);

// Get single complaint
router.get('/:id', complaintsController.getComplaint);

// Get complaint timeline/status history
router.get('/:id/timeline', complaintsController.getComplaintTimeline);

// Create complaint (victims only) - Photo is REQUIRED (multipart/form-data with 'photo' field)
// Note: validateCreateComplaint removed - photo validation happens in controller after multer processes file
router.post('/', authorizeVictim, upload.single('photo'), complaintsController.createComplaint);

// Update complaint status (organizations only) - Validates status transitions and photo requirements
// Accepts file upload (multipart/form-data with 'photo' field) or photoCid in body
router.patch('/:id/status', authorizeOrganization, upload.single('photo'), validateStatusUpdate, complaintsController.updateComplaintStatus);

// Assign complaint (DDMA/SDMA only - handled in controller)
router.patch('/:id/assign', complaintsController.assignComplaint);

module.exports = router;
