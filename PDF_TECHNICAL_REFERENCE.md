# 🔧 PDF Enhancement - Technical Reference

## Function Signature

```javascript
const generateCasePDF = async (record, verification, vendorName, fieldOfficerName)
```

### Parameters
| Parameter | Type | Description |
|-----------|------|-------------|
| `record` | Object | Case record with all customer/case details |
| `verification` | Object | Verification data including proofs and GPS |
| `vendorName` | String | Name of assigned vendor |
| `fieldOfficerName` | String | Name of assigned field officer |

### Returns
```javascript
Promise<Buffer>  // PDF content as binary buffer
```

---

## Document Configuration

### PDFDocument Options
```javascript
const doc = new PDFDocument({
  size: 'A4',           // Standard paper size
  margin: 40,           // 40pt margins on all sides
  bufferPages: true     // Enable buffering for multi-page footer
});
```

### Page Dimensions
- **Page Size**: 210mm × 297mm (A4)
- **Width**: 595pt
- **Height**: 842pt
- **Margins**: 40pt (all sides)
- **Usable Width**: ~515pt (595 - 40 - 40)

---

## Color Reference

### Color Definitions in Code
```javascript
// Header and primary text
const headerBgColor = '#0f172a';    // Dark Navy Blue
const textColor = '#111827';         // Dark Gray/Black

// Table styling
const borderColor = '#d1d5db';       // Light Gray
const alternateRowBg = '#f9fafb';    // Very Light Gray

// Branding
const accentColor = '#dc2626';       // Macronix Red

// Footer
const footerColor = '#6b7280';       // Medium Gray
```

### Color Usage
| Color | Hex | Usage |
|-------|-----|-------|
| Dark Navy | #0f172a | Headers, primary text |
| Dark Gray | #111827 | Main content text |
| Accent Red | #dc2626 | Title, highlights |
| Light Gray | #d1d5db | Borders |
| Very Light | #f9fafb | Alternating rows |
| Medium Gray | #6b7280 | Footer text |
| White | #ffffff | Text on dark bg |

---

## Font Configuration

### Available Fonts
- **Helvetica** - Default, clean
- **Helvetica-Bold** - Headers, emphasis
- **Times-Roman** - Alternative serif
- **Courier** - Monospace alternative

### Font Sizes Used
| Size | Usage |
|------|-------|
| 24pt | Company name (Helvetica-Bold) |
| 14pt | Report title (Helvetica-Bold) |
| 12pt | Section headers (Helvetica-Bold) |
| 10pt | Table headers (Helvetica-Bold) |
| 10pt | Case summary labels (Helvetica-Bold) |
| 9pt | Table content (Helvetica) |
| 8pt | Footer text (Helvetica) |
| 7pt | Page numbers (Helvetica) |

---

## Drawing Functions

### drawTable(rows, columnWidths, startY)

```javascript
const drawTable = (rows, columnWidths, startY = null) => {
  const startYPos = startY || doc.y;
  const rowHeight = 25;
  let currentY = startYPos;
  const borderColor = '#d1d5db';
  const headerBgColor = '#0f172a';
  const alternateRowBg = '#f9fafb';
  const textColor = '#111827';

  rows.forEach((row, rowIndex) => {
    const isHeader = rowIndex === 0;
    let currentX = leftX;

    // Draw row background
    if (isHeader) {
      doc.fillColor(headerBgColor).rect(leftX, currentY, pageWidth, rowHeight).fill();
    } else if (rowIndex % 2 === 0) {
      doc.fillColor(alternateRowBg).rect(leftX, currentY, pageWidth, rowHeight).fill();
    }

    // Draw row border
    doc.strokeColor(borderColor).lineWidth(0.5).rect(leftX, currentY, pageWidth, rowHeight).stroke();

    // Draw cell contents
    row.forEach((cell, colIndex) => {
      const colWidth = columnWidths[colIndex];
      doc.fillColor(isHeader ? '#ffffff' : textColor)
        .fontSize(isHeader ? 10 : 9)
        .font(isHeader ? 'Helvetica-Bold' : 'Helvetica');

      const cellX = currentX + 6;
      const cellY = currentY + 5;
      doc.text(cell.toString(), cellX, cellY, {
        width: colWidth - 12,
        height: rowHeight - 10,
        align: 'left',
        valign: 'center'
      });

      currentX += colWidth;
    });

    currentY += rowHeight;
  });

  return currentY - startYPos;  // Returns height used
};
```

#### Parameters
- **rows**: Array of arrays, each inner array is one table row
- **columnWidths**: Array of column widths in points
- **startY**: Optional starting Y position (defaults to current doc.y)

#### Usage Example
```javascript
const tableData = [
  ['Field', 'Value'],                    // Header row
  ['Case Number', 'CS12345'],           // Data row
  ['Reference', 'REF-2024-001'],        // Data row
  // ... more rows
];

drawTable(tableData, [pageWidth / 3, (pageWidth * 2) / 3]);
```

