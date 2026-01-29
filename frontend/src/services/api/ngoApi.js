/**
 * NGO API Service
 * API calls for NGO portal
 */

import apiClient from './apiClient';

/**
 * Login organization (NGO, DDMA, SDMA)
 * @param {string} username - Username
 * @param {string} password - Password
 * @returns {Promise} Login response with token
 */
export const loginOrganization = async (username, password) => {
    const response = await apiClient.post('/auth/organization/login', { username, password });
    return response.data;
};

/**
 * Get current organization user info
 * @returns {Promise} User data
 */
export const getCurrentUser = async () => {
    const response = await apiClient.get('/auth/organization/me');
    return response.data.user;
};

/**
 * Get complaints for NGO
 * @param {Object} filters - Filter options (status, etc.)
 * @returns {Promise} List of complaints
 */
export const getComplaints = async (filters = {}) => {
    const queryParams = new URLSearchParams();
    if (filters.status) queryParams.append('status', filters.status);
    
    const endpoint = `/complaints${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    const response = await apiClient.get(endpoint);
    return response.data.complaints;
};

/**
 * Get single complaint
 * @param {string} complaintId - Complaint ID
 * @returns {Promise} Complaint data
 */
export const getComplaint = async (complaintId) => {
    const response = await apiClient.get(`/complaints/${complaintId}`);
    return response.data.complaint;
};

/**
 * Get complaint timeline/status history
 * @param {string} complaintId - Complaint ID
 * @returns {Promise} Timeline data
 */
export const getComplaintTimeline = async (complaintId) => {
    const response = await apiClient.get(`/complaints/${complaintId}/timeline`);
    return response.data;
};

/**
 * Update complaint status
 * @param {string} complaintId - Complaint ID
 * @param {FormData} formData - Form data with status, notes, photo
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
 * Upload photo evidence
 * @param {FormData} formData - Form data with complaintId, complaintStatus, photo
 * @returns {Promise} Photo data
 */
export const uploadPhoto = async (formData) => {
    const token = localStorage.getItem('token');
    const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api';
    
    const response = await fetch(`${API_BASE_URL}/photos`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${token}`
        },
        body: formData
    });
    
    const data = await response.json();
    
    if (!response.ok) {
        throw new Error(data.message || 'Failed to upload photo');
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
    return response.data.photos;
};
