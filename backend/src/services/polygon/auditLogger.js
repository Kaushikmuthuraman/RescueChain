/**
 * Audit Logger Service
 * Integrates Polygon blockchain logging with database storage
 * Hashes audit data and stores on-chain
 */

const db = require('../../config/database');
const { logAuditEvent } = require('./polygonService');
const { AppError } = require('../../middleware/errorHandler');

/**
 * Log audit event to both blockchain and database
 * Non-blocking: database logs even if blockchain fails
 * @param {Object} params - Audit parameters
 * @param {string} params.entityType - Type of entity ('complaint', 'donation', etc.)
 * @param {string} params.entityId - ID of the entity
 * @param {string} params.action - Action performed ('created', 'status_changed', etc.)
 * @param {Object} params.data - Data to audit (will be sanitized before hashing)
 * @param {Object} params.oldData - Previous state (optional, for updates)
 * @param {string} params.userId - ID of user performing action
 * @param {string} params.latitude - Transaction latitude (optional, stored in DB only)
 * @param {string} params.longitude - Transaction longitude (optional, stored in DB only)
 * @param {string} params.locationText - Location text description (optional, stored in DB only)
 * @param {string} params.actorRole - Actor role: 'victim' | 'ngo' | 'ddma' (optional, stored in DB only)
 * @param {string} params.actorId - Actor UUID (optional, stored in DB only)
 * @returns {Promise<Object>} Audit log record
 */
async function logAudit(params) {
    const { 
        entityType, 
        entityId, 
        action, 
        data, 
        oldData, 
        userId,
        latitude,
        longitude,
        locationText,
        actorRole,
        actorId
    } = params;
    
    // Prepare audit data (without personal info)
    const auditData = {
        entityType,
        entityId,
        action,
        timestamp: new Date().toISOString(),
        ...(oldData && { oldStatus: oldData.status, oldDataHash: dataHash(oldData) }),
        newData: sanitizeForAudit(data)
    };
    
    // Generate event type for blockchain
    const eventType = `${entityType}_${action}`;
    
    try {
        // Log to blockchain (non-blocking)
        let blockchainResult = null;
        try {
            blockchainResult = await logAuditEvent(auditData, eventType);
        } catch (blockchainError) {
            console.error('Blockchain logging failed (continuing with DB):', blockchainError);
            // Continue with database logging even if blockchain fails
        }
        
        // Save to database (including location fields - NOT sent to blockchain)
        const result = await db.query(
            `INSERT INTO blockchain_audit_logs (
                entity_type,
                entity_id,
                action,
                old_data,
                new_data,
                polygon_tx_hash,
                polygon_block_number,
                polygon_timestamp,
                created_by,
                latitude,
                longitude,
                location_text,
                actor_role,
                actor_id
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
            RETURNING *`,
            [
                entityType,
                entityId,
                action,
                oldData ? JSON.stringify(sanitizeForAudit(oldData)) : null,
                JSON.stringify({
                    ...auditData.newData,
                    blockchainResult: blockchainResult?.blockchainResult || null
                }),
                blockchainResult?.blockchainResult?.txHash || null,
                blockchainResult?.blockchainResult?.blockNumber || null,
                blockchainResult?.blockchainResult?.timestamp ? new Date(blockchainResult.blockchainResult.timestamp) : null,
                userId,
                latitude || null,
                longitude || null,
                locationText || null,
                actorRole || null,
                actorId || null
            ]
        );
        
        return result.rows[0];
    } catch (error) {
        console.error('Audit logging error:', error);
        // Don't throw - audit logging failures shouldn't break main operations
        // But log the error for debugging
        return null;
    }
}

/**
 * Sanitize data for audit logging (remove personal information)
 * @param {Object} data - Data to sanitize
 * @returns {Object} Sanitized data
 */
