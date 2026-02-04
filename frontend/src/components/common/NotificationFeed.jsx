/**
 * NotificationFeed - Role-scoped notification list with real-time updates
 */

import React, { useState, useEffect, useCallback } from 'react';
import { useSocket } from '../../services/socket/useSocket';
import { getNotifications, markNotificationRead, markAllNotificationsRead } from '../../services/api/notificationsApi';
import './NotificationFeed.css';

const TYPE_LABELS = {
    complaint_assignment: 'Assignment',
    complaint_status_update: 'Status Update',
    complaint_escalation: 'Escalation',
    complaint_resolution: 'Resolved',
    complaint_created: 'New Complaint',
    message: 'Message',
};

export default function NotificationFeed({ onComplaintClick, onMessageClick, maxHeight = '320px' }) {
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [unreadCount, setUnreadCount] = useState(0);
    const { connected, on } = useSocket(true);

    const fetchNotifications = useCallback(async () => {
        setLoading(true);
        try {
            const res = await getNotifications({ limit: 50 });
            const list = res.data?.notifications || [];
            setNotifications(list);
            const unread = list.filter((n) => !n.read).length;
            setUnreadCount(unread);
        } catch (err) {
            console.error('Failed to fetch notifications:', err);
            setNotifications([]);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchNotifications();
    }, [fetchNotifications]);

    useEffect(() => {
        const unsubscribe = on('notification', (n) => {
            setNotifications((prev) => [n, ...prev].slice(0, 50));
            setUnreadCount((c) => c + 1);
        });
        return unsubscribe;
    }, [on]);

    const handleMarkRead = async (id) => {
        try {
            await markNotificationRead(id);
            setNotifications((prev) =>
                prev.map((n) => (n.id === id || n._id === id ? { ...n, read: true } : n))
            );
            setUnreadCount((c) => Math.max(0, c - 1));
        } catch (err) {
            console.error('Mark read failed:', err);
        }
    };

    const handleMarkAllRead = async () => {
        try {
            await markAllNotificationsRead();
            setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
            setUnreadCount(0);
        } catch (err) {
            console.error('Mark all read failed:', err);
        }
    };

    const handleClick = (n) => {
        if (!n.read) handleMarkRead(n.id || n._id);
        if (n.type === 'message' && onMessageClick) {
            onMessageClick({ ...n.payload, senderId: n.payload?.senderId });
        } else if (n.payload?.complaintId && onComplaintClick) {
            onComplaintClick(n.payload.complaintId);
        }
    };

    return (
        <div className="notification-feed">
            <div className="notification-feed-header">
                <span className="notification-feed-title">
                    Notifications
                    {connected && <span className="notification-feed-live" title="Live">●</span>}
                </span>
                {unreadCount > 0 && (
                    <button type="button" className="notification-mark-all" onClick={handleMarkAllRead}>
                        Mark all read
                    </button>
                )}
            </div>
            <div className="notification-feed-list" style={{ maxHeight }}>
                {loading ? (
                    <div className="notification-feed-loading">Loading...</div>
                ) : notifications.length === 0 ? (
                    <div className="notification-feed-empty">No notifications yet</div>
                ) : (
                    notifications.map((n) => {
                        const id = n.id || n._id;
                        return (
                            <div
                                key={id}
                                className={`notification-item ${n.read ? 'read' : 'unread'}`}
                                onClick={() => handleClick(n)}
                            >
                                <div className="notification-item-type">{TYPE_LABELS[n.type] || n.type}</div>
                                <div className="notification-item-title">{n.title}</div>
                                {n.body && <div className="notification-item-body">{n.body}</div>}
                                <div className="notification-item-time">
                                    {n.createdAt ? new Date(n.createdAt).toLocaleString() : ''}
                                </div>
                            </div>
                        );
                    })
                )}
            </div>
        </div>
    );
}
