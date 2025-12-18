const express = require('express');
const router = express.Router();
const fieldOfficerController = require('../controllers/fieldOfficerController_SQL');
const fieldOfficerAuthController = require('../controllers/fieldOfficerAuthController_SQL');
const foAuth = require('../middleware/fieldOfficerAuth');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// File storage setup
const uploadDir = path.join(__dirname, '..', 'uploads', 'fo');
if (!fs.existsSync(uploadDir)) {
	fs.mkdirSync(uploadDir, { recursive: true });
}
const storage = multer.diskStorage({
	destination: (req, file, cb) => cb(null, uploadDir),
	filename: (req, file, cb) => {
		const unique = Date.now() + '-' + Math.round(Math.random() * 1e9);
		cb(null, unique + '-' + file.originalname.replace(/\s+/g, '_'));
	}
});
const upload = multer({ storage });

// Auth
router.post('/login', fieldOfficerAuthController.login);

// Protected: FO can fetch only their cases
router.get('/cases', foAuth, async (req, res) => {
	// Reuse controller logic but force foId from token
	req.query.foId = req.fieldOfficerId;
	return fieldOfficerController.getCasesForFieldOfficerPublic(req, res);
});

// Submit verification with files
router.post(
	'/cases/:caseId/submit',
	foAuth,
	upload.fields([
		{ name: 'documents', maxCount: 10 },
		{ name: 'photos', maxCount: 10 },
			{ name: 'selfieWithHouse', maxCount: 1 },
			{ name: 'candidateWithRespondent', maxCount: 1 },
			{ name: 'officerSignature', maxCount: 1 },
			{ name: 'respondentSignature', maxCount: 1 }
		]),
		fieldOfficerController.submitVerification
	);

module.exports = router;
