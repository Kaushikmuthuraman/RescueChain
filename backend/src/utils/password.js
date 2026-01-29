/**
 * Password Hashing Utility
 * Uses bcrypt for secure password hashing and verification
 */

const bcrypt = require('bcrypt');

// Salt rounds for bcrypt (higher = more secure but slower)
const SALT_ROUNDS = 10;

/**
 * Hash a password
 * @param {string} password - Plain text password
 * @returns {Promise<string>} Hashed password
 */
async function hashPassword(password) {
    try {
        const salt = await bcrypt.genSalt(SALT_ROUNDS);
        const hash = await bcrypt.hash(password, salt);
        return hash;
    } catch (error) {
        console.error('Error hashing password:', error);
        throw new Error('Failed to hash password');
    }
}

/**
 * Verify a password against a hash
 * @param {string} password - Plain text password (NOT hashed)
 * @param {string} hash - Hashed password from database (bcrypt hash)
 * @returns {Promise<boolean>} True if password matches
 */
async function verifyPassword(password, hash) {
    try {
        // Ensure we have both password and hash
        if (!password || !hash) {
            console.error('[verifyPassword] Missing password or hash:', { hasPassword: !!password, hasHash: !!hash });
            return false;
        }
        
        // Use bcrypt.compare() - this compares plain password against bcrypt hash
        // Do NOT hash the password before calling this - bcrypt.compare() handles it
        const result = await bcrypt.compare(password, hash);
        console.log('[verifyPassword] bcrypt.compare() called - result:', result);
        return result;
    } catch (error) {
        console.error('[verifyPassword] Error during bcrypt.compare():', error.message);
        console.error('[verifyPassword] Error details:', error);
        return false;
    }
}

module.exports = {
    hashPassword,
    verifyPassword,
    SALT_ROUNDS
};
