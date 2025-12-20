const axios = require('axios');
const fs = require('fs');
const path = require('path');

async function testPDFDownload() {
  try {
    // First, login as super admin to get token
    console.log('🔐 Logging in as super admin...');
    const loginResponse = await axios.post('http://localhost:5000/api/auth/login', {
      email: 'purna@macronix.com',
      password: 'December@2025'
    });

    const token = loginResponse.data.token;
    console.log('✅ Login successful');

    // Get the record ID for REC-2025-00023
    console.log('\n📋 Fetching record for REC-2025-00023...');
    const recordsResponse = await axios.get('http://localhost:5000/api/records', {
      headers: { Authorization: `Bearer ${token}` }
    });

    const record = recordsResponse.data.records.find(r => r.referenceNumber === 'REC-2025-00023');
    if (!record) {
      console.error('❌ Record not found');
      return;
    }

    console.log('✅ Record found:', record.id);

    // Download the PDF
    console.log('\n📥 Downloading PDF...');
    const pdfResponse = await axios.get(`http://localhost:5000/api/download/case/${record.id}/pdf`, {
      headers: { Authorization: `Bearer ${token}` },
      responseType: 'arraybuffer'
    });

    const outputPath = path.join(__dirname, 'test-output.pdf');
    fs.writeFileSync(outputPath, Buffer.from(pdfResponse.data));
    
    console.log(`✅ PDF downloaded successfully!`);
    console.log(`📄 Saved to: ${outputPath}`);
    console.log(`📊 Size: ${pdfResponse.data.length} bytes`);
    console.log(`\n✅ You can now open the PDF to verify:`);
    console.log(`   - Images are visible (selfie, candidate with respondent, documents, photos)`);
    console.log(`   - Footer text is not wrapping`);
    console.log(`   - No blank extra pages`);

  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
  }
}

testPDFDownload();
