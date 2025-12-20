const PDFDocument = require('pdfkit');
const axios = require('axios');
const path = require('path');
const fs = require('fs');
const archiver = require('archiver');
const Record = require('../models/Record_SQL');
const Verification = require('../models/Verification_SQL');
const FieldOfficer = require('../models/FieldOfficer_SQL');
const Vendor = require('../models/Vendor_SQL');

// Helper to check if URL is ImageKit or local file
const isImageKitUrl = (url) => {
  return typeof url === 'string' && url.includes('ik.imagekit.io');
};

// Helper to check for generic http(s) URLs
const isHttpUrl = (url) => {
  return typeof url === 'string' && /^https?:\/\//.test(url);
};

// Helper to validate PNG buffer
const isValidPNG = (buffer) => {
  if (!buffer || buffer.length < 8) return false;
  // PNG signature: 137 80 78 71 13 10 26 10
  const pngSignature = Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]);
  return buffer.slice(0, 8).equals(pngSignature);
};

// Helper to validate JPEG buffer
const isValidJPEG = (buffer) => {
  if (!buffer || buffer.length < 3) return false;
  // JPEG signature: FF D8 FF
  return buffer[0] === 0xFF && buffer[1] === 0xD8 && buffer[2] === 0xFF;
};

// Helper to fetch image from URL or local file and return buffer
const fetchImage = async (url) => {
  try {
    if (!url || typeof url !== 'string') {
      console.log('[PDF] Invalid image URL:', typeof url, url);
      return null;
    }
    
    // If it's an ImageKit or generic http(s) URL, fetch from network
    if (isImageKitUrl(url) || isHttpUrl(url)) {
      console.log('[PDF] Fetching remote image:', url);
      try {
        const response = await axios.get(url, { responseType: 'arraybuffer', timeout: 15000 });
        if (!response.data || response.data.length === 0) {
          console.error('[PDF] Empty response for remote URL:', url);
          return null;
        }
        const buffer = Buffer.from(response.data);
        
        // Validate image format
        if (!isValidPNG(buffer) && !isValidJPEG(buffer)) {
          console.error('[PDF] Invalid or corrupted image format from URL:', url);
          return null;
        }
        
        return buffer;
      } catch (axiosError) {
        console.error('[PDF] Failed to fetch image from URL:', url, axiosError.message);
        return null;
      }
    } else {
      // Resolve local file path robustly
      console.log('[PDF] Reading local file:', url);
      let filePath;
      if (path.isAbsolute(url)) {
        filePath = url;
      } else if (url.includes('uploads')) {
        filePath = path.resolve(__dirname, '..', url.replace(/^\.\/?/, ''));
      } else if (url.includes('/') || url.includes('\\')) {
        // Treat as relative path from backend root
        filePath = path.resolve(__dirname, '..', url);
      } else {
        // Default FO uploads folder with bare filename
        filePath = path.join(__dirname, '..', 'uploads', 'fo', url);
      }

      try {
        if (fs.existsSync(filePath)) {
          const buffer = fs.readFileSync(filePath);
          if (buffer && buffer.length > 0) {
            // Validate image format
            if (!isValidPNG(buffer) && !isValidJPEG(buffer)) {
              console.error('[PDF] Invalid or corrupted image format:', filePath);
              return null;
            }
            return buffer;
          } else {
            console.error('[PDF] Local file is empty:', filePath);
            return null;
          }
        } else {
          console.error('[PDF] Local file not found:', filePath);
          return null;
        }
      } catch (fsError) {
        console.error('[PDF] Error reading local file:', filePath, fsError.message);
        return null;
      }
    }
  } catch (error) {
    console.error('[PDF] Unexpected error fetching image:', url, error.message);
    return null;
  }
};

