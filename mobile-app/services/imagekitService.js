import Constants from 'expo-constants';
import axios from 'axios';
import * as FileSystem from 'expo-file-system/legacy';

const expoExtra = Constants.expoConfig?.extra || Constants.manifest?.extra || {};
const API_BASE_URL = expoExtra.EXPO_PUBLIC_API_BASE_URL || 'http://localhost:5000/api';
const IMAGEKIT_ENDPOINT = expoExtra.EXPO_PUBLIC_IMAGEKIT_ENDPOINT;
const IMAGEKIT_PUBLIC_KEY = expoExtra.EXPO_PUBLIC_IMAGEKIT_PUBLIC_KEY;

/**
 * Fetch an authentication token from backend for ImageKit upload
 * This ensures the private key is never exposed to the mobile app
 */
async function getImageKitAuthToken() {
  try {
    const response = await axios.post(`${API_BASE_URL}/fo-portal/imagekit-token`);
    return response.data;
  } catch (error) {
    console.error('Failed to get ImageKit auth token:', error);
    throw new Error('ImageKit token generation failed');
  }
}

/**
 * Upload a single image to ImageKit
 * @param {string} fileUri - Expo file URI
 * @param {string} fileName - Name for the file
 * @param {string} folder - ImageKit folder path (e.g., 'documents', 'photos', 'signatures')
 * @returns {Promise<string>} ImageKit URL
 */
export async function uploadToImageKit(fileUri, fileName, folder = 'uploads') {
  if (!IMAGEKIT_ENDPOINT || !IMAGEKIT_PUBLIC_KEY) {
    throw new Error('ImageKit credentials not configured in app.json');
  }

  try {
    // Get auth token from backend
    const authToken = await getImageKitAuthToken();
    console.log('[ImageKit] Got auth token');

    // Read file as base64
    const fileContent = await FileSystem.readAsStringAsync(fileUri, { encoding: 'base64' });
    console.log(`[ImageKit] Read file ${fileName} (${fileContent.length} bytes)`);

    // Create FormData
    const formData = new FormData();
    formData.append('file', fileContent);
    formData.append('fileName', fileName);
    formData.append('folder', folder);
    formData.append('publicKey', IMAGEKIT_PUBLIC_KEY);
    formData.append('signature', authToken.signature);
    formData.append('expire', authToken.expire);
    formData.append('token', authToken.token);

    // Upload to ImageKit
    const response = await axios.post('https://upload.imagekit.io/api/v1/files/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    if (response.data && response.data.url) {
      console.log('[ImageKit] Upload success:', response.data.url);
      return response.data.url;
    } else {
      throw new Error('No URL returned from ImageKit');
    }
  } catch (error) {
    console.error('[ImageKit] Upload error:', error.message);
    throw error;
  }
}

/**
 * Upload multiple images to ImageKit in parallel
 * @param {Array<{uri, name}>} files - Array of {uri, name} objects
 * @param {string} folder - ImageKit folder path
 * @returns {Promise<Array<string>>} Array of ImageKit URLs
 */
export async function uploadMultipleToImageKit(files, folder = 'uploads') {
  const uploads = files.map((file) => uploadToImageKit(file.uri, file.name, folder));
  return Promise.all(uploads);
}

export default {
  uploadToImageKit,
  uploadMultipleToImageKit,
};
