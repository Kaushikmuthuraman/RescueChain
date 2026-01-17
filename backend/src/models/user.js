/**
 * User Model
 * Database operations for users table
 */

const db = require('../config/database');

/**
 * Find user by phone number
 * @param {string} phoneNumber - Phone number
 * @returns {Promise<Object|null>} User object or null
 */
async function findByPhoneNumber(phoneNumber) {
    const result = await db.query(
        'SELECT * FROM users WHERE phone_number = $1',
        [phoneNumber]
    );
    
    return result.rows[0] || null;
}

/**
 * Find user by ID
 * @param {string} userId - User ID (UUID)
 * @returns {Promise<Object|null>} User object or null
 */
async function findById(userId) {
    const result = await db.query(
        'SELECT * FROM users WHERE id = $1',
        [userId]
    );
    
    return result.rows[0] || null;
}

/**
 * Create a new victim user
 * @param {string} phoneNumber - Phone number
 * @param {string} name - User name (optional)
 * @returns {Promise<Object>} Created user object
 */
async function createVictim(phoneNumber, name = null) {
    // Generate a default name if not provided
    const userName = name || `User ${phoneNumber.slice(-4)}`;
    
    const result = await db.query(
        `INSERT INTO users (phone_number, name, user_type, created_by, is_seeded)
         VALUES ($1, $2, 'victim', NULL, FALSE)
         RETURNING *`,
        [phoneNumber, userName]
    );
    
    return result.rows[0];
}

/**
 * Update user last login
 * @param {string} userId - User ID
 * @returns {Promise<void>}
 */
async function updateLastLogin(userId) {
    await db.query(
        'UPDATE users SET updated_at = CURRENT_TIMESTAMP WHERE id = $1',
        [userId]
    );
}

/**
 * Check if phone number exists
 * @param {string} phoneNumber - Phone number
 * @returns {Promise<boolean>} True if exists
 */
async function phoneExists(phoneNumber) {
    const user = await findByPhoneNumber(phoneNumber);
    return user !== null;
}

module.exports = {
    findByPhoneNumber,
    findById,
    createVictim,
    updateLastLogin,
    phoneExists
};
