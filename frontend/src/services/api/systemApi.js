/**
 * System / observability API
 */

import { get } from './apiClient';

export const getSystemHealth = async () => {
    const response = await get('/system/health');
    return response;
};

export const getRecentIssues = async (params = {}) => {
    const query = new URLSearchParams();
    if (params.limit != null) query.set('limit', String(params.limit));

    const endpoint = `/system/issues${query.toString() ? `?${query.toString()}` : ''}`;
    const response = await get(endpoint);
    return response.data || response;
};

