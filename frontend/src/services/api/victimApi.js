/**
 * Victim API Service
 * API calls for victim portal
 */

import apiClient from './apiClient';

/**
 * Generate OTP for victim login
 * @param {string} phoneNumber - Phone number
 * @returns {Promise} OTP response
 */
export const generateOTP = async (phoneNumber) => {
    const response = await apiClient.post('/auth/victim/otp', { phoneNumber });
    return response.data;
};

/**
 * Verify OTP and login
 * @param {string} phoneNumber - Phone number
 * @param {string} otp - OTP code
 * @returns {Promise} Login response with token
 */
export const verifyOTP = async (phoneNumber, otp) => {
    const response = await apiClient.post('/auth/victim/verify', { phoneNumber, otp });
    return response.data;
};

/**
 * Get complaints for current victim
 * @returns {Promise} List of complaints
 */
export const getComplaints = async () => {
    const response = await apiClient.get('/complaints');
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
 * Create complaint with photo upload
 * @param {FormData} formData - Form data with complaint details and photo
 * @returns {Promise} Created complaint
 */
export const createComplaint = async (formData) => {
    const token = localStorage.getItem('token');
    const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api';
    
    // DO NOT set Content-Type header - browser will set it automatically with boundary for FormData
    // ONLY set Authorization header
    const headers = {
        Authorization: `Bearer ${token}`
    };
    
    const response = await fetch(`${API_BASE_URL}/complaints`, {
        method: 'POST',
        headers,
        body: formData
    });
    
    const data = await response.json();
    
    if (!response.ok) {
        throw new Error(data.message || 'Failed to create complaint');
    }
    
    return data.data.complaint;
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
