const axios = require('axios');

// Geocoding helper using OpenStreetMap Nominatim with fallbacks
// Returns { lat, lng } or { lat: null, lng: null } on failure.
async function geocodeAddress({ address, district, state, pincode }) {
  const norm = (s) => (s || '').toString().trim();
  const addr = norm(address);
  const dist = norm(district);
  const st = norm(state);
  const pin = norm(pincode);

  const candidates = [];
  // Most specific → least specific
  if (addr || dist || st || pin) {
    const parts = [addr, dist, st, pin, 'India'].filter(Boolean).join(', ');
    candidates.push(parts);
  }
  if (addr || dist || st) candidates.push([addr, dist, st, 'India'].filter(Boolean).join(', '));
  if (dist || st || pin) candidates.push([dist, st, pin, 'India'].filter(Boolean).join(', '));
  if (pin) candidates.push([pin, 'India'].join(', '));
  if (dist || st) candidates.push([dist, st, 'India'].filter(Boolean).join(', '));
  if (st) candidates.push([st, 'India'].join(', '));

  const queryList = [...new Set(candidates)].filter(Boolean);
  if (queryList.length === 0) {
    console.log('[Geocode] No address components provided');
    return { lat: null, lng: null, error: 'No address components provided' };
  }

  const fetchQ = async (q) => {
    try {
      const response = await axios.get('https://nominatim.openstreetmap.org/search', {
        params: {
          q,
          format: 'json',
          addressdetails: 0,
          limit: 1
        },
        headers: {
          'User-Agent': 'macronix-document-validation-system/1.0 (backend)'
        },
        timeout: 10000
      });
      const result = Array.isArray(response.data) ? response.data[0] : null;
      if (!result || !result.lat || !result.lon) return null;
      return result;
    } catch (e) {
      console.warn('[Geocode] Request failed for', q, e.message);
      return null;
    }
  };

  console.log('[Geocode] Query sequence:', queryList);
  for (const q of queryList) {
    const r = await fetchQ(q);
    if (r) {
      const lat = parseFloat(r.lat);
      const lng = parseFloat(r.lon);
      console.log('[Geocode] Success:', { q, lat, lng, display_name: r.display_name });
      return { lat, lng, error: null };
    }
  }

  console.log('[Geocode] No results found for any query');
  return { lat: null, lng: null, error: 'No geocoding result' };
}

module.exports = { geocodeAddress };
