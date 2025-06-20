// server/models/UserSettings.js
const mongoose = require('mongoose');

const UserSettingsSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  vehiclePreferences: {
    electric: { type: Boolean, default: true },
    hybrid: { type: Boolean, default: true },
    bike: { type: Boolean, default: false },
    public: { type: Boolean, default: false }
  },
  notifications: {
    ecoRides: { type: Boolean, default: true },
    co2Report: { type: Boolean, default: true },
    achievements: { type: Boolean, default: true },
    challenges: { type: Boolean, default: false }
  },
  ridePreferences: {
    maxDistance: { type: String, default: '25', enum: ['10', '25', '50', '100', 'unlimited'] },
    preferredTime: { type: String, default: 'evening', enum: ['morning', 'afternoon', 'evening', 'night', 'anytime'] }
  },
  privacy: {
    profileVisibility: { 
      type: String, 
      default: 'eco-community', 
      enum: ['public', 'eco-community', 'connections', 'private'] 
    },
    locationSharing: { type: Boolean, default: true }
  },
  appPreferences: {
    theme: { type: String, default: 'green', enum: ['green', 'blue', 'dark'] },
    distanceUnit: { type: String, default: 'km', enum: ['km', 'mi'] },
    currency: { type: String, default: 'INR', enum: ['INR', 'USD', 'EUR', 'GBP'] }
  },
  greenGoals: {
    monthlyCO2Target: { type: Number, default: 50 }, // kg CO₂
    monthlyRidesTarget: { type: Number, default: 20 }, // number of rides
    greenPointsTarget: { type: Number, default: 1000 } // green points
  },
  achievements: [{
    type: { type: String, required: true },
    name: { type: String, required: true },
    description: { type: String, required: true },
    dateEarned: { type: Date, default: Date.now },
    icon: { type: String, required: true }
  }]
}, {
  timestamps: true
});

// Static method to get default settings
UserSettingsSchema.statics.getDefaultSettings = function() {
  return {
    vehiclePreferences: {
      electric: true,
      hybrid: true,
      bike: false,
      public: false
    },
    notifications: {
      ecoRides: true,
      co2Report: true,
      achievements: true,
      challenges: false
    },
    ridePreferences: {
      maxDistance: '25',
      preferredTime: 'evening'
    },
    privacy: {
      profileVisibility: 'eco-community',
      locationSharing: true
    },
    appPreferences: {
      theme: 'green',
      distanceUnit: 'km',
      currency: 'INR'
    },
    greenGoals: {
      monthlyCO2Target: 50,
      monthlyRidesTarget: 20,
      greenPointsTarget: 1000
    },
    achievements: []
  };
};

module.exports = mongoose.model('UserSettings', UserSettingsSchema);
