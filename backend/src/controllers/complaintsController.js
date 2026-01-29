/**
 * Complaints Controller
 * Handles complaint-related operations
 */

const db = require('../config/database');
const { AppError, asyncHandler } = require('../middleware/errorHandler');
const { ipfsService } = require('../services/photo/ipfsService');
const { extractEXIF } = require('../services/photo/exifService');
const { validatePhoto } = require('../services/photo/photoValidationService');
const { logComplaintCreation, logComplaintStatusChange } = require('../services/polygon/auditLogger');

/**
 * Get all complaints (with filters)
 * GET /api/complaints
 */
const getComplaints = asyncHandler(async (req, res) => {
    const { status, assignedTo, victimId, limit = 50, offset = 0 } = req.query;
    const user = req.user;
    
    let query = 'SELECT * FROM complaints WHERE 1=1';
    const params = [];
    let paramCount = 0;
    
    // Role-based filtering
    if (user.userType === 'victim') {
        // Victims can only see their own complaints
        paramCount++;
        query += ` AND victim_id = $${paramCount}`;
        params.push(user.userId);
    } else if (user.userType === 'ngo') {
        // NGOs can see complaints assigned to them
        paramCount++;
        query += ` AND (assigned_to = $${paramCount} OR assigned_to IS NULL)`;
        params.push(user.userId);
    }
    // DDMA and SDMA can see all complaints (no filter)
    
    // Additional filters
    if (status) {
        paramCount++;
        query += ` AND status = $${paramCount}`;
        params.push(status);
    }
    
    if (assignedTo && (user.userType === 'ddma' || user.userType === 'sdma')) {
        paramCount++;
        query += ` AND assigned_to = $${paramCount}`;
        params.push(assignedTo);
    }
    
    if (victimId && (user.userType === 'ddma' || user.userType === 'sdma')) {
        paramCount++;
        query += ` AND victim_id = $${paramCount}`;
        params.push(victimId);
    }
    
    query += ` ORDER BY created_at DESC LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}`;
    params.push(parseInt(limit), parseInt(offset));
    
    const result = await db.query(query, params);
    
    res.json({
        success: true,
        data: {
            complaints: result.rows,
            count: result.rows.length
        }
    });
});

/**
 * Get single complaint by ID
 * GET /api/complaints/:id
 */
const getComplaint = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const user = req.user;
    
    const result = await db.query('SELECT * FROM complaints WHERE id = $1', [id]);
    
    if (result.rows.length === 0) {
        throw new AppError('Complaint not found', 404, 'NOT_FOUND');
    }
    
    const complaint = result.rows[0];
    
    // Check access
    if (user.userType === 'victim' && complaint.victim_id !== user.userId) {
        throw new AppError('Access denied', 403, 'FORBIDDEN');
    }
    
    res.json({
        success: true,
        data: { complaint }
    });
});

/**
 * Get complaint status history/timeline
 * GET /api/complaints/:id/timeline
 */
const getComplaintTimeline = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const user = req.user;
    
    // Verify complaint exists and user has access
    const complaintResult = await db.query('SELECT * FROM complaints WHERE id = $1', [id]);
    
    if (complaintResult.rows.length === 0) {
        throw new AppError('Complaint not found', 404, 'NOT_FOUND');
    }
    
    const complaint = complaintResult.rows[0];
    
    // Check access
    if (user.userType === 'victim' && complaint.victim_id !== user.userId) {
        throw new AppError('Access denied', 403, 'FORBIDDEN');
    }
    
    // Get status history with user names
    const historyResult = await db.query(
        `SELECT 
            csh.*,
            u.name as changed_by_name,
            u.user_type as changed_by_type
         FROM complaint_status_history csh
         LEFT JOIN users u ON csh.changed_by = u.id
         WHERE csh.complaint_id = $1
         ORDER BY csh.created_at ASC`,
        [id]
    );
    
    res.json({
        success: true,
        data: {
            complaint: {
                id: complaint.id,
                status: complaint.status,
                created_at: complaint.created_at
            },
            timeline: historyResult.rows.map(row => ({
                id: row.id,
                oldStatus: row.old_status,
                newStatus: row.new_status,
                changedBy: row.changed_by,
                changedByName: row.changed_by_name,
                changedByType: row.changed_by_type,
                notes: row.notes,
                createdAt: row.created_at
            }))
        }
    });
});

/**
 * Create new complaint (victims only)
 * POST /api/complaints
 * Photo is REQUIRED for complaint creation
 */
