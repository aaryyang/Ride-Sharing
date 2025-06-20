const mongoose = require('mongoose');

const rideSchema = new mongoose.Schema({
  origin: { type: String, required: true },
  destination: { type: String, required: true },
  departureTime: { type: Date, required: true },
  seatsAvailable: { type: Number, required: true },
  vehicleType: { type: String },

  driver: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  passengers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],

  // Optional for completed rides
  rider: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  distanceKm: { type: Number },
  co2SavedKg: { type: Number },
  greenPoints: { type: Number },
  riderRating: { type: Number },
  driverRating: { type: Number },
  completedAt: { type: Date }
}, { timestamps: true });

module.exports = mongoose.model('Ride', rideSchema);
