// server/controllers/userController.js
const User = require('../models/User');
const jwt = require('jsonwebtoken');

const generateToken = (user) => {
  return jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '7d' });
};

exports.registerUser = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) return res.status(400).json({ message: 'User already exists' });

    const newUser = await User.create({ name, email, password, role });
    const token = generateToken(newUser);
    res.status(201).json({ user: newUser, token });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

exports.loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user || !(await user.matchPassword(password))) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const token = generateToken(user);
    res.status(200).json({ user, token });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

exports.getUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    res.status(200).json(user);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.rateUser = async (req, res) => {
  try {
    const { rating } = req.body;
    const userToRate = await User.findById(req.params.id);
    if (!userToRate) return res.status(404).json({ message: 'User not found' });

    const totalRating = userToRate.rating * userToRate.ratingsCount;
    userToRate.ratingsCount += 1;
    userToRate.rating = (totalRating + rating) / userToRate.ratingsCount;

    await userToRate.save();
    res.status(200).json({ message: 'User rated successfully', rating: userToRate.rating });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.addGreenPoints = async (req, res) => {
  try {
    const { points } = req.body;
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    user.greenPoints += points;
    await user.save();
    res.status(200).json({ message: 'Green points updated', greenPoints: user.greenPoints });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};