---

## Section Title Function

```javascript
const sectionTitle = (title) => {
  doc.moveDown(0.5);
  doc.fontSize(12).font('Helvetica-Bold').fillColor('#ffffff')
    .rect(leftX, doc.y, pageWidth, 20).fill('#0f172a');
  doc.text(title, leftX + 8, doc.y - 15, { width: pageWidth - 16 });
  doc.moveDown(1.5);
};
```

**Output**: 20pt dark background bar with white bold text

---

## Image Embedding

### Image Insertion
```javascript
if (verification.documentProof) {
  const imageBuffer = await fetchImage(verification.documentProof);
  if (imageBuffer) {
    const maxImageHeight = doc.page.height - doc.y - 100;
    doc.image(imageBuffer, leftX, doc.y, { 
      width: pageWidth, 
      fit: [pageWidth, maxImageHeight] 
    });
    doc.moveDown(1);
  }
}
```

### Page Break Check
```javascript
if (doc.y > doc.page.height - 300) {
  doc.addPage();
}
```

**Purpose**: Ensures 300pt space before images (prevents overlap with footer)

---

## Multi-Page Footer Implementation

```javascript
const pages = doc.bufferedPageRange().count;
for (let i = 0; i < pages; i++) {
  doc.switchToPage(i);
  
  // Footer separator line
  const footerY = doc.page.height - 40;
  doc.strokeColor('#d1d5db').lineWidth(1)
    .moveTo(leftX, footerY)
    .lineTo(leftX + pageWidth, footerY)
    .stroke();

  // Footer text
  doc.fontSize(8).font('Helvetica').fillColor('#6b7280')
    .text(
      `Macronix Document Verification Report | Generated on ${new Date().toLocaleString()}`,
      leftX, footerY + 8,
      { align: 'center', width: pageWidth }
    );

  // Page numbers
  doc.fontSize(7)
    .text(`Page ${i + 1} of ${pages}`, leftX, doc.page.height - 20,
      { align: 'center', width: pageWidth }
    );
}
```

**Key Points**:
- Uses `bufferPages: true` to enable page switching
- Applies footer to all pages
- Page number format: "Page X of Y"

---

## Error Handling

### Document Error Handling
```javascript
return new Promise(async (resolve, reject) => {
  try {
    // PDF generation logic
    doc.on('error', (err) => {
      console.error('[PDF] Document error:', err);
      reject(err);
    });
  } catch (error) {
    console.error('[PDF] Error in generateCasePDF:', error);
    reject(error);
  }
});
```

### Image Error Handling
```javascript
try {
  const imageBuffer = await fetchImage(verification.documentProof);
  if (imageBuffer) {
    try {
      doc.image(imageBuffer, leftX, doc.y, { width: pageWidth, fit: [pageWidth, maxImageHeight] });
    } catch (imgError) {
      console.log('[PDF] Could not embed image:', imgError.message);
    }
  }
} catch (e) {
  console.log('[PDF] Error fetching image:', e.message);
}
```

### Logo Error Handling
```javascript
try {
  const logoPath = path.join(__dirname, '..', '..', 'logo-new.png');
  if (fs.existsSync(logoPath)) {
    doc.image(logoPath, leftX, 20, { width: 50, height: 50 });
  }
} catch (logoError) {
  console.log('[PDF] Could not add logo:', logoError.message);
}
```

---

## Console Logging

All PDF operations log with `[PDF]` prefix for easy filtering:

```javascript
console.log('[PDF] Fetching image:', url);
console.log('[PDF] Image added successfully');
console.error('[PDF] Error fetching image:', error.message);
```

### Log Levels
- **console.log**: Info level - normal operations
- **console.error**: Error level - failures that stop processing
- **console.warn**: Warning level - issues but processing continues

### Example Logs
```
[PDF] Fetching documentProof: image-1234.jpg
[PDF] Document proof image added successfully
[PDF] Fetching locationProof: image-5678.jpg
[PDF] Location proof image added successfully
[PDF] Image added successfully
Generated on 12/20/2024 2:45:30 PM
```

---

## Table Data Structures

### Case Information Table
```javascript
const caseTableData = [
  ['Field', 'Value'],
  ['Case Number', record.caseNumber || 'N/A'],
  ['Reference Number', record.referenceNumber || 'N/A'],
  ['Customer Name', record.fullName || 'N/A'],
  ['Contact Number', record.contactNumber || 'N/A'],
  ['Email', record.email || 'N/A'],
  ['Assigned Vendor', vendorName],
  ['Field Officer', fieldOfficerName],
  ['Address', record.address || 'N/A'],
  ['State / District', `${record.state || 'N/A'} / ${record.district || 'N/A'}`],
  ['Pincode', record.pincode || 'N/A'],
];
```

