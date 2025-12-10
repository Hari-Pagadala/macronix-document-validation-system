const express = require('express');
const router = express.Router();
const vendorController = require('../controllers/vendorController_SQL');
const auth = require('../middleware/auth');

router.use(auth);

router.post('/', vendorController.createVendor);
router.get('/', vendorController.getAllVendors);
router.get('/active', vendorController.getActiveVendors);
router.get('/:id', vendorController.getVendorById);
router.put('/:id', vendorController.updateVendor);
router.patch('/:id/toggle-status', vendorController.toggleVendorStatus);

module.exports = router;