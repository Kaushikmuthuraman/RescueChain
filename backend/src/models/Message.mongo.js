/**
 * Message MongoDB Model
 * In-app messaging between NGO and DDMA.
 */

const { Schema, model } = require('mongoose');

const MessageSchema = new Schema(
    {
        conversationId: {
            type: String,
            required: true,
            index: true,
        },
        senderId: {
            type: String,
            required: true,
        },
        senderRole: {
            type: String,
            enum: ['ngo', 'ddma'],
            required: true,
        },
        senderName: {
            type: String,
            default: '',
        },
        content: {
            type: String,
            required: true,
        },
        complaintId: {
            type: String,
            default: null,
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

MessageSchema.index({ conversationId: 1, createdAt: 1 });

module.exports = model('Message', MessageSchema);
