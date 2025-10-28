// Backend WebSocket Proxy Server for AIS Stream
// This server connects to AIS Stream and forwards data to browser clients

const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const path = require('path');

// Configuration
const AIS_STREAM_URL = 'wss://stream.aisstream.io/v0/stream';
const API_KEY = process.env.AIS_API_KEY || 'f293f83853263b13e78e1503402e1c374f67beb7';
const PORT = process.env.PORT || 3000;

// Create Express app
const app = express();
const server = http.createServer(app);

// Serve static files (frontend)
app.use(express.static(path.join(__dirname)));

// Create WebSocket server for browser clients
const wss = new WebSocket.Server({ server });

// Store active connections
const clients = new Set();
let aisStreamSocket = null;
let reconnectTimeout = null;
let isConnecting = false;

// Connect to AIS Stream
function connectToAISStream() {
    if (isConnecting || (aisStreamSocket && aisStreamSocket.readyState === WebSocket.OPEN)) {
        console.log('Already connected or connecting to AIS Stream');
        return;
    }

    isConnecting = true;
    console.log('Connecting to AIS Stream...');

    try {
        aisStreamSocket = new WebSocket(AIS_STREAM_URL);

        aisStreamSocket.on('open', () => {
            console.log('Connected to AIS Stream');
            isConnecting = false;

            // Send subscription message with global coverage
            const subscriptionMessage = {
                APIKey: API_KEY,
                BoundingBoxes: [[[-90, -180], [90, 180]]],
                FilterMessageTypes: ['PositionReport']
            };

            aisStreamSocket.send(JSON.stringify(subscriptionMessage));
            console.log('Subscription message sent to AIS Stream');

            // Notify all connected clients
            broadcastToClients({
                type: 'status',
                message: 'connected',
                timestamp: new Date().toISOString()
            });
        });

        aisStreamSocket.on('message', (data) => {
            // Forward AIS data to all connected browser clients
            const messageStr = data.toString();
            broadcastToClients({
                type: 'ais_data',
                data: JSON.parse(messageStr)
            });
        });

        aisStreamSocket.on('error', (error) => {
            console.error('AIS Stream WebSocket error:', error.message);
            isConnecting = false;

            broadcastToClients({
                type: 'status',
                message: 'error',
                error: error.message,
                timestamp: new Date().toISOString()
            });
        });

        aisStreamSocket.on('close', () => {
            console.log('Disconnected from AIS Stream');
            isConnecting = false;
            aisStreamSocket = null;

            broadcastToClients({
                type: 'status',
                message: 'disconnected',
                timestamp: new Date().toISOString()
            });

            // Attempt to reconnect if there are active clients
            if (clients.size > 0) {
                console.log('Attempting to reconnect in 5 seconds...');
                reconnectTimeout = setTimeout(connectToAISStream, 5000);
            }
        });

    } catch (error) {
        console.error('Error creating AIS Stream connection:', error);
        isConnecting = false;
    }
}

// Broadcast message to all connected clients
function broadcastToClients(message) {
    const messageStr = JSON.stringify(message);
    clients.forEach(client => {
        if (client.readyState === WebSocket.OPEN) {
            client.send(messageStr);
        }
    });
}

// Handle browser client connections
wss.on('connection', (ws) => {
    console.log('New client connected. Total clients:', clients.size + 1);
    clients.add(ws);

    // Send welcome message
    ws.send(JSON.stringify({
        type: 'status',
        message: 'connected_to_proxy',
        timestamp: new Date().toISOString()
    }));

    // Connect to AIS Stream if not already connected
    if (clients.size === 1) {
        connectToAISStream();
    } else if (aisStreamSocket && aisStreamSocket.readyState === WebSocket.OPEN) {
        // If already connected, notify the new client
        ws.send(JSON.stringify({
            type: 'status',
            message: 'connected',
            timestamp: new Date().toISOString()
        }));
    }

    // Handle messages from browser clients
    ws.on('message', (message) => {
        try {
            const data = JSON.parse(message.toString());

            // Handle subscription updates
            if (data.type === 'subscribe' && data.subscription) {
                if (aisStreamSocket && aisStreamSocket.readyState === WebSocket.OPEN) {
                    // Add API key to subscription
                    const subscription = {
                        ...data.subscription,
                        APIKey: API_KEY
                    };
                    aisStreamSocket.send(JSON.stringify(subscription));
                    console.log('Updated subscription sent to AIS Stream');
                }
            }
        } catch (error) {
            console.error('Error parsing client message:', error);
        }
    });

    // Handle client disconnection
    ws.on('close', () => {
        clients.delete(ws);
        console.log('Client disconnected. Remaining clients:', clients.size);

        // Disconnect from AIS Stream if no clients
        if (clients.size === 0) {
            if (reconnectTimeout) {
                clearTimeout(reconnectTimeout);
                reconnectTimeout = null;
            }
            if (aisStreamSocket) {
                console.log('No clients remaining, disconnecting from AIS Stream');
                aisStreamSocket.close();
                aisStreamSocket = null;
            }
        }
    });

    ws.on('error', (error) => {
        console.error('Client WebSocket error:', error);
    });
});

// Health check endpoint for Railway
app.get('/health', (req, res) => {
    res.json({
        status: 'ok',
        clients: clients.size,
        aisStreamConnected: aisStreamSocket && aisStreamSocket.readyState === WebSocket.OPEN,
        timestamp: new Date().toISOString()
    });
});

// API endpoint to get server status
app.get('/api/status', (req, res) => {
    res.json({
        server: 'running',
        connectedClients: clients.size,
        aisStreamStatus: aisStreamSocket ?
            (aisStreamSocket.readyState === WebSocket.OPEN ? 'connected' : 'disconnected')
            : 'disconnected',
        timestamp: new Date().toISOString()
    });
});

// Start server
server.listen(PORT, () => {
    console.log(`
========================================
Maritime Ship Tracker Server
========================================
Server running on port ${PORT}
Frontend: http://localhost:${PORT}
Health check: http://localhost:${PORT}/health
Status API: http://localhost:${PORT}/api/status
========================================
    `);
});

// Graceful shutdown
process.on('SIGTERM', () => {
    console.log('SIGTERM received, closing server...');

    // Close all client connections
    clients.forEach(client => client.close());

    // Close AIS Stream connection
    if (aisStreamSocket) {
        aisStreamSocket.close();
    }

    // Close server
    server.close(() => {
        console.log('Server closed');
        process.exit(0);
    });
});
