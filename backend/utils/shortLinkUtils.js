const crypto = require('crypto');
const ShortLink = require('../models/ShortLink');
const { Op } = require('sequelize');

// Ensure table exists once per process (covers missing migrations quietly)
let shortLinkSyncPromise = null;
async function ensureShortLinkTable() {
    if (!shortLinkSyncPromise) {
        shortLinkSyncPromise = ShortLink.sync();
    }
    return shortLinkSyncPromise;
}

/**
 * Generate a random short code
 * @param {number} length - Length of the short code (default: 6)
 * @returns {string} - Random alphanumeric code
 */
function generateShortCode(length = 6) {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    const randomBytes = crypto.randomBytes(length);
    
    for (let i = 0; i < length; i++) {
        result += chars[randomBytes[i] % chars.length];
    }
    
    return result;
}

/**
 * Create a short link and store in database
 * @param {string} fullUrl - The full URL to shorten
 * @param {number} recordId - Associated record ID
 * @param {number} expiryHours - Hours until expiry (default: 72)
 * @returns {Promise<object>} - Short link object with shortCode
 */
async function createShortLink(fullUrl, recordId, expiryHours = 72) {
    try {
        // Make sure table exists before insert
        await ensureShortLinkTable();

        let shortCode;
        let attempts = 0;
        const maxAttempts = 10;

        // Generate unique short code
        while (attempts < maxAttempts) {
            shortCode = generateShortCode(6);
            
            // Check if code already exists
            const existing = await ShortLink.findOne({
                where: { short_code: shortCode }
            });

            if (!existing) {
                break;
            }
            attempts++;
        }

        if (attempts === maxAttempts) {
            throw new Error('Failed to generate unique short code after 10 attempts');
        }

        // Calculate expiry time
        const expiresAt = new Date();
        expiresAt.setHours(expiresAt.getHours() + expiryHours);

        // Create short link
        const shortLink = await ShortLink.create({
            short_code: shortCode,
            full_url: fullUrl,
            record_id: recordId,
            expires_at: expiresAt
        });

        return shortLink;
    } catch (error) {
        console.error('Error creating short link:', error);
        throw error;
    }
}

/**
 * Get full URL from short code
 * @param {string} shortCode - The short code
 * @returns {Promise<object|null>} - Short link object or null
 */
async function getShortLink(shortCode) {
    try {
        await ensureShortLinkTable();

        const shortLink = await ShortLink.findOne({
            where: { 
                short_code: shortCode,
                expires_at: {
                    [Op.gt]: new Date()
                }
            }
        });

        return shortLink || null;
    } catch (error) {
        console.error('Error getting short link:', error);
        throw error;
    }
}

/**
 * Mark short link as used
 * @param {string} shortCode - The short code
 * @param {string} ipAddress - IP address of the user
 * @param {string} userAgent - User agent string
 * @returns {Promise<boolean>} - Success status
 */
async function markShortLinkUsed(shortCode, ipAddress, userAgent) {
    try {
        await ensureShortLinkTable();

        await ShortLink.update(
            {
                is_used: true,
                used_at: new Date(),
                ip_address: ipAddress,
                user_agent: userAgent
            },
            {
                where: { short_code: shortCode }
            }
        );
        return true;
    } catch (error) {
        console.error('Error marking short link as used:', error);
        return false;
    }
}

/**
 * Clean up expired short links
 * @returns {Promise<number>} - Number of deleted links
 */
async function cleanupExpiredLinks() {
    try {
        await ensureShortLinkTable();

        const deletedCount = await ShortLink.destroy({
            where: {
                expires_at: {
                    [Op.lt]: new Date()
                }
            }
        });
        return deletedCount;
    } catch (error) {
        console.error('Error cleaning up expired links:', error);
        return 0;
    }
}

/**
 * Build short URL for SMS
 * @param {string} shortCode - The short code
 * @returns {string} - Complete short URL
 */
function buildShortUrl(shortCode) {
    const baseUrl = process.env.SHORT_URL_BASE || 'https://verify24x7.in';
    return `${baseUrl}/c/${shortCode}`;
}

module.exports = {
    generateShortCode,
    createShortLink,
    getShortLink,
    markShortLinkUsed,
    cleanupExpiredLinks,
    buildShortUrl
};
