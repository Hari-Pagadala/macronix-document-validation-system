import axios from 'axios';
import config from '../config';

const IMAGEKIT_ENDPOINT = 'https://ik.imagekit.io/g6rdi7spf';
const IMAGEKIT_PUBLIC_KEY = 'public_jnmn+DPEtMjBKnAKHgFbNRN4OxA=';

/**
 * Get ImageKit authentication token from backend
 */
const getImageKitAuthToken = async () => {
  try {
    const response = await axios.post(`${config}/fo-portal/imagekit-token`);
    return response.data;
  } catch (error) {
    console.error('Failed to get ImageKit auth token:', error);
    throw new Error('ImageKit token generation failed');
  }
};

/**
 * Upload file to ImageKit
 * @param {File} file - The file to upload
 * @param {string} folder - ImageKit folder path (e.g., 'candidate/documents', 'candidate/photos')
 * @returns {Promise<string>} ImageKit URL
 */
export const uploadToImageKit = async (file, folder = 'candidate') => {
  try {
    // Get auth token from backend
    const authToken = await getImageKitAuthToken();
    console.log('[ImageKit] Got auth token');

    // Convert file to base64
    const reader = new FileReader();
    const base64File = await new Promise((resolve, reject) => {
      reader.onload = () => resolve(reader.result.split(',')[1]); // Remove data:image/...;base64, prefix
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });

    // Create FormData for ImageKit upload
    const formData = new FormData();
    formData.append('file', base64File);
    formData.append('fileName', `${Date.now()}-${file.name}`);
    formData.append('folder', folder);
    formData.append('publicKey', IMAGEKIT_PUBLIC_KEY);
    formData.append('signature', authToken.signature);
    formData.append('expire', authToken.expire);
    formData.append('token', authToken.token);

    // Upload to ImageKit
    const uploadResponse = await axios.post(
      'https://upload.imagekit.io/api/v1/files/upload',
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );

    console.log('[ImageKit] Upload successful:', uploadResponse.data.url);
    return uploadResponse.data.url;
  } catch (error) {
    console.error('[ImageKit] Upload failed:', error);
    console.error('[ImageKit] Error details:', error.response?.data || error.message);
    throw new Error(error.response?.data?.message || 'Failed to upload image to ImageKit');
  }
};

/**
 * Upload multiple files to ImageKit
 * @param {File[]} files - Array of files to upload
 * @param {string} folder - ImageKit folder path
 * @returns {Promise<string[]>} Array of ImageKit URLs
 */
export const uploadMultipleToImageKit = async (files, folder = 'candidate') => {
  const uploadPromises = files.map(file => uploadToImageKit(file, folder));
  return Promise.all(uploadPromises);
};
