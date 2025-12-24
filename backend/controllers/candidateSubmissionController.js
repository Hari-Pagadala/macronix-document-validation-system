const Record = require('../models/Record_SQL');
const Verification = require('../models/Verification_SQL');
const CandidateToken = require('../models/CandidateToken_SQL');
const { validateCandidateToken, markTokenAsUsed } = require('../utils/candidateTokenUtils');
const { haversineDistanceMeters } = require('../utils/gpsDistance');

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
    const { body } = req;

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

    // Parse photo data (contains url, latitude, longitude, timestamp)
    const {
      candidateSelfieData,
      idProofData,
      houseDoorPhotoData,
      gpsLat,
      gpsLng,
      ownershipType,
      periodOfStay
    } = body;

    // Validate ownership details
    if (!ownershipType) {
      return res.status(400).json({
        success: false,
        message: 'Ownership type is required'
      });
    }

    if (!periodOfStay) {
      return res.status(400).json({
        success: false,
        message: 'Period of stay is required'
      });
    }

    // Validate required photos
    if (!candidateSelfieData) {
      return res.status(400).json({
        success: false,
        message: 'Candidate selfie is required'
      });
    }

    if (!idProofData) {
      return res.status(400).json({
        success: false,
        message: 'ID proof is required'
      });
    }

    if (!houseDoorPhotoData) {
      return res.status(400).json({
        success: false,
        message: 'House door photo is required'
      });
    }

    // Parse photo data objects
    const parsedCandidateSelfie = typeof candidateSelfieData === 'string' 
      ? JSON.parse(candidateSelfieData) 
      : candidateSelfieData;
    
    const parsedIdProof = typeof idProofData === 'string' 
      ? JSON.parse(idProofData) 
      : idProofData;
    
    const parsedHouseDoorPhoto = typeof houseDoorPhotoData === 'string' 
      ? JSON.parse(houseDoorPhotoData) 
      : houseDoorPhotoData;

    console.log('[Candidate] Photo metadata received:', {
      candidateSelfie: {
        url: parsedCandidateSelfie?.url,
        timestamp: parsedCandidateSelfie?.timestamp,
        coords: `${parsedCandidateSelfie?.latitude}, ${parsedCandidateSelfie?.longitude}`
      },
      idProof: {
        url: parsedIdProof?.url,
        timestamp: parsedIdProof?.timestamp,
        coords: `${parsedIdProof?.latitude}, ${parsedIdProof?.longitude}`
      },
      houseDoorPhoto: {
        url: parsedHouseDoorPhoto?.url,
        timestamp: parsedHouseDoorPhoto?.timestamp,
        coords: `${parsedHouseDoorPhoto?.latitude}, ${parsedHouseDoorPhoto?.longitude}`
      }
    });

    // Create verification record with photo metadata
    const submittedGpsLat = gpsLat || parsedCandidateSelfie?.latitude || null;
    const submittedGpsLng = gpsLng || parsedCandidateSelfie?.longitude || null;

    const verification = await Verification.create({
      recordId: record.id,
      fieldOfficerId: null, // No field officer for candidate submissions
      ownershipType,
      periodOfStay,
      gpsLat: submittedGpsLat || 0,
      gpsLng: submittedGpsLng || 0,
      candidateSelfieData: parsedCandidateSelfie,
      idProofData: parsedIdProof,
      houseDoorPhotoData: parsedHouseDoorPhoto,
      verifiedBy: `Candidate: ${validation.token.candidateName}`,
      status: 'submitted'
    });

    // Update record status to submitted
    const submittedAt = new Date();
    const distanceMeters = record.gpsLat && record.gpsLng && submittedGpsLat && submittedGpsLng
      ? haversineDistanceMeters(record.gpsLat, record.gpsLng, submittedGpsLat, submittedGpsLng)
      : null;

    const tatDue = record.tatDueDate ? new Date(record.tatDueDate) : null;
    const isLateSubmission = tatDue ? submittedAt > tatDue : false;

    await record.update({
      status: 'submitted',
      assignedFieldOfficer: null,
      completionDate: new Date(),
      submittedAt,
      isLateSubmission,
      submittedGpsLat: submittedGpsLat,
      submittedGpsLng: submittedGpsLng,
      gpsDistanceMeters: distanceMeters
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
