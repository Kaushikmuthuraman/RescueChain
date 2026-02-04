/**
 * Map API Service
 * Fetches geo data for RescueMap visualization
 */

import { get } from './apiClient';

/**
 * Get complaints with coordinates for map
 * Role-filtered on backend
 */
export const getMapComplaints = () => get('/map/complaints');

/**
 * Get NGOs with coordinates (DDMA/SDMA only)
 */
export const getMapNGOs = () => get('/map/ngos');

/**
 * Get nearest NGOs by distance
 * @param {number} lat - Latitude
 * @param {number} lon - Longitude
 * @param {number} limit - Max results (default 5)
 */
export const getNearestNGOs = (lat, lon, limit = 5) =>
    get(`/map/nearest-ngos?lat=${lat}&lon=${lon}&limit=${limit}`);
