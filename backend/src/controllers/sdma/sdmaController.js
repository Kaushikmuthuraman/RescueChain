/**
 * SDMA Controller
 * Handles SDMA-specific operations: full visibility, donation analytics, audit timeline
 */

const db = require('../../config/database');
const { AppError, asyncHandler } = require('../../middleware/errorHandler');

/**
 * Get comprehensive system overview (SDMA only)
 * GET /api/sdma/overview
 */
const getSystemOverview = asyncHandler(async (req, res) => {
    const user = req.user;
    
    // Only SDMA can access this endpoint
    if (user.userType !== 'sdma') {
        throw new AppError('Access denied. SDMA only.', 403, 'FORBIDDEN');
    }
    
    // Get user counts by type
    const userCounts = await db.query(
        `SELECT user_type, COUNT(*) as count, 
                COUNT(CASE WHEN is_active = TRUE THEN 1 END) as active_count
         FROM users 
         GROUP BY user_type`
    );
    
    const users = {};
    userCounts.rows.forEach(row => {
        users[row.user_type] = {
            total: parseInt(row.count),
            active: parseInt(row.active_count || 0)
        };
    });
    
    // Get complaint counts by status
    const complaintCounts = await db.query(
        `SELECT status, COUNT(*) as count 
         FROM complaints 
         GROUP BY status`
    );
    
    const complaints = {};
    complaintCounts.rows.forEach(row => {
        complaints[row.status] = parseInt(row.count);
    });
    
    // Get donation statistics (SDMA can see amounts)
    const donationStats = await db.query(
        `SELECT 
            COUNT(*) as total,
            COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_count,
            COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_count,
            COALESCE(SUM(CASE WHEN status = 'completed' AND amount IS NOT NULL THEN amount ELSE 0 END), 0) as total_amount,
            COALESCE(AVG(CASE WHEN status = 'completed' AND amount IS NOT NULL THEN amount END), 0) as avg_amount
         FROM donations`
    );
    
    const donations = {
        total: parseInt(donationStats.rows[0].total || 0),
        completed: parseInt(donationStats.rows[0].completed_count || 0),
        pending: parseInt(donationStats.rows[0].pending_count || 0),
        totalAmount: parseFloat(donationStats.rows[0].total_amount || 0),
        averageAmount: parseFloat(donationStats.rows[0].avg_amount || 0)
    };
    
    // Get recent activity counts (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    
    const recentComplaints = await db.query(
        `SELECT COUNT(*) as count 
         FROM complaints 
         WHERE created_at >= $1`,
        [sevenDaysAgo]
    );
    
    const recentDonations = await db.query(
        `SELECT COUNT(*) as count 
         FROM donations 
         WHERE created_at >= $1`,
        [sevenDaysAgo]
    );
    
    res.json({
        success: true,
        data: {
            users,
            complaints,
            donations,
            recentActivity: {
                complaints: parseInt(recentComplaints.rows[0].count || 0),
                donations: parseInt(recentDonations.rows[0].count || 0)
            }
        }
    });
});

/**
 * Get all complaints with full details (SDMA only)
 * GET /api/sdma/complaints
 */
const getAllComplaints = asyncHandler(async (req, res) => {
    const { status, assignedTo, location, limit = 100, offset = 0 } = req.query;
    const user = req.user;
    
    // Only SDMA can access this endpoint
    if (user.userType !== 'sdma') {
        throw new AppError('Access denied. SDMA only.', 403, 'FORBIDDEN');
    }
    
    let query = `
        SELECT c.*, 
               u.name as victim_name,
               u.phone_number as victim_phone,
               assigned_user.name as assigned_to_name,
               assigned_user.user_type as assigned_to_type
        FROM complaints c
        INNER JOIN users u ON c.victim_id = u.id
        LEFT JOIN users assigned_user ON c.assigned_to = assigned_user.id
        WHERE 1=1
    `;
    
    const params = [];
    let paramCount = 0;
    
    if (status) {
        paramCount++;
        query += ` AND c.status = $${paramCount}`;
        params.push(status);
    }
    
    if (assignedTo) {
        paramCount++;
        query += ` AND c.assigned_to = $${paramCount}`;
        params.push(assignedTo);
    }
    
    if (location) {
        paramCount++;
        query += ` AND c.location ILIKE $${paramCount}`;
        params.push(`%${location}%`);
    }
    
    query += ` ORDER BY c.created_at DESC LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}`;
    params.push(parseInt(limit), parseInt(offset));
    
    const result = await db.query(query, params);
    
    const complaints = result.rows.map(row => ({
        id: row.id,
        complaintText: row.complaint_text,
        location: row.location,
        latitude: row.latitude ? parseFloat(row.latitude) : null,
        longitude: row.longitude ? parseFloat(row.longitude) : null,
        urgencyLevel: row.urgency_level,
        status: row.status,
        assignedTo: row.assigned_to,
        assignedToName: row.assigned_to_name,
        assignedToType: row.assigned_to_type,
        resolvedAt: row.resolved_at,
        isSeeded: row.is_seeded || false,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
        victim: {
            id: row.victim_id,
            name: row.victim_name,
            phoneNumber: row.victim_phone
        }
    }));
    
    res.json({
        success: true,
        data: {
            complaints,
            count: complaints.length
        }
    });
});

