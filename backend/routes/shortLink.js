const express = require('express');
const router = express.Router();
const { getShortLink, markShortLinkUsed } = require('../utils/shortLinkUtils');

/**
 * Redirect short code to full URL
 * GET /c/:shortCode
 */
router.get('/:shortCode', async (req, res) => {
    try {
        const { shortCode } = req.params;

        // Get short link from database
        const shortLink = await getShortLink(shortCode);

        if (!shortLink) {
            return res.status(404).send(`
                <!DOCTYPE html>
                <html>
                <head>
                    <meta charset="UTF-8">
                    <meta name="viewport" content="width=device-width, initial-scale=1.0">
                    <title>Link Not Found</title>
                    <style>
                        body {
                            font-family: Arial, sans-serif;
                            display: flex;
                            justify-content: center;
                            align-items: center;
                            height: 100vh;
                            margin: 0;
                            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                        }
                        .container {
                            text-align: center;
                            background: white;
                            padding: 40px;
                            border-radius: 10px;
                            box-shadow: 0 4px 6px rgba(0,0,0,0.1);
                            max-width: 400px;
                        }
                        h1 { color: #e53e3e; margin-bottom: 20px; }
                        p { color: #4a5568; margin-bottom: 10px; }
                    </style>
                </head>
                <body>
                    <div class="container">
                        <h1>⚠️ Link Not Found</h1>
                        <p>This verification link is invalid or has expired.</p>
                        <p>Please contact support if you need assistance.</p>
                    </div>
                </body>
                </html>
            `);
        }

        // Check if link is expired (extra safety check)
        if (shortLink.expires_at && new Date(shortLink.expires_at) < new Date()) {
            return res.status(410).send(`
                <!DOCTYPE html>
                <html>
                <head>
                    <meta charset="UTF-8">
                    <meta name="viewport" content="width=device-width, initial-scale=1.0">
                    <title>Link Expired</title>
                    <style>
                        body {
                            font-family: Arial, sans-serif;
                            display: flex;
                            justify-content: center;
                            align-items: center;
                            height: 100vh;
                            margin: 0;
                            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                        }
                        .container {
                            text-align: center;
                            background: white;
                            padding: 40px;
                            border-radius: 10px;
                            box-shadow: 0 4px 6px rgba(0,0,0,0.1);
                            max-width: 400px;
                        }
                        h1 { color: #e53e3e; margin-bottom: 20px; }
                        p { color: #4a5568; margin-bottom: 10px; }
                    </style>
                </head>
                <body>
                    <div class="container">
                        <h1>⏰ Link Expired</h1>
                        <p>This verification link has expired.</p>
                        <p>Please request a new verification link from your administrator.</p>
                    </div>
                </body>
                </html>
            `);
        }

        // Get client info
        const ipAddress = req.ip || req.connection.remoteAddress;
        const userAgent = req.get('user-agent') || 'Unknown';

        // Mark as used (track analytics)
        await markShortLinkUsed(shortCode, ipAddress, userAgent);

        // Log redirect for monitoring
        console.log(`Short link redirect: ${shortCode} -> ${shortLink.full_url}`);

        // Redirect to full URL
        return res.redirect(shortLink.full_url);

    } catch (error) {
        console.error('Error redirecting short link:', error);
        return res.status(500).send(`
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Error</title>
                <style>
                    body {
                        font-family: Arial, sans-serif;
                        display: flex;
                        justify-content: center;
                        align-items: center;
                        height: 100vh;
                        margin: 0;
                        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    }
                    .container {
                        text-align: center;
                        background: white;
                        padding: 40px;
                        border-radius: 10px;
                        box-shadow: 0 4px 6px rgba(0,0,0,0.1);
                        max-width: 400px;
                    }
                    h1 { color: #e53e3e; margin-bottom: 20px; }
                    p { color: #4a5568; margin-bottom: 10px; }
                </style>
            </head>
            <body>
                <div class="container">
                    <h1>❌ Error</h1>
                    <p>An error occurred while processing your request.</p>
                    <p>Please try again later or contact support.</p>
                </div>
            </body>
            </html>
        `);
    }
});

module.exports = router;
