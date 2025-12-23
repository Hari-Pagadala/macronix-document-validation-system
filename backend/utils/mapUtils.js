// Map utilities for generating static map URLs with colored markers

const toRad = (deg) => (deg * Math.PI) / 180;

// Compute distance between two GPS coordinates using Haversine formula
const computeDistanceMeters = (lat1, lng1, lat2, lng2) => {
  const nums = [lat1, lng1, lat2, lng2].map((v) => (v === null || v === undefined ? NaN : Number(v)));
  if (nums.some((v) => Number.isNaN(v))) return null;
  const [p1Lat, p1Lng, p2Lat, p2Lng] = nums;
  const R = 6371000;
  const dLat = toRad(p2Lat - p1Lat);
  const dLng = toRad(p2Lng - p1Lng);
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(p1Lat)) * Math.cos(toRad(p2Lat)) * Math.sin(dLng / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c);
};

/**
 * Build OpenStreetMap static map URL with simple colored markers
 * Uses OSM's built-in marker format with simple red/green colors
 * @param {number} uploadedLat - Uploaded location latitude
 * @param {number} uploadedLng - Uploaded location longitude
 * @param {number} submittedLat - Submitted location latitude
 * @param {number} submittedLng - Submitted location longitude
 * @param {number} width - Image width (default 600)
 * @param {number} height - Image height (default 400)
 * @param {number} zoom - Zoom level (default 15)
 * @returns {string|null} - OpenStreetMap static map URL or null if invalid coordinates
 */
function buildOpenStreetMapUrl(uploadedLat, uploadedLng, submittedLat, submittedLng, width = 600, height = 400, zoom = 15) {
  const nums = [uploadedLat, uploadedLng, submittedLat, submittedLng].map((v) => Number(v));
  if (nums.some((v) => !Number.isFinite(v))) return null;
  
  const [uLat, uLng, sLat, sLng] = nums;
  
  // Use OSM's simple marker format: lat,lng,marker-color with hex colors
  // Red (#EF4444) for uploaded, Green (#22C55E) for submitted
  // OSM format: markers=lat,lng,color-code|lat,lng,color-code
  const markers = `${uLat},${uLng},EF4444|${sLat},${sLng},22C55E`;
  
  return `https://staticmap.openstreetmap.de/staticmap.php?center=${uLat},${uLng}&zoom=${zoom}&size=${width}x${height}&markers=${markers}`;
}

module.exports = {
  buildOpenStreetMapUrl,
  computeDistanceMeters
};