function sanitizeForAudit(data) {
    if (!data || typeof data !== 'object') {
        return data;
    }
    
    const sanitized = { ...data };
    
    // Remove personal information fields
    const personalFields = [
        'donorName', 'donor_name',
        'donorPhone', 'donor_phone',
        'donorEmail', 'donor_email',
        'phoneNumber', 'phone_number',
        'email',
        'photoUrl', 'photo_url',
        'photoCid', 'photo_cid',
        'upiTransactionId', 'upi_transaction_id' // Keep this for audit but could remove
    ];
    
    personalFields.forEach(field => {
        if (sanitized[field] !== undefined) {
            delete sanitized[field];
        }
    });
    
    // For complaints, keep text structure but remove content if too personal
    // For audit purposes, we can keep a hash or just the fact that text exists
    if (sanitized.complaintText !== undefined) {
        // Remove actual text, keep length and structure info
        sanitized.complaintTextLength = sanitized.complaintText?.length || 0;
        delete sanitized.complaintText;
    }
    if (sanitized.complaint_text !== undefined) {
        sanitized.complaintTextLength = sanitized.complaint_text?.length || 0;
        delete sanitized.complaint_text;
    }
    
    // Remove victim_id and created_by (user IDs are personal)
    // Keep organization IDs (ngo_id, assigned_to) as they're organizational
    if (sanitized.victimId !== undefined) {
        delete sanitized.victimId;
    }
    if (sanitized.victim_id !== undefined) {
        delete sanitized.victim_id;
    }
    if (sanitized.createdBy !== undefined) {
        delete sanitized.createdBy;
    }
    if (sanitized.created_by !== undefined) {
        delete sanitized.created_by;
    }
    
    // Keep location but maybe generalize it
    // For now, keep location as it's not directly personal
    
    return sanitized;
}

/**
 * Create a simple hash of data (for old data comparison)
 * @param {Object} data - Data to hash
 * @returns {string} Hash string
 */
function dataHash(data) {
    if (!data) return null;
    const crypto = require('crypto');
    const sanitized = sanitizeForAudit(data);
    const dataString = JSON.stringify(sanitized);
    return crypto.createHash('sha256').update(dataString).digest('hex');
}

/**
 * Log complaint creation
 * @param {Object} complaint - Complaint data
 * @param {string} userId - User ID creating the complaint
 * @param {Object} options - Optional location and actor information
 * @param {string} options.latitude - Transaction latitude (optional)
 * @param {string} options.longitude - Transaction longitude (optional)
 * @param {string} options.locationText - Location text description (optional)
 */
async function logComplaintCreation(complaint, userId, options = {}) {
    return await logAudit({
        entityType: 'complaint',
        entityId: complaint.id,
        action: 'created',
        data: complaint,
        userId,
        latitude: options.latitude,
        longitude: options.longitude,
        locationText: options.locationText,
        actorRole: 'victim',
        actorId: userId
    });
}

/**
 * Log complaint status change
 * @param {Object} complaint - Updated complaint data
 * @param {Object} oldComplaint - Previous complaint data
 * @param {string} userId - User ID changing status
 * @param {string} reason - Reason for change (for fake_information)
 * @param {Object} options - Optional location and actor information
 * @param {string} options.latitude - Transaction latitude (optional)
 * @param {string} options.longitude - Transaction longitude (optional)
 * @param {string} options.locationText - Location text description (optional)
 * @param {string} options.actorRole - Actor role: 'ngo' | 'ddma' | 'sdma' (optional)
 */
async function logComplaintStatusChange(complaint, oldComplaint, userId, reason = null, options = {}) {
    const action = complaint.status === 'fake_information' ? 'fake_info_decision' : 'status_changed';
    
    const auditData = {
        ...complaint,
        ...(reason && { reason }) // Include reason for fake_info decision
    };
    
    return await logAudit({
        entityType: 'complaint',
        entityId: complaint.id,
        action,
        data: auditData,
        oldData: oldComplaint,
        userId,
        latitude: options.latitude,
        longitude: options.longitude,
        locationText: options.locationText,
        actorRole: options.actorRole || null,
        actorId: userId
    });
}

/**
 * Log donation intent
 * @param {Object} donation - Donation data
 * @param {string} userId - User ID creating donation (or null for anonymous)
 */
async function logDonationIntent(donation, userId = null) {
    return await logAudit({
        entityType: 'donation',
        entityId: donation.id,
        action: 'donation_intent',
        data: donation,
        userId
    });
}

module.exports = {
    logAudit,
    logComplaintCreation,
    logComplaintStatusChange,
    logDonationIntent,
    sanitizeForAudit
};
