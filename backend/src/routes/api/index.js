/**
 * API Routes Index
 * Main router for all API endpoints
 */

const express = require('express');
const router = express.Router();

// Import route modules
const authRoutes = require('./auth');
const complaintsRoutes = require('./complaints');
const photosRoutes = require('./photos');
const donationsRoutes = require('./donations');
const adminRoutes = require('./admin');
const homepageRoutes = require('./homepage');
const ddmaRoutes = require('./ddma');
const sdmaRoutes = require('./sdma');

// Mount routes
router.use('/auth', authRoutes);
router.use('/complaints', complaintsRoutes);
router.use('/photos', photosRoutes);
router.use('/donations', donationsRoutes);
router.use('/admin', adminRoutes);
router.use('/homepage', homepageRoutes);
router.use('/ddma', ddmaRoutes);
router.use('/sdma', sdmaRoutes);

// Health check
router.get('/health', (req, res) => {
    res.json({
        success: true,
        message: 'RescueChain API is running',
        timestamp: new Date().toISOString()
    });
});

module.exports = router;
