/**
 * Photo Validation Service
 * Validates photos against complaint requirements
 */

const db = require('../../config/database');
const { AppError } = require('../../middleware/errorHandler');
const { calculateDistance } = require('./exifService');

/**
 * Maximum allowed distance between photo location and complaint location (in meters)
 */
const MAX_LOCATION_DISTANCE = 500; // 500 meters default

/**
 * Maximum time window for photo timestamp validation (in hours)
 * Photo timestamp should be within X hours of current time
 */
const MAX_TIMESTAMP_WINDOW_HOURS = 24; // 24 hours default

/**
 * Validate photo location against complaint location
 * @param {number} photoLat - Photo latitude from EXIF
 * @param {number} photoLon - Photo longitude from EXIF
 * @param {number} complaintLat - Complaint latitude
 * @param {number} complaintLon - Complaint longitude
 * @returns {Promise<boolean>} True if valid
 */
async function validatePhotoLocation(photoLat, photoLon, complaintLat, complaintLon) {
    if (!complaintLat || !complaintLon) {
        // If complaint doesn't have coordinates, skip location validation
        return true;
    }

    if (!photoLat || !photoLon) {
        throw new AppError('Photo GPS coordinates are required', 400, 'MISSING_GEO_DATA');
    }

    const distance = calculateDistance(
        parseFloat(photoLat),
        parseFloat(photoLon),
        parseFloat(complaintLat),
        parseFloat(complaintLon)
    );

    const maxDistance = parseInt(process.env.MAX_PHOTO_LOCATION_DISTANCE || MAX_LOCATION_DISTANCE);

    if (distance > maxDistance) {
        throw new AppError(
            `Photo location is too far from complaint location. Distance: ${Math.round(distance)}m (max: ${maxDistance}m)`,
            400,
            'LOCATION_MISMATCH'
        );
    }

    return true;
}

/**
 * Validate photo timestamp is within acceptable window
 * @param {Date} photoTimestamp - Photo timestamp from EXIF
 * @returns {Promise<boolean>} True if valid
 */
function validatePhotoTimestamp(photoTimestamp) {
    if (!photoTimestamp || !(photoTimestamp instanceof Date)) {
        throw new AppError('Photo timestamp is required', 400, 'MISSING_TIMESTAMP');
    }

    const now = new Date();
    const maxWindowMs = parseInt(process.env.MAX_PHOTO_TIMESTAMP_WINDOW_HOURS || MAX_TIMESTAMP_WINDOW_HOURS) * 60 * 60 * 1000;
    
    const timeDiff = Math.abs(now.getTime() - photoTimestamp.getTime());

    if (timeDiff > maxWindowMs) {
        const hoursDiff = Math.round(timeDiff / (60 * 60 * 1000));
        throw new AppError(
            `Photo timestamp is outside acceptable window. Time difference: ${hoursDiff} hours (max: ${MAX_TIMESTAMP_WINDOW_HOURS} hours)`,
            400,
            'TIMESTAMP_OUT_OF_WINDOW'
        );
    }

    // Photo timestamp should not be in the future
    if (photoTimestamp > now) {
        throw new AppError(
            'Photo timestamp cannot be in the future',
            400,
            'FUTURE_TIMESTAMP'
        );
    }

    return true;
}

/**
 * Check if photo CID has been used before for the same complaint status
 * One photo cannot be reused across states
 * @param {string} ipfsCid - IPFS Content ID
 * @param {string} complaintId - Complaint ID
 * @param {string} complaintStatus - Complaint status
 * @returns {Promise<boolean>} True if photo is unique (not reused)
 */
async function validatePhotoUniqueness(ipfsCid, complaintId, complaintStatus) {
    if (!ipfsCid) {
        throw new AppError('IPFS CID is required', 400, 'MISSING_CID');
    }

    // Check if this CID has been used for this complaint in any status
    const result = await db.query(
        `SELECT id, complaint_status 
         FROM photo_evidence 
         WHERE ipfs_cid = $1 AND complaint_id = $2`,
        [ipfsCid, complaintId]
    );

    if (result.rows.length > 0) {
        const existingPhoto = result.rows[0];
        if (existingPhoto.complaint_status === complaintStatus) {
            throw new AppError(
                `This photo has already been uploaded for status: ${complaintStatus}`,
                400,
                'PHOTO_REUSED_SAME_STATUS'
            );
        } else {
            throw new AppError(
                `This photo has already been used for status: ${existingPhoto.complaint_status}. Each photo can only be used once per complaint.`,
                400,
                'PHOTO_REUSED'
            );
        }
    }

    return true;
}

/**
 * Validate photo against all requirements
 * @param {Object} params - Validation parameters
 * @param {number} params.photoLat - Photo latitude
 * @param {number} params.photoLon - Photo longitude
 * @param {Date} params.photoTimestamp - Photo timestamp
 * @param {string} params.ipfsCid - IPFS CID
 * @param {Object} params.complaint - Complaint object
 * @param {string} params.complaintStatus - Target complaint status
 * @returns {Promise<boolean>} True if all validations pass
 */
async function validatePhoto(params) {
    const { photoLat, photoLon, photoTimestamp, ipfsCid, complaint, complaintStatus } = params;

    // Validate location
    await validatePhotoLocation(
        photoLat,
        photoLon,
        complaint.latitude,
        complaint.longitude
    );

    // Validate timestamp
    validatePhotoTimestamp(photoTimestamp);

    // Validate uniqueness (one photo per complaint state)
    await validatePhotoUniqueness(ipfsCid, complaint.id, complaintStatus);

    return true;
}

module.exports = {
    validatePhotoLocation,
    validatePhotoTimestamp,
    validatePhotoUniqueness,
    validatePhoto,
    MAX_LOCATION_DISTANCE,
    MAX_TIMESTAMP_WINDOW_HOURS
};
