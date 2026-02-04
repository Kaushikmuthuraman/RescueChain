/**
 * Notification Service
 * Emits real-time events via Socket.IO and persists to MongoDB.
 */

const Notification = require('../../models/Notification.mongo');
let io = null;

/**
 * Initialize with Socket.IO instance
 */
function init(socketIo) {
    io = socketIo;
}

/**
 * Persist notification to MongoDB
 */
async function persist(notification) {
    try {
        const doc = await Notification.create(notification);
        return doc;
    } catch (err) {
        console.error('[NotificationService] Persist error:', err.message);
        return null;
    }
}

/**
 * Emit to specific user IDs via their rooms
 */
function emitToUsers(userIds, event, data) {
    if (!io) return;
    const ids = Array.isArray(userIds) ? userIds : [userIds];
    ids.forEach((userId) => {
        io.to(`user:${userId}`).emit(event, data);
    });
}

/**
 * Emit to all users with a role
 */
function emitToRole(role, event, data) {
    if (!io) return;
    io.to(`role:${role}`).emit(event, data);
}

/**
 * Emit to DDMA users
 */
function emitToDDMA(event, data) {
    emitToRole('ddma', event, data);
}

/**
 * Emit to SDMA users
 */
function emitToSDMA(event, data) {
    emitToRole('sdma', event, data);
}

/**
 * Notify: complaint assigned to NGO
 */
async function notifyAssignment({ complaintId, assignedToId, assignedByName, victimId, location }) {
    const notification = {
        type: 'complaint_assignment',
        recipientIds: [assignedToId],
        roles: ['ngo'],
        title: 'New assignment',
        body: `Complaint assigned to you: ${location || 'Location'}`,
        payload: { complaintId, assignedToId, assignedByName, victimId, location },
    };
    const doc = await persist(notification);
    emitToUsers(assignedToId, 'notification', doc ? doc.toObject() : notification);
}

/**
 * Notify: complaint status updated
 */
async function notifyStatusUpdate({ complaintId, oldStatus, newStatus, changedByName, victimId, assignedToId, location }) {
    const recipients = [victimId].filter(Boolean);
    if (assignedToId && !recipients.includes(assignedToId)) recipients.push(assignedToId);

    const notification = {
        type: 'complaint_status_update',
        recipientIds: recipients,
        roles: ['victim', 'ngo', 'ddma', 'sdma'],
        title: 'Status updated',
        body: `Complaint status: ${oldStatus} → ${newStatus}${changedByName ? ` by ${changedByName}` : ''}`,
        payload: { complaintId, oldStatus, newStatus, changedByName, victimId, assignedToId, location },
    };
    const doc = await persist(notification);
    emitToUsers(recipients, 'notification', doc ? doc.toObject() : notification);
    emitToDDMA('notification', doc ? doc.toObject() : notification);
}

/**
 * Notify: complaint escalated (SLA breach)
 */
async function notifyEscalation({ complaintId, reason, victimId, assignedToId, location }) {
    const notification = {
        type: 'complaint_escalation',
        recipientIds: [],
        roles: ['ddma', 'sdma'],
        title: 'Escalation: SLA breach',
        body: `Complaint escalated: ${reason || 'SLA exceeded'}`,
        payload: { complaintId, reason, victimId, assignedToId, location },
    };
    const doc = await persist(notification);
    emitToDDMA('notification', doc ? doc.toObject() : notification);
    emitToSDMA('notification', doc ? doc.toObject() : notification);
}

/**
 * Notify: complaint resolved
 */
async function notifyResolution({ complaintId, victimId, assignedToId, location }) {
    const recipients = [victimId, assignedToId].filter(Boolean);

    const notification = {
        type: 'complaint_resolution',
        recipientIds: recipients,
        roles: ['victim', 'ngo', 'ddma', 'sdma'],
        title: 'Complaint resolved',
        body: `Complaint has been resolved: ${location || ''}`,
        payload: { complaintId, victimId, assignedToId, location },
    };
    const doc = await persist(notification);
    emitToUsers(recipients, 'notification', doc ? doc.toObject() : notification);
    emitToDDMA('notification', doc ? doc.toObject() : notification);
}

/**
 * Notify: new complaint created (for DDMA/SDMA)
 */
async function notifyComplaintCreated({ complaintId, victimId, location }) {
    const notification = {
        type: 'complaint_created',
        recipientIds: [],
        roles: ['ddma', 'sdma'],
        title: 'New complaint',
        body: `New complaint submitted: ${location || ''}`,
        payload: { complaintId, victimId, location },
    };
    const doc = await persist(notification);
    emitToDDMA('notification', doc ? doc.toObject() : notification);
    emitToSDMA('notification', doc ? doc.toObject() : notification);
}

/**
 * Notify: new message (NGO ↔ DDMA)
 */
async function notifyNewMessage({ messageId, conversationId, senderId, senderName, recipientId }) {
    const notification = {
        type: 'message',
        recipientIds: [recipientId],
        roles: ['ngo', 'ddma'],
        title: `Message from ${senderName || 'User'}`,
        body: 'You have a new message',
        payload: { messageId, conversationId, senderId, senderName },
    };
    const doc = await persist(notification);
    emitToUsers(recipientId, 'notification', doc ? doc.toObject() : notification);
}

module.exports = {
    init,
    persist,
    emitToUsers,
    emitToRole,
    emitToDDMA,
    emitToSDMA,
    notifyAssignment,
    notifyStatusUpdate,
    notifyEscalation,
    notifyResolution,
    notifyComplaintCreated,
    notifyNewMessage,
};