### Verification Details Table
```javascript
const verifyTableData = [
  ['Field', 'Value'],
  ['Respondent Name', verification.respondentName || 'N/A'],
  ['Relationship', verification.respondentRelationship || 'N/A'],
  ['Respondent Contact', verification.respondentContact || 'N/A'],
  ['Ownership Type', verification.ownershipType || 'N/A'],
  ['Period of Stay', verification.periodOfStay || 'N/A'],
  ['Verification Date', verification.verificationDate || 'N/A'],
  ['Comments', verification.comments || 'N/A'],
  ['Insufficient Reason', verification.insufficientReason || 'N/A'],
];
```

### GPS & Location Details Table
```javascript
const gpsTableData = [
  ['Field', 'Value'],
  ['Latitude', verification.gpsLat || 'N/A'],
  ['Longitude', verification.gpsLng || 'N/A'],
  ['Submitted At', verification.createdAt ? new Date(verification.createdAt).toLocaleString() : 'N/A'],
  ['Action Status', verification.status || 'submitted'],
];
```

---

## Performance Considerations

### Buffer Size
- PDF buffer builds in memory as document is created
- Typical single PDF: 500KB - 5MB
- Multiple images can increase size
- Use streaming for very large batch operations

### Processing Time
- Single PDF generation: ~100-500ms
- Depends on image sizes and count
- Multi-page documents take slightly longer
- ZIP creation with multiple files is sequential

### Memory Usage
- Document is held in memory until finalized
- Images loaded into memory for embedding
- Large batches may need memory management
- Consider implementing streaming for huge batches

---

## Dependencies

### Required Packages
```json
{
  "pdfkit": "^0.13.0",           // PDF generation
  "axios": "^1.4.0",             // HTTP requests for images
  "archiver": "^6.0.0",          // ZIP file creation
  "sequelize": "^6.30.0",        // Database ORM
  "path": "built-in",            // File path handling
  "fs": "built-in"               // File system operations
}
```

### Import Statements
```javascript
const PDFDocument = require('pdfkit');
const axios = require('axios');
const path = require('path');
const fs = require('fs');
const archiver = require('archiver');
```

---

## Date/Time Formatting

### Current Implementation
```javascript
// Date formatting used in PDF:
new Date().toLocaleString()     // "12/20/2024, 2:45:30 PM"
new Date().toLocaleDateString() // "12/20/2024"

// In case creation:
record.createdAt ? new Date(record.createdAt).toLocaleString() : 'N/A'

// In verification:
verification.createdAt ? new Date(verification.createdAt).toLocaleString() : 'N/A'
```

---

## Response Headers

### Single PDF Download
```javascript
res.setHeader('Content-Type', 'application/pdf');
res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
res.setHeader('Content-Length', pdfBuffer.length);
```

### ZIP Download
```javascript
res.setHeader('Content-Type', 'application/zip');
res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
```

---

## Filename Generation

### Single Case PDF
```javascript
const generatePdfFilename = (record) => {
  const ref = record.referenceNumber || 'UNKNOWN';
  const name = (record.fullName || 'UNKNOWN').replace(/[^a-zA-Z0-9]/g, '_');
  return `MACRONIX_${ref}_${name}.pdf`;
};

// Example output: MACRONIX_REF-2024-001_John_Doe.pdf
```

### ZIP Filename
```javascript
let filename = 'Macronix_Approved_Cases';
if (vendor && vendor !== 'all' && vendor !== '') {
  filename += `_${vendor}`;
}
filename += `_${new Date().toISOString().split('T')[0]}.zip`;

// Example output: Macronix_Approved_Cases_2024-12-20.zip
```

---

## Database Queries

### Record Fetch
```javascript
const record = await Record.findByPk(id);
```

**Required Fields**:
- caseNumber
- referenceNumber
- fullName
- contactNumber
- email
- status
- createdAt
- address
- state
- district
- pincode
- assignedVendor
- assignedFieldOfficer

### Verification Fetch
```javascript
const verification = await Verification.findOne({ where: { recordId: id } });
```

**Required Fields**:
- respondentName
- respondentRelationship
- respondentContact
- ownershipType
- periodOfStay
- verificationDate
- comments
- insufficientReason
- gpsLat
- gpsLng
- status
- createdAt
- documentProof
- locationProof
- visitorIdProof

---

## Testing Checklist

### Unit Tests
- [ ] PDF generation completes without errors
- [ ] Logo loads correctly
- [ ] Tables render with proper formatting
- [ ] Colors match specifications
- [ ] Fonts are correct size/weight
- [ ] Page breaks work properly
- [ ] Footer appears on all pages

### Integration Tests
- [ ] Single PDF download works
- [ ] ZIP batch download works
- [ ] Images embed correctly
- [ ] Database queries fetch correct data
- [ ] File output is valid PDF/ZIP

### Quality Tests
- [ ] PDF opens in all readers
- [ ] Prints without distortion
- [ ] Text is readable
- [ ] No overflow or clipping
- [ ] Professional appearance

---

**Version**: 2.0  
**Last Updated**: December 20, 2025  
**Status**: Complete & Documented

