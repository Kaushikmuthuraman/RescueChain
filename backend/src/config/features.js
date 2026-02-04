/**
 * Feature flags / environment-based toggles
 * Central place to control optional subsystems.
 */

function flag(envKey, defaultValue = false) {
    const raw = process.env[envKey];
    if (raw === undefined) return defaultValue;
    return ['1', 'true', 'yes', 'on'].includes(String(raw).toLowerCase());
}

module.exports = {
    ENABLE_POLYGON_AUDIT: flag('ENABLE_POLYGON_AUDIT', true),
    ENABLE_IPFS: flag('ENABLE_IPFS', true),
    ENABLE_EXPORTS: flag('ENABLE_EXPORTS', true),
    ENABLE_INTEGRATIONS: flag('ENABLE_INTEGRATIONS', false)
};

