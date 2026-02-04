/**
 * Integration hooks
 * Central extension points for third-party integrations (webhooks, queues, etc.)
 *
 * In production, you can implement these to push events to:
 * - Webhook endpoints
 * - Message queues (Kafka, RabbitMQ, etc.)
 * - Monitoring / incident management systems
 */

const { ENABLE_INTEGRATIONS } = require('../../config/features');

async function safeInvoke(handler, payload, name) {
    if (!ENABLE_INTEGRATIONS || typeof handler !== 'function') return;
    try {
        await handler(payload);
    } catch (err) {
        console.error(`Integration hook "${name}" failed (non-blocking):`, err.message);
    }
}

// Default no-op handlers (can be replaced at runtime if desired)
let handlers = {
    onComplaintCreated: null,
    onComplaintStatusChanged: null,
    onDonationCreated: null
};

/**
 * Register custom handlers (e.g. in a bootstrap file)
 */
function registerIntegrationHandlers(customHandlers = {}) {
    handlers = { ...handlers, ...customHandlers };
}

async function onComplaintCreated(event) {
    await safeInvoke(handlers.onComplaintCreated, event, 'onComplaintCreated');
}

async function onComplaintStatusChanged(event) {
    await safeInvoke(handlers.onComplaintStatusChanged, event, 'onComplaintStatusChanged');
}

async function onDonationCreated(event) {
    await safeInvoke(handlers.onDonationCreated, event, 'onDonationCreated');
}

module.exports = {
    registerIntegrationHandlers,
    onComplaintCreated,
    onComplaintStatusChanged,
    onDonationCreated
};