// Helper to add image with proper spacing and page breaks
const addImageToDoc = async (doc, imageUrl, title, leftX, pageWidth) => {
  if (!imageUrl) {
    // Show "Not Provided" if image is missing
    doc.fontSize(10).fillColor('#6b7280').text(`${title}: Not Provided`, leftX, doc.y);
    doc.moveDown(0.5);
    return;
  }

  try {
    const imageBuffer = await fetchImage(imageUrl);
    if (!imageBuffer) {
      doc.fontSize(10).fillColor('#6b7280').text(`${title}: Not Provided`, leftX, doc.y);
      doc.moveDown(0.5);
      return;
    }

    const headerHeight = 24;
    const maxImageWidth = pageWidth - 60; // Leave margins

    // Draw section title
    doc.save();
    doc.rect(leftX, doc.y, pageWidth, headerHeight).fill('#0f172a');
    doc.fillColor('#ffffff').font('Helvetica-Bold').fontSize(11);
    doc.text(title, leftX + 10, doc.y + 7, { width: pageWidth - 20, align: 'left' });
    doc.restore();
    doc.y += headerHeight + 10;

    // Get image dimensions to calculate scaled size
    let img, aspectRatio, scaledWidth, scaledHeight;
    try {
      img = doc.openImage(imageBuffer);
      aspectRatio = img.height / img.width;
      scaledWidth = Math.min(img.width, maxImageWidth);
      scaledHeight = scaledWidth * aspectRatio;
    } catch (imgError) {
      console.error(`[PDF] Corrupted or invalid image for ${title}:`, imgError.message);
      doc.fontSize(10).fillColor('#ef4444').text(`${title}: Image file is corrupted`, leftX, doc.y);
      doc.moveDown(0.5);
      return;
    }

    // If scaled height is too large, constrain by height instead
    const maxImageHeight = 400;
    if (scaledHeight > maxImageHeight) {
      scaledHeight = maxImageHeight;
      scaledWidth = scaledHeight / aspectRatio;
    }

    // Check if image fits on current page (only add page if truly needed)
    if (doc.y + scaledHeight + 40 > doc.page.height - 60) {
      doc.addPage();
    }

    // Center the image horizontally
    const imageX = leftX + (pageWidth - scaledWidth) / 2;

    // Draw border around image area
    doc.save();
    doc.rect(imageX - 5, doc.y - 5, scaledWidth + 10, scaledHeight + 10).stroke('#d1d5db');
    doc.restore();

    // Add the image
    doc.image(imageBuffer, imageX, doc.y, { width: scaledWidth });

    // Move cursor past the image
    doc.y += scaledHeight + 15;

  } catch (error) {
    console.error(`[PDF] Error rendering ${title}:`, error.message);
    doc.fontSize(10).fillColor('#ef4444').text(`${title}: Error loading image`, leftX, doc.y);
    doc.moveDown(0.5);
  }
};

// Helper to generate filename from record
const generatePdfFilename = (record) => {
  const ref = record.referenceNumber || 'UNKNOWN';
  const name = (record.fullName || 'UNKNOWN').replace(/[^a-zA-Z0-9]/g, '_');
  return `MACRONIX_${ref}_${name}.pdf`;
};

