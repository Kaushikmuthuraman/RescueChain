/**
 * Blockchain Controller
 * Handles blockchain audit log queries
 */

const db = require('../config/database');
const { AppError, asyncHandler } = require('../middleware/errorHandler');

/**
 * Get blockchain audit logs for a complaint
 * GET /api/blockchain/audit/:complaintId
 * Returns transaction details with location information
 */
const getComplaintAuditLogs = asyncHandler(async (req, res) => {
    const { complaintId } = req.params;
    const user = req.user;
    
    // Verify complaint exists and user has access
    const complaintResult = await db.query(
        'SELECT * FROM complaints WHERE id = $1',
        [complaintId]
    );
    
    if (complaintResult.rows.length === 0) {
        throw new AppError('Complaint not found', 404, 'NOT_FOUND');
    }
    
    const complaint = complaintResult.rows[0];
    
    // Check access - victims can only see their own complaint's audit logs
    if (user.userType === 'victim' && complaint.victim_id !== user.userId) {
        throw new AppError('Access denied', 403, 'FORBIDDEN');
    }
    
    // Query blockchain audit logs for this complaint
    const auditLogsResult = await db.query(
        `SELECT 
            polygon_tx_hash as tx_hash,
            polygon_block_number as block_number,
            actor_role,
            actor_id,
            latitude,
            longitude,
            location_text,
            created_at
        FROM blockchain_audit_logs
        WHERE entity_type = 'complaint'
        AND entity_id = $1
        ORDER BY created_at DESC`,
        [complaintId]
    );

    // Mask sensitive fields for non-SDMA roles in this public audit view
    const maskLocation = user.userType !== 'sdma';
    
    res.json({
        success: true,
        data: {
            complaintId: complaintId,
            auditLogs: auditLogsResult.rows.map(row => ({
                txHash: row.tx_hash,
                blockNumber: row.block_number,
                actorRole: row.actor_role,
                actorId: user.userType === 'sdma' ? row.actor_id : null,
                latitude: maskLocation ? null : row.latitude,
                longitude: maskLocation ? null : row.longitude,
                locationText: maskLocation ? null : row.location_text,
                createdAt: row.created_at
            }))
        }
    });
});

module.exports = {
    getComplaintAuditLogs
};
