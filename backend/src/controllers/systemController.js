/**
 * System Controller
 * Health and observability endpoints for admins/SDMA.
 */

const db = require('../config/database');
const { AppError, asyncHandler } = require('../middleware/errorHandler');

/**
 * Basic system health check with dependencies.
 * GET /api/system/health
 */
const getSystemHealth = asyncHandler(async (req, res) => {
    const start = Date.now();

    // Check PostgreSQL connectivity
    let dbHealthy = false;
    let dbLatencyMs = null;
    try {
        const dbStart = Date.now();
        await db.query('SELECT 1');
        dbLatencyMs = Date.now() - dbStart;
        dbHealthy = true;
    } catch (err) {
        dbHealthy = false;
    }

    // Check MongoDB connectivity (if connectDB has attached status)
    let mongoHealthy = true;
    if (typeof global.mongoConnectionHealthy === 'boolean') {
        mongoHealthy = global.mongoConnectionHealthy;
    }

    const overallHealthy = dbHealthy && mongoHealthy;

    res.status(overallHealthy ? 200 : 503).json({
        success: overallHealthy,
        status: overallHealthy ? 'healthy' : 'degraded',
        message: overallHealthy ? 'System is healthy' : 'One or more dependencies are unavailable',
        checks: {
            postgres: {
                healthy: dbHealthy,
                latencyMs: dbLatencyMs
            },
            mongo: {
                healthy: mongoHealthy
            }
        },
        timestamp: new Date().toISOString(),
        latencyMs: Date.now() - start
    });
});

/**
 * Recent infrastructure issues for admin panel.
 * GET /api/system/issues
 *
 * Returns recent failed blockchain audit attempts and other infra-level problems.
 */
const getRecentIssues = asyncHandler(async (req, res) => {
    const { limit = 50 } = req.query;

    // Fetch recent blockchain audit failures / skips from blockchain_audit_logs
    const result = await db.query(
        `SELECT 
            id,
            entity_type,
            entity_id,
            action,
            new_data,
            created_at
         FROM blockchain_audit_logs
         WHERE new_data -> 'blockchainResult' ->> 'status' IN ('failed', 'skipped')
         ORDER BY created_at DESC
         LIMIT $1`,
        [parseInt(limit)]
    );

    const issues = result.rows.map(row => {
        const blockchainResult = row.new_data?.blockchainResult || {};
        return {
            id: row.id,
            entityType: row.entity_type,
            entityId: row.entity_id,
            action: row.action,
            status: blockchainResult.status || 'unknown',
            attempts: blockchainResult.attempts != null ? Number(blockchainResult.attempts) : null,
            error: blockchainResult.error || null,
            createdAt: row.created_at
        };
    });

    res.json({
        success: true,
        data: {
            issues,
            count: issues.length
        }
    });
});

module.exports = {
    getSystemHealth,
    getRecentIssues
};

