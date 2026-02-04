/**
 * Validation Middleware for Complaints
 * Validates complaint creation and status updates
 */

const { AppError, asyncHandler } = require('../errorHandler');

const { complaintWorkflow, validateComplaintTransition } = require('../../config/workflows');

/**
 * Validate complaint creation request
 * Photo is REQUIRED for creation (file upload or photo CID)
 */
function validateCreateComplaint(req, res, next) {
    const { complaintText, location } = req.body;
    
    if (!complaintText || !location) {
        return res.status(400).json({
            success: false,
            error: 'VALIDATION_ERROR',
            message: 'Complaint text and location are required'
        });
    }
    
    // Photo is REQUIRED for complaint creation
    // Can be file upload (req.file) or already-processed photo CID
    const { photoCid } = req.body;
    if (!req.file && !photoCid) {
        return res.status(400).json({
            success: false,
            error: 'PHOTO_REQUIRED',
            message: 'Photo file is required for complaint creation. Upload as multipart/form-data with field name "photo".'
        });
    }
    
    next();
}

/**
 * Validate status update request
 * Validates status transitions and photo requirements
 */
const validateStatusUpdate = asyncHandler(async (req, res, next) => {
    const { status, photoUrl } = req.body;
    const { id } = req.params;
    
    if (!status) {
        return res.status(400).json({
            success: false,
            error: 'VALIDATION_ERROR',
            message: 'Status is required'
        });
    }
    
    const validStatuses = complaintWorkflow.statuses;
    if (!validStatuses.includes(status)) {
        return res.status(400).json({
            success: false,
            error: 'INVALID_STATUS',
            message: `Invalid status. Valid statuses: ${validStatuses.join(', ')}`
        });
    }
    
    // Get current complaint to validate transitions
    const db = require('../../config/database');
    const complaintResult = await db.query('SELECT * FROM complaints WHERE id = $1', [id]);
    
    if (complaintResult.rows.length === 0) {
        return res.status(404).json({
            success: false,
            error: 'NOT_FOUND',
            message: 'Complaint not found'
        });
    }
    
    const complaint = complaintResult.rows[0];
    const currentStatus = complaint.status;
    
    // Validate transition via config-driven workflow
    const user = req.user;
    const isSDMA = user && user.userType === 'sdma';
    const { ok, errorCode, message } = validateComplaintTransition(currentStatus, status, { isSDMA });
    if (!ok) {
        return res.status(400).json({
            success: false,
            error: errorCode,
            message
        });
    }
    
    // Validate photo requirements from workflow config
    // Can be file upload (req.file) or already-processed photo CID
    if (complaintWorkflow.photoRequired[status]) {
        const { photoCid } = req.body;
        if (!req.file && !photoCid) {
            return res.status(400).json({
                success: false,
                error: 'PHOTO_REQUIRED',
                message: `Photo is required for status: ${status}. Upload as multipart/form-data with field name "photo". Photo is not required for 'accepted' status.`
            });
        }
    }
    
    // Validate any extra per-status rules
    if (status === 'fake_information') {
        const { reason } = req.body;
        if (!reason || typeof reason !== 'string' || reason.trim() === '') {
            return res.status(400).json({
                success: false,
                error: 'REASON_REQUIRED',
                message: 'Reason is required when marking complaint as fake_information'
            });
        }
    }
    
    // Store complaint in request for use in controller
    req.complaint = complaint;
    
    next();
});

module.exports = {
    validateCreateComplaint,
    validateStatusUpdate
};
