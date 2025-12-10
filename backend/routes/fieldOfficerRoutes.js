const express = require('express');
const router = express.Router();
const fieldOfficerController = require('../controllers/fieldOfficerController_SQL');
const auth = require('../middleware/auth');

router.use(auth);

router.post('/', fieldOfficerController.createFieldOfficer);
router.get('/', fieldOfficerController.getAllFieldOfficers);
router.get('/vendor/:vendorId', fieldOfficerController.getFieldOfficersByVendor);
router.get('/:id', fieldOfficerController.getFieldOfficerById);
router.put('/:id', fieldOfficerController.updateFieldOfficer);
router.patch('/:id/toggle-status', fieldOfficerController.toggleFieldOfficerStatus);

module.exports = router;