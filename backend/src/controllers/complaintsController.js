/**
 * Complaints Controller
 * Handles complaint-related operations
 */

const db = require('../config/database');
const { AppError, asyncHandler } = require('../middleware/errorHandler');

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
 * Create new complaint (victims only)
 * POST /api/complaints
 */
const createComplaint = asyncHandler(async (req, res) => {
    const { complaintText, location, latitude, longitude, urgencyLevel } = req.body;
    const user = req.user;
    
    if (user.userType !== 'victim') {
        throw new AppError('Only victims can create complaints', 403, 'FORBIDDEN');
    }
    
    if (!complaintText || !location) {
        throw new AppError('Complaint text and location are required', 400, 'VALIDATION_ERROR');
    }
    
    const result = await db.query(
        `INSERT INTO complaints (victim_id, complaint_text, location, latitude, longitude, urgency_level, status)
         VALUES ($1, $2, $3, $4, $5, $6, 'submitted')
         RETURNING *`,
        [user.userId, complaintText, location, latitude || null, longitude || null, urgencyLevel || 'medium']
    );
    
    res.status(201).json({
        success: true,
        message: 'Complaint created successfully',
        data: { complaint: result.rows[0] }
    });
});

/**
 * Update complaint status (organizations only)
 * PATCH /api/complaints/:id/status
 */
const updateComplaintStatus = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { status, notes } = req.body;
    const user = req.user;
    
    if (user.userType === 'victim') {
        throw new AppError('Victims cannot update complaint status', 403, 'FORBIDDEN');
    }
    
    const validStatuses = ['submitted', 'accepted', 'arriving', 'in_progress', 'resolved', 'fake_information'];
    if (!validStatuses.includes(status)) {
        throw new AppError('Invalid status', 400, 'VALIDATION_ERROR');
    }
    
    // Get current complaint
    const complaintResult = await db.query('SELECT * FROM complaints WHERE id = $1', [id]);
    if (complaintResult.rows.length === 0) {
        throw new AppError('Complaint not found', 404, 'NOT_FOUND');
    }
    
    const complaint = complaintResult.rows[0];
    
    // Update status
    const updateResult = await db.query(
        `UPDATE complaints 
         SET status = $1, updated_at = CURRENT_TIMESTAMP, 
             resolved_at = CASE WHEN $1 = 'resolved' THEN CURRENT_TIMESTAMP ELSE resolved_at END
         WHERE id = $2
         RETURNING *`,
        [status, id]
    );
    
    // Status history is auto-created by trigger, but we can add notes
    if (notes) {
        await db.query(
            `UPDATE complaint_status_history 
             SET notes = $1 
             WHERE complaint_id = $2 
             AND new_status = $3 
             AND created_at = (SELECT MAX(created_at) FROM complaint_status_history WHERE complaint_id = $2)`,
            [notes, id, status]
        );
    }
    
    res.json({
        success: true,
        message: 'Complaint status updated',
        data: { complaint: updateResult.rows[0] }
    });
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
    createComplaint,
    updateComplaintStatus,
    assignComplaint
};
