/**
 * DDMA Controller
 * Handles DDMA-specific operations: area-wise complaints, NGO coordination
 */

const db = require('../../config/database');
const { AppError, asyncHandler } = require('../../middleware/errorHandler');

/**
 * Get complaints grouped by area/location
 * GET /api/ddma/complaints/by-area
 * Returns complaints grouped by location
 */
const getComplaintsByArea = asyncHandler(async (req, res) => {
    const { status, limit = 100, offset = 0 } = req.query;
    const user = req.user;
    
    // Only DDMA can access this endpoint
    if (user.userType !== 'ddma') {
        throw new AppError('Access denied. DDMA only.', 403, 'FORBIDDEN');
    }
    
    let query = `
        SELECT 
            location,
            COUNT(*) as complaint_count,
            COUNT(CASE WHEN status = 'submitted' THEN 1 END) as submitted_count,
            COUNT(CASE WHEN status = 'accepted' THEN 1 END) as accepted_count,
            COUNT(CASE WHEN status = 'arriving' THEN 1 END) as arriving_count,
            COUNT(CASE WHEN status = 'in_progress' THEN 1 END) as in_progress_count,
            COUNT(CASE WHEN status = 'resolved' THEN 1 END) as resolved_count,
            COUNT(CASE WHEN status = 'fake_information' THEN 1 END) as fake_count,
            AVG(latitude) as avg_latitude,
            AVG(longitude) as avg_longitude
        FROM complaints
        WHERE 1=1
    `;
    
    const params = [];
    let paramCount = 0;
    
    if (status) {
        paramCount++;
        query += ` AND status = $${paramCount}`;
        params.push(status);
    }
    
    query += ` GROUP BY location ORDER BY complaint_count DESC`;
    
    const result = await db.query(query, params);
    
    // Get detailed complaints for each area (optional - can be requested separately)
    const areas = result.rows.map(row => ({
        location: row.location,
        complaintCount: parseInt(row.complaint_count),
        statusBreakdown: {
            submitted: parseInt(row.submitted_count || 0),
            accepted: parseInt(row.accepted_count || 0),
            arriving: parseInt(row.arriving_count || 0),
            inProgress: parseInt(row.in_progress_count || 0),
            resolved: parseInt(row.resolved_count || 0),
            fakeInformation: parseInt(row.fake_count || 0)
        },
        avgLatitude: row.avg_latitude ? parseFloat(row.avg_latitude) : null,
        avgLongitude: row.avg_longitude ? parseFloat(row.avg_longitude) : null
    }));
    
    res.json({
        success: true,
        data: {
            areas,
            count: areas.length
        }
    });
});

/**
 * Get complaints for a specific area
 * GET /api/ddma/complaints/by-area/:location
 */
const getComplaintsForArea = asyncHandler(async (req, res) => {
    const { location } = req.params;
    const { status, limit = 50, offset = 0 } = req.query;
    const user = req.user;
    
    // Only DDMA can access this endpoint
    if (user.userType !== 'ddma') {
        throw new AppError('Access denied. DDMA only.', 403, 'FORBIDDEN');
    }
    
    let query = `
        SELECT c.*, 
               u.name as victim_name,
               u.phone_number as victim_phone,
               assigned_user.name as assigned_to_name
        FROM complaints c
        INNER JOIN users u ON c.victim_id = u.id
        LEFT JOIN users assigned_user ON c.assigned_to = assigned_user.id
        WHERE c.location = $1
    `;
    
    const params = [decodeURIComponent(location)];
    let paramCount = 1;
    
    if (status) {
        paramCount++;
        query += ` AND c.status = $${paramCount}`;
        params.push(status);
    }
    
    query += ` ORDER BY c.created_at DESC LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}`;
    params.push(parseInt(limit), parseInt(offset));
    
    const result = await db.query(query, params);
    
    const complaints = result.rows.map(row => ({
        id: row.id,
        complaintText: row.complaint_text,
        location: row.location,
        latitude: row.latitude ? parseFloat(row.latitude) : null,
        longitude: row.longitude ? parseFloat(row.longitude) : null,
        urgencyLevel: row.urgency_level,
        status: row.status,
        assignedTo: row.assigned_to,
        assignedToName: row.assigned_to_name,
        resolvedAt: row.resolved_at,
        isSeeded: row.is_seeded || false,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
        victim: {
            id: row.victim_id,
            name: row.victim_name,
            phoneNumber: row.victim_phone
        }
    }));
    
    res.json({
        success: true,
        data: {
            complaints,
            location: decodeURIComponent(location),
            count: complaints.length
        }
    });
});

/**
 * Get list of all NGOs for coordination
 * GET /api/ddma/ngos
 */
const getNGOs = asyncHandler(async (req, res) => {
    const user = req.user;
    
    // Only DDMA can access this endpoint
    if (user.userType !== 'ddma') {
        throw new AppError('Access denied. DDMA only.', 403, 'FORBIDDEN');
    }
    
    const result = await db.query(
        `SELECT 
            u.id, 
            u.name, 
            u.phone_number,
            u.is_active,
            n.organization_name, 
            n.registration_number, 
            n.address, 
            n.contact_person, 
            n.email,
            (SELECT COUNT(*) FROM complaints WHERE assigned_to = u.id) as assigned_complaints_count,
            (SELECT COUNT(*) FROM complaints WHERE assigned_to = u.id AND status != 'resolved' AND status != 'fake_information') as active_complaints_count
        FROM users u
        LEFT JOIN ngos n ON u.id = n.user_id
        WHERE u.user_type = 'ngo' 
        ORDER BY u.name ASC`
    );
    
    const ngos = result.rows.map(row => ({
        id: row.id,
        name: row.organization_name || row.name,
        phoneNumber: row.phone_number,
        registrationNumber: row.registration_number,
        address: row.address,
        contactPerson: row.contact_person,
        email: row.email,
        isActive: row.is_active,
        assignedComplaintsCount: parseInt(row.assigned_complaints_count || 0),
        activeComplaintsCount: parseInt(row.active_complaints_count || 0)
    }));
    
    res.json({
        success: true,
        data: {
            ngos,
            count: ngos.length
        }
    });
});

module.exports = {
    getComplaintsByArea,
    getComplaintsForArea,
    getNGOs
};
