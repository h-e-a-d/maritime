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

        // Search functionality
        document.getElementById('search-btn').addEventListener('click', () => this.searchShips());
        document.getElementById('clear-search-btn').addEventListener('click', () => this.clearSearch());
        document.getElementById('search-input').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.searchShips();
            }
        });
        document.getElementById('close-results').addEventListener('click', () => this.hideSearchResults());
    }

    // Connect to Backend Proxy WebSocket
    connect() {
        if (this.isConnected) {
            console.log('Already connected');
            return;
        }

        console.log('Connecting to backend proxy...');
        this.updateStatus('Connecting...', false);

        try {
            // Determine WebSocket URL based on environment
            const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
            const wsUrl = `${protocol}//${window.location.host}`;

            console.log('Connecting to:', wsUrl);
            this.websocket = new WebSocket(wsUrl);

            this.websocket.onopen = () => {
                console.log('Connected to backend proxy');
                this.updateStatus('Connecting to AIS Stream...', false);

                // Optionally send subscription preferences to backend
                const subscriptionMessage = {
                    type: 'subscribe',
                    subscription: {
                        BoundingBoxes: CONFIG.BOUNDING_BOXES,
                        FilterMessageTypes: ['PositionReport']
                    }
                };

                this.websocket.send(JSON.stringify(subscriptionMessage));
                console.log('Subscription preferences sent to backend');
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
            alert('Failed to connect to backend: ' + error.message);
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

    // Handle incoming messages from backend proxy
    handleMessage(data) {
        try {
            const message = JSON.parse(data);

            // Handle different message types from proxy
            if (message.type === 'status') {
                // Handle status updates from proxy
                if (message.message === 'connected') {
                    console.log('Backend connected to AIS Stream');
                    this.isConnected = true;
                    this.updateStatus('Connected', true);
                    this.updateButtons(true);
                } else if (message.message === 'disconnected') {
                    console.log('Backend disconnected from AIS Stream');
                    this.isConnected = false;
                    this.updateStatus('Disconnected', false);
                    this.updateButtons(false);
                } else if (message.message === 'connected_to_proxy') {
                    console.log('Connected to proxy, waiting for AIS Stream connection...');
                    this.updateStatus('Connecting...', false);
                } else if (message.message === 'error') {
                    console.error('Backend error:', message.error);
                    this.updateStatus('Error', false);
                }
            } else if (message.type === 'ais_data') {
                // Handle AIS data forwarded from proxy
                const aisMessage = message.data;

                // Check if this is a position report
                if (aisMessage.MessageType === 'PositionReport') {
                    this.updateShipPosition(aisMessage);
                }
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

    // Search ships by name, MMSI, or call sign
    searchShips() {
        const searchInput = document.getElementById('search-input');
        const query = searchInput.value.trim().toLowerCase();

        if (!query) {
            alert('Please enter a search term (ship name, MMSI, or call sign)');
            return;
        }

        if (this.ships.size === 0) {
            alert('No ships loaded yet. Please wait for ships to appear on the map.');
            return;
        }

        // Search through all ships
        const results = [];
        this.ships.forEach((shipData, mmsi) => {
            const name = (shipData.name || '').toLowerCase();
            const mmsiStr = (shipData.mmsi || '').toString().toLowerCase();
            const callSign = (shipData.callSign || '').toLowerCase();

            if (name.includes(query) || mmsiStr.includes(query) || callSign.includes(query)) {
                results.push({
                    ...shipData,
                    matchField: name.includes(query) ? 'name' :
                               mmsiStr.includes(query) ? 'mmsi' : 'callSign'
                });
            }
        });

        this.displaySearchResults(results, query);
    }

    // Display search results
    displaySearchResults(results, query) {
        const resultsPanel = document.getElementById('search-results');
        const resultsList = document.getElementById('search-results-list');
        const resultsCount = document.getElementById('search-results-count');

        if (results.length === 0) {
            resultsCount.textContent = 'No results found';
            resultsList.innerHTML = '<div style="padding: 1rem; text-align: center; color: #6b7280;">No ships found matching your search.</div>';
            resultsPanel.style.display = 'block';
            return;
        }

        resultsCount.textContent = `${results.length} result${results.length !== 1 ? 's' : ''} found`;

        // Create result items
        resultsList.innerHTML = '';
        results.forEach(ship => {
            const resultItem = document.createElement('div');
            resultItem.className = 'search-result-item';

            // Highlight the matched field
            const nameDisplay = this.highlightMatch(ship.name, query, ship.matchField === 'name');
            const mmsiDisplay = this.highlightMatch(ship.mmsi.toString(), query, ship.matchField === 'mmsi');
            const callSignDisplay = this.highlightMatch(ship.callSign, query, ship.matchField === 'callSign');

            resultItem.innerHTML = `
                <div class="search-result-name">${nameDisplay}</div>
                <div class="search-result-details">
                    MMSI: ${mmsiDisplay} | Call Sign: ${callSignDisplay} |
                    Speed: ${ship.speed.toFixed(1)} knots |
                    Position: ${ship.lat.toFixed(2)}, ${ship.lon.toFixed(2)}
                </div>
            `;

            resultItem.addEventListener('click', () => {
                this.selectShip(ship);
            });

            resultsList.appendChild(resultItem);
        });

        resultsPanel.style.display = 'block';
    }

    // Highlight matching text
    highlightMatch(text, query, isMatch) {
        if (!isMatch) return text;

        const regex = new RegExp(`(${query})`, 'gi');
        return text.replace(regex, '<span class="search-result-highlight">$1</span>');
    }

    // Select and focus on a ship
    selectShip(shipData) {
        // Zoom to ship location
        this.map.setView([shipData.lat, shipData.lon], 10, {
            animate: true,
            duration: 1
        });

        // Get the marker and make it pulse
        const marker = this.markers.get(shipData.mmsi);
        if (marker) {
            // Remove previous highlights
            this.markers.forEach(m => {
                const element = m.getElement();
                if (element) {
                    element.classList.remove('ship-marker-highlighted');
                }
            });

            // Highlight this marker
            const element = marker.getElement();
            if (element) {
                element.classList.add('ship-marker-highlighted');

                // Remove highlight after 5 seconds
                setTimeout(() => {
                    element.classList.remove('ship-marker-highlighted');
                }, 5000);
            }

            // Open popup
            marker.openPopup();
        }

        // Show ship info in panel
        this.showShipInfo(shipData);

        // Close search results
        this.hideSearchResults();
    }

    // Clear search
    clearSearch() {
        document.getElementById('search-input').value = '';
        this.hideSearchResults();

        // Remove all highlights
        this.markers.forEach(marker => {
            const element = marker.getElement();
            if (element) {
                element.classList.remove('ship-marker-highlighted');
            }
        });
    }

    // Hide search results panel
    hideSearchResults() {
        document.getElementById('search-results').style.display = 'none';
    }
}

// Initialize application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    console.log('Maritime Ship Tracker starting...');
    const tracker = new ShipTracker();
});
