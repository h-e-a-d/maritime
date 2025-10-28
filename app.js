// Maritime Ship Tracker Application
// Using AIS Stream WebSocket API and Leaflet.js

class ShipTracker {
    constructor() {
        this.websocket = null;
        this.ships = new Map();
        this.markers = new Map();
        this.map = null;
        this.isConnected = false;

        this.initMap();
        this.initEventListeners();
    }

    // Initialize Leaflet map
    initMap() {
        // Create map centered on Atlantic Ocean
        this.map = L.map('map').setView([20, -30], 3);

        // Add OpenStreetMap tile layer
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
            maxZoom: 19
        }).addTo(this.map);

        console.log('Map initialized');
    }

    // Initialize event listeners for UI controls
    initEventListeners() {
        document.getElementById('connect-btn').addEventListener('click', () => this.connect());
        document.getElementById('disconnect-btn').addEventListener('click', () => this.disconnect());
        document.getElementById('clear-btn').addEventListener('click', () => this.clearShips());
    }

    // Connect to AIS Stream WebSocket
    connect() {
        if (this.isConnected) {
            console.log('Already connected');
            return;
        }

        if (!CONFIG.API_KEY || CONFIG.API_KEY === 'YOUR_API_KEY_HERE') {
            alert('Please set your AIS Stream API key in config.js');
            return;
        }

        console.log('Connecting to AIS Stream...');
        this.updateStatus('Connecting...', false);

        try {
            this.websocket = new WebSocket('wss://stream.aisstream.io/v0/stream');

            this.websocket.onopen = () => {
                console.log('WebSocket connected');

                // Send subscription message
                const subscriptionMessage = {
                    APIKey: CONFIG.API_KEY,
                    BoundingBoxes: CONFIG.BOUNDING_BOXES,
                    FilterMessageTypes: ['PositionReport']
                };

                this.websocket.send(JSON.stringify(subscriptionMessage));
                console.log('Subscription message sent');

                this.isConnected = true;
                this.updateStatus('Connected', true);
                this.updateButtons(true);
            };

            this.websocket.onmessage = (event) => {
                this.handleMessage(event.data);
            };

            this.websocket.onerror = (error) => {
                console.error('WebSocket error:', error);
                this.updateStatus('Error', false);
            };

            this.websocket.onclose = () => {
                console.log('WebSocket disconnected');
                this.isConnected = false;
                this.updateStatus('Disconnected', false);
                this.updateButtons(false);
            };

        } catch (error) {
            console.error('Connection error:', error);
            alert('Failed to connect to AIS Stream: ' + error.message);
            this.updateStatus('Error', false);
        }
    }

    // Disconnect from WebSocket
    disconnect() {
        if (this.websocket) {
            this.websocket.close();
            this.websocket = null;
        }
    }

    // Handle incoming AIS messages
    handleMessage(data) {
        try {
            const message = JSON.parse(data);

            // Check if this is a position report
            if (message.MessageType === 'PositionReport') {
                this.updateShipPosition(message);
            }
        } catch (error) {
            console.error('Error parsing message:', error);
        }
    }

    // Update ship position on map
    updateShipPosition(message) {
        const metadata = message.MetaData;
        const positionReport = message.Message.PositionReport;

        if (!positionReport || !metadata) {
            return;
        }

        const mmsi = metadata.MMSI;
        const lat = positionReport.Latitude;
        const lon = positionReport.Longitude;

        // Validate coordinates
        if (!lat || !lon || Math.abs(lat) > 90 || Math.abs(lon) > 180) {
            return;
        }

        // Store ship data
        const shipData = {
            mmsi: mmsi,
            name: metadata.ShipName || 'Unknown',
            lat: lat,
            lon: lon,
            speed: positionReport.Sog || 0, // Speed over ground
            course: positionReport.Cog || 0, // Course over ground
            heading: positionReport.TrueHeading || 0,
            destination: metadata.Destination || 'Unknown',
            timestamp: metadata.time_utc,
            callSign: metadata.CallSign || 'N/A'
        };

        this.ships.set(mmsi, shipData);

        // Update or create marker
        if (this.markers.has(mmsi)) {
            // Update existing marker
            const marker = this.markers.get(mmsi);
            marker.setLatLng([lat, lon]);
        } else {
            // Create new marker
            const marker = L.circleMarker([lat, lon], {
                radius: 6,
                fillColor: '#2563eb',
                color: '#fff',
                weight: 2,
                opacity: 1,
                fillOpacity: 0.8
            }).addTo(this.map);

            // Add popup with ship info
            marker.bindPopup(this.createPopupContent(shipData));

            // Add click event to show info panel
            marker.on('click', () => {
                this.showShipInfo(shipData);
            });

            this.markers.set(mmsi, marker);
        }

        // Update ship count
        this.updateShipCount();
    }

    // Create popup content for ship marker
    createPopupContent(shipData) {
        return `
            <div style="min-width: 200px;">
                <h3 style="margin: 0 0 10px 0; color: #1f2937;">${shipData.name}</h3>
                <p style="margin: 5px 0;"><strong>MMSI:</strong> ${shipData.mmsi}</p>
                <p style="margin: 5px 0;"><strong>Speed:</strong> ${shipData.speed.toFixed(1)} knots</p>
                <p style="margin: 5px 0;"><strong>Course:</strong> ${shipData.course.toFixed(1)}°</p>
                <p style="margin: 5px 0;"><strong>Destination:</strong> ${shipData.destination}</p>
            </div>
        `;
    }

    // Show ship info in info panel
    showShipInfo(shipData) {
        const infoDiv = document.getElementById('ship-info');
        infoDiv.innerHTML = `
            <div class="ship-info-grid">
                <div class="ship-info-item">
                    <span class="ship-info-label">Ship Name</span>
                    <span class="ship-info-value">${shipData.name}</span>
                </div>
                <div class="ship-info-item">
                    <span class="ship-info-label">MMSI</span>
                    <span class="ship-info-value">${shipData.mmsi}</span>
                </div>
                <div class="ship-info-item">
                    <span class="ship-info-label">Call Sign</span>
                    <span class="ship-info-value">${shipData.callSign}</span>
                </div>
                <div class="ship-info-item">
                    <span class="ship-info-label">Speed</span>
                    <span class="ship-info-value">${shipData.speed.toFixed(1)} knots</span>
                </div>
                <div class="ship-info-item">
                    <span class="ship-info-label">Course</span>
                    <span class="ship-info-value">${shipData.course.toFixed(1)}°</span>
                </div>
                <div class="ship-info-item">
                    <span class="ship-info-label">Heading</span>
                    <span class="ship-info-value">${shipData.heading}°</span>
                </div>
                <div class="ship-info-item">
                    <span class="ship-info-label">Position</span>
                    <span class="ship-info-value">${shipData.lat.toFixed(4)}, ${shipData.lon.toFixed(4)}</span>
                </div>
                <div class="ship-info-item">
                    <span class="ship-info-label">Destination</span>
                    <span class="ship-info-value">${shipData.destination}</span>
                </div>
            </div>
        `;
    }

    // Clear all ships from map
    clearShips() {
        this.markers.forEach(marker => {
            this.map.removeLayer(marker);
        });
        this.markers.clear();
        this.ships.clear();
        this.updateShipCount();

        // Clear info panel
        document.getElementById('ship-info').innerHTML = '<p>Click on a ship marker to view details</p>';
    }

    // Update connection status display
    updateStatus(text, connected) {
        const statusBadge = document.getElementById('connection-status');
        statusBadge.textContent = text;
        statusBadge.className = `status-badge ${connected ? 'connected' : 'disconnected'}`;
    }

    // Update ship count display
    updateShipCount() {
        document.getElementById('ship-count').textContent = `Ships: ${this.ships.size}`;
    }

    // Update button states
    updateButtons(connected) {
        document.getElementById('connect-btn').disabled = connected;
        document.getElementById('disconnect-btn').disabled = !connected;
    }
}

// Initialize application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    console.log('Maritime Ship Tracker starting...');
    const tracker = new ShipTracker();
});
