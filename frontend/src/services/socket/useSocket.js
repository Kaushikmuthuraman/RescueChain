/**
 * useSocket - React hook for Socket.IO connection with JWT auth
 */

import { useEffect, useState, useCallback } from 'react';
import { io } from 'socket.io-client';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api';
const SOCKET_URL = API_BASE.replace(/\/api\/?$/, '');

let socketInstance = null;

export function useSocket(enabled = true) {
    const [connected, setConnected] = useState(false);

    useEffect(() => {
        if (!enabled) return;

        const token = localStorage.getItem('token');
        if (!token) return;

        if (socketInstance?.connected) {
            setConnected(true);
            return;
        }

        socketInstance = io(SOCKET_URL, {
            auth: { token },
            transports: ['websocket', 'polling'],
        });

        socketInstance.on('connect', () => setConnected(true));
        socketInstance.on('disconnect', () => setConnected(false));
        socketInstance.on('connect_error', () => setConnected(false));

        return () => {
            if (socketInstance) {
                socketInstance.disconnect();
                socketInstance = null;
            }
            setConnected(false);
        };
    }, [enabled]);

    const on = useCallback((event, handler) => {
        if (!socketInstance) return () => {};
        socketInstance.on(event, handler);
        return () => socketInstance.off(event, handler);
    }, []);

    return { socket: socketInstance, connected, on };
}
