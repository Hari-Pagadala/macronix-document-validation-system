const StaticMaps = require('staticmaps');

// Create a simple SVG circle marker as a Data URI
function createSvgMarker(color, label = '') {
  const svg = `<?xml version="1.0" encoding="UTF-8"?>
  <svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 100 100">
    <circle cx="50" cy="50" r="40" fill="${color}" opacity="0.9" stroke="white" stroke-width="2"/>
  </svg>`;
  return 'data:image/svg+xml;base64,' + Buffer.from(svg).toString('base64');
}

// GET /api/map/static?uploadedLat=&uploadedLng=&submittedLat=&submittedLng=&width=&height=&zoom=
async function getStaticMap(req, res) {
  try {
    const {
      uploadedLat,
      uploadedLng,
      submittedLat,
      submittedLng,
      width = 600,
      height = 400,
      zoom
    } = req.query;

    const nums = [uploadedLat, uploadedLng, submittedLat, submittedLng].map((v) => Number(v));
    if (nums.some((v) => !Number.isFinite(v))) {
      return res.status(400).json({ error: 'Invalid coordinates' });
    }
    const [uLat, uLng, sLat, sLng] = nums;

    const redIcon = createSvgMarker('#EF4444');
    const greenIcon = createSvgMarker('#22C55E');

    const geojson = {
      type: 'FeatureCollection',
      features: [
        {
          type: 'Feature',
          properties: {
            markerIconOptions: {
              iconUrl: redIcon,
              iconSize: [100, 100],
              iconAnchor: [50, 50]
            }
          },
          geometry: {
            type: 'Point',
            coordinates: [uLng, uLat]
          }
        },
        {
          type: 'Feature',
          properties: {
            markerIconOptions: {
              iconUrl: greenIcon,
              iconSize: [100, 100],
              iconAnchor: [50, 50]
            }
          },
          geometry: {
            type: 'Point',
            coordinates: [sLng, sLat]
          }
        }
      ]
    };

    const options = {
      width: Number(width),
      height: Number(height),
      tileUrl: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
      tileSubdomains: ['a', 'b', 'c']
    };
    const map = new StaticMaps(options);

    // Draw circles for uploaded and submitted locations with transparency
    const uploadedCircle = {
      coord: [uLng, uLat],
      radius: 300,
      fill: '#EF4444',
      opacity: 0.2,
      width: 2,
      color: '#ffffff'
    };
    const submittedCircle = {
      coord: [sLng, sLat],
      radius: 300,
      fill: '#22C55E',
      opacity: 0.2,
      width: 2,
      color: '#ffffff'
    };
    map.addCircle(uploadedCircle);
    map.addCircle(submittedCircle);

    // Auto-fit to both points unless an explicit zoom is provided
    if (zoom !== undefined) {
      await map.render([uLng, uLat], Number(zoom));
    } else {
      await map.render();
    }
    const buffer = await map.image.buffer('image/png');
    res.type('png');
    return res.send(buffer);
  } catch (err) {
    console.error('[Map] Static generation error:', err.message);
    return res.status(500).json({ error: 'Failed to generate static map', message: err.message });
  }
}

module.exports = { getStaticMap };
