/**
 * Donations Controller
 * Handles donation operations
 */

const db = require('../config/database');
const { AppError, asyncHandler } = require('../middleware/errorHandler');

/**
 * Get all donations
 * GET /api/donations
 */
const getDonations = asyncHandler(async (req, res) => {
    const { status, complaintId, limit = 50, offset = 0 } = req.query;
    const user = req.user;
    
    let query = 'SELECT * FROM donations WHERE 1=1';
    const params = [];
    let paramCount = 0;
    
    // Filter by complaint if provided
    if (complaintId) {
        paramCount++;
        query += ` AND complaint_id = $${paramCount}`;
        params.push(complaintId);
    }
    
    // Filter by status
    if (status) {
        paramCount++;
        query += ` AND status = $${paramCount}`;
        params.push(status);
    }
    
    // Victims can only see donations linked to their complaints
    if (user.userType === 'victim') {
        paramCount++;
        query += ` AND complaint_id IN (SELECT id FROM complaints WHERE victim_id = $${paramCount})`;
        params.push(user.userId);
    }
    
    query += ` ORDER BY created_at DESC LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}`;
    params.push(parseInt(limit), parseInt(offset));
    
    const result = await db.query(query, params);
    
    res.json({
        success: true,
        data: {
            donations: result.rows,
            count: result.rows.length
        }
    });
});

/**
 * Get single donation
 * GET /api/donations/:id
 */
const getDonation = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const user = req.user;
    
    const result = await db.query('SELECT * FROM donations WHERE id = $1', [id]);
    
    if (result.rows.length === 0) {
        throw new AppError('Donation not found', 404, 'NOT_FOUND');
    }
    
    const donation = result.rows[0];
    
    // Check access for victims
    if (user.userType === 'victim' && donation.complaint_id) {
        const complaintResult = await db.query('SELECT victim_id FROM complaints WHERE id = $1', [donation.complaint_id]);
        if (complaintResult.rows.length > 0 && complaintResult.rows[0].victim_id !== user.userId) {
            throw new AppError('Access denied', 403, 'FORBIDDEN');
        }
    }
    
    res.json({
        success: true,
        data: { donation }
    });
});

/**
 * Create donation
 * POST /api/donations
 */
const createDonation = asyncHandler(async (req, res) => {
    const { donorName, donorPhone, donorEmail, amount, upiTransactionId, upiQrCode, complaintId } = req.body;
    
    if (!amount || amount <= 0) {
        throw new AppError('Valid amount is required', 400, 'VALIDATION_ERROR');
    }
    
    if (!upiTransactionId) {
        throw new AppError('UPI transaction ID is required', 400, 'VALIDATION_ERROR');
    }
    
    // Use common UPI QR if not provided
    const qrCode = upiQrCode || 'COMMON-UPI-QR-001';
    
    const result = await db.query(
        `INSERT INTO donations (donor_name, donor_phone, donor_email, amount, upi_transaction_id, upi_qr_code, complaint_id, status)
         VALUES ($1, $2, $3, $4, $5, $6, $7, 'pending')
         RETURNING *`,
        [donorName || null, donorPhone || null, donorEmail || null, amount, upiTransactionId, qrCode, complaintId || null]
    );
    
    res.status(201).json({
        success: true,
        message: 'Donation created successfully',
        data: { donation: result.rows[0] }
    });
});

/**
 * Update donation status (organizations only)
 * PATCH /api/donations/:id/status
 */
const updateDonationStatus = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { status } = req.body;
    const user = req.user;
    
    if (user.userType === 'victim') {
        throw new AppError('Victims cannot update donation status', 403, 'FORBIDDEN');
    }
    
    const validStatuses = ['pending', 'completed', 'failed', 'refunded'];
    if (!validStatuses.includes(status)) {
        throw new AppError('Invalid status', 400, 'VALIDATION_ERROR');
    }
    
    const result = await db.query(
        `UPDATE donations 
         SET status = $1, updated_at = CURRENT_TIMESTAMP,
             completed_at = CASE WHEN $1 = 'completed' THEN CURRENT_TIMESTAMP ELSE completed_at END
         WHERE id = $2
         RETURNING *`,
        [status, id]
    );
    
    if (result.rows.length === 0) {
        throw new AppError('Donation not found', 404, 'NOT_FOUND');
    }
    
    res.json({
        success: true,
        message: 'Donation status updated',
        data: { donation: result.rows[0] }
    });
});

module.exports = {
    getDonations,
    getDonation,
    createDonation,
    updateDonationStatus
};
