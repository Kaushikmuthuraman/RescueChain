/**
 * Homepage API Service
 * Public API calls for homepage data
 */

import { get, post, patch, del } from './apiClient';

/**
 * Get homepage statistics
 * @returns {Promise} Homepage stats
 */
export const getHomepageStats = async () => {
    const response = await get('/homepage/stats');
    return response.data.stats;
};

/**
 * Get public NGO list
 * @returns {Promise} List of NGOs
 */
export const getPublicNGOs = async () => {
    const response = await get('/homepage/ngos');
    return response.data.ngos;
};
