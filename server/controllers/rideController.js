// server/controllers/rideController.js
const Ride = require('../models/Ride');

exports.createRide = async (req, res) => {
  try {
    const { origin, destination, departureTime, seatsAvailable, vehicleType } = req.body;
    const newRide = await Ride.create({
      driver: req.user._id, // Ensure `req.user` is populated by authentication middleware
      origin,
      destination,
      departureTime,
      seatsAvailable,
      vehicleType,
    });

    res.status(201).json({ message: 'Ride created', ride: newRide });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

exports.searchRides = async (req, res) => {
  try {
    const { origin, destination, vehicleType } = req.query;

    const rides = await Ride.find({
      origin: { $regex: origin, $options: 'i' },
      destination: { $regex: destination, $options: 'i' },
      vehicleType,
      seatsAvailable: { $gt: 0 },
    })
      .populate('driver', 'name rating')
      .sort('departureTime');

    res.status(200).json(rides);
  } catch (err) {
    res.status(500).json({ message: 'Search failed', error: err.message });
  }
};

exports.joinRide = async (req, res) => {
  try {
    const rideId = req.params.rideId;
    const userId = req.user._id;

    const ride = await Ride.findById(rideId);
    if (!ride) return res.status(404).json({ message: 'Ride not found' });

    if (ride.seatsAvailable <= 0) {
      return res.status(400).json({ message: 'No seats available' });
    }

    if (ride.passengers.includes(userId)) {
      return res.status(400).json({ message: 'Already joined' });
    }

    // Add user to passengers and decrement seats
    ride.passengers.push(userId);
    ride.seatsAvailable -= 1;
    await ride.save();

    // Optionally, update the user's joined rides (if you have a User model)
    // const user = await User.findById(userId);
    // user.joinedRides.push(rideId);
    // await user.save();

    res.status(200).json({ success: true, message: 'Ride joined successfully', ride });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

exports.findMatches = async (req, res) => {
  try {
    const { origin, destination } = req.body;

    const matches = await Ride.find({
      origin: { $regex: origin, $options: 'i' },
      destination: { $regex: destination, $options: 'i' },
      seatsAvailable: { $gt: 0 },
    }).populate('driver', 'name rating');

    res.status(200).json(matches);
  } catch (err) {
    res.status(500).json({ message: 'Failed to find matches', error: err.message });
  }
};

// server/controllers/rideController.js
const CompletedRide = require('../models/CompletedRide'); // <-- Import it

exports.completeRide = async (req, res) => {
  try {
    const { riderId, driverId, distanceKm, riderRating, driverRating } = req.body;

    const co2SavedKg = distanceKm * 0.121; // Assume 0.121 kg/km CO2 saved
    const greenPoints = Math.round(co2SavedKg * 10);

    const ride = await CompletedRide.create({
      rider: riderId,
      driver: driverId,
      distanceKm,
      co2SavedKg,
      greenPoints,
      riderRating,
      driverRating,
    });

    res.status(201).json({ message: 'Ride completed', ride });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

exports.getRideHistory = async (req, res) => {
  try {
    const userId = req.params.userId;

    // Fetch rides where the user is a driver or a passenger
    const rides = await Ride.find({
      $or: [
        { driver: userId },
        { passengers: userId }
      ]
    }).populate('driver', 'name').populate('passengers', 'name');

    res.status(200).json({ success: true, rides });
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch ride history', error: err.message });
  }
};

