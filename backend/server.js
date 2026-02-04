/**
 * Server Entry Point
 * Starts the Express server with Socket.IO for real-time notifications
 */

require('dotenv').config();
const http = require('http');
const { connectDB } = require('./src/config/mongo');
const app = require('./src/app');
const socketService = require('./src/services/socket/socketService');
const notificationService = require('./src/services/notifications/notificationService');

const PORT = process.env.PORT || 3000;
const HOST = process.env.HOST || '0.0.0.0';

async function startServer() {
    await connectDB();

    const server = http.createServer(app);
    const io = socketService.init(server);
    notificationService.init(io);

    server.listen(PORT, HOST, () => {
        console.log(`RescueChain API server running on http://${HOST}:${PORT}`);
        console.log(`WebSocket (Socket.IO) enabled for real-time notifications`);
        console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
    });
}

startServer();

// Graceful shutdown
process.on('SIGTERM', () => {
    console.log('SIGTERM signal received: closing HTTP server');
    process.exit(0);
});

process.on('SIGINT', () => {
    console.log('SIGINT signal received: closing HTTP server');
    process.exit(0);
});
