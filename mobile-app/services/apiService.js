import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import * as FileSystem from 'expo-file-system/legacy';

// Resolve API base URL in this order:
// 1. Expo config extra `EXPO_PUBLIC_API_BASE_URL`
// 2. process.env.EXPO_PUBLIC_API_BASE_URL (when available)
// 3. sensible defaults for common runtimes
const expoExtra = Constants.expoConfig?.extra || Constants.manifest?.extra || {};
const envBase = expoExtra.EXPO_PUBLIC_API_BASE_URL || process.env?.EXPO_PUBLIC_API_BASE_URL;

// Defaults:
// - For Android emulator: 10.0.2.2
// - For iOS simulator / web: localhost
// - For physical device: developer should set EXPO_PUBLIC_API_BASE_URL to machine IP
let API_BASE_URL = envBase || 'http://localhost:5000/api';
if (!envBase) {
  if (Platform.OS === 'android') {
    // Android emulator uses 10.0.2.2 to reach host localhost
    API_BASE_URL = 'http://10.0.2.2:5000/api';
  } else if (Platform.OS === 'web') {
    API_BASE_URL = 'http://localhost:5000/api';
  }
}

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
});

// Add token to all requests
api.interceptors.request.use(
  async (config) => {
    try {
      const token = await AsyncStorage.getItem('fieldOfficerToken');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      // For FormData, delete Content-Type to let axios auto-detect with boundary
      if (config.data instanceof FormData) {
        console.log('[Interceptor] FormData detected, removing Content-Type');
        delete config.headers['Content-Type'];
        config.transformRequest = [(data) => data]; // Prevent transformation
      }
    } catch (err) {
      console.error('Error retrieving token:', err);
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Handle response errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      AsyncStorage.removeItem('fieldOfficerToken');
    }
    return Promise.reject(error);
  }
);

export const authService = {
  login: (email, password) =>
    api.post('/fo-portal/login', { email, password }),
};

export const caseService = {
  getCases: (status = '', search = '', page = 1, limit = 10) =>
    api.get('/fo-portal/cases', {
      params: { foId: 'self', status, search, page, limit },
    }),
  getCaseDetails: (caseId) =>
    api.get(`/records/${caseId}`),
  getVerification: (caseId) =>
    api.get(`/records/${caseId}/verification`).catch((error) => {
      // 404 means verification doesn't exist yet (case is assigned, not submitted)
      if (error.response?.status === 404) {
        return { data: { success: false, verification: null } };
      }
      throw error;
    }),
};

