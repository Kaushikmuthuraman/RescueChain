/**
 * DDMA API Service
 * API calls for DDMA portal
 */

import apiClient from './apiClient';

// Re-export organization login and current user from ngoApi (shared functionality)
export { loginOrganization, getCurrentUser } from './ngoApi';

/**
 * Get complaints grouped by area
 * @param {Object} filters - Filter options (status)
 * @returns {Promise} List of areas with complaint counts
 */
export const getComplaintsByArea = async (filters = {}) => {
    const queryParams = new URLSearchParams();
    if (filters.status) queryParams.append('status', filters.status);
    
    const endpoint = `/ddma/complaints/by-area${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    const response = await apiClient.get(endpoint);
    return response.data.areas || response.areas || [];
};

/**
 * Get complaints for a specific area
 * @param {string} location - Location/area name
 * @param {Object} filters - Filter options (status, limit, offset)
 * @returns {Promise} List of complaints for the area
 */
export const getComplaintsForArea = async (location, filters = {}) => {
    const queryParams = new URLSearchParams();
    if (filters.status) queryParams.append('status', filters.status);
    if (filters.limit) queryParams.append('limit', filters.limit);
    if (filters.offset) queryParams.append('offset', filters.offset);
    
    const encodedLocation = encodeURIComponent(location);
    const endpoint = `/ddma/complaints/by-area/${encodedLocation}${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    const response = await apiClient.get(endpoint);
    return response.data || response;
};

/**
 * Get list of NGOs for coordination
 * @returns {Promise} List of NGOs
 */
export const getNGOs = async () => {
    const response = await apiClient.get('/ddma/ngos');
    return response.data.ngos || response.ngos || [];
};

/**
 * Assign complaint to NGO
 * @param {string} complaintId - Complaint ID
 * @param {string} ngoId - NGO user ID
 * @returns {Promise} Updated complaint
 */
export const assignComplaint = async (complaintId, ngoId) => {
    const response = await apiClient.patch(`/complaints/${complaintId}/assign`, {
        assignedTo: ngoId
    });
    return response.data.complaint || response.complaint;
};

/**
 * Get all complaints (for DDMA)
 * @param {Object} filters - Filter options
 * @returns {Promise} List of complaints
 */
export const getComplaints = async (filters = {}) => {
    const queryParams = new URLSearchParams();
    if (filters.status) queryParams.append('status', filters.status);
    if (filters.assignedTo) queryParams.append('assignedTo', filters.assignedTo);
    
    const endpoint = `/complaints${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    const response = await apiClient.get(endpoint);
    return response.data.complaints || response.complaints || [];
};

/**
 * Get single complaint
 * @param {string} complaintId - Complaint ID
 * @returns {Promise} Complaint data
 */
export const getComplaint = async (complaintId) => {
    const response = await apiClient.get(`/complaints/${complaintId}`);
    return response.data.complaint || response.complaint;
};

/**
 * Get complaint timeline/status history
 * @param {string} complaintId - Complaint ID
 * @returns {Promise} Timeline data
 */
export const getComplaintTimeline = async (complaintId) => {
    const response = await apiClient.get(`/complaints/${complaintId}/timeline`);
    return response.data || response;
};

/**
 * Update complaint status (including mark as fake)
 * @param {string} complaintId - Complaint ID
 * @param {FormData} formData - Form data with status, notes, photo, reason
 * @returns {Promise} Updated complaint
 */
export const updateComplaintStatus = async (complaintId, formData) => {
    const token = localStorage.getItem('token');
    const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api';
    
    const response = await fetch(`${API_BASE_URL}/complaints/${complaintId}/status`, {
        method: 'PATCH',
        headers: {
            'Authorization': `Bearer ${token}`
        },
        body: formData
    });
    
    const data = await response.json();
    
    if (!response.ok) {
        throw new Error(data.message || 'Failed to update complaint status');
    }
    
    return data.data;
};

/**
 * Get photos for a complaint
 * @param {string} complaintId - Complaint ID
 * @returns {Promise} List of photos
 */
export const getComplaintPhotos = async (complaintId) => {
    const response = await apiClient.get(`/photos/complaint/${complaintId}`);
    return response.data.photos || response.photos || [];
};
