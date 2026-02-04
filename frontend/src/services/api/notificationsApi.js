import { get, patch, post } from './apiClient';

export const getNotifications = (params = {}) => {
    const q = new URLSearchParams(params).toString();
    return get(`/notifications${q ? `?${q}` : ''}`);
};

export const markNotificationRead = (id) => patch(`/notifications/${id}/read`, {});
export const markAllNotificationsRead = () => post('/notifications/read-all', {});
