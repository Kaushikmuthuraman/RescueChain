/**
 * Photos Controller
 * Handles photo evidence operations with EXIF extraction and IPFS storage
 */

const db = require('../config/database');
const { AppError, asyncHandler } = require('../middleware/errorHandler');
const { ipfsService } = require('../services/photo/ipfsService');
const { extractEXIF } = require('../services/photo/exifService');
const { validatePhoto } = require('../services/photo/photoValidationService');

/**
 * Upload photo evidence
 * POST /api/photos
 * 
 * Rules:
 * - Extract EXIF metadata (lat, lng, timestamp)
 * - Reject photo if geo or time missing
 * - Validate photo location vs complaint
 * - Validate timestamp window
 * - One photo cannot be reused across states
 * - Upload to IPFS abstraction
 * - Store CID + metadata in PostgreSQL
 */
const uploadPhoto = asyncHandler(async (req, res) => {
    const { complaintId, complaintStatus } = req.body;
    const user = req.user;
    const file = req.file;

    if (user.userType === 'victim') {
        throw new AppError('Victims cannot upload photos', 403, 'FORBIDDEN');
    }

    if (!complaintId || !complaintStatus) {
        throw new AppError('complaintId and complaintStatus are required', 400, 'VALIDATION_ERROR');
    }

    if (!file) {
        throw new AppError('Photo file is required', 400, 'FILE_REQUIRED');
    }

    // Verify complaint exists and is accessible
    const complaintResult = await db.query('SELECT * FROM complaints WHERE id = $1', [complaintId]);
    if (complaintResult.rows.length === 0) {
        throw new AppError('Complaint not found', 404, 'NOT_FOUND');
    }

    const complaint = complaintResult.rows[0];

    // Check if user has access to this complaint
    if (user.userType === 'ngo' && complaint.assigned_to !== user.userId) {
        throw new AppError('You can only upload photos for complaints assigned to you', 403, 'FORBIDDEN');
    }

    // Verify status requires photo (not 'accepted' or 'submitted')
    const physicalStatuses = ['arriving', 'in_progress', 'resolved'];
    if (!physicalStatuses.includes(complaintStatus)) {
        throw new AppError('Photos can only be uploaded for physical statuses (arriving, in_progress, resolved)', 400, 'VALIDATION_ERROR');
    }

    // Extract EXIF metadata
    const exifData = await extractEXIF(file.buffer);

    // Upload to IPFS
    const ipfsResult = await ipfsService.uploadFile(file.buffer, file.originalname);
    const ipfsCid = ipfsResult.cid;

    // Validate photo (location, timestamp, uniqueness)
    await validatePhoto({
        photoLat: exifData.latitude,
        photoLon: exifData.longitude,
        photoTimestamp: exifData.timestamp,
        ipfsCid: ipfsCid,
        complaint: complaint,
        complaintStatus: complaintStatus
    });

    // Use transaction for atomicity
    const client = await db.getClient();

    try {
        await client.query('BEGIN');

        // Insert photo evidence with IPFS CID and EXIF metadata
        const result = await client.query(
            `INSERT INTO photo_evidence (
                complaint_id, 
                complaint_status, 
                ipfs_cid, 
                photo_url, 
                exif_latitude, 
                exif_longitude, 
                exif_timestamp, 
                uploaded_by
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
            RETURNING *`,
            [
                complaintId,
                complaintStatus,
                ipfsCid,
                ipfsService.getGatewayUrl(ipfsCid), // Gateway URL for backward compatibility
                exifData.latitude,
                exifData.longitude,
                exifData.timestamp,
                user.userId
            ]
        );

        await client.query('COMMIT');

        res.status(201).json({
            success: true,
            message: 'Photo uploaded successfully',
            data: {
                photo: result.rows[0],
                exif: {
                    latitude: exifData.latitude,
                    longitude: exifData.longitude,
                    timestamp: exifData.timestamp
                },
                ipfs: {
                    cid: ipfsCid,
                    gatewayUrl: ipfsService.getGatewayUrl(ipfsCid)
                }
            }
        });
    } catch (error) {
        await client.query('ROLLBACK');
        throw error;
    } finally {
        client.release();
    }
});

/**
 * Get photos for a complaint
 * GET /api/photos/complaint/:complaintId
 */
const getComplaintPhotos = asyncHandler(async (req, res) => {
    const { complaintId } = req.params;
    const user = req.user;

    // Verify complaint exists
    const complaintResult = await db.query('SELECT * FROM complaints WHERE id = $1', [complaintId]);
    if (complaintResult.rows.length === 0) {
        throw new AppError('Complaint not found', 404, 'NOT_FOUND');
    }

    const complaint = complaintResult.rows[0];

    // Check access
    if (user.userType === 'victim' && complaint.victim_id !== user.userId) {
        throw new AppError('Access denied', 403, 'FORBIDDEN');
    }

    if (user.userType === 'ngo' && complaint.assigned_to !== user.userId) {
        throw new AppError('Access denied', 403, 'FORBIDDEN');
    }

    // Get photos
    const result = await db.query(
        `SELECT pe.*, u.name as uploaded_by_name
         FROM photo_evidence pe
         LEFT JOIN users u ON pe.uploaded_by = u.id
         WHERE pe.complaint_id = $1
         ORDER BY pe.uploaded_at DESC`,
        [complaintId]
    );

    res.json({
        success: true,
        data: {
            photos: result.rows,
            count: result.rows.length
        }
    });
});

/**
 * Get single photo
 * GET /api/photos/:id
 */
const getPhoto = asyncHandler(async (req, res) => {
    const { id } = req.params;

    const result = await db.query(
        `SELECT pe.*, u.name as uploaded_by_name, c.victim_id, c.assigned_to
         FROM photo_evidence pe
         LEFT JOIN users u ON pe.uploaded_by = u.id
         LEFT JOIN complaints c ON pe.complaint_id = c.id
         WHERE pe.id = $1`,
        [id]
    );

    if (result.rows.length === 0) {
        throw new AppError('Photo not found', 404, 'NOT_FOUND');
    }

    const photo = result.rows[0];
    const user = req.user;

    // Check access
    if (user.userType === 'victim' && photo.victim_id !== user.userId) {
        throw new AppError('Access denied', 403, 'FORBIDDEN');
    }

    if (user.userType === 'ngo' && photo.assigned_to !== user.userId) {
        throw new AppError('Access denied', 403, 'FORBIDDEN');
    }

    res.json({
        success: true,
        data: { photo }
    });
});

module.exports = {
    uploadPhoto,
    getComplaintPhotos,
    getPhoto
};
