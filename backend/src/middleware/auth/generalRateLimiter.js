/**
 * General API Rate Limiting Middleware
 * Protects all API endpoints from abuse
 * Demo-safe: Configurable limits, clear messages, explainable behavior
 */

// In-memory store for rate limiting (use Redis in production)
const requestCounts = new Map();

// Default rate limits (requests per window)
const RATE_LIMITS = {
    default: {
        windowMs: 15 * 60 * 1000, // 15 minutes
        maxRequests: 100
    },
    strict: {
        windowMs: 15 * 60 * 1000, // 15 minutes
        maxRequests: 30
    },
    lenient: {
        windowMs: 15 * 60 * 1000, // 15 minutes
        maxRequests: 200
    }
};

/**
 * Clean up old entries periodically
 */
function cleanupRateLimit() {
    const now = Date.now();
    const keysToDelete = [];
    
    requestCounts.forEach((data, key) => {
        if (now - data.windowStart > data.windowMs) {
            keysToDelete.push(key);
        }
    });
    
    keysToDelete.forEach(key => requestCounts.delete(key));
}

// Cleanup every 5 minutes
setInterval(cleanupRateLimit, 5 * 60 * 1000);

/**
 * Get rate limit key from request
 * Uses IP address and optional user ID
 */
function getRateLimitKey(req) {
    const ip = req.ip || req.connection.remoteAddress || 'unknown';
    const userId = req.user ? req.user.userId : null;
    
    // If authenticated, use user ID; otherwise use IP
    return userId ? `user:${userId}` : `ip:${ip}`;
}

/**
 * General rate limiter middleware factory
 * @param {Object} options - Rate limit options
 * @param {string} options.type - Rate limit type: 'default', 'strict', 'lenient'
 * @param {number} options.windowMs - Time window in milliseconds (optional)
 * @param {number} options.maxRequests - Max requests per window (optional)
 * @returns {Function} Express middleware
 */
function createRateLimiter(options = {}) {
    const { type = 'default', windowMs, maxRequests } = options;
    
    let limit;
    if (windowMs && maxRequests) {
        limit = { windowMs, maxRequests };
    } else {
        limit = RATE_LIMITS[type] || RATE_LIMITS.default;
    }
    
    return (req, res, next) => {
        cleanupRateLimit();
        
        const key = getRateLimitKey(req);
        const now = Date.now();
        const requestData = requestCounts.get(key);
        
        if (!requestData) {
            // First request
            requestCounts.set(key, {
                count: 1,
                windowStart: now,
                windowMs: limit.windowMs
            });
            
            // Add rate limit headers
            res.set({
                'X-RateLimit-Limit': limit.maxRequests,
                'X-RateLimit-Remaining': limit.maxRequests - 1,
                'X-RateLimit-Reset': new Date(now + limit.windowMs).toISOString()
            });
            
            return next();
        }
        
        // Check if window has expired
        if (now - requestData.windowStart > requestData.windowMs) {
            // Reset window
            requestData.count = 1;
            requestData.windowStart = now;
            
            res.set({
                'X-RateLimit-Limit': limit.maxRequests,
                'X-RateLimit-Remaining': limit.maxRequests - 1,
                'X-RateLimit-Reset': new Date(now + limit.windowMs).toISOString()
            });
            
            return next();
        }
        
        // Check if limit exceeded
        if (requestData.count >= limit.maxRequests) {
            const resetTime = new Date(requestData.windowStart + requestData.windowMs);
            const retryAfter = Math.ceil((requestData.windowStart + requestData.windowMs - now) / 1000);
            
            res.set({
                'X-RateLimit-Limit': limit.maxRequests,
                'X-RateLimit-Remaining': 0,
                'X-RateLimit-Reset': resetTime.toISOString(),
                'Retry-After': retryAfter
            });
            
            return res.status(429).json({
                success: false,
                error: 'RATE_LIMIT_EXCEEDED',
                message: `Too many requests. Limit: ${limit.maxRequests} requests per ${Math.round(limit.windowMs / 60000)} minutes. Please try again later.`,
                retryAfter: retryAfter,
                resetAt: resetTime.toISOString()
            });
        }
        
        // Increment count
        requestData.count++;
        
        // Add rate limit headers
        res.set({
            'X-RateLimit-Limit': limit.maxRequests,
            'X-RateLimit-Remaining': limit.maxRequests - requestData.count,
            'X-RateLimit-Reset': new Date(requestData.windowStart + requestData.windowMs).toISOString()
        });
        
        next();
    };
}

/**
 * Default rate limiter (100 requests per 15 minutes)
 */
const defaultRateLimiter = createRateLimiter({ type: 'default' });

/**
 * Strict rate limiter (30 requests per 15 minutes)
 */
const strictRateLimiter = createRateLimiter({ type: 'strict' });

/**
 * Lenient rate limiter (200 requests per 15 minutes)
 */
const lenientRateLimiter = createRateLimiter({ type: 'lenient' });

module.exports = {
    createRateLimiter,
    defaultRateLimiter,
    strictRateLimiter,
    lenientRateLimiter,
    RATE_LIMITS
};