/**
 * Get donation analytics (SDMA only - with amounts visible)
 * GET /api/sdma/donations/analytics
 */
const getDonationAnalytics = asyncHandler(async (req, res) => {
    const { startDate, endDate, ngoId } = req.query;
    const user = req.user;
    
    // Only SDMA can access this endpoint
    if (user.userType !== 'sdma') {
        throw new AppError('Access denied. SDMA only.', 403, 'FORBIDDEN');
    }
    
    let query = `
        SELECT 
            DATE(created_at) as donation_date,
            COUNT(*) as donation_count,
            COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_count,
            COALESCE(SUM(CASE WHEN status = 'completed' AND amount IS NOT NULL THEN amount ELSE 0 END), 0) as total_amount,
            COALESCE(AVG(CASE WHEN status = 'completed' AND amount IS NOT NULL THEN amount END), 0) as avg_amount,
            COUNT(DISTINCT ngo_id) as ngo_count
        FROM donations
        WHERE 1=1
    `;
    
    const params = [];
    let paramCount = 0;
    
    if (startDate) {
        paramCount++;
        query += ` AND created_at >= $${paramCount}`;
        params.push(new Date(startDate));
    }
    
    if (endDate) {
        paramCount++;
        query += ` AND created_at <= $${paramCount}`;
        params.push(new Date(endDate));
    }
    
    if (ngoId) {
        paramCount++;
        query += ` AND ngo_id = $${paramCount}`;
        params.push(ngoId);
    }
    
    query += ` GROUP BY DATE(created_at) ORDER BY donation_date DESC LIMIT 90`;
    
    const dailyStats = await db.query(query, params);
    
    // Get NGO-wise statistics
    const ngoStatsQuery = `
        SELECT 
            d.ngo_id,
            u.name as ngo_name,
            n.organization_name,
            COUNT(*) as total_donations,
            COUNT(CASE WHEN d.status = 'completed' THEN 1 END) as completed_donations,
            COALESCE(SUM(CASE WHEN d.status = 'completed' AND d.amount IS NOT NULL THEN d.amount ELSE 0 END), 0) as total_amount
        FROM donations d
        LEFT JOIN users u ON d.ngo_id = u.id
        LEFT JOIN ngos n ON u.id = n.user_id
        WHERE 1=1
        ${ngoId ? `AND d.ngo_id = $${paramCount + 1}` : ''}
        GROUP BY d.ngo_id, u.name, n.organization_name
        ORDER BY total_amount DESC
    `;
    
    const ngoStats = await db.query(
        ngoId ? ngoStatsQuery : ngoStatsQuery.replace(`AND d.ngo_id = $${paramCount + 1}`, ''),
        ngoId ? [...params, ngoId] : params
    );
    
    // Overall summary
    let summaryQuery = `
        SELECT 
            COUNT(*) as total_donations,
            COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_donations,
            COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_donations,
            COALESCE(SUM(CASE WHEN status = 'completed' AND amount IS NOT NULL THEN amount ELSE 0 END), 0) as total_amount,
            COALESCE(AVG(CASE WHEN status = 'completed' AND amount IS NOT NULL THEN amount END), 0) as avg_amount,
            COALESCE(MAX(CASE WHEN status = 'completed' AND amount IS NOT NULL THEN amount END), 0) as max_amount
        FROM donations
        WHERE 1=1
    `;
    
    const summaryParams = [];
    let summaryParamCount = 0;
    
    if (startDate) {
        summaryParamCount++;
        summaryQuery += ` AND created_at >= $${summaryParamCount}`;
        summaryParams.push(new Date(startDate));
    }
    
    if (endDate) {
        summaryParamCount++;
        summaryQuery += ` AND created_at <= $${summaryParamCount}`;
        summaryParams.push(new Date(endDate));
    }
    
    const summary = await db.query(summaryQuery, summaryParams);
    
    res.json({
        success: true,
        data: {
            dailyStats: dailyStats.rows.map(row => ({
                date: row.donation_date,
                donationCount: parseInt(row.donation_count),
                completedCount: parseInt(row.completed_count),
                totalAmount: parseFloat(row.total_amount || 0),
                averageAmount: parseFloat(row.avg_amount || 0),
                ngoCount: parseInt(row.ngo_count)
            })),
            ngoStats: ngoStats.rows.map(row => ({
                ngoId: row.ngo_id,
                ngoName: row.organization_name || row.ngo_name,
                totalDonations: parseInt(row.total_donations),
                completedDonations: parseInt(row.completed_donations),
                totalAmount: parseFloat(row.total_amount || 0)
            })),
            summary: {
                totalDonations: parseInt(summary.rows[0].total_donations || 0),
                completedDonations: parseInt(summary.rows[0].completed_donations || 0),
                pendingDonations: parseInt(summary.rows[0].pending_donations || 0),
                totalAmount: parseFloat(summary.rows[0].total_amount || 0),
                averageAmount: parseFloat(summary.rows[0].avg_amount || 0),
                maxAmount: parseFloat(summary.rows[0].max_amount || 0)
            }
        }
    });
});

