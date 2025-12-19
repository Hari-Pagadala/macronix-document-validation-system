// Centralized API base URL for frontend
// Prefer environment variable; fall back to backend default on port 5000
const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000/api';

// The uploads are served at /uploads from the backend root
// Derive uploads base by replacing trailing /api when present
const ROOT_BASE_URL = API_BASE_URL.replace(/\/api$/, '');
export const UPLOADS_BASE_URL = `${ROOT_BASE_URL}/uploads/fo`;
export default API_BASE_URL;
