/**
 * Blockchain API Service
 * API calls for blockchain audit logs
 */

import apiClient from './apiClient';

/**
 * Get blockchain audit logs for a complaint
 * @param {string} complaintId - Complaint ID
 * @returns {Promise} Audit logs data
 */
export const getComplaintAuditLogs = async (complaintId) => {
    const response = await apiClient.get(`/blockchain/audit/${complaintId}`);
    return response.data;
};
