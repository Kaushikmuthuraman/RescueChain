/**
 * Notifications Controller
 * Role-scoped notification feeds and mark-as-read
 */

const Notification = require('../models/Notification.mongo');
const { AppError, asyncHandler } = require('../middleware/errorHandler');

/**
 * Get notifications for current user (role-scoped)
 * GET /api/notifications?limit=50&offset=0
 */
const getNotifications = asyncHandler(async (req, res) => {
    const { limit = 50, offset = 0 } = req.query;
    const user = req.user;

    const query = {
        $or: [
            { recipientIds: user.userId },
            { roles: user.userType },
        ],
    };

    const [notifications, total] = await Promise.all([
        Notification.find(query)
            .sort({ createdAt: -1 })
            .limit(parseInt(limit, 10))
            .skip(parseInt(offset, 10))
            .lean(),
        Notification.countDocuments(query),
    ]);

    const withRead = notifications.map((n) => {
        const id = n._id?.toString?.() || n.id;
        return {
            ...n,
            id,
            read: (n.readBy || []).some((r) => r.userId === user.userId),
        };
    });

    res.json({
        success: true,
        data: {
            notifications: withRead,
            total,
        },
    });
});

/**
 * Mark notification as read
 * PATCH /api/notifications/:id/read
 */
const markAsRead = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const user = req.user;

    const notification = await Notification.findById(id);
    if (!notification) {
        throw new AppError('Notification not found', 404, 'NOT_FOUND');
    }

    const canAccess =
        notification.recipientIds.includes(user.userId) ||
        (notification.roles && notification.roles.includes(user.userType));

    if (!canAccess) {
        throw new AppError('Access denied', 403, 'FORBIDDEN');
    }

    const alreadyRead = (notification.readBy || []).some((r) => r.userId === user.userId);
    if (!alreadyRead) {
        notification.readBy = notification.readBy || [];
        notification.readBy.push({ userId: user.userId, readAt: new Date() });
        await notification.save();
    }

    res.json({
        success: true,
        message: 'Notification marked as read',
        data: { notification: notification.toObject() },
    });
});

/**
 * Mark all notifications as read
 * POST /api/notifications/read-all
 */
const markAllAsRead = asyncHandler(async (req, res) => {
    const user = req.user;

    await Notification.updateMany(
        {
            $or: [
                { recipientIds: user.userId },
                { roles: user.userType },
            ],
            'readBy.userId': { $ne: user.userId },
        },
        { $push: { readBy: { userId: user.userId, readAt: new Date() } } }
    );

    res.json({
        success: true,
        message: 'All notifications marked as read',
    });
});

module.exports = {
    getNotifications,
    markAsRead,
    markAllAsRead,
};
