const express = require('express');
const router = express.Router();
const downloadController = require('../controllers/downloadController');
const auth = require('../middleware/auth');

// Download approved case as PDF (Super Admin only)
router.get('/case/:id/pdf', auth, downloadController.downloadApprovedCase);

// Download all approved cases as ZIP (Super Admin only)
router.get('/cases/zip', auth, downloadController.downloadApprovedCasesZip);

module.exports = router;
