// server/models/CompletedRide.js
const mongoose = require('mongoose');

const completedRideSchema = new mongoose.Schema({
  rider: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  driver: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  distanceKm: { type: Number, required: true },
  co2SavedKg: { type: Number, required: true },
  greenPoints: { type: Number, required: true },
  riderRating: { type: Number },
  driverRating: { type: Number },
  completedAt: { type: Date, default: Date.now },
}, { timestamps: true });

module.exports = mongoose.model('CompletedRide', completedRideSchema);