// Helper to generate PDF for a single case (returns buffer)
const generateCasePDF = async (record, verification, vendorName, fieldOfficerName) => {
  return new Promise(async (resolve, reject) => {
    try {
      const chunks = [];
      const doc = new PDFDocument({ size: 'A4', margin: 40, bufferPages: true });
      
      // Collect PDF data with error handling
      doc.on('data', chunk => {
        try {
          chunks.push(chunk);
        } catch (e) {
          console.error('[PDF] Error collecting chunk:', e.message);
        }
      });

      doc.on('end', () => {
        try {
          const buffer = Buffer.concat(chunks);
          resolve(buffer);
        } catch (e) {
          console.error('[PDF] Error concatenating chunks:', e.message);
          reject(e);
        }
      });

      doc.on('error', (err) => {
        console.error('[PDF] Document error:', err);
        reject(err);
      });

      const pageWidth = doc.page.width - doc.page.margins.left - doc.page.margins.right;
      const leftX = doc.page.margins.left;

      // Helper function to draw table
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

          // Draw background
          if (isHeader) {
            doc.fillColor(headerBgColor).rect(leftX, currentY, pageWidth, rowHeight).fill();
          } else if (rowIndex % 2 === 0) {
            doc.fillColor(alternateRowBg).rect(leftX, currentY, pageWidth, rowHeight).fill();
          }

          // Draw border
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

        return currentY - startYPos;
      };

      // Add header with logo (larger for visibility)
      try {
        const logoPath = path.join(__dirname, '..', '..', 'logo-new.png');
        if (fs.existsSync(logoPath)) {
          // Increase width for better visibility; height auto-scales
          doc.image(logoPath, leftX, 20, { width: 140 });
        }
      } catch (logoError) {
        console.log('[PDF] Could not add logo:', logoError.message);
      }

      // Title below the logo only (remove "Macronix" text)
      doc.y = 70; // place title below logo area
      doc.fontSize(18)
        .font('Helvetica-Bold')
        .fillColor('#0f172a')
        .text('Document Verification Report', leftX, doc.y, { width: pageWidth, align: 'left' });

      // Case header info bar
      doc.moveDown(1.2);
      const headerBarY = doc.y;
      doc.fillColor('#f3f4f6').rect(leftX, headerBarY, pageWidth, 40).fill();
      doc.strokeColor('#d1d5db').lineWidth(1).rect(leftX, headerBarY, pageWidth, 40).stroke();

      doc.fontSize(10).font('Helvetica-Bold').fillColor('#0f172a').text(`Case # ${record.caseNumber || 'N/A'}`, leftX + 10, headerBarY + 5);
      doc.fontSize(10).font('Helvetica').fillColor('#374151').text(`Reference: ${record.referenceNumber || 'N/A'}`, leftX + 10, headerBarY + 18);
      
      doc.fontSize(10).font('Helvetica-Bold').fillColor('#0f172a').text(`Status: ${record.status?.toUpperCase?.() || 'N/A'}`, leftX + pageWidth / 2, headerBarY + 5);
      doc.fontSize(10).font('Helvetica').fillColor('#374151').text(`Date: ${record.createdAt ? new Date(record.createdAt).toLocaleDateString() : 'N/A'}`, leftX + pageWidth / 2, headerBarY + 18);

      doc.moveDown(3);

      // Helper for section title (fixed vertical alignment inside background)
      const sectionTitle = (title) => {
        const headerHeight = 24;
        const startY = doc.y;

        // Draw background bar
        doc.save();
        doc.rect(leftX, startY, pageWidth, headerHeight).fill('#0f172a');

        // Draw title centered vertically within the bar
        doc.fillColor('#ffffff').font('Helvetica-Bold').fontSize(12);
        const textY = startY + (headerHeight - 12) / 2; // approx vertical centering
        doc.text(title, leftX + 10, textY, { width: pageWidth - 20, align: 'left' });
        doc.restore();

        // Advance cursor just below the header bar
        doc.y = startY + headerHeight + 6;
      };

      // Case Information Table
      sectionTitle('Case Information');
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
      drawTable(caseTableData, [pageWidth / 3, (pageWidth * 2) / 3]);
      doc.moveDown(1);

      // Verification Details Table
      const verifyStartY = doc.y;
      doc.save();
      doc.rect(leftX, verifyStartY, pageWidth, 24).fill('#0f172a');
      doc.fillColor('#ffffff').font('Helvetica-Bold').fontSize(12);
      doc.text('Verification Details', leftX + 10, verifyStartY + 6, { width: pageWidth - 20, align: 'left' });
      doc.restore();
      doc.y = verifyStartY + 24 + 6;
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
      drawTable(verifyTableData, [pageWidth / 3, (pageWidth * 2) / 3]);
      doc.moveDown(2);

      // GPS Details Table - add page only if not enough space
      if (doc.y > doc.page.height - 250) {
        doc.addPage();
      }
      const gpsStartY = doc.y;
      doc.save();
      doc.rect(leftX, gpsStartY, pageWidth, 24).fill('#0f172a');
      doc.fillColor('#ffffff').font('Helvetica-Bold').fontSize(12);
      doc.text('GPS & Location Details', leftX + 10, gpsStartY + 6, { width: pageWidth - 20, align: 'left' });
      doc.restore();
      doc.y = gpsStartY + 24 + 6;
      const gpsTableData = [
        ['Field', 'Value'],
        ['Latitude', verification.gpsLat || 'N/A'],
        ['Longitude', verification.gpsLng || 'N/A'],
        ['Submitted At', verification.createdAt ? new Date(verification.createdAt).toLocaleString() : 'N/A'],
        ['Action Status', verification.status || 'submitted'],
      ];
      drawTable(gpsTableData, [pageWidth / 3, (pageWidth * 2) / 3]);
      doc.moveDown(1.5);

      // Photos Section - Each image on separate section with proper spacing
      
      // Selfie with House
      if (verification.selfieWithHousePath) {
        await addImageToDoc(doc, verification.selfieWithHousePath, 'Selfie with House', leftX, pageWidth);
        console.log('[PDF] Selfie with house image added');
      }

      // Candidate with Respondent
      if (verification.candidateWithRespondentPath) {
        await addImageToDoc(doc, verification.candidateWithRespondentPath, 'Candidate with Respondent', leftX, pageWidth);
        console.log('[PDF] Candidate with respondent image added');
      }

      // House Photos
      const photos = verification.photos || [];
      for (let i = 0; i < photos.length; i++) {
        await addImageToDoc(doc, photos[i], `House Photo ${i + 1}`, leftX, pageWidth);
        console.log(`[PDF] House photo ${i + 1} added`);
      }

      // Documents
      const docs = verification.documents || [];
      for (let i = 0; i < docs.length; i++) {
        await addImageToDoc(doc, docs[i], `Document ${i + 1}`, leftX, pageWidth);
        console.log(`[PDF] Document ${i + 1} added`);
      }

      // Signatures Section - only add page if not enough space for signatures (need ~180px)
      if (doc.y > doc.page.height - 180) {
        doc.addPage();
      }

      // Add section title for signatures
      const sigSectionY = doc.y;
      doc.save();
      doc.rect(leftX, sigSectionY, pageWidth, 24).fill('#0f172a');
      doc.fillColor('#ffffff').font('Helvetica-Bold').fontSize(12);
      doc.text('Signatures', leftX + 10, sigSectionY + 6, { width: pageWidth - 20, align: 'left' });
      doc.restore();
      doc.y = sigSectionY + 30;

      // Officer and Respondent signatures side by side
      const sigWidth = 200;
      const sigHeight = 100;
      const sigY = doc.y;
      const sig1X = leftX + 40;
      const sig2X = leftX + pageWidth - sigWidth - 40;

      // Officer Signature
      doc.fontSize(10).fillColor('#374151').text('Field Officer Signature', sig1X, sigY);
      doc.rect(sig1X, sigY + 20, sigWidth, sigHeight).stroke('#d1d5db');
      
      if (verification.officerSignaturePath) {
        try {
          const sigBuffer = await fetchImage(verification.officerSignaturePath);
          if (sigBuffer) {
            // Validate the image can be opened before adding to doc
            try {
              const testImg = doc.openImage(sigBuffer);
              doc.image(sigBuffer, sig1X + 10, sigY + 30, { fit: [sigWidth - 20, sigHeight - 20] });
            } catch (imgError) {
              console.error('[PDF] Corrupted officer signature:', verification.officerSignaturePath, imgError.message);
              doc.fontSize(9).fillColor('#ef4444').text('Corrupted Image', sig1X + 55, sigY + 60);
            }
          } else {
            doc.fontSize(9).fillColor('#6b7280').text('Not Provided', sig1X + 60, sigY + 60);
          }
        } catch (e) {
          console.error('[PDF] Error adding officer signature:', e.message);
          doc.fontSize(9).fillColor('#ef4444').text('Error Loading', sig1X + 55, sigY + 60);
        }
      } else {
        doc.fontSize(9).fillColor('#6b7280').text('Not Provided', sig1X + 60, sigY + 60);
      }

      // Respondent Signature
      doc.fontSize(10).fillColor('#374151').text('Respondent Signature', sig2X, sigY);
      doc.rect(sig2X, sigY + 20, sigWidth, sigHeight).stroke('#d1d5db');
      
      if (verification.respondentSignaturePath) {
        try {
          const sigBuffer = await fetchImage(verification.respondentSignaturePath);
          if (sigBuffer) {
            // Validate the image can be opened before adding to doc
            try {
              const testImg = doc.openImage(sigBuffer);
              doc.image(sigBuffer, sig2X + 10, sigY + 30, { fit: [sigWidth - 20, sigHeight - 20] });
            } catch (imgError) {
              console.error('[PDF] Corrupted respondent signature:', verification.respondentSignaturePath, imgError.message);
              doc.fontSize(9).fillColor('#ef4444').text('Corrupted Image', sig2X + 55, sigY + 60);
            }
          } else {
            doc.fontSize(9).fillColor('#6b7280').text('Not Provided', sig2X + 60, sigY + 60);
          }
        } catch (e) {
          console.error('[PDF] Error adding respondent signature:', e.message);
          doc.fontSize(9).fillColor('#ef4444').text('Error Loading', sig2X + 55, sigY + 60);
        }
      } else {
        doc.fontSize(9).fillColor('#6b7280').text('Not Provided', sig2X + 60, sigY + 60);
      }

      doc.y = sigY + sigHeight + 40;

      // Finalize PDF
      doc.end();

    } catch (error) {
      console.error('[PDF] Error in generateCasePDF:', error);
      reject(error);
    }
  });
};

