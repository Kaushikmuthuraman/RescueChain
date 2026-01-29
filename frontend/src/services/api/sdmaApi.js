/**
 * SDMA API Service
 * API calls for SDMA portal
 */

import apiClient from './apiClient';

// Re-export organization login and current user from ngoApi (shared functionality)
export { loginOrganization, getCurrentUser } from './ngoApi';

/**
 * Get complaints list (uses GET /api/complaints; SDMA sees all)
 * @param {Object} filters - Optional { status, limit, offset }
 * @returns {Promise<Array>} Complaints
 */
export const getComplaintsList = async (filters = {}) => {
    const q = new URLSearchParams();
    if (filters.status) q.set('status', filters.status);
    if (filters.limit != null) q.set('limit', String(filters.limit));
    if (filters.offset != null) q.set('offset', String(filters.offset));
    const query = q.toString();
    const res = await apiClient.get(`/complaints${query ? `?${query}` : ''}`);
    return res.data?.complaints || [];
};

/**
 * Get system overview
 * @returns {Promise} System overview data
 */
export const getSystemOverview = async () => {
    const response = await apiClient.get('/sdma/overview');
    return response.data || response;
};

/**
 * Get all complaints (full visibility)
 * @param {Object} filters - Filter options (status, assignedTo, location, limit, offset)
 * @returns {Promise} List of complaints
 */
export const getAllComplaints = async (filters = {}) => {
    const queryParams = new URLSearchParams();
    if (filters.status) queryParams.append('status', filters.status);
    if (filters.assignedTo) queryParams.append('assignedTo', filters.assignedTo);
    if (filters.location) queryParams.append('location', filters.location);
    if (filters.limit) queryParams.append('limit', filters.limit);
    if (filters.offset) queryParams.append('offset', filters.offset);
    
    const endpoint = `/sdma/complaints${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    const response = await apiClient.get(endpoint);
    return response.data.complaints || response.complaints || [];
};

/**
 * Get donation analytics
 * @param {Object} filters - Filter options (startDate, endDate, ngoId)
 * @returns {Promise} Donation analytics data
 */
export const getDonationAnalytics = async (filters = {}) => {
    const queryParams = new URLSearchParams();
    if (filters.startDate) queryParams.append('startDate', filters.startDate);
    if (filters.endDate) queryParams.append('endDate', filters.endDate);
    if (filters.ngoId) queryParams.append('ngoId', filters.ngoId);
    
    const endpoint = `/sdma/donations/analytics${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    const response = await apiClient.get(endpoint);
    return response.data || response;
};

/**
 * Get all donations (with amounts visible to SDMA)
 * @param {Object} filters - Filter options (status, ngoId, limit, offset)
 * @returns {Promise} List of donations
 */
export const getAllDonations = async (filters = {}) => {
    const queryParams = new URLSearchParams();
    if (filters.status) queryParams.append('status', filters.status);
    if (filters.ngoId) queryParams.append('ngoId', filters.ngoId);
    if (filters.limit) queryParams.append('limit', filters.limit);
    if (filters.offset) queryParams.append('offset', filters.offset);
    
    const endpoint = `/sdma/donations${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    const response = await apiClient.get(endpoint);
    return response.data.donations || response.donations || [];
};

/**
 * Get audit timeline/blockchain logs
 * @param {Object} filters - Filter options (entityType, entityId, action, limit, offset)
 * @returns {Promise} List of audit logs
 */
export const getAuditTimeline = async (filters = {}) => {
    const queryParams = new URLSearchParams();
    if (filters.entityType) queryParams.append('entityType', filters.entityType);
    if (filters.entityId) queryParams.append('entityId', filters.entityId);
    if (filters.action) queryParams.append('action', filters.action);
    if (filters.limit) queryParams.append('limit', filters.limit);
    if (filters.offset) queryParams.append('offset', filters.offset);
    
    const endpoint = `/sdma/audit-timeline${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    const response = await apiClient.get(endpoint);
    return response.data.auditLogs || response.auditLogs || [];
};

/**
 * Create organization (NGO/DDMA) - Admin API
 * @param {Object} organizationData - Organization data
 * @returns {Promise} Created organization
 */
export const createOrganization = async (organizationData) => {
    const response = await apiClient.post('/admin/organizations', organizationData);
    return response.data.user || response.user;
};

/**
 * Get all users
 * @param {Object} filters - Filter options (userType, limit, offset)
 * @returns {Promise} List of users
 */
export const getUsers = async (filters = {}) => {
    const queryParams = new URLSearchParams();
    if (filters.userType) queryParams.append('userType', filters.userType);
    if (filters.limit) queryParams.append('limit', filters.limit);
    if (filters.offset) queryParams.append('offset', filters.offset);
    
    const endpoint = `/admin/users${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    const response = await apiClient.get(endpoint);
    return response.data.users || response.users || [];
};

/**
 * Update user status
 * @param {string} userId - User ID
 * @param {boolean} isActive - Active status
 * @returns {Promise} Updated user
 */
export const updateUserStatus = async (userId, isActive) => {
    const response = await apiClient.patch(`/admin/users/${userId}/status`, { isActive });
    return response.data.user || response.user;
};
