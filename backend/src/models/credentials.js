/**
 * Credentials Model
 * Database operations for credentials table
 */

const db = require('../config/database');

/**
 * Find credentials by username
 * @param {string} username - Username
 * @returns {Promise<Object|null>} Credentials object with user info or null
 */
async function findByUsername(username) {
    const result = await db.query(
        `SELECT 
            c.id as credential_id,
            c.user_id,
            c.username,
            c.password_hash,
            c.last_login,
            u.id,
            u.phone_number,
            u.name,
            u.user_type,
            u.is_active,
            u.created_by,
            u.is_seeded
        FROM credentials c
        INNER JOIN users u ON c.user_id = u.id
        WHERE c.username = $1`,
        [username]
    );
    
    if (result.rows.length === 0) {
        return null;
    }
    
    const row = result.rows[0];
    return {
        credentialId: row.credential_id,
        userId: row.user_id,
        username: row.username,
        passwordHash: row.password_hash,
        lastLogin: row.last_login,
        user: {
            id: row.id,
            phoneNumber: row.phone_number,
            name: row.name,
            userType: row.user_type,
            isActive: row.is_active,
            createdBy: row.created_by,
            isSeeded: row.is_seeded || false
        }
    };
}

/**
 * Find credentials by user ID
 * @param {string} userId - User ID (UUID)
 * @returns {Promise<Object|null>} Credentials object or null
 */
async function findByUserId(userId) {
    const result = await db.query(
        `SELECT 
            c.id,
            c.user_id,
            c.username,
            c.password_hash,
            c.last_login,
            c.created_at,
            c.updated_at
        FROM credentials c
        WHERE c.user_id = $1`,
        [userId]
    );
    
    return result.rows[0] || null;
}

/**
 * Update last login timestamp
 * @param {string} credentialId - Credential ID
 * @returns {Promise<void>}
 */
async function updateLastLogin(credentialId) {
    await db.query(
        'UPDATE credentials SET last_login = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP WHERE id = $1',
        [credentialId]
    );
}

/**
 * Check if username exists
 * @param {string} username - Username
 * @returns {Promise<boolean>} True if exists
 */
async function usernameExists(username) {
    const result = await db.query(
        'SELECT 1 FROM credentials WHERE username = $1',
        [username]
    );
    
    return result.rows.length > 0;
}

/**
 * Create credentials for a user
 * @param {string} userId - User ID
 * @param {string} username - Username
 * @param {string} passwordHash - Hashed password
 * @returns {Promise<Object>} Created credentials object
 */
async function create(userId, username, passwordHash) {
    const result = await db.query(
        `INSERT INTO credentials (user_id, username, password_hash)
         VALUES ($1, $2, $3)
         RETURNING *`,
        [userId, username, passwordHash]
    );
    
    return result.rows[0];
}

/**
 * Update password hash
 * @param {string} credentialId - Credential ID
 * @param {string} newPasswordHash - New hashed password
 * @returns {Promise<void>}
 */
async function updatePassword(credentialId, newPasswordHash) {
    await db.query(
        'UPDATE credentials SET password_hash = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
        [newPasswordHash, credentialId]
    );
}

module.exports = {
    findByUsername,
    findByUserId,
    updateLastLogin,
    usernameExists,
    create,
    updatePassword
};
