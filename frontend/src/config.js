// Centralized API base URL for frontend
// Use environment variable if set, otherwise dynamically construct from current hostname
const getApiBaseUrl = () => {
  // If env var is set, use it
  if (process.env.REACT_APP_API_BASE_URL) {
    return process.env.REACT_APP_API_BASE_URL;
  }
  
  // Otherwise, construct URL using current window.location.hostname
  // This allows the app to work on localhost, IP addresses, and domains
  if (typeof window !== 'undefined' && window.location) {
    const hostname = window.location.hostname;
    const protocol = window.location.protocol;
    return `${protocol}//${hostname}:5000/api`;
  }
  
  // Fallback for build-time usage (e.g., SSR)
  return 'http://localhost:5000/api';
};

const API_BASE_URL = getApiBaseUrl();

// The uploads are served at /uploads from the backend root
// Derive uploads base by replacing trailing /api when present
const ROOT_BASE_URL = API_BASE_URL.replace(/\/api$/, '');
export const UPLOADS_BASE_URL = `${ROOT_BASE_URL}/uploads/fo`;
export default API_BASE_URL;
