# Code Snippets Reference - Bulk ZIP Download Feature

## Backend Implementation Snippets

### 1. PDF Filename Generator
**File**: `backend/controllers/downloadController.js` (Lines 41-45)

```javascript
const generatePdfFilename = (record) => {
  const ref = record.referenceNumber || 'UNKNOWN';
  const name = (record.fullName || 'UNKNOWN').replace(/[^a-zA-Z0-9]/g, '_');
  return `MACRONIX_${ref}_${name}.pdf`;
};
```

**Output Examples:**
- Input: `{referenceNumber: 'REF001', fullName: 'John Doe'}`
  → Output: `MACRONIX_REF001_John_Doe.pdf`
- Input: `{referenceNumber: 'REF002', fullName: 'Mary Jane'}`
  → Output: `MACRONIX_REF002_Mary_Jane.pdf`
- Input: `{referenceNumber: 'REF003', fullName: 'Kumar/Singh'}`
  → Output: `MACRONIX_REF003_Kumar_Singh.pdf`

---

### 2. Image Fetching Helper
**File**: `backend/controllers/downloadController.js` (Lines 13-33)

```javascript
const fetchImage = async (url) => {
  try {
    if (!url) return null;
    
    // If it's an ImageKit URL, fetch from URL
    if (isImageKitUrl(url)) {
      console.log('[PDF] Fetching ImageKit image:', url);
      const response = await axios.get(url, { 
        responseType: 'arraybuffer', 
        timeout: 10000 
      });
      return Buffer.from(response.data);
    } else {
      // If it's a local filename, read from uploads directory
      console.log('[PDF] Reading local file:', url);
      const filePath = path.join(__dirname, '..', 'uploads', 'fo', url);
      if (fs.existsSync(filePath)) {
        return fs.readFileSync(filePath);
      } else {
        console.error('[PDF] Local file not found:', filePath);
        return null;
      }
    }
  } catch (error) {
    console.error('[PDF] Failed to fetch/read image:', url, error.message);
    return null;
  }
};
```

**Supports:**
- ImageKit URLs: `https://ik.imagekit.io/...`
- Local files: `filename.jpg`
- Graceful fallback: Returns null if not found

---

### 3. PDF Generation Function (Main)
**File**: `backend/controllers/downloadController.js` (Lines 48-237)

```javascript
const generateCasePDF = async (record, verification, vendorName, fieldOfficerName) => {
  return new Promise((resolve, reject) => {
    try {
      const chunks = [];
      const doc = new PDFDocument({ size: 'A4', margin: 50 });
      
      // Collect PDF data
      doc.on('data', chunk => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      const pageWidth = doc.page.width - doc.page.margins.left - doc.page.margins.right;
      const leftX = doc.page.margins.left;

      // Styled header band
      const headerHeight = 70;
      doc.save();
      doc.roundedRect(leftX, doc.y, pageWidth, headerHeight, 8).fill('#0f172a');
      doc.fillColor('#ffffff').font('Helvetica-Bold').fontSize(18)
        .text('Document Verification Report', leftX + 16, doc.y + 14);
      // ... more styling ...
      
      // Returns Buffer (can be used in single download or added to ZIP)
    } catch (error) {
      reject(error);
    }
  });
};
```

**Key Features:**
- Returns Promise<Buffer> (not response stream)
- Collects PDF chunks into memory
- Resolves when PDF is complete
- Can be reused for both single and bulk downloads

---

### 4. Single PDF Download Endpoint
**File**: `backend/controllers/downloadController.js` (Lines 239-276)

```javascript
exports.downloadApprovedCase = async (req, res) => {
  try {
    const { id } = req.params;

    // Fetch and validate record
    const record = await Record.findByPk(id);
    if (!record) {
      return res.status(404).json({ success: false, message: 'Case not found' });
    }

    // Only approved cases
    if (record.status !== 'approved') {
      return res.status(400).json({ 
        success: false, 
        message: 'Only approved cases can be downloaded' 
      });
    }

    // Fetch verification
    const verification = await Verification.findOne({ where: { recordId: id } });
    if (!verification) {
      return res.status(404).json({ 
        success: false, 
        message: 'Verification not found for this case' 
      });
    }

    // Fetch vendor and field officer
    let vendorName = 'N/A';
    let fieldOfficerName = 'N/A';
    
    if (record.assignedVendor) {
      const vendor = await Vendor.findByPk(record.assignedVendor);
      if (vendor) vendorName = vendor.company || vendor.name;
    }
    
    if (record.assignedFieldOfficer) {
      const officer = await FieldOfficer.findByPk(record.assignedFieldOfficer);
      if (officer) fieldOfficerName = officer.name;
    }

    // Generate PDF
    const pdfBuffer = await generateCasePDF(record, verification, vendorName, fieldOfficerName);

    // Send response
    const filename = generatePdfFilename(record);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Length', pdfBuffer.length);
    res.send(pdfBuffer);

  } catch (error) {
    console.error('PDF generation error:', error);
    if (!res.headersSent) {
      res.status(500).json({ 
        success: false, 
        message: 'Failed to generate PDF', 
        error: error.message 
      });
    }
  }
};
```

