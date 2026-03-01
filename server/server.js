// server.js
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

// Import routes
const rideRoutes = require('./routes/ride');
const authRoutes = require('./routes/auth');
const { protect } = require('./utils/authMiddleware'); // Import the protect middleware

// Import models for public stats
const User = require('./models/User');
const CompletedRide = require('./models/CompletedRide');

dotenv.config();
const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*'
  }
});

// Security headers with CSP configured for frontend dependencies
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "https://unpkg.com"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://unpkg.com", "https://cdnjs.cloudflare.com", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com", "https://cdnjs.cloudflare.com"],
      imgSrc: ["'self'", "data:", "https:", "blob:"],
      connectSrc: ["'self'", "wss:", "ws:", "https://unpkg.com", "https://nominatim.openstreetmap.org"],
      scriptSrcAttr: ["'unsafe-inline'"],
    },
  },
}));

// Rate limiting: max 20 auth requests per 15 minutes per IP
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: { message: 'Too many requests, please try again later.' }
});

// General API rate limit: 100 requests per 15 minutes
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: { message: 'Too many requests, please try again later.' }
});

// Middleware
app.use(cors());
app.use(express.json());
app.use('/api/auth', authLimiter);
app.use('/api', apiLimiter);

// Serve static files from the 'public' directory
app.use(express.static('public'));

// Use routes
app.use('/api/rides', rideRoutes);
app.use('/api/auth', authRoutes);

// Public stats endpoint — no auth required
app.get('/api/stats', async (req, res) => {
  try {
    const [totalUsers, totalRides, co2Result] = await Promise.all([
      User.countDocuments(),
      CompletedRide.countDocuments(),
      CompletedRide.aggregate([
        { $group: { _id: null, totalCo2: { $sum: '$co2SavedKg' } } }
      ])
    ]);
    const totalCo2Kg = co2Result.length > 0 ? co2Result[0].totalCo2 : 0;
    res.json({ totalUsers, totalRides, totalCo2Kg });
  } catch (err) {
    res.status(500).json({ message: 'Failed to load stats' });
  }
});

// Health check route
app.get('/', (req, res) => {
  res.send('Backend is working!');
});

// Test protect route
app.get('/api/test-protect', protect, (req, res) => {
  res.json({ message: 'Protected route accessed', user: req.user });
});

// Socket connection
io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  socket.on('locationUpdate', ({ userId, coords }) => {
    socket.broadcast.emit('locationUpdate', { userId, coords });
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

// MongoDB connect + routes
mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    server.listen(process.env.PORT || 5000, () => {
      console.log('Server and Socket.IO running on port', process.env.PORT || 5000);
    });
  })
  .catch(err => console.error(err));
