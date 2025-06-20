# 🌱 GreenCommute - Eco-Friendly Ridesharing Platform

<div align="center">
  <img src="https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white" alt="Node.js" />
  <img src="https://img.shields.io/badge/Express.js-000000?style=for-the-badge&logo=express&logoColor=white" alt="Express.js" />
  <img src="https://img.shields.io/badge/MongoDB-4EA94B?style=for-the-badge&logo=mongodb&logoColor=white" alt="MongoDB" />
  <img src="https://img.shields.io/badge/Socket.io-010101?&style=for-the-badge&logo=Socket.io&logoColor=white" alt="Socket.IO" />
  <img src="https://img.shields.io/badge/JavaScript-323330?style=for-the-badge&logo=javascript&logoColor=F7DF1E" alt="JavaScript" />
</div>

## 🚀 Overview

GreenCommute is a comprehensive eco-friendly ridesharing platform that prioritizes environmental sustainability, user safety, and seamless commuting experiences. Built with modern web technologies, it offers a complete solution for connecting eco-conscious riders and drivers while tracking environmental impact.

## ✨ Key Features

### 🔐 **Authentication & Security**
- **Secure User Registration & Login** - JWT-based authentication
- **Protected Route Access** - Middleware-based authorization
- **Password Encryption** - bcryptjs for secure password hashing
- **Session Management** - Persistent user sessions

### 🚗 **Ride Management**
- **Create & Find Rides** - Intuitive ride creation and search functionality
- **Vehicle Type Selection** - Support for multiple vehicle types (car, bike, bus, electric)
- **Real-time Ride Updates** - Live status tracking and notifications
- **Ride History** - Secure access to personal ride history
- **Ride Completion** - Comprehensive ride completion with ratings and feedback

### 🛡️ **Safety Features**
- **Emergency Contacts** - Manage and access emergency contacts
- **Live Location Tracking** - Real-time GPS tracking during rides
- **Safety Alerts** - Automated safety notifications
- **Emergency Button** - One-tap emergency assistance
- **Driver Verification** - Verified driver badges and profiles
- **Safety Tips** - Comprehensive safety guidelines with visual icons
- **Incident Reporting** - Report and track safety incidents
- **Safety Score** - Personal safety rating system
- **Driver Profiles** - Avatar display with verification status

### 💚 **Environmental Impact**
- **Carbon Footprint Tracking** - Monitor CO2 savings from shared rides
- **Eco Statistics** - Personal and community environmental impact
- **Green Goals** - Set and track sustainability targets
- **Eco Community** - Connect with environmentally conscious users

### 💳 **Payment & Transactions**
- **Payment Methods** - Manage multiple payment options
- **Transaction History** - Complete payment tracking
- **Eco Rewards** - Earn points for sustainable choices
- **Cost Splitting** - Fair ride cost distribution

### ⚙️ **User Settings & Customization**
- **Theme Management** - Light/Dark mode with persistence
- **Eco Settings** - Carbon tracking preferences and green goals
- **Privacy Controls** - Location sharing and data privacy settings
- **App Preferences** - Notification and display customization
- **Profile Management** - Update personal information and preferences

### 📱 **User Experience**
- **Responsive Design** - Mobile-first, cross-device compatibility
- **Modern UI/UX** - Clean, intuitive interface with smooth animations
- **Progressive Web App** - App-like experience in the browser
- **Real-time Updates** - Socket.IO for live data synchronization
- **Offline Support** - Basic functionality without internet connection

## 🏗️ Technical Architecture

### **Backend Stack**
- **Node.js** - Runtime environment
- **Express.js** - Web application framework
- **MongoDB** - NoSQL database with Mongoose ODM
- **Socket.IO** - Real-time bidirectional communication
- **JWT** - JSON Web Token authentication
- **bcryptjs** - Password hashing and encryption

