// AIS Stream Configuration
// Get your free API key at: https://aisstream.io/

const CONFIG = {
    // Your AIS Stream API Key
    // Sign up at https://aisstream.io/ to get a free API key
    API_KEY: 'f293f83853263b13e78e1503402e1c374f67beb7',

    // Bounding boxes define the geographic areas to receive ship data
    // Format: [[minLat, minLon], [maxLat, maxLon]]
    // Example configurations:

    // Global coverage (receives data from all ships worldwide)
    BOUNDING_BOXES: [[[-90, -180], [90, 180]]],

    // Atlantic Ocean only
    // BOUNDING_BOXES: [[[-60, -80], [70, 20]]],

    // Mediterranean Sea
    // BOUNDING_BOXES: [[[30, -6], [46, 37]]],

    // US East Coast
    // BOUNDING_BOXES: [[[24, -82], [45, -65]]],

    // English Channel
    // BOUNDING_BOXES: [[[49, -6], [51, 2]]],

    // You can define multiple bounding boxes
    // BOUNDING_BOXES: [
    //     [[30, -6], [46, 37]],    // Mediterranean
    //     [[49, -6], [51, 2]]      // English Channel
    // ],
};
