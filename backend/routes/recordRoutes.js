const express = require('express');
const router = express.Router();
const recordController = require('../controllers/recordController_SQL');
const auth = require('../middleware/auth');

router.use(auth);

router.post('/bulk-upload', recordController.bulkUpload);
router.post('/manual', recordController.createManualRecord);
router.get('/dashboard-stats', recordController.getDashboardStats);
router.get('/', recordController.getAllRecords);
router.put('/:id/stop', recordController.stopRecord);
router.put('/:id/revert', recordController.revertRecord);
router.put('/:id/approve', recordController.approveRecord);
router.put('/:id/reject', recordController.rejectRecord);
router.put('/:id/reinitiate', recordController.reinitiateRecord);
router.get('/:id/verification', recordController.getRecordVerification);
router.get('/:id', recordController.getRecordById);
router.put('/:id', recordController.updateRecord);

module.exports = router;