const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, default: 'user' },
  rating: { type: Number, default: 0 },
  ratingsCount: { type: Number, default: 0 },
  greenPoints: { type: Number, default: 0 },
  verified: { type: Boolean, default: false },
  profilePicture: { type: String }, // URL to profile picture
  phone: { type: String },
  joinedDate: { type: Date, default: Date.now }
});

const User = mongoose.model('User', userSchema);

module.exports = User;