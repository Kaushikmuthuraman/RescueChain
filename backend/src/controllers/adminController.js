/**
 * Admin Controller
 * Handles administrative operations (SDMA only)
 */

const db = require('../config/database');
const { AppError, asyncHandler } = require('../middleware/errorHandler');
const { hashPassword } = require('../utils/password');
const credentialsModel = require('../models/credentials');
const userModel = require('../models/user');

/**
 * Create organization account (SDMA only)
 * POST /api/admin/organizations
 */
const createOrganization = asyncHandler(async (req, res) => {
    const { phoneNumber, name, userType, username, password, organizationData } = req.body;
    
    if (!phoneNumber || !name || !userType || !username || !password) {
        throw new AppError('phoneNumber, name, userType, username, and password are required', 400, 'VALIDATION_ERROR');
    }
    
    const validTypes = ['ngo', 'ddma', 'sdma'];
    if (!validTypes.includes(userType)) {
        throw new AppError('Invalid user type. Must be ngo, ddma, or sdma', 400, 'VALIDATION_ERROR');
    }
    
    // Check if phone number already exists
    const existingUser = await userModel.findByPhoneNumber(phoneNumber);
    if (existingUser) {
        throw new AppError('Phone number already registered', 409, 'DUPLICATE_ENTRY');
    }
    
    // Check if username already exists
    const existingUsername = await credentialsModel.usernameExists(username);
    if (existingUsername) {
        throw new AppError('Username already taken', 409, 'DUPLICATE_ENTRY');
    }
    
    // Hash password
    const passwordHash = await hashPassword(password);
    
    // Create user (created_by is current SDMA user)
    const userResult = await db.query(
        `INSERT INTO users (phone_number, name, user_type, created_by, is_seeded)
         VALUES ($1, $2, $3, $4, FALSE)
         RETURNING *`,
        [phoneNumber, name, userType, req.user.userId]
    );
    
    const newUser = userResult.rows[0];
    
    // Create credentials
    await credentialsModel.create(newUser.id, username, passwordHash);
    
    // Create NGO details if it's an NGO
    if (userType === 'ngo' && organizationData) {
        await db.query(
            `INSERT INTO ngos (user_id, organization_name, registration_number, address, contact_person, email)
             VALUES ($1, $2, $3, $4, $5, $6)`,
            [
                newUser.id,
                organizationData.organizationName || name,
                organizationData.registrationNumber || null,
                organizationData.address || null,
                organizationData.contactPerson || null,
                organizationData.email || null
            ]
        );
    }
    
    res.status(201).json({
        success: true,
        message: 'Organization account created successfully',
        data: {
            user: {
                id: newUser.id,
                phoneNumber: newUser.phone_number,
                name: newUser.name,
                userType: newUser.user_type
            }
        }
    });
});

/**
 * Get all users (SDMA only)
 * GET /api/admin/users
 */
const getUsers = asyncHandler(async (req, res) => {
    const { userType, limit = 50, offset = 0 } = req.query;
    
    let query = 'SELECT * FROM users WHERE 1=1';
    const params = [];
    let paramCount = 0;
    
    if (userType) {
        paramCount++;
        query += ` AND user_type = $${paramCount}`;
        params.push(userType);
    }
    
    query += ` ORDER BY created_at DESC LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}`;
    params.push(parseInt(limit), parseInt(offset));
    
    const result = await db.query(query, params);
    
    res.json({
        success: true,
        data: {
            users: result.rows,
            count: result.rows.length
        }
    });
});

/**
 * Update user status (SDMA only)
 * PATCH /api/admin/users/:id/status
 */
const updateUserStatus = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { isActive } = req.body;
    
    if (typeof isActive !== 'boolean') {
        throw new AppError('isActive must be a boolean', 400, 'VALIDATION_ERROR');
    }
    
    const result = await db.query(
        `UPDATE users SET is_active = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING *`,
        [isActive, id]
    );
    
    if (result.rows.length === 0) {
        throw new AppError('User not found', 404, 'NOT_FOUND');
    }
    
    res.json({
        success: true,
        message: 'User status updated',
        data: { user: result.rows[0] }
    });
});

/**
 * Get system statistics (SDMA only)
 * GET /api/admin/stats
 */
const getStats = asyncHandler(async (req, res) => {
    const stats = {};
    
    // User counts
    const userCounts = await db.query(
        `SELECT user_type, COUNT(*) as count FROM users GROUP BY user_type`
    );
    stats.users = {};
    userCounts.rows.forEach(row => {
        stats.users[row.user_type] = parseInt(row.count);
    });
    
    // Complaint counts by status
    const complaintCounts = await db.query(
        `SELECT status, COUNT(*) as count FROM complaints GROUP BY status`
    );
    stats.complaints = {};
    complaintCounts.rows.forEach(row => {
        stats.complaints[row.status] = parseInt(row.count);
    });
    
    // Donation stats
    const donationStats = await db.query(
        `SELECT 
            COUNT(*) as total,
            SUM(CASE WHEN status = 'completed' THEN amount ELSE 0 END) as total_amount,
            COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_count
         FROM donations`
    );
    stats.donations = {
        total: parseInt(donationStats.rows[0].total),
        totalAmount: parseFloat(donationStats.rows[0].total_amount) || 0,
        completedCount: parseInt(donationStats.rows[0].completed_count)
    };
    
    res.json({
        success: true,
        data: { stats }
    });
});

module.exports = {
    createOrganization,
    getUsers,
    updateUserStatus,
    getStats
};