**Flow:**
1. Get case ID from URL parameter
2. Validate case exists and is approved
3. Fetch verification data
4. Look up vendor and field officer names
5. Generate PDF buffer
6. Set response headers with professional filename
7. Send buffer to client

---

### 5. Bulk ZIP Download Endpoint
**File**: `backend/controllers/downloadController.js` (Lines 278-335)

```javascript
exports.downloadApprovedCasesZip = async (req, res) => {
  try {
    // Get all approved records
    const records = await Record.findAll({
      where: { status: 'approved' },
      order: [['createdAt', 'DESC']]
    });

    if (records.length === 0) {
      return res.status(404).json({ 
        success: false, 
        message: 'No approved cases found' 
      });
    }

    // Create archive with max compression
    const archive = archiver('zip', { zlib: { level: 9 } });
    const filename = `Macronix_Approved_Cases_${new Date().toISOString().split('T')[0]}.zip`;

    // Set response headers
    res.setHeader('Content-Type', 'application/zip');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

    archive.pipe(res);

    // Add each case as PDF to archive
    for (const record of records) {
      // Fetch verification
      const verification = await Verification.findOne({ where: { recordId: record.id } });
      if (!verification) continue; // Skip if no verification

      // Get vendor and officer names
      let vendorName = 'N/A';
      let fieldOfficerName = 'N/A';

      if (record.assignedVendor) {
        const vendor = await Vendor.findByPk(record.assignedVendor);
        if (vendor) vendorName = vendor.company || vendor.name;
      }

      if (record.assignedFieldOfficer) {
        const officer = await FieldOfficer.findByPk(record.assignedFieldOfficer);
        if (officer) fieldOfficerName = officer.name;
      }

      // Generate PDF for this case
      const pdfBuffer = await generateCasePDF(record, verification, vendorName, fieldOfficerName);
      const pdfFilename = generatePdfFilename(record);
      
      // Add to archive
      archive.append(pdfBuffer, { name: pdfFilename });
      console.log(`[ZIP] Added ${pdfFilename}`);
    }

    // Handle archive events
    archive.on('error', (err) => {
      console.error('Archive error:', err);
      if (!res.headersSent) {
        res.status(500).json({ success: false, message: 'Failed to create archive' });
      }
    });

    // Finalize (send to client)
    await archive.finalize();

  } catch (error) {
    console.error('ZIP download error:', error);
    if (!res.headersSent) {
      res.status(500).json({ 
        success: false, 
        message: 'Failed to generate ZIP', 
        error: error.message 
      });
    }
  }
};
```

**Flow:**
1. Fetch all records with status='approved'
2. Validate records exist
3. Create archiver instance with max compression
4. Set ZIP response headers
5. Pipe archive to response
6. Loop through each record:
   - Fetch verification data
   - Get vendor/officer names
   - Generate PDF buffer using reusable function
   - Append PDF to archive with professional filename
7. Finalize archive (sends to client)
8. Handle errors gracefully

---

## Route Registration

### File: `backend/routes/downloadRoutes.js`

```javascript
const express = require('express');
const router = express.Router();
const downloadController = require('../controllers/downloadController');
const auth = require('../middleware/auth');

// Download approved case as PDF (Super Admin only)
router.get('/case/:id/pdf', auth, downloadController.downloadApprovedCase);

// Download all approved cases as ZIP (Super Admin only)
router.get('/cases/zip', auth, downloadController.downloadApprovedCasesZip);

module.exports = router;
```

**Registered in server.js:**
```javascript
const downloadRoutes = require('./routes/downloadRoutes');
app.use('/api/download', downloadRoutes);
```

---

## Frontend Implementation

### 1. Bulk Download Handler
**File**: `frontend/src/components/RecordsTable.js` (Lines 175-205)

