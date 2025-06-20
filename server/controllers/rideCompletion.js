const express = require('express');
const router = express.Router();
const CompletedRide = require('../models/CompletedRide');
const Ride = require('../models/Ride'); // <-- Make sure this is imported!
const User = require('../models/User');
const { recordPositiveFeedback } = require('./safetyController');

exports.completeRide = async (req, res) => {
  const { rideId, riderId, driverId, distanceKm, riderRating, driverRating } = req.body;

  const CO2_PER_KM = 0.121;
  const co2Saved = distanceKm * CO2_PER_KM;
  const greenPoints = Math.floor(co2Saved * 10);

  // ✅ Delete the active ride properly
  const originalRide = await Ride.findByIdAndDelete(rideId);
  if (!originalRide) {
    return res.status(404).json({ error: 'Active ride not found' });
  }

  // ✅ Create the completed ride
  const completedRide = await CompletedRide.create({
    rider: riderId,
    driver: driverId,
    distanceKm,
    co2SavedKg: co2Saved,
    greenPoints,
    riderRating,
    driverRating
  });

  // ✅ Update users
  const rider = await User.findById(riderId);
  const driver = await User.findById(driverId);

  rider.greenPoints += greenPoints;
  driver.greenPoints += greenPoints;

  if (driverRating) {
    driver.rating = ((driver.rating * driver.ratingsCount) + driverRating) / (driver.ratingsCount + 1);
    driver.ratingsCount += 1;
  }

  if (riderRating) {
    rider.rating = ((rider.rating * rider.ratingsCount) + riderRating) / (rider.ratingsCount + 1);
    rider.ratingsCount += 1;
  }
  await rider.save();
  await driver.save();

  // Record positive feedback for safety scoring (if ratings are good)
  try {
    if (riderRating >= 4) {
      await recordPositiveFeedback(riderId);
    }
    if (driverRating >= 4) {
      await recordPositiveFeedback(driverId);
    }
  } catch (error) {
    console.error('Error recording safety feedback:', error);
  }

  res.json({ message: 'Ride completed', ride: completedRide });
};

