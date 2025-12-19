const ImageKit = require('imagekit');
const dotenv = require('dotenv');

dotenv.config();

// Initialize ImageKit
const imageKit = new ImageKit({
  publicKey: process.env.IMAGEKIT_PUBLIC_KEY,
  privateKey: process.env.IMAGEKIT_PRIVATE_KEY,
  urlEndpoint: process.env.IMAGEKIT_ENDPOINT,
});

/**
 * Generate authentication token for ImageKit client-side upload
 * This endpoint is called by the mobile app before uploading
 */
const generateImageKitToken = async (req, res) => {
  try {
    const token = imageKit.getAuthenticationParameters();
    res.json({
      token: token.token,
      expire: token.expire,
      signature: token.signature,
      publicKey: process.env.IMAGEKIT_PUBLIC_KEY,
      urlEndpoint: process.env.IMAGEKIT_ENDPOINT,
    });
  } catch (error) {
    console.error('[ImageKit] Token generation error:', error);
    res.status(500).json({ success: false, message: 'Failed to generate ImageKit token' });
  }
};

module.exports = imageKit;
module.exports.generateImageKitToken = generateImageKitToken;
