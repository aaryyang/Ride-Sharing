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
    const { origin, destination, vehicleType, date, minSeats } = req.query;

    const query = { seatsAvailable: { $gt: 0 } };
    if (origin && origin.trim()) query.origin = { $regex: origin.trim(), $options: 'i' };
    if (destination && destination.trim()) query.destination = { $regex: destination.trim(), $options: 'i' };
    if (vehicleType) query.vehicleType = vehicleType;
    if (minSeats) query.seatsAvailable = { $gte: parseInt(minSeats) };
    if (date) {
      const start = new Date(date); start.setHours(0, 0, 0, 0);
      const end = new Date(date); end.setHours(23, 59, 59, 999);
      query.departureTime = { $gte: start, $lte: end };
    }

    const rides = await Ride.find(query)
      .populate('driver', 'name rating')
      .sort('departureTime');

    res.status(200).json(rides);
  } catch (err) {
    res.status(500).json({ message: 'Search failed', error: err.message });
  }
};

exports.joinRide = async (req, res) => {
  try {
    const { rideId } = req.params;
    const userId = req.user._id;

    // ✅ THE ATOMIC FIX: 
    // We only find the ride IF seats > 0 AND the user is NOT already a passenger
    const ride = await Ride.findOneAndUpdate(
      {
        _id: rideId,
        seatsAvailable: { $gt: 0 },         // Parity check: must have seats
        passengers: { $ne: userId }         // Security check: user not already inside
      },
      {
        $inc: { seatsAvailable: -1 },       // Subtract 1 seat atomically
        $push: { passengers: userId }       // Add user to array atomically
      },
      { new: true } // Return the updated document
    );

    if (!ride) {
      // If the query above fails, it's either full or you're already in it
      return res.status(400).json({
        message: 'Join failed: Ride is full or you have already joined.'
      });
    }

    res.status(200).json({ success: true, message: 'Joined successfully!', ride });
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

    // ✅ THE FIX: Verify the person clicking "Complete" is the actual driver
    if (req.user._id.toString() !== driverId) {
      return res.status(403).json({
        message: 'Access denied: Only the assigned driver can complete this ride.'
      });
    }

    const co2SavedKg = distanceKm * 0.121; // Assume 0.121 kg/km CO2 saved
    const greenPoints = Math.round(co2SavedKg * 10);

    const ride = await CompletedRide.create({
      rider: riderId,
      driver: req.user._id,
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

