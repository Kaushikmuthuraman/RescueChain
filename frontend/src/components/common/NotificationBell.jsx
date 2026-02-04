/**
 * NotificationBell - Header dropdown with NotificationFeed
 */

import React, { useState, useRef, useEffect } from 'react';
import NotificationFeed from './NotificationFeed';
import './NotificationBell.css';

export default function NotificationBell({ onComplaintClick, onMessageClick }) {
    const [open, setOpen] = useState(false);
    const ref = useRef(null);

    useEffect(() => {
        const handleClickOutside = (e) => {
            if (ref.current && !ref.current.contains(e.target)) {
                setOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    return (
        <div className="notification-bell-wrap" ref={ref}>
            <button
                type="button"
                className="notification-bell-btn"
                onClick={() => setOpen(!open)}
                title="Notifications"
            >
                🔔
            </button>
            {open && (
                <div className="notification-bell-dropdown">
                    <NotificationFeed
                        onComplaintClick={(id) => {
                            onComplaintClick?.(id);
                            setOpen(false);
                        }}
                        onMessageClick={(p) => {
                            onMessageClick?.(p);
                            setOpen(false);
                        }}
                        maxHeight="360px"
                    />
                </div>
            )}
        </div>
    );
}
