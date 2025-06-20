const { SafetySettings, IncidentReport } = require('../models/Safety');

// Get user's safety settings
const getSafetySettings = async (req, res) => {
  try {
    let safetySettings = await SafetySettings.findOne({ user: req.user._id });
    
    if (!safetySettings) {
      // Create default safety settings for new user
      safetySettings = new SafetySettings({
        user: req.user._id,
        emergencyContacts: [],
        liveTracking: true,
        safetyAlerts: true,
        shareLocationWithContacts: true,
        autoNotifyOnRideStart: true
      });
      await safetySettings.save();
    }
    
    res.json(safetySettings);
  } catch (error) {
    console.error('Error fetching safety settings:', error);
    res.status(500).json({ error: 'Failed to fetch safety settings' });
  }
};

// Update safety settings
const updateSafetySettings = async (req, res) => {
  try {
    const updates = req.body;
    delete updates.user; // Prevent user ID manipulation
    
    const safetySettings = await SafetySettings.findOneAndUpdate(
      { user: req.user._id },
      updates,
      { new: true, upsert: true }
    );
    
    res.json(safetySettings);
  } catch (error) {
    console.error('Error updating safety settings:', error);
    res.status(500).json({ error: 'Failed to update safety settings' });
  }
};

// Add emergency contact
const addEmergencyContact = async (req, res) => {
  try {
    const { name, phone, relationship } = req.body;
    
    if (!name || !phone || !relationship) {
      return res.status(400).json({ error: 'Name, phone, and relationship are required' });
    }
    
    let safetySettings = await SafetySettings.findOne({ user: req.user._id });
    
    if (!safetySettings) {
      safetySettings = new SafetySettings({ user: req.user._id });
    }
    
    // Check if contact limit is reached
    if (safetySettings.emergencyContacts.length >= 5) {
      return res.status(400).json({ error: 'Maximum 5 emergency contacts allowed' });
    }
    
    // Check if contact already exists
    const existingContact = safetySettings.emergencyContacts.find(
      contact => contact.phone === phone || contact.name.toLowerCase() === name.toLowerCase()
    );
    
    if (existingContact) {
      return res.status(400).json({ error: 'Contact already exists' });
    }
    
    safetySettings.emergencyContacts.push({ name, phone, relationship });
    await safetySettings.save();
    
    res.json({ message: 'Emergency contact added successfully', contact: { name, phone, relationship } });
  } catch (error) {
    console.error('Error adding emergency contact:', error);
    res.status(500).json({ error: 'Failed to add emergency contact' });
  }
};

// Remove emergency contact
const removeEmergencyContact = async (req, res) => {
  try {
    const { contactId } = req.params;
    
    const safetySettings = await SafetySettings.findOne({ user: req.user._id });
    
    if (!safetySettings) {
      return res.status(404).json({ error: 'Safety settings not found' });
    }
    
    safetySettings.emergencyContacts.id(contactId).remove();
    await safetySettings.save();
    
    res.json({ message: 'Emergency contact removed successfully' });
  } catch (error) {
    console.error('Error removing emergency contact:', error);
    res.status(500).json({ error: 'Failed to remove emergency contact' });
  }
};

// Submit incident report
const submitIncidentReport = async (req, res) => {
  try {
    const { type, rideId, description, severity } = req.body;
    
    if (!type || !description || !severity) {
      return res.status(400).json({ error: 'Type, description, and severity are required' });
    }
    
    const incidentReport = new IncidentReport({
      type,
      rideId: rideId || null,
      description,
      severity,
      reporter: req.user._id
    });
    
    await incidentReport.save();
    
    // Update safety score if needed
    if (severity === 'high' || severity === 'emergency') {
      await SafetySettings.findOneAndUpdate(
        { user: req.user._id },
        { $inc: { safetyReports: 1 } }
      );
    }
    
    res.json({ message: 'Incident report submitted successfully', reportId: incidentReport._id });
  } catch (error) {
    console.error('Error submitting incident report:', error);
    res.status(500).json({ error: 'Failed to submit incident report' });
  }
};

// Get user's incident reports
const getIncidentReports = async (req, res) => {
  try {
    const reports = await IncidentReport.find({ reporter: req.user._id })
      .populate('rideId', 'origin destination departureTime')
      .sort({ createdAt: -1 });
    
    res.json(reports);
  } catch (error) {
    console.error('Error fetching incident reports:', error);
    res.status(500).json({ error: 'Failed to fetch incident reports' });
  }
};

// Calculate and update safety score
const updateSafetyScore = async (req, res) => {
  try {
    const safetySettings = await SafetySettings.findOne({ user: req.user._id });
    
    if (!safetySettings) {
      return res.status(404).json({ error: 'Safety settings not found' });
    }
    
    // Calculate safety score based on various factors
    let score = 5.0;
    
    // Reduce score based on safety reports
    if (safetySettings.safetyReports > 0) {
      score -= (safetySettings.safetyReports * 0.5);
    }
    
    // Increase score based on positive feedback percentage
    if (safetySettings.totalRides > 0) {
      const positiveFeedbackRate = safetySettings.positiveFeedback / safetySettings.totalRides;
      score = score * positiveFeedbackRate;
    }
    
    // Ensure score is between 0 and 5
    score = Math.max(0, Math.min(5, score));
    
    safetySettings.safetyScore = parseFloat(score.toFixed(1));
    await safetySettings.save();
    
    res.json({ safetyScore: safetySettings.safetyScore });
  } catch (error) {
    console.error('Error updating safety score:', error);
    res.status(500).json({ error: 'Failed to update safety score' });
  }
};

// Record positive feedback (called when ride is completed successfully)
const recordPositiveFeedback = async (userId) => {
  try {
    await SafetySettings.findOneAndUpdate(
      { user: userId },
      { 
        $inc: { 
          totalRides: 1,
          positiveFeedback: 1 
        }
      },
      { upsert: true }
    );
  } catch (error) {
    console.error('Error recording positive feedback:', error);
  }
};

// Get safety statistics
const getSafetyStats = async (req, res) => {
  try {
    let safetySettings = await SafetySettings.findOne({ user: req.user._id });
    
    if (!safetySettings) {
      // Create default safety settings for new user
      safetySettings = new SafetySettings({
        user: req.user._id,
        emergencyContacts: [],
        liveTracking: true,
        safetyAlerts: true,
        shareLocationWithContacts: true,
        autoNotifyOnRideStart: true,
        safetyScore: 5.0,
        totalRides: 0,
        safetyReports: 0,
        positiveFeedback: 0
      });
      await safetySettings.save();
    }
    
    const positiveFeedbackRate = safetySettings.totalRides > 0 
      ? Math.round((safetySettings.positiveFeedback / safetySettings.totalRides) * 100)
      : 100; // Default to 100% for new users
    
    res.json({
      safetyScore: safetySettings.safetyScore,
      totalRides: safetySettings.totalRides,
      safetyReports: safetySettings.safetyReports,
      positiveFeedbackRate
    });
  } catch (error) {
    console.error('Error fetching safety stats:', error);
    res.status(500).json({ error: 'Failed to fetch safety stats' });
  }
};

module.exports = {
  getSafetySettings,
  updateSafetySettings,
  addEmergencyContact,
  removeEmergencyContact,
  submitIncidentReport,
  getIncidentReports,
  updateSafetyScore,
  recordPositiveFeedback,
  getSafetyStats
};
