const express = require('express');
const router = express.Router();
const reportController = require('../controllers/reportController_SQL');
const vendorAuth = require('../middleware/vendorAuth');

// Super Admin: Download cases report with filters
router.get('/download-cases', reportController.downloadCasesReport);

// Vendor: Download vendor cases report (with authentication)
router.get('/vendor/download-cases', vendorAuth, reportController.downloadVendorCasesReport);

module.exports = router;