### **Frontend Stack**
- **Vanilla JavaScript** - Core functionality
- **HTML5** - Semantic markup
- **CSS3** - Modern styling with CSS Grid and Flexbox
- **FontAwesome** - Icon library
- **Socket.IO Client** - Real-time communication

### **Database Models**
- **User** - User profiles with authentication data
- **Ride** - Ride information and status
- **CompletedRide** - Historical ride data with ratings
- **Payment** - Payment methods and transaction records
- **UserSettings** - User preferences and configurations
- **Safety** - Emergency contacts and safety-related data

## 📂 Project Structure

```
smart-commute/
└── server/
    ├── package.json              # Project dependencies
    ├── server.js                 # Main server file
    ├── controllers/              # Business logic
    │   ├── authController.js     # Authentication logic
    │   ├── rideController.js     # Ride management
    │   ├── rideCompletion.js     # Ride completion logic
    │   ├── UserController.js     # User management
    │   ├── paymentController.js  # Payment processing
    │   ├── settingsController.js # User settings
    │   └── safetyController.js   # Safety features
    ├── models/                   # Database schemas
    │   ├── User.js              # User model
    │   ├── Ride.js              # Ride model
    │   ├── CompletedRide.js     # Completed ride model
    │   ├── Payment.js           # Payment model
    │   ├── UserSettings.js      # Settings model
    │   └── Safety.js            # Safety model
    ├── routes/                   # API endpoints
    │   ├── auth.js              # Authentication routes
    │   ├── ride.js              # Main API routes
    │   ├── rideRoutes.js        # Ride-specific routes
    │   └── userRoutes.js        # User-specific routes
    ├── utils/                    # Utility functions
    │   └── authMiddleware.js     # Authentication middleware
    └── public/                   # Frontend files
        └── index.html            # Single-page application
```

## 🚀 Installation & Setup

### Prerequisites
- Node.js (v14 or higher)
- MongoDB (local installation or MongoDB Atlas)
- Git

### 1. Clone the Repository
```bash
git clone https://github.com/yourusername/smart-commute.git
cd smart-commute/server
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Environment Configuration
Create a `.env` file in the server directory:
```env
MONGO_URI=mongodb://localhost:27017/greencommute
# OR for MongoDB Atlas:
# MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/greencommute

JWT_SECRET=your_super_secret_jwt_key_here
PORT=5000
NODE_ENV=development
```

### 4. Database Setup
Ensure MongoDB is running locally or configure MongoDB Atlas connection in your `.env` file.

### 5. Start the Application
```bash
# Development mode
node server.js

