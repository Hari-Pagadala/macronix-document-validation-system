/**
 * Test script to verify short link generation and SMS formatting
 */

require('dotenv').config();

const sequelize = require('./config/database');
const ShortLink = require('./models/ShortLink');
const { createShortLink, buildShortUrl } = require('./utils/shortLinkUtils');

async function testShortLinkGeneration() {
    console.log('\n=== SHORT LINK GENERATION TEST ===\n');

    try {
        // Sync database
        console.log('0. Syncing database...');
        await sequelize.sync({ alter: true });
        console.log('   ✅ Database synced\n');

        // Test data
        const fullUrl = 'http://localhost:3000/candidate/submit?token=c24a18553b0a511e0d052d38e500542e7b0175be85267f3c5a3efc11906f98ad';
        const recordId = 1; // Test record ID
        
        console.log('1. Testing short link creation...');
        console.log('   Full URL:', fullUrl);
        console.log('   Record ID:', recordId);

        const shortLink = await createShortLink(fullUrl, recordId, 72);
        console.log('   ✅ Short link created successfully!');
        console.log('   Short Code:', shortLink.short_code);
        console.log('   Expires At:', shortLink.expires_at);

        const builtUrl = buildShortUrl(shortLink.short_code);
        console.log('   Built Short URL:', builtUrl);

        // Test SMS formatting
        console.log('\n2. Testing SMS format...');
        const firstName = 'Hari';
        const smsBody = `Dear ${firstName}, to complete your address verification please click the link below and fill the form:\n${builtUrl}`;
        
        console.log('   SMS Message:');
        console.log('   ' + smsBody);
        console.log('   SMS Length:', smsBody.length, 'characters');
        
        if (smsBody.length <= 160) {
            console.log('   ✅ SMS within 160 character limit!');
        } else {
            console.log('   ⚠️  SMS exceeds 160 character limit!');
        }

        console.log('\n3. SMS Preview:');
        console.log('   ---');
        console.log(smsBody);
        console.log('   ---\n');

        process.exit(0);
    } catch (error) {
        console.error('   ❌ Error:', error.message);
        console.error(error.stack);
        process.exit(1);
    }
}

testShortLinkGeneration();
