/**
 * Audit Middleware
 * Automatically logs critical operations to audit trail
 * Demo-safe: Comprehensive logging without exposing sensitive data
 */

const { logAudit } = require('../../services/polygon/auditLogger');

/**
 * Audit middleware factory
 * Logs operations to blockchain audit trail
 * @param {Object} options - Audit options
 * @param {string} options.entityType - Type of entity (e.g., 'complaint', 'donation')
 * @param {Function} options.getEntityId - Function to extract entity ID from request/response
 * @param {string} options.action - Action name (e.g., 'created', 'updated', 'deleted')
 * @param {Function} options.getData - Function to extract audit data from request/response
 * @returns {Function} Express middleware
 */
function auditMiddleware(options) {
    return async (req, res, next) => {
        // Store original json method
        const originalJson = res.json.bind(res);
        
        // Override json method to capture response
        res.json = function(data) {
            // Log audit after response is sent (non-blocking)
            setImmediate(async () => {
                try {
                    const entityId = options.getEntityId ? options.getEntityId(req, data) : null;
                    const auditData = options.getData ? options.getData(req, data) : {};
                    
                    if (entityId && data && data.success) {
                        await logAudit({
                            entityType: options.entityType,
                            entityId: entityId,
                            action: options.action,
                            data: auditData,
                            userId: req.user ? req.user.userId : null
                        });
                    }
                } catch (auditError) {
                    // Audit logging failures should not break the main operation
                    console.error('Audit logging failed (non-blocking):', auditError);
                }
            });
            
            // Call original json method
            return originalJson(data);
        };
        
        next();
    };
}

/**
 * Manual audit log helper
 * Use this in controllers for custom audit logging
 */
async function logManualAudit(params) {
    try {
        await logAudit(params);
    } catch (error) {
        // Audit logging failures should not break the main operation
        console.error('Manual audit logging failed (non-blocking):', error);
    }
}

module.exports = {
    auditMiddleware,
    logManualAudit
};
