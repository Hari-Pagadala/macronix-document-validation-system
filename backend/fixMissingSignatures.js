/**
 * Fix verification records that point to missing/corrupted files
 */

const Verification = require('./models/Verification_SQL');
const fs = require('fs');
const path = require('path');

(async () => {
  try {
    console.log('\n=== Fixing Verification Records with Missing Files ===\n');
    
    // Get all verifications
    const verifications = await Verification.findAll();
    
    console.log(`Found ${verifications.length} verification records\n`);
    
    let fixedCount = 0;
    
    for (const verification of verifications) {
      let needsUpdate = false;
      const updates = {};
      
      // Check officer signature
      if (verification.officerSignaturePath) {
        const isUrl = verification.officerSignaturePath.startsWith('http');
        
        if (!isUrl) {
          const filePath = path.join(__dirname, 'uploads', 'fo', verification.officerSignaturePath);
          if (!fs.existsSync(filePath)) {
            console.log(`❌ Officer signature missing: ${verification.officerSignaturePath}`);
            updates.officerSignaturePath = null;
            needsUpdate = true;
          } else {
            const size = fs.statSync(filePath).size;
            if (size < 69) {
              console.log(`❌ Officer signature corrupted (${size} bytes): ${verification.officerSignaturePath}`);
              fs.unlinkSync(filePath);
              updates.officerSignaturePath = null;
              needsUpdate = true;
            }
          }
        }
      }
      
      // Check respondent signature
      if (verification.respondentSignaturePath) {
        const isUrl = verification.respondentSignaturePath.startsWith('http');
        
        if (!isUrl) {
          const filePath = path.join(__dirname, 'uploads', 'fo', verification.respondentSignaturePath);
          if (!fs.existsSync(filePath)) {
            console.log(`❌ Respondent signature missing: ${verification.respondentSignaturePath}`);
            updates.respondentSignaturePath = null;
            needsUpdate = true;
          } else {
            const size = fs.statSync(filePath).size;
            if (size < 69) {
              console.log(`❌ Respondent signature corrupted (${size} bytes): ${verification.respondentSignaturePath}`);
              fs.unlinkSync(filePath);
              updates.respondentSignaturePath = null;
              needsUpdate = true;
            }
          }
        }
      }
      
      if (needsUpdate) {
        await verification.update(updates);
        console.log(`✅ Updated verification for record ID: ${verification.recordId}\n`);
        fixedCount++;
      }
    }
    
    console.log('=== Summary ===');
    console.log(`Total verifications: ${verifications.length}`);
    console.log(`Fixed: ${fixedCount}`);
    
    if (fixedCount > 0) {
      console.log('\n✅ Database updated - missing/corrupted signatures set to null');
      console.log('   PDFs will now show "Not Provided" for these signatures');
    } else {
      console.log('\n✅ No issues found');
    }
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
})();
