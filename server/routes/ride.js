// server/routes/ride.js
const express = require("express");
const { createRide, findMatches, searchRides } = require("../controllers/rideController");
const { completeRide } = require("../controllers/rideCompletion"); 
const {
  addPaymentMethod,
  getPaymentMethods,
  processRidePayment,
  getTransactionHistory,
  deletePaymentMethod,
  awardEcoBonus
} = require("../controllers/paymentController");
const {
  getUserSettings,
  updateUserSettings,
  getGreenStats,
  updateGreenGoals,
  addAchievement,
  resetSettings
} = require("../controllers/settingsController");
const {
  getSafetySettings,
  updateSafetySettings,
  addEmergencyContact,
  removeEmergencyContact,
  submitIncidentReport,
  getIncidentReports,
  updateSafetyScore,
  getSafetyStats
} = require("../controllers/safetyController");
const router = express.Router();
const Ride = require('../models/Ride'); // Ensure you have the Ride model imported
const { protect } = require('../utils/authMiddleware');
const { joinRide } = require('../controllers/rideController');


router.post('/create', protect, createRide);
router.get('/search', protect, searchRides);
router.post("/match", findMatches);
router.post('/complete', protect, completeRide);
router.post('/:rideId/join', protect, joinRide);

// Payment routes
router.post('/payment/methods', protect, addPaymentMethod);
router.get('/payment/methods', protect, getPaymentMethods);
router.post('/payment/process', protect, processRidePayment);
router.get('/payment/transactions', protect, getTransactionHistory);
router.delete('/payment/methods/:paymentMethodId', protect, deletePaymentMethod);
router.post('/payment/eco-bonus', protect, awardEcoBonus);

// Settings routes
router.get('/settings', protect, getUserSettings);
router.put('/settings', protect, updateUserSettings);
router.get('/settings/green-stats', protect, getGreenStats);
router.put('/settings/green-goals', protect, updateGreenGoals);
router.post('/settings/achievements', protect, addAchievement);
router.post('/settings/reset', protect, resetSettings);

// Safety routes
router.get('/safety/settings', protect, getSafetySettings);
router.put('/safety/settings', protect, updateSafetySettings);
router.post('/safety/emergency-contacts', protect, addEmergencyContact);
router.delete('/safety/emergency-contacts/:contactId', protect, removeEmergencyContact);
router.post('/safety/incident-reports', protect, submitIncidentReport);
router.get('/safety/incident-reports', protect, getIncidentReports);
router.put('/safety/score', protect, updateSafetyScore);
router.get('/safety/stats', protect, getSafetyStats);

// Get ride history for a user
router.get('/history/:userId', protect, async (req, res) => {
  try {
    const userId = req.params.userId;
    
    if (req.user._id.toString() !== userId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const CompletedRide = require('../models/CompletedRide');

    // ✅ THE EFFICIENCY FIX: Run both database queries in parallel
    // Also using .lean() to get plain JSON objects (much faster!)
    const [activeRides, completedRides] = await Promise.all([
      Ride.find({ $or: [{ driver: userId }, { passengers: userId }] })
          .populate('driver passengers', 'name')
          .lean(),
      CompletedRide.find({ $or: [{ rider: userId }, { driver: userId }] })
          .populate('rider driver', 'name')
          .lean()
    ]);

    // Tag the data so the frontend knows which is which
    const taggedActive = activeRides.map(r => ({ ...r, status: 'active' }));
    const taggedCompleted = completedRides.map(r => ({ ...r, status: 'completed' }));

    // Combine and sort by date (Newest first)
    const allRides = [...taggedActive, ...taggedCompleted].sort((a, b) => {
      return new Date(b.createdAt) - new Date(a.createdAt);
    });

    res.json(allRides);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch history' });
  }
});
module.exports = router;


