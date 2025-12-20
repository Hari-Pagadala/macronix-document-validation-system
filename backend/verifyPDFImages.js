const fs = require('fs');
const path = require('path');

const pdfPath = path.join(__dirname, 'test-output.pdf');

if (!fs.existsSync(pdfPath)) {
  console.error('❌ PDF file not found');
  process.exit(1);
}

const pdfBuffer = fs.readFileSync(pdfPath);
const pdfString = pdfBuffer.toString('latin1');

console.log('🔍 DETAILED PDF IMAGE VERIFICATION\n');
console.log('='
.repeat(60));

// Check file size
console.log(`\n📊 File Size: ${(pdfBuffer.length / 1024).toFixed(2)} KB`);

// Count images
const imageMatches = pdfString.match(/\/Type\s*\/XObject[\s\S]*?\/Subtype\s*\/Image/g);
console.log(`\n🖼️  Total Images Found: ${imageMatches ? imageMatches.length : 0}`);

// Check page count
const pageMatches = pdfString.match(/\/Type\s*\/Page[^s]/g);
const pageCount = pageMatches ? pageMatches.length : 0;
console.log(`📑 Total Pages: ${pageCount}`);

// Extract image dimensions from PDF stream
console.log('\n📐 Image Dimensions Analysis:');
const imageObjects = pdfString.match(/\/Type\s*\/XObject[\s\S]{0,500}?\/Width\s+(\d+)[\s\S]{0,200}?\/Height\s+(\d+)/g);
if (imageObjects) {
  imageObjects.forEach((obj, idx) => {
    const widthMatch = obj.match(/\/Width\s+(\d+)/);
    const heightMatch = obj.match(/\/Height\s+(\d+)/);
    if (widthMatch && heightMatch) {
      console.log(`   Image ${idx + 1}: ${widthMatch[1]}x${heightMatch[1]} pixels`);
    }
  });
}

// Check for section titles
console.log('\n📝 Section Headers Found:');
const sections = [
  'Selfie with House',
  'Candidate with Respondent',
  'Document 1',
  'House Photo 1'
];

sections.forEach(section => {
  const found = pdfString.includes(section);
  console.log(`   ${found ? '✅' : '❌'} ${section}`);
});

// Check for proper spacing indicators
console.log('\n🎨 Layout Analysis:');

// In PDFKit, when we set doc.y, it affects the position
// Let's check if the footer appears on all pages
const footerPattern = /Verification Report/g;
const footerMatches = pdfString.match(footerPattern);
console.log(`   Footer instances: ${footerMatches ? footerMatches.length : 0}`);
console.log(`   Expected footers: ${pageCount}`);
console.log(`   ${footerMatches && footerMatches.length === pageCount ? '✅' : '⚠️'} Footer on all pages`);

// Check image positioning hints
const hasPositioning = pdfString.includes('cm'); // transformation matrices in PDF
console.log(`   ${hasPositioning ? '✅' : '⚠️'} Image positioning commands found`);

// Check for image streams
const streamCount = (pdfString.match(/stream\r?\n[\s\S]*?endstream/g) || []).length;
console.log(`   Total content streams: ${streamCount}`);

// Estimate if images are properly embedded
const jpegMarkers = (pdfString.match(/\xFF\xD8\xFF/g) || []).length;
const pngMarkers = (pdfString.match(/\x89PNG/g) || []).length;
console.log('\n📦 Image Data:');
console.log(`   JPEG images: ${jpegMarkers}`);
console.log(`   PNG images: ${pngMarkers}`);
console.log(`   Total image data: ${jpegMarkers + pngMarkers}`);

// Final assessment
console.log('\n' + '='.repeat(60));
console.log('\n💡 VERIFICATION SUMMARY:\n');

if (imageMatches && imageMatches.length >= 4) {
  console.log('✅ PASS: All expected images are embedded in PDF');
  console.log(`   Found: ${imageMatches.length} images`);
  console.log(`   Expected: 4+ images (selfie, candidate, document, photo)`);
} else {
  console.log('❌ FAIL: Missing images in PDF');
  console.log(`   Found: ${imageMatches ? imageMatches.length : 0} images`);
  console.log(`   Expected: 4+ images`);
}

if (footerMatches && footerMatches.length === pageCount) {
  console.log('✅ PASS: Footer appears on all pages correctly');
} else {
  console.log('⚠️  WARNING: Footer may not be on all pages');
}

if (jpegMarkers + pngMarkers >= 4) {
  console.log('✅ PASS: Image data is properly embedded');
} else {
  console.log('⚠️  WARNING: Some image data may be missing');
}

console.log('\n📂 PDF Location:', pdfPath);
console.log('\n🔍 Manual Verification Steps:');
console.log('   1. Open the PDF file in a PDF viewer');
console.log('   2. Check that all images are visible and centered');
console.log('   3. Verify consistent spacing between images');
console.log('   4. Confirm no images are cut off or overlapping');
console.log('   5. Check that section headers appear above each image');
console.log('\n');
