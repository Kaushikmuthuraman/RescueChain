/**
 * API Client Configuration
 * Centralized API request handler
 */

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api';

/**
 * Make API request
 * @param {string} endpoint - API endpoint
 * @param {Object} options - Fetch options
 * @returns {Promise} API response
 */
async function apiRequest(endpoint, options = {}) {
    const url = `${API_BASE_URL}${endpoint}`;
    
    const defaultOptions = {
        headers: {
            'Content-Type': 'application/json',
        },
    };
    
    // Add auth token if available
    const token = localStorage.getItem('token');
    if (token) {
        defaultOptions.headers['Authorization'] = `Bearer ${token}`;
    }
    
    const config = {
        ...defaultOptions,
        ...options,
        headers: {
            ...defaultOptions.headers,
            ...(options.headers || {}),
        },
    };
    
    try {
        const response = await fetch(url, config);
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.message || 'API request failed');
        }
        
        return data;
    } catch (error) {
        console.error('API request error:', error);
        throw error;
    }
}

/**
 * GET request
 */
export const get = (endpoint, options = {}) => {
    return apiRequest(endpoint, { ...options, method: 'GET' });
};

/**
 * POST request
 */
export const post = (endpoint, body, options = {}) => {
    return apiRequest(endpoint, {
        ...options,
        method: 'POST',
        body: JSON.stringify(body),
    });
};

/**
 * PATCH request
 */
export const patch = (endpoint, body, options = {}) => {
    return apiRequest(endpoint, {
        ...options,
        method: 'PATCH',
        body: JSON.stringify(body),
    });
};

/**
 * DELETE request
 */
export const del = (endpoint, options = {}) => {
    return apiRequest(endpoint, { ...options, method: 'DELETE' });
};

export default {
    get,
    post,
    patch,
    delete: del,
};
