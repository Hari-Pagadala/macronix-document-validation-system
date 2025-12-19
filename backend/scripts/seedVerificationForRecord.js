const path = require('path');
const fs = require('fs');
const sequelize = require('../config/database');
const Record = require('../models/Record_SQL');
const Verification = require('../models/Verification_SQL');

const ONE_BY_ONE_PNG_BASE64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAoMBg4y2WJcAAAAASUVORK5CYII=';

function ensureUploadDir() {
  const uploadDir = path.join(__dirname, '..', 'uploads', 'fo');
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }
  return uploadDir;
}

function saveBase64File(base64Data, filename, uploadDir) {
  const filepath = path.join(uploadDir, filename);
  const buffer = Buffer.from(base64Data, 'base64');
  fs.writeFileSync(filepath, buffer);
  return filename;
}

async function main() {
  const ref = process.argv[2];
  if (!ref) {
    console.error('Usage: node scripts/seedVerificationForRecord.js <CASE_OR_REFERENCE_NUMBER>');
    process.exit(1);
  }

  console.log('Seeding verification for record:', ref);
  await sequelize.authenticate();

  // Find record by caseNumber or referenceNumber
  const record = await Record.findOne({ where: { caseNumber: ref } })
    || await Record.findOne({ where: { referenceNumber: ref } });

  if (!record) {
    console.error('Record not found for:', ref);
    process.exit(1);
  }

  const uploadDir = ensureUploadDir();
  const ts = Date.now();

  // Create sample files
  const docFiles = [saveBase64File(ONE_BY_ONE_PNG_BASE64, `document_${ts}_0.png`, uploadDir)];
  const photoFiles = [
    saveBase64File(ONE_BY_ONE_PNG_BASE64, `photo_${ts}_0.png`, uploadDir),
    saveBase64File(ONE_BY_ONE_PNG_BASE64, `photo_${ts}_1.png`, uploadDir)
  ];
  const selfiePath = saveBase64File(ONE_BY_ONE_PNG_BASE64, `selfie_${ts}.png`, uploadDir);
  const candidatePath = saveBase64File(ONE_BY_ONE_PNG_BASE64, `candidate_${ts}.png`, uploadDir);
  const officerSig = saveBase64File(ONE_BY_ONE_PNG_BASE64, `officer_sig_${ts}.png`, uploadDir);
  const respondentSig = saveBase64File(ONE_BY_ONE_PNG_BASE64, `respondent_sig_${ts}.png`, uploadDir);

  const payload = {
    recordId: record.id,
    fieldOfficerId: record.assignedFieldOfficer || null,
    respondentName: 'Test Respondent',
    respondentRelationship: 'Neighbor',
    respondentContact: '9999999999',
    periodOfStay: '2 years',
    ownershipType: 'Rented',
    verificationDate: new Date(),
    comments: 'Seeded test verification with sample images',
    insufficientReason: null,
    gpsLat: '12.9716',
    gpsLng: '77.5946',
    documents: docFiles,
    photos: photoFiles,
    selfieWithHousePath: selfiePath,
    candidateWithRespondentPath: candidatePath,
    officerSignaturePath: officerSig,
    respondentSignaturePath: respondentSig,
    status: 'submitted'
  };

  const existing = await Verification.findOne({ where: { recordId: record.id } });
  if (existing) {
    await existing.update(payload);
    console.log('Updated existing verification for record', ref);
  } else {
    await Verification.create(payload);
    console.log('Created verification for record', ref);
  }

  // Update record status
  record.status = 'submitted';
  record.completionDate = new Date();
  await record.save();

  console.log('Done. Files saved to uploads/fo and DB updated.');
  process.exit(0);
}

main().catch((err) => {
  console.error('Seed script error:', err);
  process.exit(1);
});
