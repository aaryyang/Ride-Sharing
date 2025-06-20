// server.js
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const cors = require('cors');

// Import routes
const rideRoutes = require('./routes/ride');
const authRoutes = require('./routes/auth');
const { protect } = require('./utils/authMiddleware'); // Import the protect middleware

dotenv.config();
const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*'
  }
});

// Middleware
app.use(cors());
app.use(express.json());

// Serve static files from the 'public' directory
app.use(express.static('public'));

// Use routes
app.use('/api/rides', rideRoutes);
app.use('/api/auth', authRoutes);

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
