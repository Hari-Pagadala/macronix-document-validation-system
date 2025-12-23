// Haversine distance in meters between two lat/lng coordinate pairs
function toRad(deg) {
  return (deg * Math.PI) / 180;
}

function haversineDistanceMeters(lat1, lng1, lat2, lng2) {
  const a = [lat1, lng1, lat2, lng2].map((v) => (v === null || v === undefined ? null : Number(v)));
  if (a.some((v) => Number.isNaN(v))) {
    return null;
  }

  const [p1Lat, p1Lng, p2Lat, p2Lng] = a;
  const R = 6371000; // Earth radius in meters
  const dLat = toRad(p2Lat - p1Lat);
  const dLng = toRad(p2Lng - p1Lng);
  const radLat1 = toRad(p1Lat);
  const radLat2 = toRad(p2Lat);

  const h = Math.sin(dLat / 2) ** 2 + Math.cos(radLat1) * Math.cos(radLat2) * Math.sin(dLng / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
  return Math.round(R * c);
}

module.exports = {
  haversineDistanceMeters
};