/**
 * Get audit timeline/blockchain audit logs (SDMA only)
 * GET /api/sdma/audit-timeline
 */
const getAuditTimeline = asyncHandler(async (req, res) => {
    const { entityType, entityId, action, limit = 100, offset = 0 } = req.query;
    const user = req.user;
    
    // Only SDMA can access this endpoint
    if (user.userType !== 'sdma') {
        throw new AppError('Access denied. SDMA only.', 403, 'FORBIDDEN');
    }
    
    let query = `
        SELECT bal.*, 
               u.name as created_by_name,
               u.user_type as created_by_type
        FROM blockchain_audit_logs bal
        LEFT JOIN users u ON bal.created_by = u.id
        WHERE 1=1
    `;
    
    const params = [];
    let paramCount = 0;
    
    if (entityType) {
        paramCount++;
        query += ` AND bal.entity_type = $${paramCount}`;
        params.push(entityType);
    }
    
    if (entityId) {
        paramCount++;
        query += ` AND bal.entity_id = $${paramCount}`;
        params.push(entityId);
    }
    
    if (action) {
        paramCount++;
        query += ` AND bal.action = $${paramCount}`;
        params.push(action);
    }
    
    query += ` ORDER BY bal.created_at DESC LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}`;
    params.push(parseInt(limit), parseInt(offset));
    
    const result = await db.query(query, params);
    
    const auditLogs = result.rows.map(row => ({
        id: row.id,
        entityType: row.entity_type,
        entityId: row.entity_id,
        action: row.action,
        oldData: row.old_data,
        newData: row.new_data,
        polygonTxHash: row.polygon_tx_hash,
        polygonBlockNumber: row.polygon_block_number ? parseInt(row.polygon_block_number) : null,
        polygonTimestamp: row.polygon_timestamp,
        createdBy: row.created_by,
        createdByName: row.created_by_name,
        createdByType: row.created_by_type,
        createdAt: row.created_at
    }));
    
    res.json({
        success: true,
        data: {
            auditLogs,
            count: auditLogs.length
        }
    });
});

/**
 * Get all donations with full details including amounts (SDMA only)
 * GET /api/sdma/donations
 */
const getAllDonations = asyncHandler(async (req, res) => {
    const { status, ngoId, limit = 100, offset = 0 } = req.query;
    const user = req.user;
    
    // Only SDMA can access this endpoint
    if (user.userType !== 'sdma') {
        throw new AppError('Access denied. SDMA only.', 403, 'FORBIDDEN');
    }
    
    let query = `
        SELECT d.*, 
               u.name as ngo_name,
               n.organization_name
        FROM donations d
        LEFT JOIN users u ON d.ngo_id = u.id
        LEFT JOIN ngos n ON u.id = n.user_id
        WHERE 1=1
    `;
    
    const params = [];
    let paramCount = 0;
    
    if (status) {
        paramCount++;
        query += ` AND d.status = $${paramCount}`;
        params.push(status);
    }
    
    if (ngoId) {
        paramCount++;
        query += ` AND d.ngo_id = $${paramCount}`;
        params.push(ngoId);
    }
    
    query += ` ORDER BY d.created_at DESC LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}`;
    params.push(parseInt(limit), parseInt(offset));
    
    const result = await db.query(query, params);
    
    const donations = result.rows.map(row => ({
        id: row.id,
        donorName: row.donor_name,
        donorPhone: row.donor_phone,
        donorEmail: row.donor_email,
        amount: row.amount ? parseFloat(row.amount) : null,
        upiTransactionId: row.upi_transaction_id,
        upiQrCode: row.upi_qr_code,
        ngoId: row.ngo_id,
        ngoName: row.organization_name || row.ngo_name,
        status: row.status,
        complaintId: row.complaint_id,
        isSeeded: row.is_seeded || false,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
        completedAt: row.completed_at
    }));
    
    res.json({
        success: true,
        data: {
            donations,
            count: donations.length
        }
    });
});

module.exports = {
    getSystemOverview,
    getAllComplaints,
    getDonationAnalytics,
    getAuditTimeline,
    getAllDonations
};
