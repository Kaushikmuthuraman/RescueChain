/**
 * Notification MongoDB Model
 * Persists real-time notifications for role-scoped feeds.
 */

const { Schema, model } = require('mongoose');

const NOTIFICATION_TYPES = [
    'complaint_assignment',
    'complaint_status_update',
    'complaint_escalation',
    'complaint_resolution',
    'complaint_created',
    'message',
];

const NotificationSchema = new Schema(
    {
        type: {
            type: String,
            enum: NOTIFICATION_TYPES,
            required: true,
        },
        // Recipients: array of user IDs (PostgreSQL UUIDs as strings)
        recipientIds: [{
            type: String,
            required: true,
        }],
        // Role filter: only show to users with these roles
        roles: [{
            type: String,
            enum: ['victim', 'ngo', 'ddma', 'sdma'],
        }],
        title: {
            type: String,
            required: true,
        },
        body: {
            type: String,
            default: '',
        },
        payload: {
            type: Schema.Types.Mixed,
            default: {},
        },
        readBy: [{
            userId: String,
            readAt: { type: Date, default: Date.now },
        }],
        createdAt: {
            type: Date,
            default: Date.now,
        },
    },
    { timestamps: true }
);

NotificationSchema.index({ recipientIds: 1, createdAt: -1 });
NotificationSchema.index({ type: 1, createdAt: -1 });
NotificationSchema.index({ createdAt: -1 });

module.exports = model('Notification', NotificationSchema);
module.exports.NOTIFICATION_TYPES = NOTIFICATION_TYPES;
