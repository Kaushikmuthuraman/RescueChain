/**
 * Socket.IO Service
 * Real-time WebSocket with JWT authentication and role-based rooms.
 */

const { Server } = require('socket.io');
const { verifyToken } = require('../../utils/jwt');

let io = null;

/**
 * Initialize Socket.IO and attach to HTTP server
 */
function init(httpServer) {
    io = new Server(httpServer, {
        cors: {
            origin: process.env.CORS_ORIGIN || '*',
            methods: ['GET', 'POST'],
        },
        pingTimeout: 60000,
        pingInterval: 25000,
    });

    io.use((socket, next) => {
        const token = socket.handshake.auth?.token || socket.handshake.query?.token;
        if (!token) {
            return next(new Error('Authentication required'));
        }
        const decoded = verifyToken(token);
        if (!decoded) {
            return next(new Error('Invalid token'));
        }
        socket.user = {
            userId: decoded.userId,
            userType: decoded.userType,
            phoneNumber: decoded.phoneNumber,
        };
        next();
    });

    io.on('connection', (socket) => {
        const { userId, userType } = socket.user;

        socket.join(`user:${userId}`);
        socket.join(`role:${userType}`);

        socket.on('disconnect', () => {
            socket.leave(`user:${userId}`);
            socket.leave(`role:${userType}`);
        });
    });

    return io;
}

function getIO() {
    return io;
}

module.exports = { init, getIO };
