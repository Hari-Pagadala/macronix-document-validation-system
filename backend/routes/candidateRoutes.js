const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const candidateSubmissionController = require('../controllers/candidateSubmissionController');

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '..', 'uploads', 'candidate'));
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|pdf/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only .png, .jpg, .jpeg and .pdf formats allowed!'));
    }
  }
});

// Public routes (no authentication required)

/**
 * @route   GET /api/candidate/validate/:token
 * @desc    Validate candidate token and get case details
 * @access  Public
 */
router.get('/validate/:token', candidateSubmissionController.validateToken);

/**
 * @route   POST /api/candidate/submit/:token
 * @desc    Submit verification by candidate
 * @access  Public (token-based)
 */
router.post(
  '/submit/:token',
  upload.fields([
    { name: 'candidateSelfie', maxCount: 1 },
    { name: 'housePhoto', maxCount: 1 },
    { name: 'selfieWithHouse', maxCount: 1 },
    { name: 'candidateSignature', maxCount: 1 },
    { name: 'documents', maxCount: 10 }
  ]),
  candidateSubmissionController.submitVerification
);

module.exports = router;