const createComplaint = asyncHandler(async (req, res) => {
    // Check for photo file FIRST - multer must process before this check
    if (!req.file) {
        return res.status(400).json({
            success: false,
            message: 'Photo is required for complaint creation'
        });
    }
    
    const { complaintText, location, latitude, longitude, urgencyLevel, photoUrl } = req.body;
    const user = req.user;
    
    if (user.userType !== 'victim') {
        throw new AppError('Only victims can create complaints', 403, 'FORBIDDEN');
    }
    
    if (!complaintText || !location) {
        throw new AppError('Complaint text and location are required', 400, 'VALIDATION_ERROR');
    }
    
    // Insert complaint
    // Photo is validated to be provided, but photo_evidence table only allows
    // specific statuses ('arriving', 'in_progress', 'resolved'), so photo
    // will be stored when status changes to one of those statuses
    const result = await db.query(
        `INSERT INTO complaints (victim_id, complaint_text, location, latitude, longitude, urgency_level, status)
         VALUES ($1, $2, $3, $4, $5, $6, 'submitted')
         RETURNING *`,
        [user.userId, complaintText, location, latitude || null, longitude || null, urgencyLevel || 'medium']
    );
    
    const complaint = result.rows[0];
    
    // Update the status history entry created by trigger to set correct changed_by
    await db.query(
        `UPDATE complaint_status_history 
         SET changed_by = $1, notes = $2
         WHERE complaint_id = $3 
         AND new_status = 'submitted'
         AND old_status IS NULL`,
        [user.userId, 'Complaint created with photo', complaint.id]
    );
    
    // Log to blockchain audit (non-blocking)
    try {
        await logComplaintCreation(complaint, user.userId);
    } catch (auditError) {
        console.error('Audit logging failed (non-blocking):', auditError);
        // Continue even if audit logging fails
    }
    
    res.status(201).json({
        success: true,
        message: 'Complaint created successfully',
        data: { complaint }
    });
});

/**
 * Update complaint status (organizations only)
 * PATCH /api/complaints/:id/status
 * 
 * Rules:
 * - Statuses cannot be skipped
 * - Accepted does NOT require photo
 * - All other statuses REQUIRE photo
 * - Fake Information is terminal (cannot transition from it)
 * - All transitions are logged
 */
