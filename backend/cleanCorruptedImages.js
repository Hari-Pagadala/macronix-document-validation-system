const fs = require('fs');
const path = require('path');

/**
 * Script to find and optionally remove corrupted/invalid PNG files
 * Checks file size and attempts basic validation
 */

const MIN_VALID_PNG_SIZE = 100; // bytes - valid PNGs are typically larger

function scanDirectory(dir, results = []) {
  const files = fs.readdirSync(dir);
  
  for (const file of files) {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory()) {
      scanDirectory(filePath, results);
    } else if (file.endsWith('.png') || file.endsWith('.jpg') || file.endsWith('.jpeg')) {
      results.push({ path: filePath, size: stat.size });
    }
  }
  
  return results;
}

function isValidPNG(buffer) {
  if (!buffer || buffer.length < 8) return false;
  const pngSignature = Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]);
  return buffer.slice(0, 8).equals(pngSignature);
}

function isValidJPEG(buffer) {
  if (!buffer || buffer.length < 3) return false;
  return buffer[0] === 0xFF && buffer[1] === 0xD8 && buffer[2] === 0xFF;
}

console.log('Scanning for potentially corrupted image files...\n');

const uploadsDir = path.join(__dirname, 'uploads');
const allImages = scanDirectory(uploadsDir);

console.log(`Found ${allImages.length} image files\n`);

const suspiciousFiles = [];

for (const image of allImages) {
  if (image.size < MIN_VALID_PNG_SIZE) {
    const buffer = fs.readFileSync(image.path);
    const isPNG = isValidPNG(buffer);
    const isJPEG = isValidJPEG(buffer);
    
    if (isPNG || isJPEG) {
      // Has valid header but is very small - likely corrupted
      suspiciousFiles.push({
        ...image,
        reason: `Valid ${isPNG ? 'PNG' : 'JPEG'} header but only ${image.size} bytes (likely corrupted)`
      });
    } else {
      suspiciousFiles.push({
        ...image,
        reason: `Invalid image format (${image.size} bytes)`
      });
    }
  }
}

if (suspiciousFiles.length === 0) {
  console.log('✓ No corrupted image files found!');
} else {
  console.log(`⚠ Found ${suspiciousFiles.length} suspicious/corrupted image files:\n`);
  
  suspiciousFiles.forEach((file, index) => {
    console.log(`${index + 1}. ${path.relative(uploadsDir, file.path)}`);
    console.log(`   Size: ${file.size} bytes`);
    console.log(`   Reason: ${file.reason}\n`);
  });
  
  console.log('\nTo remove these files, add the --remove flag:');
  console.log('node cleanCorruptedImages.js --remove');
}

// Handle remove flag
if (process.argv.includes('--remove')) {
  if (suspiciousFiles.length > 0) {
    console.log('\n🗑️  Removing corrupted files...\n');
    
    suspiciousFiles.forEach(file => {
      try {
        fs.unlinkSync(file.path);
        console.log(`✓ Removed: ${path.relative(uploadsDir, file.path)}`);
      } catch (error) {
        console.error(`✗ Failed to remove ${file.path}: ${error.message}`);
      }
    });
    
    console.log(`\n✓ Removed ${suspiciousFiles.length} corrupted files`);
  }
}
