// server/routes/userRoutes.js
const express = require('express');
const router = express.Router();
const {
  registerUser,
  loginUser,
  getUserProfile,
  rateUser,
  addGreenPoints
} = require('../controllers/UserController.js');
const { protect } = require('../utils/authMiddleware');

router.post('/register', registerUser);
router.post('/login', loginUser);
router.get('/profile', protect, getUserProfile);
router.post('/rate-user/:id', protect, rateUser);
router.post('/add-points/:id', protect, addGreenPoints);

module.exports = router;
