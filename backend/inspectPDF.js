const fs = require('fs');
const path = require('path');

const pdfPath = path.join(__dirname, 'test-output.pdf');

// Check if file exists
if (!fs.existsSync(pdfPath)) {
  console.error('❌ PDF file not found');
  process.exit(1);
}

const pdfBuffer = fs.readFileSync(pdfPath);
const pdfString = pdfBuffer.toString('latin1');

console.log('📄 PDF Analysis for REC-2025-00023\n');
console.log(`📊 File size: ${pdfBuffer.length} bytes\n`);

// Check for images in PDF (they appear as /Image in PDF structure)
const imageMatches = pdfString.match(/\/Type\s*\/XObject[\s\S]*?\/Subtype\s*\/Image/g);
console.log(`🖼️  Images found in PDF: ${imageMatches ? imageMatches.length : 0}`);

// Check if ImageKit URLs are embedded
const imagekitRefs = (pdfString.match(/ik\.imagekit\.io/g) || []).length;
console.log(`🔗 ImageKit URL references: ${imagekitRefs}`);

// Check page count
const pageMatches = pdfString.match(/\/Type\s*\/Page[^s]/g);
console.log(`📑 Total pages: ${pageMatches ? pageMatches.length : 'Unknown'}`);

// Check for text content
const hasFooter = pdfString.includes('Verification Report');
const hasTitle = pdfString.includes('Document Verification Report');
const hasMacronix = pdfString.includes('Macronix');

console.log('\n📝 Text content checks:');
console.log(`   - Title "Document Verification Report": ${hasTitle ? '✅' : '❌'}`);
console.log(`   - Footer "Verification Report": ${hasFooter ? '✅' : '❌'}`);
console.log(`   - "Macronix" text: ${hasMacronix ? '✅' : '❌'}`);

// Check for image sections
const hasSelfieSection = pdfString.includes('Selfie with House');
const hasCandidateSection = pdfString.includes('Candidate with Respondent');
const hasDocumentSection = pdfString.includes('Document ') && pdfString.includes('1');
const hasPhotoSection = pdfString.includes('House Photo');

console.log('\n📸 Image section checks:');
console.log(`   - "Selfie with House" section: ${hasSelfieSection ? '✅' : '❌'}`);
console.log(`   - "Candidate with Respondent" section: ${hasCandidateSection ? '✅' : '❌'}`);
console.log(`   - "Document" sections: ${hasDocumentSection ? '✅' : '❌'}`);
console.log(`   - "House Photo" sections: ${hasPhotoSection ? '✅' : '❌'}`);

console.log('\n💡 Summary:');
if (imageMatches && imageMatches.length >= 4) {
  console.log('✅ SUCCESS: PDF contains multiple images as expected!');
} else {
  console.log('⚠️  WARNING: PDF may not contain all expected images');
  console.log(`   Expected: At least 4 images (selfie, candidate, document, photo)`);
  console.log(`   Found: ${imageMatches ? imageMatches.length : 0} images`);
}

if (hasFooter && !pdfString.includes('Generated 202')) {
  console.log('✅ Footer appears to be shortened (no long timestamp)');
} else {
  console.log('⚠️  Footer may still contain long timestamp');
}

console.log('\n📂 PDF saved at:', pdfPath);
console.log('🔍 Open the PDF manually to visually verify the fixes');