const updateComplaintStatus = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { status, notes, photoCid, reason } = req.body;
    const user = req.user;
    const complaint = req.complaint; // Set by validation middleware
    const file = req.file; // File upload from multer
    
    if (user.userType === 'victim') {
        throw new AppError('Victims cannot update complaint status', 403, 'FORBIDDEN');
    }
    
    const currentStatus = complaint.status;
    
    // Terminal status check (already validated in middleware, but double-check)
    // SDMA can override terminal status (fake_information)
    const TERMINAL_STATUSES = ['fake_information'];
    const isSDMA = user.userType === 'sdma';
    
    if (TERMINAL_STATUSES.includes(currentStatus) && !isSDMA) {
        throw new AppError(`Cannot update status from terminal status: ${currentStatus}. Only SDMA can override locked complaints.`, 400, 'TERMINAL_STATUS');
    }
    
    // Validate fake_information requires reason
    if (status === 'fake_information') {
        if (!reason || typeof reason !== 'string' || reason.trim() === '') {
            throw new AppError('Reason is required when marking complaint as fake_information', 400, 'REASON_REQUIRED');
        }
    }
    
    // Photo requirement validation and processing
    // Accepted does NOT require photo
    // All other statuses REQUIRE photo with EXIF extraction and validation
    const STATUSES_REQUIRING_PHOTO = ['arriving', 'in_progress', 'resolved', 'fake_information'];
    let exifData = null;
    let ipfsCid = photoCid; // Use provided CID or process file upload
    
    if (STATUSES_REQUIRING_PHOTO.includes(status)) {
        if (!file && !photoCid) {
            throw new AppError(`Photo is required for status: ${status}. Photo is not required for 'accepted' status.`, 400, 'PHOTO_REQUIRED');
        }
        
        // If file is uploaded, process it (extract EXIF, upload to IPFS, validate)
        if (file) {
            // Extract EXIF metadata
            exifData = await extractEXIF(file.buffer);
            
            // Upload to IPFS
            const ipfsResult = await ipfsService.uploadFile(file.buffer, file.originalname);
            ipfsCid = ipfsResult.cid;
            
            // Validate photo (location, timestamp, uniqueness)
            await validatePhoto({
                photoLat: exifData.latitude,
                photoLon: exifData.longitude,
                photoTimestamp: exifData.timestamp,
                ipfsCid: ipfsCid,
                complaint: complaint,
                complaintStatus: status
            });
        } else if (photoCid) {
            // If CID is provided, validate uniqueness (but can't validate EXIF without file)
            const { validatePhotoUniqueness } = require('../services/photo/photoValidationService');
            await validatePhotoUniqueness(photoCid, id, status);
        }
    }
    
    // Use transaction for atomicity
    const client = await db.getClient();
    
    try {
        await client.query('BEGIN');
        
        // Update complaint status
        const updateResult = await client.query(
            `UPDATE complaints 
             SET status = $1, updated_at = CURRENT_TIMESTAMP, 
                 resolved_at = CASE WHEN $1 = 'resolved' THEN CURRENT_TIMESTAMP ELSE resolved_at END
             WHERE id = $2
             RETURNING *`,
            [status, id]
        );
        
        const updatedComplaint = updateResult.rows[0];
        
        // Insert photo evidence if required and status allows it
        // Now includes 'fake_information' as it requires photo evidence
        const PHOTO_EVIDENCE_ALLOWED_STATUSES = ['arriving', 'in_progress', 'resolved', 'fake_information'];
        if (PHOTO_EVIDENCE_ALLOWED_STATUSES.includes(status) && ipfsCid) {
            await client.query(
                `INSERT INTO photo_evidence (
                    complaint_id, 
                    complaint_status, 
                    ipfs_cid, 
                    photo_url, 
                    exif_latitude, 
                    exif_longitude, 
                    exif_timestamp, 
                    uploaded_by
                )
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
                [
                    id,
                    status,
                    ipfsCid,
                    ipfsService.getGatewayUrl(ipfsCid),
                    exifData ? exifData.latitude : null,
                    exifData ? exifData.longitude : null,
                    exifData ? exifData.timestamp : null,
                    user.userId
                ]
            );
        }
        
        // Update status history with correct changed_by and reason
        // The trigger creates a history entry, but we need to update changed_by to the actual user making the change
        // For fake_information, store reason in notes field for full audit trail
        let historyNote;
        if (status === 'fake_information') {
            // Fake information requires reason - store it in status history for audit trail
            historyNote = `Status changed from ${currentStatus} to ${status}. Reason: ${reason}${notes ? '. Additional notes: ' + notes : ''}`;
        } else if (TERMINAL_STATUSES.includes(currentStatus) && isSDMA) {
            // SDMA override - log that SDMA overrode the terminal status
            historyNote = `[SDMA OVERRIDE] Status changed from ${currentStatus} to ${status}${notes ? '. Notes: ' + notes : ''}`;
        } else {
            historyNote = notes || `Status changed from ${currentStatus} to ${status}`;
        }
        
        await client.query(
            `UPDATE complaint_status_history 
             SET changed_by = $1, notes = $2
             WHERE complaint_id = $3 
             AND new_status = $4 
             AND created_at = (SELECT MAX(created_at) FROM complaint_status_history WHERE complaint_id = $3)`,
            [user.userId, historyNote, id, status]
        );
        
        await client.query('COMMIT');
        
        // Log to blockchain audit (non-blocking)
        try {
            await logComplaintStatusChange(updatedComplaint, complaint, user.userId, reason || null);
        } catch (auditError) {
            console.error('Audit logging failed (non-blocking):', auditError);
            // Continue even if audit logging fails
        }
        
        res.json({
            success: true,
            message: 'Complaint status updated',
            data: { 
                complaint: updatedComplaint,
                ...(exifData && { exif: exifData }),
                ...(ipfsCid && { ipfs: { cid: ipfsCid, gatewayUrl: ipfsService.getGatewayUrl(ipfsCid) } })
            }
        });
    } catch (error) {
        await client.query('ROLLBACK');
        throw error;
    } finally {
        client.release();
    }
});

/**
 * Assign complaint to organization
 * PATCH /api/complaints/:id/assign
 */
const assignComplaint = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { assignedTo } = req.body;
    const user = req.user;
    
    // Only DDMA and SDMA can assign complaints
    if (user.userType !== 'ddma' && user.userType !== 'sdma') {
        throw new AppError('Only DDMA and SDMA can assign complaints', 403, 'FORBIDDEN');
    }
    
    if (!assignedTo) {
        throw new AppError('assignedTo is required', 400, 'VALIDATION_ERROR');
    }
    
    const result = await db.query(
        `UPDATE complaints 
         SET assigned_to = $1, updated_at = CURRENT_TIMESTAMP
         WHERE id = $2
         RETURNING *`,
        [assignedTo, id]
    );
    
    if (result.rows.length === 0) {
        throw new AppError('Complaint not found', 404, 'NOT_FOUND');
    }
    
    res.json({
        success: true,
        message: 'Complaint assigned successfully',
        data: { complaint: result.rows[0] }
    });
});

module.exports = {
    getComplaints,
    getComplaint,
    getComplaintTimeline,
    createComplaint,
    updateComplaintStatus,
    assignComplaint
};
