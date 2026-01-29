/**
 * Donations Controller
 * Handles donation operations
 * App never processes payments - only logs donation intent
 * Amount is hidden from public & NGOs, visible only to SDMA
 */

const db = require('../config/database');
const { AppError, asyncHandler } = require('../middleware/errorHandler');
const { logDonationIntent } = require('../services/polygon/auditLogger');

/**
 * Helper function to sanitize donation data based on user role
 * Amount is hidden from public & NGOs, visible only to SDMA
 * @param {Object} donation - Donation object from database
 * @param {Object} user - Current user
 * @returns {Object} Sanitized donation object
 */
function sanitizeDonation(donation, user) {
    if (!donation) return donation;
    
    const sanitized = { ...donation };
    
    // Hide amount from public & NGOs - only SDMA can see it
    if (user.userType !== 'sdma') {
        delete sanitized.amount;
    }
    
    return sanitized;
}

/**
 * Get list of NGOs (for donor selection)
 * GET /api/donations/ngos
 */
const getNGOs = asyncHandler(async (req, res) => {
    const result = await db.query(
        `SELECT u.id, u.name, u.phone_number, n.organization_name, n.registration_number, n.address, n.contact_person, n.email
         FROM users u
         LEFT JOIN ngos n ON u.id = n.user_id
         WHERE u.user_type = 'ngo' AND u.is_active = TRUE
         ORDER BY u.name ASC`
    );
    
    const ngos = result.rows.map(row => ({
        id: row.id,
        name: row.organization_name || row.name,
        phoneNumber: row.phone_number,
        registrationNumber: row.registration_number,
        address: row.address,
        contactPerson: row.contact_person,
        email: row.email
    }));
    
    res.json({
        success: true,
        data: {
            ngos,
            count: ngos.length
        }
    });
});

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
    
    // Sanitize donations to hide amount from non-SDMA users
    const donations = result.rows.map(donation => sanitizeDonation(donation, user));
    
    res.json({
        success: true,
        data: {
            donations,
            count: donations.length
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
    
    // Sanitize donation to hide amount from non-SDMA users
    const sanitizedDonation = sanitizeDonation(donation, user);
    
    res.json({
        success: true,
        data: { donation: sanitizedDonation }
    });
});

/**
 * Create donation (log donation intent only)
 * POST /api/donations
 * 
 * Rules:
 * - App never processes payments
 * - Only logs donation intent
 * - NGO selection is required
 * - Amount and transaction ID are optional (user confirms payment externally)
 */
const createDonation = asyncHandler(async (req, res) => {
    const { donorName, donorPhone, donorEmail, ngoId, amount, upiTransactionId, complaintId } = req.body;
    
    // NGO selection is required
    if (!ngoId) {
        throw new AppError('NGO selection is required', 400, 'VALIDATION_ERROR');
    }
    
    // Verify NGO exists and is actually an NGO
    const ngoResult = await db.query('SELECT id, user_type FROM users WHERE id = $1', [ngoId]);
    if (ngoResult.rows.length === 0) {
        throw new AppError('Selected NGO not found', 404, 'NOT_FOUND');
    }
    
    if (ngoResult.rows[0].user_type !== 'ngo') {
        throw new AppError('Selected user is not an NGO', 400, 'VALIDATION_ERROR');
    }
    
    // Amount and transaction ID are optional
    // App doesn't process payments, just logs donation intent
    // User confirms payment externally via UPI
    
    // Use common UPI QR code
    const qrCode = 'COMMON-UPI-QR-001';
    
    // Validate amount if provided
    if (amount !== undefined && amount !== null) {
        if (typeof amount !== 'number' || amount <= 0) {
            throw new AppError('Amount must be a positive number if provided', 400, 'VALIDATION_ERROR');
        }
    }
    
    const result = await db.query(
        `INSERT INTO donations (donor_name, donor_phone, donor_email, ngo_id, amount, upi_transaction_id, upi_qr_code, complaint_id, status)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'pending')
         RETURNING *`,
        [
            donorName || null,
            donorPhone || null,
            donorEmail || null,
            ngoId,
            amount || null,
            upiTransactionId || null,
            qrCode,
            complaintId || null
        ]
    );
    
    const donation = result.rows[0];
    
    // Log to blockchain audit (non-blocking)
    // Use user ID if authenticated, otherwise null for anonymous donations
    try {
        await logDonationIntent(donation, req.user?.userId || null);
    } catch (auditError) {
        console.error('Audit logging failed (non-blocking):', auditError);
        // Continue even if audit logging fails
    }
    
    // Sanitize response to hide amount from non-SDMA users
    const sanitizedDonation = sanitizeDonation(donation, req.user);
    
    res.status(201).json({
        success: true,
        message: 'Donation intent logged successfully',
        data: { donation: sanitizedDonation }
    });
});

/**
 * Confirm donation payment (mark as completed)
 * PATCH /api/donations/:id/confirm
 * User confirms they have completed payment externally
 */
const confirmDonationPayment = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { amount, upiTransactionId } = req.body;
    const user = req.user;
    
    // Get current donation
    const result = await db.query('SELECT * FROM donations WHERE id = $1', [id]);
    if (result.rows.length === 0) {
        throw new AppError('Donation not found', 404, 'NOT_FOUND');
    }
    
    const donation = result.rows[0];
    
    // Only the donor or authenticated user can confirm their own donation
    // For simplicity, any authenticated user can confirm if they have access
    // In production, you might want to track who created the donation
    
    // Update donation with payment confirmation details
    const updateFields = [];
    const updateValues = [];
    let paramCount = 0;
    
    if (amount !== undefined && amount !== null) {
        paramCount++;
        updateFields.push(`amount = $${paramCount}`);
        updateValues.push(amount);
    }
    
    if (upiTransactionId) {
        paramCount++;
        updateFields.push(`upi_transaction_id = $${paramCount}`);
        updateValues.push(upiTransactionId);
    }
    
    paramCount++;
    updateFields.push(`status = $${paramCount}`);
    updateValues.push('completed');
    
    paramCount++;
    updateFields.push(`completed_at = CURRENT_TIMESTAMP`);
    updateFields.push(`updated_at = CURRENT_TIMESTAMP`);
    
    updateValues.push(id);
    paramCount++;
    
    const updateQuery = `UPDATE donations 
                        SET ${updateFields.join(', ')}
                        WHERE id = $${paramCount}
                        RETURNING *`;
    
    const updateResult = await db.query(updateQuery, updateValues);
    
    // Sanitize response
    const updatedDonation = sanitizeDonation(updateResult.rows[0], user);
    
    res.json({
        success: true,
        message: 'Donation payment confirmed',
        data: { donation: updatedDonation }
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
    
    // Sanitize response
    const donation = sanitizeDonation(result.rows[0], user);
    
    res.json({
        success: true,
        message: 'Donation status updated',
        data: { donation }
    });
});

module.exports = {
    getNGOs,
    getDonations,
    getDonation,
    createDonation,
    confirmDonationPayment,
    updateDonationStatus
};