// Download single approved case as PDF
exports.downloadApprovedCase = async (req, res) => {
  try {
    const { id } = req.params;

    // Fetch record
    const record = await Record.findByPk(id);
    if (!record) {
      return res.status(404).json({ success: false, message: 'Case not found' });
    }

    // Only allow download for approved cases
    if (record.status !== 'approved') {
      return res.status(400).json({ success: false, message: 'Only approved cases can be downloaded' });
    }

    // Fetch verification
    const verification = await Verification.findOne({ where: { recordId: id } });
    if (!verification) {
      return res.status(404).json({ success: false, message: 'Verification not found for this case' });
    }

    // Fetch vendor and field officer details
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

    // Set response headers
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

// Download all approved cases as ZIP
exports.downloadApprovedCasesZip = async (req, res) => {
  console.log('[ZIP] Received ZIP download request with params:', req.query);
  let archive = null;
  
  try {
    // Get filter parameters
    const { vendor, fromDate, toDate } = req.query;
    
    // Build where clause
    const whereClause = { status: 'approved' };
    
    // Add vendor filter if provided
    if (vendor && vendor !== 'all' && vendor !== '') {
      whereClause.assignedVendor = vendor;
    }
    
    // Add date range filters if provided (filter by approval date, not creation date)
    const { Op } = require('sequelize');
    if (fromDate || toDate) {
      whereClause.updatedAt = {};
      if (fromDate) {
        whereClause.updatedAt[Op.gte] = new Date(fromDate);
      }
      if (toDate) {
        const toDateObj = new Date(toDate);
        toDateObj.setHours(23, 59, 59, 999); // Include entire day
        whereClause.updatedAt[Op.lte] = toDateObj;
      }
    }

    // Get filtered records
    const records = await Record.findAll({
      where: whereClause,
      order: [['createdAt', 'DESC']]
    });

    console.log(`[ZIP] Query filters:`, JSON.stringify(whereClause, null, 2));
    console.log(`[ZIP] Found ${records.length} approved cases matching filters`);

    if (records.length === 0) {
      return res.status(404).json({ success: false, message: 'No approved cases found matching your filters' });
    }

    // Create archive with compression
    archive = archiver('zip', { zlib: { level: 9 } });
    
    // Create filename with filter info
    let filename = 'Macronix_Approved_Cases';
    if (vendor && vendor !== 'all' && vendor !== '') {
      filename += `_${vendor}`;
    }
    filename += `_${new Date().toISOString().split('T')[0]}.zip`;

    console.log(`[ZIP] Creating archive: ${filename}`);

    // Set response headers
    res.setHeader('Content-Type', 'application/zip');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

    // Handle archive errors
    archive.on('error', (err) => {
      console.error('[ZIP] Archive error:', err);
      try {
        if (!res.headersSent) {
          res.status(500).json({ success: false, message: 'Failed to create archive', error: err.message });
        }
      } catch (e) {
        console.error('[ZIP] Error sending error response:', e);
      }
    });

    // Handle response errors
    res.on('error', (err) => {
      console.error('[ZIP] Response error:', err);
      if (archive) {
        archive.destroy();
      }
    });

    // Pipe archive to response
    archive.pipe(res);

    // Add each case as PDF to archive
    for (const record of records) {
      try {
        const verification = await Verification.findOne({ where: { recordId: record.id } });
        if (!verification) {
          console.log(`[ZIP] Skipping ${record.id} - no verification`);
          continue;
        }

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

        console.log(`[ZIP] Generating PDF for case ${record.id}...`);
        const pdfBuffer = await generateCasePDF(record, verification, vendorName, fieldOfficerName);
        const pdfFilename = generatePdfFilename(record);
        
        console.log(`[ZIP] Adding ${pdfFilename} (${pdfBuffer.length} bytes)`);
        archive.append(pdfBuffer, { name: pdfFilename });
      } catch (recordError) {
        console.error(`[ZIP] Error processing record ${record.id}:`, recordError);
        // Continue with next record instead of failing entire ZIP
      }
    }

    console.log('[ZIP] Finalizing archive...');
    archive.finalize();

  } catch (error) {
    console.error('[ZIP] Download error:', error);
    if (!res.headersSent) {
      res.status(500).json({ 
        success: false, 
        message: 'Failed to generate ZIP', 
        error: error.message 
      });
    }
    if (archive) {
      archive.destroy();
    }
  }
};
