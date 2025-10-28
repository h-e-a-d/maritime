# Maritime Ship Tracker

A real-time ship tracking web application using the AIS Stream API and Leaflet.js for map visualization.

## Features

- Real-time ship position tracking using AIS (Automatic Identification System) data
- Interactive map with ship markers
- Ship information display (name, MMSI, speed, course, destination)
- Customizable geographic bounding boxes
- Clean and responsive UI

## Prerequisites

- A modern web browser (Chrome, Firefox, Safari, or Edge)
- AIS Stream API key (free tier available)

## Getting Started

### 1. Get Your API Key

1. Visit [https://aisstream.io/](https://aisstream.io/)
2. Sign up for a free account
3. Copy your API key from the dashboard

### 2. Configure the Application

1. Open `config.js` in a text editor
2. Replace `YOUR_API_KEY_HERE` with your actual API key:

```javascript
API_KEY: 'your-actual-api-key-here',
```

3. (Optional) Customize the bounding boxes to focus on specific regions:

```javascript
// Example: Track ships in the Mediterranean Sea
BOUNDING_BOXES: [[[30, -6], [46, 37]]],
```

### 3. Run the Application

You need to serve the files through a web server (not just opening the HTML file directly).

#### Option A: Using Python (Recommended)

If you have Python installed:

```bash
# Python 3
python -m http.server 8000

# Python 2
python -m SimpleHTTPServer 8000
```

Then open your browser to: `http://localhost:8000`

#### Option B: Using Node.js

If you have Node.js installed, you can use `http-server`:

```bash
# Install http-server globally (once)
npm install -g http-server

# Run the server
http-server -p 8000
```

Then open your browser to: `http://localhost:8000`

#### Option C: Using VS Code

If you use VS Code, install the "Live Server" extension and click "Go Live" at the bottom right.

### 4. Use the Application

1. Click the "Connect to AIS Stream" button
2. Wait for ships to appear on the map (this may take a few moments depending on your bounding box)
3. Click on any ship marker to view detailed information
4. Use the "Clear Ships" button to remove all markers and start fresh
5. Use the "Disconnect" button to stop receiving data

## Configuration Options

### Bounding Boxes

The `BOUNDING_BOXES` configuration defines which geographic areas you want to receive ship data from. Format: `[[[minLat, minLon], [maxLat, maxLon]]]`

**Predefined Regions:**

```javascript
// Global coverage
BOUNDING_BOXES: [[[-90, -180], [90, 180]]],

// Atlantic Ocean
BOUNDING_BOXES: [[[-60, -80], [70, 20]]],

// Mediterranean Sea
BOUNDING_BOXES: [[[30, -6], [46, 37]]],

// US East Coast
BOUNDING_BOXES: [[[24, -82], [45, -65]]],

// Multiple regions
BOUNDING_BOXES: [
    [[30, -6], [46, 37]],    // Mediterranean
    [[49, -6], [51, 2]]      // English Channel
],
```

## Ship Information

The application displays the following information for each ship:

- **Ship Name**: The vessel's name
- **MMSI**: Maritime Mobile Service Identity (unique identifier)
- **Call Sign**: Radio call sign
- **Speed**: Speed over ground in knots
- **Course**: Course over ground in degrees
- **Heading**: True heading in degrees
- **Position**: Latitude and longitude coordinates
- **Destination**: Reported destination port

## Technology Stack

- **AIS Stream API**: Real-time maritime data via WebSocket
- **Leaflet.js**: Interactive map visualization
- **OpenStreetMap**: Map tiles
- **Vanilla JavaScript**: No framework dependencies

## Troubleshooting

### "Please set your AIS Stream API key" alert

Make sure you've replaced `YOUR_API_KEY_HERE` in `config.js` with your actual API key from aisstream.io.

### No ships appearing

- Check your browser console for errors (F12)
- Verify your API key is correct
- Try a larger bounding box (e.g., global coverage)
- Wait a few minutes as ship data may be sparse in some regions
- Ensure you have a stable internet connection

### WebSocket connection fails

- Check that you're serving the files through a web server (not file://)
- Verify your firewall allows WebSocket connections
- Check the browser console for specific error messages

## API Rate Limits

The free tier of AIS Stream has the following limits:
- Limited number of API calls per month
- Check [https://aisstream.io/](https://aisstream.io/) for current pricing and limits

## License

This project is open source and available for educational and personal use.

## Resources

- [AIS Stream Documentation](https://aisstream.io/documentation)
- [Leaflet.js Documentation](https://leafletjs.com/)
- [AIS Message Types](https://www.navcen.uscg.gov/?pageName=AISMessages)

## Contributing

Feel free to submit issues, fork the repository, and create pull requests for any improvements.
