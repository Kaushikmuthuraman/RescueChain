/**
 * Express Application Setup
 * Main application file for RescueChain backend
 */

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');

// Import routes
const apiRoutes = require('./routes/api');

// Import error handlers
const { errorHandler, notFoundHandler } = require('./middleware/errorHandler');

// Import rate limiting
const { defaultRateLimiter } = require('./middleware/auth/generalRateLimiter');

// Create Express app
const app = express();

// Middleware
app.use(helmet()); // Security headers
app.use(cors()); // Enable CORS
app.use(express.json({ limit: '10mb' })); // Parse JSON bodies (limit to prevent abuse)
app.use(express.urlencoded({ extended: true, limit: '10mb' })); // Parse URL-encoded bodies
app.use(morgan('combined')); // HTTP request logger

// Apply general rate limiting to all API routes (protects from abuse)
app.use(['/api', '/api/v1', '/api/v2'], defaultRateLimiter);

// API routes
// Legacy base path
app.use('/api', apiRoutes);
// Versioned aliases
app.use('/api/v1', apiRoutes);
app.use('/api/v2', apiRoutes);

// Root route
app.get('/', (req, res) => {
    res.json({
        success: true,
        message: 'RescueChain API',
        version: '1.0.0',
        endpoints: {
            health: '/api/health',
            auth: {
                victim: {
                    generateOTP: 'POST /api/auth/victim/otp',
                    verifyOTP: 'POST /api/auth/victim/verify',
                    rateLimit: 'GET /api/auth/victim/rate-limit'
                },
                organization: {
                    login: 'POST /api/auth/organization/login',
                    me: 'GET /api/auth/organization/me'
                }
            },
            complaints: {
                list: 'GET /api/complaints',
                get: 'GET /api/complaints/:id',
                create: 'POST /api/complaints',
                updateStatus: 'PATCH /api/complaints/:id/status',
                assign: 'PATCH /api/complaints/:id/assign'
            },
            photos: {
                upload: 'POST /api/photos',
                getByComplaint: 'GET /api/photos/complaint/:complaintId',
                get: 'GET /api/photos/:id'
            },
            donations: {
                list: 'GET /api/donations',
                get: 'GET /api/donations/:id',
                create: 'POST /api/donations',
                updateStatus: 'PATCH /api/donations/:id/status'
            },
            admin: {
                createOrganization: 'POST /api/admin/organizations',
                getUsers: 'GET /api/admin/users',
                updateUserStatus: 'PATCH /api/admin/users/:id/status',
                getStats: 'GET /api/admin/stats'
            }
        }
    });
});

// 404 handler (must be before error handler)
app.use(notFoundHandler);

// Central error handler (must be last)
app.use(errorHandler);

module.exports = app;
