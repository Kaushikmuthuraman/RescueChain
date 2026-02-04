/**
 * Map Controller
 * Provides geo data for live map visualization:
 * - Complaints with coordinates (EXIF-verified or user-entered)
 * - NGOs with coordinates
 * - Nearest NGO suggestion by distance
 */

const db = require('../config/database');
const { AppError, asyncHandler } = require('../middleware/errorHandler');

/**
 * Get complaints with coordinates for map visualization
 * GET /api/map/complaints
 * Role-based filtering: victim (own), ngo (assigned), ddma/sdma (all)
 * Returns: latitude, longitude, exifVerified, status, assignedTo, etc.
 */
const getMapComplaints = asyncHandler(async (req, res) => {
    const user = req.user;

    let query = `
        WITH latest_exif AS (
            SELECT DISTINCT ON (complaint_id)
                complaint_id,
                exif_latitude,
                exif_longitude,
                complaint_status
            FROM photo_evidence
            WHERE exif_latitude IS NOT NULL AND exif_longitude IS NOT NULL
            ORDER BY complaint_id, uploaded_at DESC
        )
        SELECT 
            c.id,
            c.complaint_text,
            c.location,
            c.urgency_level,
            c.status,
            c.assigned_to,
            c.resolved_at,
            c.created_at,
            c.victim_id,
            COALESCE(le.exif_latitude, c.latitude) as latitude,
            COALESCE(le.exif_longitude, c.longitude) as longitude,
            (le.exif_latitude IS NOT NULL) as exif_verified,
            assigned_user.name as assigned_to_name,
            u.name as victim_name
        FROM complaints c
        LEFT JOIN latest_exif le ON c.id = le.complaint_id
        LEFT JOIN users assigned_user ON c.assigned_to = assigned_user.id
        LEFT JOIN users u ON c.victim_id = u.id
        WHERE (c.latitude IS NOT NULL AND c.longitude IS NOT NULL)
           OR (le.exif_latitude IS NOT NULL AND le.exif_longitude IS NOT NULL)
    `;
    const params = [];
    let paramCount = 0;

    // Role-based filtering
    if (user.userType === 'victim') {
        paramCount++;
        query += ` AND c.victim_id = $${paramCount}`;
        params.push(user.userId);
    } else if (user.userType === 'ngo') {
        paramCount++;
        query += ` AND (c.assigned_to = $${paramCount} OR c.assigned_to IS NULL)`;
        params.push(user.userId);
    }
    // DDMA and SDMA see all (no filter)

    query += ` ORDER BY c.created_at DESC`;

    const result = await db.query(query, params);

    const complaints = result.rows
        .filter((row) => (row.latitude != null && row.longitude != null))
        .map((row) => ({
            id: row.id,
            complaintText: row.complaint_text,
            location: row.location,
            latitude: parseFloat(row.latitude),
            longitude: parseFloat(row.longitude),
            exifVerified: row.exif_verified,
            urgencyLevel: row.urgency_level,
            status: row.status,
            assignedTo: row.assigned_to,
            assignedToName: row.assigned_to_name,
            victimName: row.victim_name,
            resolvedAt: row.resolved_at,
            createdAt: row.created_at,
        }));

    res.json({
        success: true,
        data: {
            complaints,
            count: complaints.length,
        },
    });
});

/**
 * Get NGOs with coordinates for map
 * GET /api/map/ngos
 * DDMA and SDMA only
 */
const getMapNGOs = asyncHandler(async (req, res) => {
    const user = req.user;

    if (user.userType !== 'ddma' && user.userType !== 'sdma') {
        throw new AppError('Only DDMA and SDMA can view NGO map layer', 403, 'FORBIDDEN');
    }

    const result = await db.query(
        `SELECT 
            u.id,
            n.organization_name,
            n.address,
            n.latitude,
            n.longitude,
            n.contact_person,
            (SELECT COUNT(*) FROM complaints WHERE assigned_to = u.id AND status NOT IN ('resolved', 'fake_information')) as active_complaints_count
        FROM users u
        INNER JOIN ngos n ON u.id = n.user_id
        WHERE u.user_type = 'ngo'
          AND n.latitude IS NOT NULL
          AND n.longitude IS NOT NULL
        ORDER BY n.organization_name ASC`
    );

    const ngos = result.rows.map((row) => ({
        id: row.id,
        name: row.organization_name,
        address: row.address,
        latitude: parseFloat(row.latitude),
        longitude: parseFloat(row.longitude),
        contactPerson: row.contact_person,
        activeComplaintsCount: parseInt(row.active_complaints_count || 0, 10),
    }));

    res.json({
        success: true,
        data: {
            ngos,
            count: ngos.length,
        },
    });
});

/**
 * Haversine formula for distance in km
 */
function haversineDistanceKm(lat1, lon1, lat2, lon2) {
    const R = 6371; // Earth radius in km
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos((lat1 * Math.PI) / 180) *
            Math.cos((lat2 * Math.PI) / 180) *
            Math.sin(dLon / 2) *
            Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
}

/**
 * Get nearest NGOs by distance
 * GET /api/map/nearest-ngos?lat=28.5&lon=77.3&limit=5
 * DDMA and SDMA only
 */
const getNearestNGOs = asyncHandler(async (req, res) => {
    const user = req.user;
    const lat = parseFloat(req.query.lat);
    const lon = parseFloat(req.query.lon);
    const limit = Math.min(parseInt(req.query.limit, 10) || 5, 20);

    if (user.userType !== 'ddma' && user.userType !== 'sdma') {
        throw new AppError('Only DDMA and SDMA can access nearest NGOs', 403, 'FORBIDDEN');
    }

    if (isNaN(lat) || isNaN(lon)) {
        throw new AppError('lat and lon query parameters are required and must be valid numbers', 400, 'VALIDATION_ERROR');
    }

    const result = await db.query(
        `SELECT 
            u.id,
            n.organization_name,
            n.address,
            n.latitude,
            n.longitude,
            n.contact_person,
            (SELECT COUNT(*) FROM complaints WHERE assigned_to = u.id AND status NOT IN ('resolved', 'fake_information')) as active_complaints_count
        FROM users u
        INNER JOIN ngos n ON u.id = n.user_id
        WHERE u.user_type = 'ngo'
          AND n.latitude IS NOT NULL
          AND n.longitude IS NOT NULL
        ORDER BY n.organization_name ASC`
    );

    const ngosWithDistance = result.rows.map((row) => {
        const distanceKm = haversineDistanceKm(
            lat,
            lon,
            parseFloat(row.latitude),
            parseFloat(row.longitude)
        );
        return {
            id: row.id,
            name: row.organization_name,
            address: row.address,
            latitude: parseFloat(row.latitude),
            longitude: parseFloat(row.longitude),
            contactPerson: row.contact_person,
            activeComplaintsCount: parseInt(row.active_complaints_count || 0, 10),
            distanceKm: Math.round(distanceKm * 100) / 100,
        };
    });

    ngosWithDistance.sort((a, b) => a.distanceKm - b.distanceKm);

    res.json({
        success: true,
        data: {
            ngos: ngosWithDistance.slice(0, limit),
            count: Math.min(ngosWithDistance.length, limit),
        },
    });
});

module.exports = {
    getMapComplaints,
    getMapNGOs,
    getNearestNGOs,
};
