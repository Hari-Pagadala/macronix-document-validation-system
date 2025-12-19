import * as Location from 'expo-location';
import Constants from 'expo-constants';
import * as FileSystem from 'expo-file-system/legacy';

const expoExtra = Constants.expoConfig?.extra || Constants.manifest?.extra || {};
const MAP_PROVIDER = expoExtra.EXPO_PUBLIC_STATIC_MAP_PROVIDER || '';
const MAPBOX_TOKEN = expoExtra.EXPO_PUBLIC_MAPBOX_TOKEN || '';
const GOOGLE_MAPS_KEY = expoExtra.EXPO_PUBLIC_GOOGLE_MAPS_KEY || '';

export async function getFastLocation() {
  let loc = null;
  try {
    loc = await Location.getLastKnownPositionAsync();
    if (!loc) {
      loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Low });
    }
  } catch (e) {
    // ignore and return null
  }
  return loc;
}

export async function reverseGeocodeSingleLine(lat, lng) {
  try {
    const res = await Location.reverseGeocodeAsync({ latitude: Number(lat), longitude: Number(lng) });
    if (Array.isArray(res) && res.length) {
      const r = res[0];
      const parts = [r.name, r.street, r.subregion, r.city || r.district, r.region, r.postalCode, r.country]
        .filter(Boolean)
        .map((s) => s.toString().trim());
      const uniq = Array.from(new Set(parts));
      return uniq.join(', ');
    }
  } catch (e) {
    // ignore
  }
  return '';
}

export function buildStaticMapUrl(lat, lng, opts = {}) {
  const { zoom = 16, width = 600, height = 400 } = opts;
  const latStr = encodeURIComponent(lat);
  const lngStr = encodeURIComponent(lng);
  const effectiveProvider = MAP_PROVIDER || (GOOGLE_MAPS_KEY ? 'google' : (MAPBOX_TOKEN ? 'mapbox' : 'osm'));

  if (effectiveProvider === 'mapbox' && MAPBOX_TOKEN) {
    // Mapbox Static Images API
    // style: streets-v11; marker pin-s
    return `https://api.mapbox.com/styles/v1/mapbox/streets-v11/static/pin-s+ff0000(${lngStr},${latStr})/${lngStr},${latStr},${zoom}/${width}x${height}@2x?access_token=${MAPBOX_TOKEN}`;
  }

  if (effectiveProvider === 'google' && GOOGLE_MAPS_KEY) {
    // Google Static Maps API
    return `https://maps.googleapis.com/maps/api/staticmap?center=${latStr},${lngStr}&zoom=${zoom}&size=${width}x${height}&markers=color:red%7C${latStr},${lngStr}&key=${GOOGLE_MAPS_KEY}`;
  }

  // Fallback to OSM demo static map (usage limits apply)
  return `https://staticmap.openstreetmap.de/staticmap.php?center=${latStr},${lngStr}&zoom=${zoom}&size=${width}x${height}&markers=${latStr},${lngStr},red-pushpin`;
}

export async function getStaticMapImage(lat, lng, opts = {}) {
  const url = buildStaticMapUrl(lat, lng, opts);
  const fileName = `static_map_${lat}_${lng}_${Date.now()}.png`;
  const filePath = `${FileSystem.cacheDirectory}${fileName}`;
  try {
    await FileSystem.downloadAsync(url, filePath);
    return filePath;
  } catch (e) {
    return '';
  }
}

export default {
  getFastLocation,
  reverseGeocodeSingleLine,
  buildStaticMapUrl,
  getStaticMapImage,
};
