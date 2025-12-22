const Record = require('../models/Record_SQL');
const Verification = require('../models/Verification_SQL');
const CandidateToken = require('../models/CandidateToken_SQL');
const { validateCandidateToken, markTokenAsUsed } = require('../utils/candidateTokenUtils');
const path = require('path');
const fs = require('fs');

/**
 * Validate candidate token and get case details
 */
exports.validateToken = async (req, res) => {
  try {
    const { token } = req.params;

    const validation = await validateCandidateToken(token);

    if (!validation.valid) {
      return res.status(400).json({
        success: false,
        message: validation.error
      });
    }

    const record = await Record.findByPk(validation.recordId);

    if (!record) {
      return res.status(404).json({
        success: false,
        message: 'Case not found'
      });
    }

    // Check if case status is still CANDIDATE_ASSIGNED
    if (record.status !== 'candidate_assigned') {
      return res.status(400).json({
        success: false,
        message: 'This case is no longer available for submission'
      });
    }

    // Return case details and candidate info
    res.json({
      success: true,
      caseDetails: {
        caseNumber: record.caseNumber,
        referenceNumber: record.referenceNumber,
        fullName: record.fullName,
        fatherName: record.fatherName,
        age: record.age,
        gender: record.gender,
        mobileNumber: record.contactNumber,
        address: record.address,
        city: record.district,
        state: record.state,
        pincode: record.pincode
      },
      candidateInfo: {
        name: validation.token.candidateName,
        email: validation.token.candidateEmail,
        mobile: validation.token.candidateMobile
      },
      expiresAt: validation.token.expiresAt
    });

  } catch (error) {
    console.error('Token validation error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to validate token',
      error: error.message
    });
  }
};

/**
 * Submit verification by candidate
 */
exports.submitVerification = async (req, res) => {
  try {
    const { token } = req.params;
    const { body, files } = req;

    console.log('[Candidate] Submission received for token:', token);

    // Validate token
    const validation = await validateCandidateToken(token);
    if (!validation.valid) {
      return res.status(400).json({
        success: false,
        message: validation.error
      });
    }

    const record = await Record.findByPk(validation.recordId);

    if (!record) {
      return res.status(404).json({
        success: false,
        message: 'Case not found'
      });
    }

    if (record.status !== 'candidate_assigned') {
      return res.status(400).json({
        success: false,
        message: 'This case is no longer available for submission'
      });
    }

    // Parse body data (multipart form data)
    const parseField = (field) => {
      if (typeof field === 'string') {
        try {
          return JSON.parse(field);
        } catch {
          return field;
        }
      }
      return field;
    };

    const {
      address,
      pincode,
      landmark,
      city,
      state,
      ownershipType,
      ownerName,
      relationWithOwner,
      periodOfStay,
      gpsLat,
      gpsLng,
      verificationNotes,
      candidateSelfie,
      housePhoto,
      selfieWithHouse,
      candidateSignature,
      documents
    } = body;

    // Validate required fields
    if (!address || !pincode || !city || !state) {
      return res.status(400).json({
        success: false,
        message: 'Address details are required'
      });
    }

    if (!ownershipType) {
      return res.status(400).json({
        success: false,
        message: 'Ownership type is required'
      });
    }

    if (!gpsLat || !gpsLng) {
      return res.status(400).json({
        success: false,
        message: 'GPS location is required'
      });
    }

    // Check for required signature
    const hasSignature = !!(candidateSignature || req.files?.candidateSignature);

    if (!hasSignature) {
      return res.status(400).json({
        success: false,
        message: 'Signature is required'
      });
    }

    // Process file uploads (ImageKit URLs or multer files)
    const uploadDir = path.join(__dirname, '..', 'uploads', 'candidate');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    let candidateSignaturePath = typeof candidateSignature === 'string' ? candidateSignature : null;
    let docUrls = [];
    let candidateSelfieUrl = typeof candidateSelfie === 'string' ? candidateSelfie : null;
    let housePhotoUrl = typeof housePhoto === 'string' ? housePhoto : null;
    let selfieUrl = typeof selfieWithHouse === 'string' ? selfieWithHouse : null;

    // Handle multer files if present
    if (req.files) {
      if (req.files.candidateSignature?.[0]) {
        candidateSignaturePath = req.files.candidateSignature[0].filename;
      }
      if (req.files.documents) {
        docUrls = req.files.documents.map(f => f.filename);
      }
      if (req.files.candidateSelfie?.[0]) {
        candidateSelfieUrl = req.files.candidateSelfie[0].filename;
      }
      if (req.files.housePhoto?.[0]) {
        housePhotoUrl = req.files.housePhoto[0].filename;
      }
      if (req.files.selfieWithHouse?.[0]) {
        selfieUrl = req.files.selfieWithHouse[0].filename;
      }
    }

    // Parse array URLs from ImageKit
    if (typeof documents === 'string') {
      try {
        const parsed = JSON.parse(documents);
        docUrls = Array.isArray(parsed) ? parsed : [];
      } catch (e) {
        console.error('[Candidate] Failed to parse documents:', e);
      }
    }

    // Create verification record
    const verification = await Verification.create({
      recordId: record.id,
      fieldOfficerId: null, // No field officer for candidate submissions
      periodOfStay: periodOfStay || null,
      address,
      pincode,
      landmark: landmark || null,
      city,
      state,
      ownershipType,
      ownerName: ownerName || null,
      relationWithOwner: relationWithOwner || null,
      gpsLat: parseFloat(gpsLat),
      gpsLng: parseFloat(gpsLng),
      verificationNotes: verificationNotes || null,
      selfieWithHousePath: selfieUrl,
      candidateWithRespondentPath: candidateSelfieUrl, // Store candidate selfie here
      documents: docUrls.length > 0 ? docUrls : [],
      photos: housePhotoUrl ? [housePhotoUrl] : [], // Store house photo here
      officerSignaturePath: candidateSignaturePath, // Store candidate signature here
      respondentSignaturePath: null, // Not used anymore
      verifiedBy: `Candidate: ${validation.token.candidateName}`,
      status: 'submitted'
    });

    // Update record status to submitted
    await record.update({
      status: 'submitted',
      assignedFieldOfficer: null, // Clear FO assignment
      completionDate: new Date() // Set completion date
    });

    // Mark token as used
    const ipAddress = req.ip || req.connection.remoteAddress;
    await markTokenAsUsed(token, ipAddress);

    console.log('[Candidate] Verification submitted successfully:', verification.id);

    res.json({
      success: true,
      message: 'Verification submitted successfully',
      verificationId: verification.id,
      caseNumber: record.caseNumber
    });

  } catch (error) {
    console.error('[Candidate] Submission error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to submit verification',
      error: error.message
    });
  }
};
