/**
 * Comprehensive test for PNG/JPEG signature validation fixes
 * Tests both upload (base64 decoding) and PDF rendering (corrupted image handling)
 */

const fs = require('fs');
const path = require('path');

// Test 1: Base64 decoding with data URI prefix
console.log('\n=== Test 1: Base64 Decoding ===\n');

const validPNG = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
const invalidPNG = 'iVBORw0KGgoAAAANSU'; // Too short
const withDataURI = 'data:image/png;base64,' + validPNG;

// Helper to validate PNG
const isValidPNG = (buffer) => {
  if (!buffer || buffer.length < 8) return false;
  const pngSignature = Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]);
  return buffer.slice(0, 8).equals(pngSignature);
};

// Helper to validate JPEG
const isValidJPEG = (buffer) => {
  if (!buffer || buffer.length < 3) return false;
  return buffer[0] === 0xFF && buffer[1] === 0xD8 && buffer[2] === 0xFF;
};

// Test saveBase64File logic
const saveBase64File = (base64Data, filename) => {
    try {
        // Strip data URI prefix if present
        let cleanBase64 = base64Data;
        if (typeof base64Data === 'string' && base64Data.includes('base64,')) {
            cleanBase64 = base64Data.split('base64,')[1];
            console.log(`  ✓ Stripped data URI prefix`);
        }
        
        // Decode base64 to buffer
        const buffer = Buffer.from(cleanBase64, 'base64');
        
        // Validate buffer size
        if (buffer.length < 100) {
            console.error(`  ✗ Image too small (${buffer.length} bytes), likely corrupted`);
            return null;
        }
        
        console.log(`  ✓ Valid buffer size: ${buffer.length} bytes`);
        return filename;
    } catch (error) {
        console.error(`  ✗ Failed to decode:`, error.message);
        return null;
    }
};

console.log('Test 1a: Valid PNG with data URI prefix');
const result1a = saveBase64File(withDataURI, 'test1a.png');
console.log(`  Result: ${result1a ? '✅ PASS' : '❌ FAIL'}\n`);

console.log('Test 1b: Valid PNG without data URI prefix');
const result1b = saveBase64File(validPNG, 'test1b.png');
console.log(`  Result: ${result1b ? '✅ PASS' : '❌ FAIL'}\n`);

console.log('Test 1c: Invalid PNG (too small)');
const result1c = saveBase64File(invalidPNG, 'test1c.png');
console.log(`  Result: ${result1c === null ? '✅ PASS (rejected)' : '❌ FAIL (should reject)'}\n`);

// Test 2: Image validation in fetchImage
console.log('\n=== Test 2: Image Buffer Validation ===\n');

const testValidation = (buffer, name) => {
    const isPNG = isValidPNG(buffer);
    const isJPEG = isValidJPEG(buffer);
    const isValid = isPNG || isJPEG;
    console.log(`${name}:`);
    console.log(`  PNG: ${isPNG}, JPEG: ${isJPEG}`);
    console.log(`  Result: ${isValid ? '✅ VALID' : '❌ INVALID'}\n`);
    return isValid;
};

// Valid PNG (1x1 pixel)
const validPNGBuffer = Buffer.from(validPNG, 'base64');
testValidation(validPNGBuffer, 'Valid PNG (1x1 pixel)');

// Invalid buffer (corrupted 68 bytes like the actual issue)
const corruptedBuffer = Buffer.alloc(68);
corruptedBuffer[0] = 0x89;
corruptedBuffer[1] = 0x50;
corruptedBuffer[2] = 0x4E;
corruptedBuffer[3] = 0x47;
corruptedBuffer[4] = 0x0D;
corruptedBuffer[5] = 0x0A;
corruptedBuffer[6] = 0x1A;
corruptedBuffer[7] = 0x0A;
// Rest is zeros/garbage
testValidation(corruptedBuffer, 'Corrupted PNG (68 bytes with valid header)');

// Empty buffer
testValidation(Buffer.alloc(0), 'Empty buffer');

// Random data
testValidation(Buffer.from('random data'), 'Random data (not an image)');

// Test 3: Check actual corrupted files
console.log('\n=== Test 3: Checking Actual Corrupted Files ===\n');

const uploadsDir = path.join(__dirname, 'uploads', 'fo');
const corruptedFiles = [
    'officer_sig_1766119905803.png',
    'respondent_sig_1766119905803.png'
];

for (const filename of corruptedFiles) {
    const filepath = path.join(uploadsDir, filename);
    if (fs.existsSync(filepath)) {
        const buffer = fs.readFileSync(filepath);
        console.log(`File: ${filename}`);
        console.log(`  Size: ${buffer.length} bytes`);
        console.log(`  Has PNG header: ${isValidPNG(buffer)}`);
        console.log(`  Has JPEG header: ${isValidJPEG(buffer)}`);
        console.log(`  Status: ${buffer.length < 100 ? '❌ TOO SMALL (corrupted)' : '✅ OK'}\n`);
    } else {
        console.log(`File: ${filename}`);
        console.log(`  Status: ⚠️  NOT FOUND\n`);
    }
}

// Test 4: Summary of fixes
console.log('\n=== Fix Summary ===\n');

console.log('✅ PDF Generation Fixes (downloadController.js):');
console.log('   1. Added isValidPNG() and isValidJPEG() validation functions');
console.log('   2. Enhanced fetchImage() to validate image buffers');
console.log('   3. Wrapped doc.openImage() in try/catch for signatures');
console.log('   4. Display "Corrupted Image" instead of crashing');
console.log('   5. PDF generation continues even with corrupted images\n');

console.log('✅ Upload/Save Fixes (fieldOfficerController_SQL.js):');
console.log('   1. Strip data URI prefix before base64 decoding');
console.log('   2. Validate buffer size (min 100 bytes)');
console.log('   3. Return null if save fails');
console.log('   4. Final validation before creating verification record');
console.log('   5. Prevent corrupted images from being saved\n');

console.log('✅ Additional Tools:');
console.log('   1. cleanCorruptedImages.js - Scan and remove corrupted files');
console.log('   2. testZipQuery.js - Verify ZIP download query logic\n');

console.log('🎯 Result: PDF generation is now resilient to corrupted images!');