```javascript
const handleBulkDownload = async () => {
  try {
    setBulkDownloading(true);
    setError('');
    
    const response = await axios.get(
      'http://localhost:5000/api/download/cases/zip',
      {
        headers: {
          'Authorization': `Bearer ${token}`
        },
        responseType: 'blob'
      }
    );

    // Create download link
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Macronix_Approved_Cases_${new Date().toISOString().split('T')[0]}.zip`);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
    
  } catch (err) {
    setError('Failed to download ZIP: ' + (err.response?.data?.message || err.message));
    console.error('Error downloading ZIP:', err);
  } finally {
    setBulkDownloading(false);
  }
};
```

**Key Points:**
- `responseType: 'blob'` for binary data
- Creates temporary URL for download
- Proper cleanup of URL object
- Error handling with user-friendly messages

---

### 2. Bulk Download Button
**File**: `frontend/src/components/RecordsTable.js` (Lines 212-245)

```javascript
{status === 'approved' && (
  <Button
    onClick={handleBulkDownload}
    variant="contained"
    color="primary"
    disabled={bulkDownloading}
    startIcon={<DownloadIcon />}
    sx={{
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      '&:hover': {
        background: 'linear-gradient(135deg, #5568d3 0%, #6a3f99 100%)'
      },
      '&:disabled': {
        background: 'linear-gradient(135deg, #9ca3af 0%, #6b7280 100%)'
      },
      whiteSpace: 'nowrap'
    }}
  >
    {bulkDownloading ? 'Downloading...' : 'Download All PDFs'}
  </Button>
)}
```

**Features:**
- Conditional display: Only shows for "approved" status
- Gradient background styling
- Proper disabled state
- Loading text during download
- Icon support

---

### 3. State Management
**File**: `frontend/src/components/RecordsTable.js` (Line 67)

```javascript
const [bulkDownloading, setBulkDownloading] = useState(false);
```

**Usage:**
- Set true: When download starts
- Set false: When download completes or error occurs
- Disables button and shows loading text while true

---

## Import Statements

### Backend Imports
```javascript
const PDFDocument = require('pdfkit');
const axios = require('axios');
const path = require('path');
const fs = require('fs');
const archiver = require('archiver');
const Record = require('../models/Record_SQL');
const Verification = require('../models/Verification_SQL');
const FieldOfficer = require('../models/FieldOfficer_SQL');
const Vendor = require('../models/Vendor_SQL');
```

### Frontend Imports
```javascript
import { Download as DownloadIcon } from '@mui/icons-material';
import { Button } from '@mui/material';
import axios from 'axios';
```

---

## Database Queries

### Get All Approved Records
```javascript
const records = await Record.findAll({
  where: { status: 'approved' },
  order: [['createdAt', 'DESC']]
});
```

### Get Verification for Record
```javascript
const verification = await Verification.findOne({ 
  where: { recordId: record.id } 
});
```

### Get Vendor Details
```javascript
const vendor = await Vendor.findByPk(record.assignedVendor);
const vendorName = vendor.company || vendor.name;
```

### Get Field Officer Details
```javascript
const officer = await FieldOfficer.findByPk(record.assignedFieldOfficer);
const fieldOfficerName = officer.name;
```

---

## Response Headers

### Single PDF Response
```javascript
res.setHeader('Content-Type', 'application/pdf');
res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
res.setHeader('Content-Length', pdfBuffer.length);
res.send(pdfBuffer);
```

### Bulk ZIP Response
```javascript
res.setHeader('Content-Type', 'application/zip');
res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
archive.pipe(res);
```

---

## Error Responses

### HTTP 404 - Not Found
```javascript
{ success: false, message: 'Case not found' }
{ success: false, message: 'Verification not found for this case' }
{ success: false, message: 'No approved cases found' }
```

### HTTP 400 - Bad Request
```javascript
{ success: false, message: 'Only approved cases can be downloaded' }
```

### HTTP 500 - Server Error
```javascript
{ success: false, message: 'Failed to generate PDF', error: 'Details' }
{ success: false, message: 'Failed to generate ZIP', error: 'Details' }
{ success: false, message: 'Failed to create archive' }
```

---

## Testing Code Examples

### Test Single PDF Download
```javascript
// In browser console
fetch('http://localhost:5000/api/download/case/1/pdf', {
  headers: {
    'Authorization': 'Bearer YOUR_TOKEN'
  }
})
.then(r => r.blob())
.then(blob => {
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'test.pdf';
  a.click();
});
```

### Test Bulk ZIP Download
```javascript
// In browser console
fetch('http://localhost:5000/api/download/cases/zip', {
  headers: {
    'Authorization': 'Bearer YOUR_TOKEN'
  }
})
.then(r => r.blob())
.then(blob => {
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'test.zip';
  a.click();
});
```

---

## Key Configuration

### PDF Settings
```javascript
{
  size: 'A4',          // Page size
  margin: 50,          // Margins in points
  font: 'Helvetica',   // Default font
  fontSize: 10         // Default size
}
```

### Archive Settings
```javascript
{
  zlib: {
    level: 9           // Maximum compression
  }
}
```

### Fetch Timeout
```javascript
timeout: 10000         // 10 seconds per image
```

---

## Best Practices Used

1. ✅ Reusable functions (generateCasePDF for both single and bulk)
2. ✅ Proper error handling (try-catch with user-friendly messages)
3. ✅ Memory efficient (streaming to response)
4. ✅ Security (authentication on all endpoints)
5. ✅ Graceful degradation (skips missing data, continues processing)
6. ✅ Professional naming conventions (consistent across all files)
7. ✅ Proper HTTP headers (correct content types and attachments)
8. ✅ Logging for debugging (console.log for archive operations)

