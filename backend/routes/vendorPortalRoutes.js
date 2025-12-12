const express = require('express');
const router = express.Router();
const vendorAuth = require('../middleware/vendorAuth');
const vendorAuthController = require('../controllers/vendorAuthController_SQL');
const vendorPortalController = require('../controllers/vendorPortalController_SQL');
const vendorFieldOfficerController = require('../controllers/vendorFieldOfficerController_SQL');

// Auth routes (no auth required)
router.post('/login', vendorAuthController.vendorLogin);

// Protected routes (vendor auth required)
router.get('/profile', vendorAuth, vendorAuthController.getVendorProfile);
router.put('/profile', vendorAuth, vendorAuthController.updateVendorProfile);
router.put('/change-password', vendorAuth, vendorAuthController.changeVendorPassword);

// Dashboard
router.get('/dashboard/stats', vendorAuth, vendorPortalController.getVendorDashboardStats);

// Cases
router.get('/cases', vendorAuth, vendorPortalController.getVendorCases);
router.post('/cases/:caseId/assign-field-officer', vendorAuth, vendorPortalController.assignFieldOfficer);
router.put('/cases/:caseId/status', vendorAuth, vendorPortalController.updateCaseStatus);
router.get('/cases/:id', vendorAuth, vendorPortalController.getVendorCase);

// Field Officers
router.get('/field-officers', vendorAuth, vendorFieldOfficerController.getVendorFieldOfficers);
router.get('/field-officers/:id', vendorAuth, vendorFieldOfficerController.getVendorFieldOfficer);
router.post('/field-officers', vendorAuth, vendorFieldOfficerController.createFieldOfficer);
router.put('/field-officers/:id', vendorAuth, vendorFieldOfficerController.updateFieldOfficer);
router.put('/field-officers/:id/toggle-status', vendorAuth, vendorFieldOfficerController.toggleFieldOfficerStatus);
router.delete('/field-officers/:id', vendorAuth, vendorFieldOfficerController.deleteFieldOfficer);

module.exports = router;
