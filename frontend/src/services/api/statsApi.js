/**
 * Stats / analytics API service
 * Used primarily by SDMA dashboard for advanced analytics.
 */

import { get } from './apiClient';

/**
 * Complaint density heatmap by region.
 * @param {Object} params - { days?, limit? }
 */
export const getComplaintHeatmap = async (params = {}) => {
    const query = new URLSearchParams();
    if (params.days != null) query.set('days', String(params.days));
    if (params.limit != null) query.set('limit', String(params.limit));

    const endpoint = `/stats/complaint-heatmap${query.toString() ? `?${query.toString()}` : ''}`;
    const response = await get(endpoint);
    return response.data || response;
};

/**
 * NGO performance trends over time.
 * @param {Object} params - { startDate?, endDate?, groupBy? }
 */
export const getNGOPerformanceTrends = async (params = {}) => {
    const query = new URLSearchParams();
    if (params.startDate) query.set('startDate', params.startDate);
    if (params.endDate) query.set('endDate', params.endDate);
    if (params.groupBy) query.set('groupBy', params.groupBy);

    const endpoint = `/stats/ngo-performance${query.toString() ? `?${query.toString()}` : ''}`;
    const response = await get(endpoint);
    return response.data || response;
};

/**
 * Response-time distribution buckets.
 * @param {Object} params - { days? }
 */
export const getResponseTimeDistribution = async (params = {}) => {
    const query = new URLSearchParams();
    if (params.days != null) query.set('days', String(params.days));

    const endpoint = `/stats/response-time-distribution${query.toString() ? `?${query.toString()}` : ''}`;
    const response = await get(endpoint);
    return response.data || response;
};

/**
 * High-risk zones based on complaint history.
 * @param {Object} params - { days?, limit?, minTotal? }
 */
export const getHighRiskZones = async (params = {}) => {
    const query = new URLSearchParams();
    if (params.days != null) query.set('days', String(params.days));
    if (params.limit != null) query.set('limit', String(params.limit));
    if (params.minTotal != null) query.set('minTotal', String(params.minTotal));

    const endpoint = `/stats/high-risk-zones${query.toString() ? `?${query.toString()}` : ''}`;
    const response = await get(endpoint);
    return response.data || response;
};

