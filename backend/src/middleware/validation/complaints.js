/**
 * Validation Middleware for Complaints
 * Validates complaint creation and status updates
 */

const { AppError, asyncHandler } = require('../errorHandler');

/**
 * Valid status order for transitions
 * Statuses cannot be skipped
 */
const STATUS_ORDER = {
    'submitted': 0,
    'accepted': 1,
    'arriving': 2,
    'in_progress': 3,
    'resolved': 4,
    'fake_information': 99 // Terminal status
};

/**
 * Statuses that require photo evidence
 */
const STATUSES_REQUIRING_PHOTO = ['arriving', 'in_progress', 'resolved', 'fake_information'];

/**
 * Terminal statuses (cannot transition from these)
 */
const TERMINAL_STATUSES = ['fake_information'];

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
    
    const validStatuses = Object.keys(STATUS_ORDER);
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
    
    // Check if complaint is in terminal status
    // SDMA can override terminal status (fake_information)
    const user = req.user;
    const isSDMA = user && user.userType === 'sdma';
    
    if (TERMINAL_STATUSES.includes(currentStatus) && !isSDMA) {
        return res.status(400).json({
            success: false,
            error: 'TERMINAL_STATUS',
            message: `Cannot update status from terminal status: ${currentStatus}. Only SDMA can override locked complaints.`
        });
    }
    
    // Validate status transition (cannot skip statuses)
    if (status !== currentStatus) {
        const currentOrder = STATUS_ORDER[currentStatus];
        const newOrder = STATUS_ORDER[status];
        
        // Allow transitions to fake_information from any status
        if (status === 'fake_information') {
            // This is allowed from any non-terminal status
        } else {
            // For normal flow, check if transition is sequential
            // Allow going to any later status (not skipping backwards is handled implicitly)
            if (newOrder <= currentOrder) {
                return res.status(400).json({
                    success: false,
                    error: 'INVALID_TRANSITION',
                    message: `Invalid status transition from ${currentStatus} to ${status}. Statuses cannot be skipped.`
                });
            }
            
            // Check for skipping statuses (must be next in sequence)
            // Allow: submitted→accepted, accepted→arriving, arriving→in_progress, in_progress→resolved
            const expectedNextStatuses = {
                'submitted': ['accepted', 'fake_information'],
                'accepted': ['arriving', 'fake_information'],
                'arriving': ['in_progress', 'fake_information'],
                'in_progress': ['resolved', 'fake_information']
            };
            
            if (expectedNextStatuses[currentStatus] && !expectedNextStatuses[currentStatus].includes(status)) {
                return res.status(400).json({
                    success: false,
                    error: 'STATUS_SKIP_NOT_ALLOWED',
                    message: `Cannot skip statuses. Valid transitions from ${currentStatus}: ${expectedNextStatuses[currentStatus].join(', ')}`
                });
            }
        }
    }
    
    // Validate photo requirements
    // Accepted status does NOT require photo
    // All other statuses REQUIRE photo
    // Can be file upload (req.file) or already-processed photo CID
    if (STATUSES_REQUIRING_PHOTO.includes(status)) {
        const { photoCid } = req.body;
        if (!req.file && !photoCid) {
            return res.status(400).json({
                success: false,
                error: 'PHOTO_REQUIRED',
                message: `Photo is required for status: ${status}. Upload as multipart/form-data with field name "photo". Photo is not required for 'accepted' status.`
            });
        }
    }
    
    // Validate fake_information requires reason
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
    validateStatusUpdate,
    STATUS_ORDER,
    STATUSES_REQUIRING_PHOTO,
    TERMINAL_STATUSES
};
