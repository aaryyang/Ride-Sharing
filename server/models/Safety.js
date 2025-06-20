const mongoose = require('mongoose');

const emergencyContactSchema = new mongoose.Schema({
  name: { type: String, required: true },
  phone: { type: String, required: true },
  relationship: { type: String, required: true }
});

const incidentReportSchema = new mongoose.Schema({
  type: { 
    type: String, 
    required: true,
    enum: ['harassment', 'reckless-driving', 'vehicle-issue', 'route-deviation', 'other']
  },
  rideId: { type: mongoose.Schema.Types.ObjectId, ref: 'Ride' },
  description: { type: String, required: true },
  severity: { 
    type: String, 
    required: true,
    enum: ['low', 'medium', 'high', 'emergency']
  },
  reporter: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  status: { 
    type: String, 
    default: 'pending',
    enum: ['pending', 'investigating', 'resolved', 'dismissed']
  },
  resolvedAt: { type: Date },
  adminNotes: { type: String }
}, { timestamps: true });

const safetySettingsSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  emergencyContacts: [emergencyContactSchema],
  liveTracking: { type: Boolean, default: true },
  safetyAlerts: { type: Boolean, default: true },
  shareLocationWithContacts: { type: Boolean, default: true },
  autoNotifyOnRideStart: { type: Boolean, default: true },
  safetyScore: { type: Number, default: 5.0, min: 0, max: 5 },
  totalRides: { type: Number, default: 0 },
  safetyReports: { type: Number, default: 0 },
  positiveFeedback: { type: Number, default: 0 }
}, { timestamps: true });

// Create separate models
const SafetySettings = mongoose.model('SafetySettings', safetySettingsSchema);
const IncidentReport = mongoose.model('IncidentReport', incidentReportSchema);

module.exports = {
  SafetySettings,
  IncidentReport
};
