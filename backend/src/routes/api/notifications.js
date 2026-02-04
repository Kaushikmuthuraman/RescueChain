const express = require('express');
const router = express.Router();
const { authenticate } = require('../../middleware/auth/authenticate');
const notificationsController = require('../../controllers/notificationsController');

router.use(authenticate);

router.get('/', notificationsController.getNotifications);
router.post('/read-all', notificationsController.markAllAsRead);
router.patch('/:id/read', notificationsController.markAsRead); // Must be after /read-all

module.exports = router;
