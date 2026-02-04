/**
 * Messages Controller
 * In-app messaging between NGO and DDMA
 */

const Message = require('../models/Message.mongo');
const db = require('../config/database');
const { AppError, asyncHandler } = require('../middleware/errorHandler');
const notificationService = require('../services/notifications/notificationService');

/**
 * Build conversation ID: sorted ngoId and ddmaUserId
 */
function buildConversationId(ngoUserId, ddmaUserId) {
    const ids = [ngoUserId, ddmaUserId].sort();
    return `conv:${ids[0]}:${ids[1]}`;
}

/**
 * Send message
 * POST /api/messages
 * Body: { recipientId, content, complaintId? }
 */
const sendMessage = asyncHandler(async (req, res) => {
    const { recipientId, content, complaintId } = req.body;
    const user = req.user;

    if (user.userType !== 'ngo' && user.userType !== 'ddma') {
        throw new AppError('Only NGO and DDMA can send messages', 403, 'FORBIDDEN');
    }

    if (!recipientId || !content || typeof content !== 'string' || content.trim() === '') {
        throw new AppError('recipientId and content are required', 400, 'VALIDATION_ERROR');
    }

    const recipientRes = await db.query(
        'SELECT id, name, user_type FROM users WHERE id = $1',
        [recipientId]
    );
    if (recipientRes.rows.length === 0) {
        throw new AppError('Recipient not found', 404, 'NOT_FOUND');
    }
    const recipient = recipientRes.rows[0];

    if (recipient.user_type !== 'ngo' && recipient.user_type !== 'ddma') {
        throw new AppError('Can only message NGO or DDMA users', 400, 'VALIDATION_ERROR');
    }

    if (
        (user.userType === 'ngo' && recipient.user_type !== 'ddma') ||
        (user.userType === 'ddma' && recipient.user_type !== 'ngo')
    ) {
        throw new AppError('NGO can only message DDMA; DDMA can only message NGO', 400, 'VALIDATION_ERROR');
    }

    const senderRes = await db.query(
        'SELECT u.name, COALESCE(n.organization_name, u.name) as org_name FROM users u LEFT JOIN ngos n ON u.id = n.user_id WHERE u.id = $1',
        [user.userId]
    );
    const senderName = senderRes.rows[0]?.org_name || senderRes.rows[0]?.name || user.userType;

    const conversationId = buildConversationId(user.userId, recipientId);

    const message = await Message.create({
        conversationId,
        senderId: user.userId,
        senderRole: user.userType,
        senderName,
        content: content.trim(),
        complaintId: complaintId || null,
    });

    try {
        await notificationService.notifyNewMessage({
            messageId: message._id.toString(),
            conversationId,
            senderId: user.userId,
            senderName,
            recipientId,
        });
    } catch (err) {
        console.error('Message notification failed:', err);
    }

    res.status(201).json({
        success: true,
        message: 'Message sent',
        data: {
            message: {
                id: message._id.toString(),
                conversationId: message.conversationId,
                senderId: message.senderId,
                senderName: message.senderName,
                content: message.content,
                complaintId: message.complaintId,
                createdAt: message.createdAt,
            },
        },
    });
});

/**
 * Get conversation with a specific user
 * GET /api/messages/conversation/:userId?limit=50&offset=0
 */
const getConversation = asyncHandler(async (req, res) => {
    const { userId: otherUserId } = req.params;
    const { limit = 50, offset = 0 } = req.query;
    const user = req.user;

    if (user.userType !== 'ngo' && user.userType !== 'ddma') {
        throw new AppError('Only NGO and DDMA can view messages', 403, 'FORBIDDEN');
    }

    const otherRes = await db.query('SELECT id, user_type FROM users WHERE id = $1', [otherUserId]);
    if (otherRes.rows.length === 0) {
        throw new AppError('User not found', 404, 'NOT_FOUND');
    }
    const other = otherRes.rows[0];
    if (other.user_type !== 'ngo' && other.user_type !== 'ddma') {
        throw new AppError('Invalid conversation', 400, 'VALIDATION_ERROR');
    }

    const conversationId = buildConversationId(user.userId, otherUserId);

    const [messages, total] = await Promise.all([
        Message.find({ conversationId })
            .sort({ createdAt: 1 })
            .skip(parseInt(offset, 10))
            .limit(parseInt(limit, 10))
            .lean(),
        Message.countDocuments({ conversationId }),
    ]);

    const formatted = messages.map((m) => ({
        id: m._id.toString(),
        conversationId: m.conversationId,
        senderId: m.senderId,
        senderName: m.senderName,
        content: m.content,
        complaintId: m.complaintId,
        createdAt: m.createdAt,
        isOwn: m.senderId === user.userId,
    }));

    res.json({
        success: true,
        data: {
            messages: formatted,
            total,
        },
    });
});

/**
 * List conversations for current user
 * GET /api/messages/conversations
 */
const listConversations = asyncHandler(async (req, res) => {
    const user = req.user;

    if (user.userType !== 'ngo' && user.userType !== 'ddma') {
        throw new AppError('Only NGO and DDMA can list conversations', 403, 'FORBIDDEN');
    }

    const convIds = await Message.distinct('conversationId', {
        $or: [
            { senderId: user.userId },
            { conversationId: { $regex: user.userId } },
        ],
    });

    const lastMessages = await Message.aggregate([
        { $match: { conversationId: { $in: convIds } } },
        { $sort: { createdAt: -1 } },
        { $group: { _id: '$conversationId', lastMessage: { $first: '$$ROOT' } } },
    ]);

    const otherUserIds = new Set();
    lastMessages.forEach((c) => {
        const ids = c._id.replace('conv:', '').split(':');
        const other = ids.find((id) => id !== user.userId);
        if (other) otherUserIds.add(other);
    });

    if (otherUserIds.size === 0) {
        return res.json({ success: true, data: { conversations: [] } });
    }

    const usersRes = await db.query(
        `SELECT u.id, u.name, u.user_type, COALESCE(n.organization_name, u.name) as org_name 
         FROM users u LEFT JOIN ngos n ON u.id = n.user_id 
         WHERE u.id = ANY($1)`,
        [Array.from(otherUserIds)]
    );
    const userMap = {};
    usersRes.rows.forEach((r) => {
        userMap[r.id] = r.org_name || r.name;
    });

    const list = lastMessages.map((c) => {
        const ids = c._id.replace('conv:', '').split(':');
        const otherId = ids.find((id) => id !== user.userId);
        return {
            conversationId: c._id,
            otherUserId: otherId,
            otherUserName: userMap[otherId] || 'User',
            lastMessage: c.lastMessage?.content?.slice(0, 80) || '',
            lastMessageAt: c.lastMessage?.createdAt,
        };
    });

    res.json({
        success: true,
        data: { conversations: list },
    });
});

module.exports = {
    sendMessage,
    getConversation,
    listConversations,
};
