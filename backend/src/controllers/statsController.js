/**
 * Stats Controller
 * Provides KPI metrics for dashboards across all portals
 */

const db = require('../config/database');
const { AppError, asyncHandler } = require('../middleware/errorHandler');

/**
 * Get KPI metrics for dashboards
 * GET /api/stats/kpi
 *
 * Returns role-filtered KPIs:
 * - Active rescues (accepted, arriving, in_progress)
 * - Pending assignments (submitted)
 * - Average resolution time (last 30 days)
 * - NGO response SLA (avg time from assignment to first status update)
 * - Severity breakdown (counts by urgency level for active complaints)
 */
const getKPIMetrics = asyncHandler(async (req, res) => {
    const user = req.user;
    const userType = user?.userType;
    const userId = user?.userId;
    
    // Build WHERE clause based on role
    let whereClause = '';
    const params = [];
    let paramIndex = 1;
    
    if (userType === 'ngo') {
        // NGO: Only their assigned complaints
        whereClause = `WHERE c.assigned_to = $${paramIndex}`;
        params.push(userId);
        paramIndex++;
    } else if (userType === 'victim') {
        // Victim: Only their own complaints
        whereClause = `WHERE c.victim_id = $${paramIndex}`;
        params.push(userId);
        paramIndex++;
    }
    // DDMA and SDMA see all complaints (no filter)
    
    // 1. Active Rescues (accepted, arriving, in_progress)
    const activeRescuesQuery = `
        SELECT COUNT(*) as count 
        FROM complaints c
        ${whereClause}
        ${whereClause ? 'AND' : 'WHERE'} c.status IN ('accepted', 'arriving', 'in_progress')
    `;
    const activeRescuesResult = await db.query(activeRescuesQuery, params);
    const activeRescues = parseInt(activeRescuesResult.rows[0]?.count || 0);
    
    // 2. Pending Assignments (submitted status)
    const pendingQuery = `
        SELECT COUNT(*) as count 
        FROM complaints c
        ${whereClause}
        ${whereClause ? 'AND' : 'WHERE'} c.status = 'submitted'
    `;
    const pendingResult = await db.query(pendingQuery, params);
    const pendingAssignments = parseInt(pendingResult.rows[0]?.count || 0);
    
    // 3. Average Resolution Time (last 30 days, in hours)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const resolutionTimeQuery = `
        SELECT 
            AVG(EXTRACT(EPOCH FROM (c.resolved_at - c.created_at)) / 3600) as avg_hours,
            COUNT(*) as resolved_count
        FROM complaints c
        ${whereClause}
        ${whereClause ? 'AND' : 'WHERE'} c.status = 'resolved' 
        AND c.resolved_at IS NOT NULL
        AND c.resolved_at >= $${paramIndex}
    `;
    const resolutionParams = [...params, thirtyDaysAgo];
    const resolutionResult = await db.query(resolutionTimeQuery, resolutionParams);
    const avgResolutionHours = parseFloat(resolutionResult.rows[0]?.avg_hours || 0);
    const resolvedCount = parseInt(resolutionResult.rows[0]?.resolved_count || 0);
    
    // 4. NGO Response SLA (avg time from assignment to first NGO status update)
    // This measures how quickly NGOs respond after being assigned
    const slaQuery = `
        SELECT 
            AVG(EXTRACT(EPOCH FROM (first_update.created_at - c.updated_at)) / 3600) as avg_response_hours,
            COUNT(*) as count
        FROM complaints c
        INNER JOIN LATERAL (
            SELECT csh.created_at
            FROM complaint_status_history csh
            WHERE csh.complaint_id = c.id
            AND csh.old_status = 'submitted'
            AND csh.new_status = 'accepted'
            ORDER BY csh.created_at ASC
            LIMIT 1
        ) first_update ON true
        ${whereClause}
        ${whereClause ? 'AND' : 'WHERE'} c.assigned_to IS NOT NULL
    `;
    const slaResult = await db.query(slaQuery, params);
    const avgResponseHours = parseFloat(slaResult.rows[0]?.avg_response_hours || 0);
    
    // 5. Severity Breakdown (counts by urgency level for non-resolved complaints)
    const severityQuery = `
        SELECT 
            c.urgency_level,
            COUNT(*) as count
        FROM complaints c
        ${whereClause}
        ${whereClause ? 'AND' : 'WHERE'} c.status NOT IN ('resolved', 'fake_information')
        GROUP BY c.urgency_level
    `;
    const severityResult = await db.query(severityQuery, params);
    const severityBreakdown = {
        critical: 0,
        high: 0,
        medium: 0,
        low: 0
    };
    severityResult.rows.forEach(row => {
        severityBreakdown[row.urgency_level] = parseInt(row.count);
    });
    
    // 6. Today's Resolutions
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const todayResolvedQuery = `
        SELECT COUNT(*) as count 
        FROM complaints c
        ${whereClause}
        ${whereClause ? 'AND' : 'WHERE'} c.status = 'resolved' 
        AND c.resolved_at >= $${paramIndex}
    `;
    const todayParams = [...params, today];
    const todayResult = await db.query(todayResolvedQuery, todayParams);
    const todayResolved = parseInt(todayResult.rows[0]?.count || 0);
    
    // 7. Total complaints for context
    const totalQuery = `
        SELECT COUNT(*) as count FROM complaints c ${whereClause}
    `;
    const totalResult = await db.query(totalQuery, params);
    const totalComplaints = parseInt(totalResult.rows[0]?.count || 0);
    
    // Format response
    res.json({
        success: true,
        data: {
            activeRescues,
            pendingAssignments,
            avgResolutionTime: {
                hours: Math.round(avgResolutionHours * 10) / 10,
                formatted: formatDuration(avgResolutionHours),
                sampleSize: resolvedCount
            },
            ngoResponseSLA: {
                hours: Math.round(avgResponseHours * 10) / 10,
                formatted: formatDuration(avgResponseHours)
            },
            severityBreakdown,
            todayResolved,
            totalComplaints,
            // Computed metrics
            activeTotal: activeRescues + pendingAssignments,
            criticalActive: severityBreakdown.critical + severityBreakdown.high
        }
    });
});

/**
 * Format duration in hours to human-readable string
 * @param {number} hours - Duration in hours
 * @returns {string} Formatted string
 */
function formatDuration(hours) {
    if (!hours || hours === 0) return 'N/A';
    
    if (hours < 1) {
        const minutes = Math.round(hours * 60);
        return `${minutes}m`;
    } else if (hours < 24) {
        const h = Math.floor(hours);
        const m = Math.round((hours - h) * 60);
        return m > 0 ? `${h}h ${m}m` : `${h}h`;
    } else {
        const days = Math.floor(hours / 24);
        const remainingHours = Math.round(hours % 24);
        return remainingHours > 0 ? `${days}d ${remainingHours}h` : `${days}d`;
    }
}

/**
 * Get severity distribution for charts
 * GET /api/stats/severity
 */
const getSeverityDistribution = asyncHandler(async (req, res) => {
    const user = req.user;
    const userType = user?.userType;
    const userId = user?.userId;
    
    let whereClause = '';
    const params = [];
    
    if (userType === 'ngo') {
        whereClause = 'WHERE c.assigned_to = $1';
        params.push(userId);
    } else if (userType === 'victim') {
        whereClause = 'WHERE c.victim_id = $1';
        params.push(userId);
    }
    
    const query = `
        SELECT 
            c.urgency_level,
            c.status,
            COUNT(*) as count
        FROM complaints c
        ${whereClause}
        GROUP BY c.urgency_level, c.status
        ORDER BY c.urgency_level, c.status
    `;
    
    const result = await db.query(query, params);
    
    // Transform to grouped format
    const distribution = {};
    result.rows.forEach(row => {
        if (!distribution[row.urgency_level]) {
            distribution[row.urgency_level] = {};
        }
        distribution[row.urgency_level][row.status] = parseInt(row.count);
    });
    
    res.json({
        success: true,
        data: distribution
    });
});

/**
 * Complaint density heatmap by region
 * GET /api/stats/complaint-heatmap
 *
 * Used primarily by the SDMA dashboard to understand where
 * complaints are concentrated. Regions are based on the
 * `location` field which, in seeded data, typically maps
 * to area / district names.
 *
 * Query params:
 * - days (optional, default 30): lookback window
 * - limit (optional, default 100): max regions to return
 */
const getComplaintHeatmap = asyncHandler(async (req, res) => {
    const days = parseInt(req.query.days, 10);
    const limit = parseInt(req.query.limit, 10);

    const daysWindow = Number.isNaN(days) || days <= 0 ? 30 : days;
    const maxRegions = Number.isNaN(limit) || limit <= 0 ? 100 : limit;

    const query = `
        SELECT 
            COALESCE(c.location, 'Unknown') AS region,
            COUNT(*) AS total_complaints,
            SUM(CASE WHEN c.urgency_level IN ('high', 'critical') THEN 1 ELSE 0 END) AS high_urgency_count,
            SUM(CASE WHEN c.status IN ('accepted', 'arriving', 'in_progress') THEN 1 ELSE 0 END) AS active_count
        FROM complaints c
        WHERE c.created_at >= NOW() - ($1::int || ' days')::interval
        GROUP BY region
        ORDER BY total_complaints DESC
        LIMIT $2
    `;

    const result = await db.query(query, [daysWindow, maxRegions]);

    const heatmap = result.rows.map(row => ({
        region: row.region,
        totalComplaints: parseInt(row.total_complaints || 0),
        highUrgencyComplaints: parseInt(row.high_urgency_count || 0),
        activeComplaints: parseInt(row.active_count || 0)
    }));

    res.json({
        success: true,
        data: heatmap
    });
});

/**
 * NGO performance trends over time
 * GET /api/stats/ngo-performance
 *
 * Returns time-series metrics per NGO:
 * - Resolved complaint count
 * - Average resolution time (hours)
 *
 * Query params:
 * - startDate, endDate (ISO strings, optional)
 * - groupBy = 'day' | 'week' (default: 'day')
 */
const getNGOPerformanceTrends = asyncHandler(async (req, res) => {
    const { startDate, endDate, groupBy } = req.query;

    let start;
    let end;

    if (startDate || endDate) {
        start = startDate ? new Date(startDate) : null;
        end = endDate ? new Date(endDate) : null;
    } else {
        // Default: last 30 days ending now
        end = new Date();
        start = new Date();
        start.setDate(end.getDate() - 30);
    }

    if (!start || !end || Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
        throw new AppError('Invalid date range for NGO performance trends', 400);
    }

    const groupByUnit = groupBy === 'week' ? 'week' : 'day';

    const query = `
        SELECT 
            n.id AS ngo_id,
            n.organization_name,
            DATE_TRUNC('${groupByUnit}', c.resolved_at) AS period,
            COUNT(*) AS resolved_count,
            AVG(EXTRACT(EPOCH FROM (c.resolved_at - c.created_at)) / 3600) AS avg_resolution_hours
        FROM complaints c
        INNER JOIN users u ON c.assigned_to = u.id
        INNER JOIN ngos n ON n.user_id = u.id
        WHERE c.status = 'resolved'
          AND c.resolved_at IS NOT NULL
          AND c.resolved_at BETWEEN $1 AND $2
        GROUP BY n.id, n.organization_name, period
        ORDER BY period ASC, resolved_count DESC
    `;

    const result = await db.query(query, [start, end]);

    const trends = result.rows.map(row => ({
        ngoId: row.ngo_id,
        organizationName: row.organization_name,
        period: row.period,
        resolvedCount: parseInt(row.resolved_count || 0),
        avgResolutionHours: row.avg_resolution_hours != null
            ? parseFloat(row.avg_resolution_hours)
            : null
    }));

    res.json({
        success: true,
        data: trends
    });
});

/**
 * Response time distribution
 * GET /api/stats/response-time-distribution
 *
 * Buckets resolution times for resolved complaints into ranges.
 *
 * Query params:
 * - days (optional, default 30): lookback window
 */
const getResponseTimeDistribution = asyncHandler(async (req, res) => {
    const days = parseInt(req.query.days, 10);
    const daysWindow = Number.isNaN(days) || days <= 0 ? 30 : days;

    const query = `
        WITH resolved AS (
            SELECT 
                EXTRACT(EPOCH FROM (c.resolved_at - c.created_at)) / 3600 AS diff_hours
            FROM complaints c
            WHERE c.status = 'resolved'
              AND c.resolved_at IS NOT NULL
              AND c.resolved_at >= NOW() - ($1::int || ' days')::interval
        )
        SELECT
            CASE
                WHEN diff_hours < 1 THEN '0-1h'
                WHEN diff_hours < 3 THEN '1-3h'
                WHEN diff_hours < 6 THEN '3-6h'
                WHEN diff_hours < 12 THEN '6-12h'
                WHEN diff_hours < 24 THEN '12-24h'
                ELSE '24h+'
            END AS bucket,
            COUNT(*) AS count
        FROM resolved
        GROUP BY bucket
        ORDER BY 
            CASE bucket
                WHEN '0-1h' THEN 1
                WHEN '1-3h' THEN 2
                WHEN '3-6h' THEN 3
                WHEN '6-12h' THEN 4
                WHEN '12-24h' THEN 5
                ELSE 6
            END
    `;

    const result = await db.query(query, [daysWindow]);

    const distribution = result.rows.map(row => ({
        bucket: row.bucket,
        count: parseInt(row.count || 0)
    }));

    res.json({
        success: true,
        data: distribution
    });
});

/**
 * High-risk zones based on complaint history
 * GET /api/stats/high-risk-zones
 *
 * Identifies regions (based on `location`) with a concentration
 * of high / critical complaints in the recent past.
 *
 * Query params:
 * - days (optional, default 30): lookback window
 * - limit (optional, default 20): max regions to return
 * - minTotal (optional, default 5): minimum total complaints per region
 */
const getHighRiskZones = asyncHandler(async (req, res) => {
    const days = parseInt(req.query.days, 10);
    const limit = parseInt(req.query.limit, 10);
    const minTotal = parseInt(req.query.minTotal, 10);

    const daysWindow = Number.isNaN(days) || days <= 0 ? 30 : days;
    const maxRegions = Number.isNaN(limit) || limit <= 0 ? 20 : limit;
    const minTotalComplaints = Number.isNaN(minTotal) || minTotal <= 0 ? 5 : minTotal;

    const query = `
        SELECT 
            COALESCE(c.location, 'Unknown') AS region,
            COUNT(*) AS total_complaints,
            SUM(CASE WHEN c.urgency_level IN ('high', 'critical') THEN 1 ELSE 0 END) AS high_urgency_count,
            SUM(CASE WHEN c.status IN ('submitted', 'accepted', 'arriving', 'in_progress') THEN 1 ELSE 0 END) AS active_count,
            MIN(c.created_at) AS first_seen_at,
            MAX(c.created_at) AS last_seen_at
        FROM complaints c
        WHERE c.created_at >= NOW() - ($1::int || ' days')::interval
        GROUP BY region
        HAVING COUNT(*) >= $3
        ORDER BY high_urgency_count DESC, total_complaints DESC
        LIMIT $2
    `;

    const result = await db.query(query, [daysWindow, maxRegions, minTotalComplaints]);

    const zones = result.rows.map(row => ({
        region: row.region,
        totalComplaints: parseInt(row.total_complaints || 0),
        highUrgencyComplaints: parseInt(row.high_urgency_count || 0),
        activeComplaints: parseInt(row.active_count || 0),
        firstSeenAt: row.first_seen_at,
        lastSeenAt: row.last_seen_at
    }));

    res.json({
        success: true,
        data: zones
    });
});

module.exports = {
    getKPIMetrics,
    getSeverityDistribution,
    getComplaintHeatmap,
    getNGOPerformanceTrends,
    getResponseTimeDistribution,
    getHighRiskZones
};
