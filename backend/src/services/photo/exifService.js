/**
 * EXIF Service
 * Extracts metadata from photos using EXIF data
 */

const { AppError } = require('../../middleware/errorHandler');

/**
 * Extract EXIF metadata from image buffer
 * @param {Buffer} imageBuffer - Image file buffer
 * @returns {Promise<{latitude: number, longitude: number, timestamp: Date}>} EXIF metadata
 */
async function extractEXIF(imageBuffer) {
    if (!imageBuffer || !Buffer.isBuffer(imageBuffer)) {
        throw new AppError('Invalid image buffer', 400, 'INVALID_IMAGE');
    }

    try {
        // Dynamic import of exifr to avoid requiring it at module load
        const exifr = require('exifr');
        
        const exifData = await exifr.parse(imageBuffer, {
            latitude: true,
            longitude: true,
            exif: true,
            gps: true,
            translateKeys: false,
            translateValues: false,
            reviveValues: true,
            sanitize: true,
            mergeOutput: true
        });

        if (!exifData) {
            throw new AppError('No EXIF data found in image', 400, 'NO_EXIF_DATA');
        }

        // Extract GPS coordinates
        const latitude = exifData.latitude || exifData.GPSLatitude;
        const longitude = exifData.longitude || exifData.GPSLongitude;

        // Extract timestamp
        let timestamp = null;
        if (exifData.DateTimeOriginal) {
            timestamp = new Date(exifData.DateTimeOriginal);
        } else if (exifData.DateTime) {
            timestamp = new Date(exifData.DateTime);
        } else if (exifData.ModifyDate) {
            timestamp = new Date(exifData.ModifyDate);
        } else if (exifData.CreateDate) {
            timestamp = new Date(exifData.CreateDate);
        }

        // Validate required fields
        if (latitude === undefined || latitude === null || 
            longitude === undefined || longitude === null) {
            throw new AppError('Photo is missing GPS coordinates (latitude/longitude) in EXIF data', 400, 'MISSING_GEO_DATA');
        }

        if (!timestamp || isNaN(timestamp.getTime())) {
            throw new AppError('Photo is missing timestamp in EXIF data', 400, 'MISSING_TIMESTAMP');
        }

        return {
            latitude: parseFloat(latitude),
            longitude: parseFloat(longitude),
            timestamp: timestamp
        };
    } catch (error) {
        if (error instanceof AppError) {
            throw error;
        }

        // Handle exifr not found
        if (error.code === 'MODULE_NOT_FOUND') {
            throw new AppError(
                'EXIF extraction library not installed. Install with: npm install exifr',
                500,
                'EXIF_LIBRARY_MISSING'
            );
        }

        throw new AppError(
            `Failed to extract EXIF data: ${error.message}`,
            400,
            'EXIF_EXTRACTION_ERROR'
        );
    }
}

/**
 * Calculate distance between two GPS coordinates (Haversine formula)
 * @param {number} lat1 - Latitude 1
 * @param {number} lon1 - Longitude 1
 * @param {number} lat2 - Latitude 2
 * @param {number} lon2 - Longitude 2
 * @returns {number} Distance in meters
 */
function calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371000; // Earth radius in meters
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
}

module.exports = {
    extractEXIF,
    calculateDistance
};
