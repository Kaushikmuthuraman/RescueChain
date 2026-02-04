import { get, post } from './apiClient';

export const sendMessage = (body) => post('/messages', body);
export const getConversations = () => get('/messages/conversations');
export const getConversation = (userId, params = {}) => {
    const q = new URLSearchParams(params).toString();
    return get(`/messages/conversation/${userId}${q ? `?${q}` : ''}`);
};
