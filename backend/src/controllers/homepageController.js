/**
 * Homepage Controller
 * Public endpoints for homepage data (no authentication required)
 */

const db = require('../config/database');
const { AppError, asyncHandler } = require('../middleware/errorHandler');

/**
 * Get public homepage statistics
 * GET /api/homepage/stats
 * No authentication required
 */
const getHomepageStats = asyncHandler(async (req, res) => {
    const stats = {};
    
    // User counts (public info)
    const userCounts = await db.query(
        `SELECT user_type, COUNT(*) as count 
         FROM users 
         WHERE is_active = TRUE 
         GROUP BY user_type`
    );
    stats.users = {};
    userCounts.rows.forEach(row => {
        stats.users[row.user_type] = parseInt(row.count);
    });
    
    // Complaint counts by status (public info)
    const complaintCounts = await db.query(
        `SELECT status, COUNT(*) as count 
         FROM complaints 
         GROUP BY status`
    );
    stats.complaints = {};
    let totalComplaints = 0;
    complaintCounts.rows.forEach(row => {
        stats.complaints[row.status] = parseInt(row.count);
        totalComplaints += parseInt(row.count);
    });
    stats.complaints.total = totalComplaints;
    
    // Active complaints (not resolved, not fake)
    const activeComplaintsResult = await db.query(
        `SELECT COUNT(*) as count 
         FROM complaints 
         WHERE status NOT IN ('resolved', 'fake_information')`
    );
    stats.complaints.active = parseInt(activeComplaintsResult.rows[0].count);
    
    // Resolved complaints
    const resolvedComplaintsResult = await db.query(
        `SELECT COUNT(*) as count 
         FROM complaints 
         WHERE status = 'resolved'`
    );
    stats.complaints.resolved = parseInt(resolvedComplaintsResult.rows[0].count);
    
    // Donation stats (public info - no amounts)
    const donationStats = await db.query(
        `SELECT 
            COUNT(*) as total,
            COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_count,
            COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_count
         FROM donations`
    );
    stats.donations = {
        total: parseInt(donationStats.rows[0].total),
        completed: parseInt(donationStats.rows[0].completed_count),
        pending: parseInt(donationStats.rows[0].pending_count)
    };
    
    // Recent activity (last 10 resolved complaints)
    const recentActivity = await db.query(
        `SELECT 
            id,
            status,
            urgency_level,
            location,
            created_at,
            resolved_at
         FROM complaints 
         WHERE status = 'resolved' 
         ORDER BY resolved_at DESC NULLS LAST, created_at DESC
         LIMIT 10`
    );
    stats.recentActivity = recentActivity.rows.map(row => ({
        id: row.id,
        status: row.status,
        urgencyLevel: row.urgency_level,
        location: row.location,
        createdAt: row.created_at,
        resolvedAt: row.resolved_at
    }));
    
    res.json({
        success: true,
        data: { stats }
    });
});

/**
 * Get public NGO list for homepage
 * GET /api/homepage/ngos
 * No authentication required
 */
const getPublicNGOs = asyncHandler(async (req, res) => {
    const result = await db.query(
        `SELECT 
            u.id, 
            u.name, 
            n.organization_name, 
            n.registration_number, 
            n.address, 
            n.contact_person, 
            n.email
         FROM users u
         LEFT JOIN ngos n ON u.id = n.user_id
         WHERE u.user_type = 'ngo' 
         AND u.is_active = TRUE
         ORDER BY u.name ASC`
    );
    
    const ngos = result.rows.map(row => ({
        id: row.id,
        name: row.organization_name || row.name,
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

module.exports = {
    getHomepageStats,
    getPublicNGOs
};
