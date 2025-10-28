# Maritime Ship Tracker

A real-time ship tracking web application using the AIS Stream API and Leaflet.js for map visualization. Built with Node.js backend proxy for secure API key handling and CORS compliance.

## Features

- Real-time ship position tracking using AIS (Automatic Identification System) data
- Interactive map with ship markers
- Ship information display (name, MMSI, speed, course, destination)
- Customizable geographic bounding boxes
- Clean and responsive UI
- Secure backend proxy server
- Ready for Railway.app deployment

## Architecture

- **Frontend**: HTML, CSS, JavaScript with Leaflet.js
- **Backend**: Node.js + Express + WebSocket proxy
- **Data Source**: AIS Stream API via WebSocket

## Prerequisites

- Node.js 18.x or higher
- AIS Stream API key (free tier available from https://aisstream.io/)

## Getting Started

### 1. Get Your API Key

1. Visit [https://aisstream.io/](https://aisstream.io/)
2. Sign up for a free account
3. Go to API Keys page and generate a new API key
4. Copy your API key

### 2. Deploy to Railway.app (Recommended)

#### Quick Deploy

1. **Connect Repository to Railway**
   - Go to [Railway.app](https://railway.app/)
   - Click "New Project"
   - Select "Deploy from GitHub repo"
   - Choose your `maritime` repository

2. **Configure Environment Variables**
   - In Railway dashboard, go to your project
   - Click on "Variables" tab
   - Add required variable:
     - Name: `AIS_API_KEY`
     - Value: `your-api-key-here`
   - (Optional) Add MMSI filtering variables:
     - Name: `MMSI_MIN`
     - Value: `247187700` (example: Portuguese vessels start)
     - Name: `MMSI_MAX`
     - Value: `247435300` (example: Portuguese vessels end)
   - Click "Add"

3. **Deploy**
   - Railway will automatically deploy your application
   - Once deployed, click on the URL to access your app
   - Example: `https://maritime-production.up.railway.app`

4. **Use the Application**
   - Open the Railway URL in your browser
   - Click "Connect to AIS Stream"
   - Ships will start appearing on the map in 10-30 seconds

### 3. Run Locally (Development)

#### Install Dependencies

```bash
npm install
```

#### Configure API Key

Create a `.env` file in the project root:

```bash
AIS_API_KEY=your-api-key-here
PORT=3000
```

Or set environment variables directly:

```bash
export AIS_API_KEY=your-api-key-here
```

#### Start the Server

```bash
npm start
```

The server will start on `http://localhost:3000`

#### Use the Application

1. Open `http://localhost:3000` in your browser
2. Click "Connect to AIS Stream" button
3. Wait for ships to appear on the map (10-30 seconds)
4. Click on any ship marker to view detailed information
5. Use the "Clear Ships" button to remove all markers
6. Use the "Disconnect" button to stop receiving data

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

### MMSI Range Filtering (Backend)

The backend server supports filtering ships by MMSI range. This is useful for tracking specific fleets or vessels from a particular country.

**How it works:**
- Configured via environment variables `MMSI_MIN` and `MMSI_MAX`
- Filtering happens on the backend before data is sent to clients
- Reduces bandwidth and improves performance
- If not configured, all ships are forwarded (no filtering)

**Common MMSI Ranges by Country (MID codes):**
- **201-xxx-xxx**: Albania
- **247-xxx-xxx**: Portugal
- **255-xxx-xxx**: Portugal (Madeira)
- **304-xxx-xxx**: Anguilla
- **338-xxx-xxx**: USA
- **636-xxx-xxx**: Liberia

**Example: Track Portuguese vessels**
```bash
MMSI_MIN=247000000
MMSI_MAX=247999999
```

**Example: Track specific ship range**
```bash
MMSI_MIN=247187700
MMSI_MAX=247435300
```

**Railway Configuration:**
1. Go to Railway dashboard → Variables
2. Add `MMSI_MIN` with your minimum MMSI value
3. Add `MMSI_MAX` with your maximum MMSI value
4. Redeploy (automatic)

**Statistics:**
Check filtering statistics at `/api/status` endpoint:
- Total messages received
- Total messages filtered
- Total messages forwarded
- Filter rate percentage

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

### No ships appearing

- **Wait longer**: Ships can take 30-60 seconds to start appearing
- **Check console**: Open browser console (F12) and look for connection status messages
- **Verify API key**: Ensure the `AIS_API_KEY` environment variable is set correctly in Railway
- **Check backend logs**: In Railway dashboard, check the deployment logs for errors
- **Try larger bounding box**: The default is global coverage `[[[-90, -180], [90, 180]]]`
- **Sparse regions**: Some geographic areas have less ship traffic

### WebSocket connection fails

- **Railway deployment**: Ensure the app is fully deployed and running
- **Environment variables**: Verify `AIS_API_KEY` is set in Railway variables
- **Backend logs**: Check Railway logs for WebSocket connection errors
- **Firewall**: Verify your network allows WebSocket connections
- **API key validity**: Check your API key is active at https://aisstream.io/apikeys

### Local development issues

- **Port already in use**: Change `PORT` in `.env` file
- **Dependencies not installed**: Run `npm install`
- **API key not set**: Create `.env` file with `AIS_API_KEY`

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
