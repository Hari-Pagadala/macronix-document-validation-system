const express = require('express');
const router = express.Router();

const { getStaticMap } = require('../controllers/mapController');

// Public endpoint for static map image
router.get('/static', getStaticMap);

module.exports = router;
