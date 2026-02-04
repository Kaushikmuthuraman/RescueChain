/**
 * Data retention configuration
 * Central place to control how far back exports / logs can go.
 */

const DEFAULT_AUDIT_RETENTION_DAYS = 365; // 1 year
const DEFAULT_EXPORT_RETENTION_DAYS = 365;

const AUDIT_RETENTION_DAYS = parseInt(process.env.AUDIT_RETENTION_DAYS || '', 10) || DEFAULT_AUDIT_RETENTION_DAYS;
const EXPORT_RETENTION_DAYS = parseInt(process.env.EXPORT_RETENTION_DAYS || '', 10) || DEFAULT_EXPORT_RETENTION_DAYS;

function clampStartDate(requestedDate, maxDays) {
    const now = new Date();
    const minDate = new Date();
    minDate.setDate(now.getDate() - maxDays);

    if (!requestedDate || Number.isNaN(requestedDate.getTime())) {
        return minDate;
    }

    return requestedDate < minDate ? minDate : requestedDate;
}

module.exports = {
    AUDIT_RETENTION_DAYS,
    EXPORT_RETENTION_DAYS,
    clampStartDate
};

