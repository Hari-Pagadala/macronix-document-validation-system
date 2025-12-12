const express = require('express');
const router = express.Router();
const fieldOfficerController = require('../controllers/fieldOfficerController_SQL');
const fieldOfficerAuthController = require('../controllers/fieldOfficerAuthController_SQL');
const foAuth = require('../middleware/fieldOfficerAuth');

// Auth
router.post('/login', fieldOfficerAuthController.login);

// Protected: FO can fetch only their cases
router.get('/cases', foAuth, async (req, res) => {
	// Reuse controller logic but force foId from token
	req.query.foId = req.fieldOfficerId;
	return fieldOfficerController.getCasesForFieldOfficerPublic(req, res);
});

module.exports = router;