export const verificationService = {
  submitVerification: async (caseId, formData) => {
    // Convert FormData to JSON with base64 encoded files
    const token = await AsyncStorage.getItem('fieldOfficerToken');
    const url = `${API_BASE_URL}/fo-portal/cases/${caseId}/submit`;
    
    console.log('=== CONVERTING FORMDATA TO JSON ===');
    console.log('URL:', url);
    
    try {
      // Build submission object from FormData
      const submission = {};
      const files = {};
      
      // Parse FormData entries
      for (const [key, value] of formData.entries()) {
        console.log(`Processing field: ${key}`);
        
        // Check if it's a file (has uri property)
        if (value && typeof value === 'object' && value.uri) {
          console.log(`File field: ${key}, uri: ${value.uri}`);
          // Read file as base64
          try {
            const fileContent = await FileSystem.readAsStringAsync(value.uri, { encoding: 'base64' });
            const fileObj = {
              name: value.name || key,
              type: value.type || 'image/jpeg',
              data: fileContent,
            };
            // Support arrays for repeating keys like documents and photos
            if (key === 'documents' || key === 'photos') {
              if (!Array.isArray(files[key])) files[key] = [];
              files[key].push(fileObj);
            } else {
              files[key] = fileObj;
            }
            console.log(`Converted file ${key} to base64 (${fileContent.length} chars)`);
          } catch (fileErr) {
            console.error(`Failed to read file ${key}:`, fileErr.message);
            throw new Error(`Failed to read ${key}: ${fileErr.message}`);
          }
        } else if (Array.isArray(value)) {
          // Array field
          submission[key] = value;
        } else {
          // Regular field
          submission[key] = value;
        }
      }
      
      // Combine submission data with files
      const requestBody = {
        ...submission,
        files: files,
      };
      
      console.log('[JSON] Sending submission as JSON...');
      console.log('[JSON] Files included:', Object.keys(files).join(', '));
      
      const res = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(requestBody),
      });
      
      console.log('[JSON] Response status:', res.status);
      
      let data;
      try {
        data = await res.json();
        console.log('[JSON] Response data:', data);
      } catch (e) {
        console.error('[JSON] JSON parse error:', e);
        data = { success: false, message: 'Invalid JSON response' };
      }
      
      if (!res.ok) {
        const err = new Error(data.message || `HTTP ${res.status}`);
        err.response = { status: res.status, data };
        throw err;
      }
      
      return { data };
    } catch (error) {
      console.error('[JSON] Submission error:', error.message);
      throw error;
    }
  },
  submitVerificationFetch: async (caseId, formData) => {
    const token = await AsyncStorage.getItem('fieldOfficerToken');
    const url = `${API_BASE_URL}/fo-portal/cases/${caseId}/submit`;
    
    console.log('=== NETWORK REQUEST ===');
    console.log('URL:', url);
    console.log('API_BASE_URL:', API_BASE_URL);
    console.log('Has token:', !!token);
    
    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
          // Do NOT set Content-Type for FormData; let fetch add correct boundary
        },
        body: formData,
      });
      
      console.log('Response status:', res.status);
      console.log('Response ok:', res.ok);
      
      let data;
      try {
        data = await res.json();
        console.log('Response data:', data);
      } catch (e) {
        console.error('JSON parse error:', e);
        data = { success: false, message: 'Invalid JSON response' };
      }
      if (!res.ok) {
        const err = new Error(data.message || `HTTP ${res.status}`);
        err.response = { status: res.status, data };
        throw err;
      }
      return { data };
    } catch (error) {
      console.error('Fetch error details:', {
        name: error.name,
        message: error.message,
        stack: error.stack
      });
      throw error;
    }
  },
  
  // Test endpoint to verify POST requests work
  testPost: async () => {
    const url = `${API_BASE_URL}/test-post`;
    console.log('[Test] Sending test POST to:', url);
    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ test: 'data', timestamp: new Date().toISOString() }),
      });
      const data = await res.json();
      console.log('[Test] Response:', data);
      return { success: true, data };
    } catch (error) {
      console.error('[Test] Error:', error.message);
      return { success: false, error: error.message };
    }
  },

  /**
   * Submit verification with ImageKit URLs instead of base64 files
   * Images are already uploaded to ImageKit, only URLs are sent
   */
  submitVerificationWithImageKitUrls: async (caseId, payload) => {
    const token = await AsyncStorage.getItem('fieldOfficerToken');
    const url = `${API_BASE_URL}/fo-portal/cases/${caseId}/submit`;
    
    console.log('[ImageKit Submit] Sending submission with ImageKit URLs');
    console.log('[ImageKit Submit] URL:', url);
    
    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(payload),
      });
      
      console.log('[ImageKit Submit] Response status:', res.status);
      
      let data;
      try {
        data = await res.json();
        console.log('[ImageKit Submit] Response data:', data);
      } catch (e) {
        console.error('[ImageKit Submit] JSON parse error:', e);
        data = { success: false, message: 'Invalid JSON response' };
      }
      
      if (!res.ok) {
        const err = new Error(data.message || `HTTP ${res.status}`);
        err.response = { status: res.status, data };
        throw err;
      }
      
      return { data };
    } catch (error) {
      console.error('[ImageKit Submit] Submission error:', error.message);
      throw error;
    }
  },
};

export default api;
