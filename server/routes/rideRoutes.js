const express = require('express');
const router = express.Router();
const { createRide, searchRides, joinRide } = require('../controllers/rideController');
const { protect } = require('../utils/authMiddleware');

router.post('/', protect, createRide);
router.get('/search', protect, searchRides);
router.post('/join/:id', protect, joinRide);

module.exports = router;