# Or with nodemon for auto-restart
npx nodemon server.js
```

### 6. Access the Application
Open your browser and navigate to:
```
http://localhost:5000
```

## 🔧 API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user info

### Rides
- `POST /api/rides` - Create a new ride
- `GET /api/rides` - Get available rides
- `GET /api/rides/my-rides` - Get user's ride history
- `PUT /api/rides/:id/complete` - Complete a ride

### Payments
- `GET /api/rides/payment-methods` - Get payment methods
- `POST /api/rides/payment-methods` - Add payment method
- `DELETE /api/rides/payment-methods/:id` - Delete payment method
- `GET /api/rides/transactions` - Get transaction history

### Settings
- `GET /api/rides/settings` - Get user settings
- `PUT /api/rides/settings` - Update user settings

### Safety
- `GET /api/rides/safety/emergency-contacts` - Get emergency contacts
- `POST /api/rides/safety/emergency-contacts` - Add emergency contact
- `DELETE /api/rides/safety/emergency-contacts/:id` - Delete emergency contact
- `POST /api/rides/safety/incident-report` - Report safety incident
- `GET /api/rides/safety/incidents` - Get incident history

## 🛡️ Security Features

### Authentication & Authorization
- JWT-based secure authentication
- Protected routes with middleware validation
- Password hashing with bcryptjs
- Session persistence and management

### Data Protection
- Secure user data handling
- Personal ride history access control
- Privacy settings for location sharing
- Encrypted sensitive information storage

### Safety Measures
- Real-time location tracking
- Emergency contact management
- Incident reporting system
- Driver verification badges
- Safety score calculations

## 🌍 Environmental Impact

GreenCommute helps reduce carbon emissions by:
- **Ride Sharing** - Fewer vehicles on the road
- **Carbon Tracking** - Monitor your environmental impact
- **Eco Goals** - Set and achieve sustainability targets
- **Green Community** - Connect with eco-conscious users
- **Impact Statistics** - Track collective environmental benefits

## 🎨 User Interface Features

### Modern Design
- Clean, intuitive interface
- Responsive design for all devices
- Smooth animations and transitions
- Accessibility-focused development

### Theme Support
- Light and dark mode options
- Theme persistence across sessions
- Consistent styling throughout the app
- User preference customization

### Interactive Elements
- Real-time updates and notifications
- Interactive maps and location services
- Modal dialogs for enhanced UX
- Progressive loading and feedback

## 🔄 Real-time Features

### Socket.IO Integration
- Live location tracking during rides
- Real-time ride status updates
- Instant messaging between users
- Live safety alerts and notifications

### Live Updates
- Ride availability changes
- Driver location updates
- Safety status monitoring
- Environmental impact tracking

## 📱 Progressive Web App Features

- **Offline Support** - Basic functionality without internet
- **App-like Experience** - Native app feel in the browser
- **Push Notifications** - Stay updated on ride status
- **Home Screen Installation** - Add to device home screen

## 🧪 Testing

### Manual Testing
1. User registration and login
2. Ride creation and search
3. Payment method management
4. Safety feature functionality
5. Settings and theme switching

### Automated Testing (Future Enhancement)
```bash
# Future implementation
npm test
```

## 🚀 Deployment

### Production Setup
1. **Environment Variables** - Configure production environment
2. **Database** - Set up MongoDB Atlas for cloud deployment
3. **Security** - Enable HTTPS and security headers
4. **Monitoring** - Implement logging and error tracking

### Deployment Platforms
- **Heroku** - Easy deployment with git integration
- **AWS** - Scalable cloud infrastructure
- **DigitalOcean** - Simple cloud hosting
- **Vercel** - Frontend deployment (for static files)

## 🤝 Contributing

We welcome contributions to GreenCommute! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Code Style
- Use consistent indentation (2 spaces)
- Follow JavaScript best practices
- Add comments for complex logic
- Test your changes thoroughly

## 📄 License

This project is licensed under the ISC License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

If you encounter any issues or have questions:

1. **Check the Issues** - Look through existing GitHub issues
2. **Create an Issue** - Report bugs or request features
3. **Documentation** - Review this README and code comments
4. **Community** - Join our eco-friendly commuting community

## 🙏 Acknowledgments

- **MongoDB** - For the robust database solution
- **Express.js** - For the excellent web framework
- **Socket.IO** - For real-time communication capabilities
- **FontAwesome** - For the beautiful icon library
- **bcryptjs** - For secure password hashing
- **JWT** - For secure authentication tokens

## 🔮 Future Enhancements

### Planned Features
- **Mobile App** - Native iOS and Android applications
- **Advanced Routing** - AI-powered route optimization
- **Machine Learning** - Predictive ride matching
- **Integration APIs** - Third-party service connections
- **Advanced Analytics** - Detailed environmental impact reports
- **Gamification** - Eco-challenges and rewards system

### Technical Improvements
- **Automated Testing** - Comprehensive test suite
- **Performance Optimization** - Caching and optimization
- **Microservices** - Scalable architecture refactoring
- **GraphQL** - Efficient data querying
- **Docker** - Containerized deployment
- **CI/CD Pipeline** - Automated testing and deployment

---

<div align="center">
  <p>🌱 Made with ❤️ for a greener future 🌍</p>
  <p>Join the eco-friendly commuting revolution with GreenCommute!</p>
</div>
