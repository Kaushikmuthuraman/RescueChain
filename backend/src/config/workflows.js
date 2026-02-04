/**
 * Workflow configuration for complaints and related entities.
 * This centralizes status flows so they can be extended without
 * rewriting controllers.
 */

// Core complaint statuses (db enum-backed)
const COMPLAINT_STATUSES = [
    'submitted',
    'accepted',
    'arriving',
    'in_progress',
    'resolved',
    'fake_information'
];

// Config-driven status flow, including per-status requirements
const complaintWorkflow = {
    statuses: COMPLAINT_STATUSES,
    terminalStatuses: ['fake_information'],
    // Next allowed statuses from each state
    transitions: {
        submitted: ['accepted', 'fake_information'],
        accepted: ['arriving', 'fake_information'],
        arriving: ['in_progress', 'fake_information'],
        in_progress: ['resolved', 'fake_information'],
        resolved: [], // End of normal flow
        fake_information: [] // Terminal
    },
    // Photo requirements by target status
    photoRequired: {
        submitted: false,
        accepted: false,
        arriving: true,
        in_progress: true,
        resolved: true,
        fake_information: true
    },
    // Extra validation rules by status
    rules: {
        fake_information: {
            reasonRequired: true
        }
    }
};

/**
 * Validate transition according to workflow.
 * Returns { ok, errorCode, message }.
 */
function validateComplaintTransition(currentStatus, nextStatus, { isSDMA } = {}) {
    if (!complaintWorkflow.statuses.includes(nextStatus)) {
        return {
            ok: false,
            errorCode: 'INVALID_STATUS',
            message: `Invalid status. Valid statuses: ${complaintWorkflow.statuses.join(', ')}`
        };
    }

    const terminal = complaintWorkflow.terminalStatuses.includes(currentStatus);
    if (terminal && !isSDMA) {
        return {
            ok: false,
            errorCode: 'TERMINAL_STATUS',
            message: `Cannot update status from terminal status: ${currentStatus}. Only SDMA can override locked complaints.`
        };
    }

    if (currentStatus === nextStatus) {
        return { ok: true };
    }

    // Allow jumping to terminal fake_information from any non-terminal status
    if (nextStatus === 'fake_information' && !terminal) {
        return { ok: true };
    }

    const allowedNext = complaintWorkflow.transitions[currentStatus] || [];
    if (!allowedNext.includes(nextStatus)) {
        return {
            ok: false,
            errorCode: 'STATUS_SKIP_NOT_ALLOWED',
            message: `Invalid status transition from ${currentStatus} to ${nextStatus}. Valid transitions: ${allowedNext.join(', ') || 'none'}.`
        };
    }

    return { ok: true };
}

module.exports = {
    complaintWorkflow,
    validateComplaintTransition
};

