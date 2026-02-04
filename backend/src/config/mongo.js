/**
 * MongoDB Configuration
 * Mongoose connection setup for image/evidence storage
 */

const mongoose = require('mongoose');

const MONGODB_URI = process.env.MONGODB_URI;

/**
 * Initialize MongoDB connection using Mongoose.
 * This should be called when the server starts.
 */
async function connectDB() {
    if (!MONGODB_URI) {
        console.error('[MongoDB] MONGODB_URI is not set in environment variables.');
        process.exit(1);
    }

    try {
        // Modern Mongoose connection (no deprecated options)
        await mongoose.connect(MONGODB_URI);
        console.log('[MongoDB] Connected successfully');
    } catch (error) {
        console.error('[MongoDB] Connection error:', error.message);
        // Fail fast in production so we don't run without Mongo image storage
        process.exit(1);
    }
}

mongoose.connection.on('connected', () => {
    console.log('[MongoDB] Connection established');
});

mongoose.connection.on('error', (err) => {
    console.error('[MongoDB] Connection error:', err.message);
});

mongoose.connection.on('disconnected', () => {
    console.warn('[MongoDB] Connection disconnected');
});

module.exports = {
    mongoose,
    connectDB,
};

