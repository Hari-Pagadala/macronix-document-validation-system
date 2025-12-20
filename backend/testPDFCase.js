const Record = require('./models/Record_SQL');
const Verification = require('./models/Verification_SQL');
const FieldOfficer = require('./models/FieldOfficer_SQL');
const Vendor = require('./models/Vendor_SQL');
const sequelize = require('./config/database');

async function testCase() {
  try {
    await sequelize.authenticate();
    console.log('✅ Database connected');

    const refNumber = 'REC-2025-00023';
    console.log(`\n📋 Looking for case: ${refNumber}`);

    const record = await Record.findOne({ where: { referenceNumber: refNumber } });
    if (!record) {
      console.error('❌ Record not found');
      process.exit(1);
    }

    console.log('\n✅ Record found:');
    console.log('ID:', record.id);
    console.log('Case Number:', record.caseNumber);
    console.log('Reference Number:', record.referenceNumber);
    console.log('Status:', record.status);

    const verification = await Verification.findOne({ where: { recordId: record.id } });
    if (!verification) {
      console.error('❌ No verification found for this record');
      process.exit(1);
    }

    console.log('\n✅ Verification found:');
    console.log('ID:', verification.id);
    console.log('Status:', verification.status);
    console.log('Respondent:', verification.respondentName);
    console.log('GPS:', verification.gpsLat, verification.gpsLng);
    
    console.log('\n📸 Image Paths:');
    console.log('Documents:', JSON.stringify(verification.documents, null, 2));
    console.log('Photos:', JSON.stringify(verification.photos, null, 2));
    console.log('Selfie with House:', verification.selfieWithHousePath);
    console.log('Candidate with Respondent:', verification.candidateWithRespondentPath);
    console.log('Officer Signature:', verification.officerSignaturePath);
    console.log('Respondent Signature:', verification.respondentSignaturePath);

    const fieldOfficer = await FieldOfficer.findByPk(record.assignedFieldOfficer);
    const vendor = await Vendor.findByPk(record.assignedVendor);

    console.log('\n👤 Field Officer:', fieldOfficer?.name || 'N/A');
    console.log('🏢 Vendor:', vendor?.name || 'N/A');

    console.log('\n--- Testing PDF Generation ---');
    const { generateCasePDF } = require('./controllers/downloadController');
    
    console.log('Calling generateCasePDF...');
    const pdfBuffer = await generateCasePDF(
      record,
      verification,
      vendor?.name || 'Unknown Vendor',
      fieldOfficer?.name || 'Unknown FO'
    );

    console.log(`\n✅ PDF generated successfully! Buffer size: ${pdfBuffer.length} bytes`);
    console.log('\nTo save PDF for inspection, run:');
    console.log(`const fs = require('fs'); fs.writeFileSync('test.pdf', pdfBuffer);`);

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error.stack);
  } finally {
    await sequelize.close();
  }
}

testCase();
