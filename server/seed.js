// seed.js — Wipes all collections and loads fresh demo data
// Usage: node seed.js

require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const User = require('./models/User');
const Ride = require('./models/Ride');
const CompletedRide = require('./models/CompletedRide');
const { PaymentMethod } = require('./models/Payment');
const { SafetySettings } = require('./models/Safety');
const UserSettings = require('./models/UserSettings');

async function seed() {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected. Wiping all collections...');

    await Promise.all([
        User.deleteMany({}),
        Ride.deleteMany({}),
        CompletedRide.deleteMany({}),
        PaymentMethod.deleteMany({}),
        SafetySettings.deleteMany({}),
        UserSettings.deleteMany({}),
    ]);
    console.log('All collections cleared.');

    // ─── USERS ─────────────────────────────────────────────────
    const password = await bcrypt.hash('password123', 10);

    const users = await User.insertMany([
        {
            name: 'Aarav Mehta',
            email: 'aarav@greencommute.com',
            password,
            role: 'driver',
            rating: 4.8,
            ratingsCount: 42,
            greenPoints: 980,
            verified: true,
            phone: '9876543210',
        },
        {
            name: 'Sneha Rao',
            email: 'sneha@greencommute.com',
            password,
            role: 'user',
            rating: 4.5,
            ratingsCount: 18,
            greenPoints: 540,
            verified: true,
            phone: '9123456789',
        },
        {
            name: 'Kunal Patil',
            email: 'kunal@greencommute.com',
            password,
            role: 'driver',
            rating: 4.7,
            ratingsCount: 31,
            greenPoints: 720,
            verified: true,
            phone: '9988776655',
        },
        {
            name: 'Priya Singh',
            email: 'priya@greencommute.com',
            password,
            role: 'user',
            rating: 4.3,
            ratingsCount: 9,
            greenPoints: 210,
            verified: false,
            phone: '9001122334',
        },
        {
            name: 'Rahul Sharma',
            email: 'rahul@greencommute.com',
            password,
            role: 'driver',
            rating: 4.9,
            ratingsCount: 67,
            greenPoints: 1450,
            verified: true,
            phone: '9845001234',
        },
        // Demo login account — easy for interviews
        {
            name: 'Demo User',
            email: 'demo@greencommute.com',
            password,
            role: 'user',
            rating: 4.0,
            ratingsCount: 3,
            greenPoints: 120,
            verified: true,
            phone: '9000000000',
        },
    ]);

    const [aarav, sneha, kunal, priya, rahul, demo] = users;
    console.log(`Created ${users.length} users.`);

    // ─── RIDES (upcoming) ─────────────────────────────────────
    const now = new Date();
    const h = (n) => new Date(now.getTime() + n * 60 * 60 * 1000); // n hours from now

    const rides = await Ride.insertMany([
        {
            driver: aarav._id,
            origin: 'Bandra West, Mumbai',
            destination: 'Andheri East, Mumbai',
            departureTime: h(1),
            seatsAvailable: 3,
            vehicleType: 'electric',
            passengers: [],
        },
        {
            driver: kunal._id,
            origin: 'Koramangala, Bangalore',
            destination: 'Whitefield, Bangalore',
            departureTime: h(2),
            seatsAvailable: 2,
            vehicleType: 'car',
            passengers: [],
        },
        {
            driver: rahul._id,
            origin: 'Connaught Place, Delhi',
            destination: 'Gurugram Cyber City, Delhi',
            departureTime: h(3),
            seatsAvailable: 4,
            vehicleType: 'car',
            passengers: [sneha._id],
        },
        {
            driver: aarav._id,
            origin: 'Powai, Mumbai',
            destination: 'BKC, Mumbai',
            departureTime: h(4),
            seatsAvailable: 2,
            vehicleType: 'bike',
            passengers: [],
        },
        {
            driver: kunal._id,
            origin: 'HSR Layout, Bangalore',
            destination: 'Electronic City, Bangalore',
            departureTime: h(5),
            seatsAvailable: 3,
            vehicleType: 'electric',
            passengers: [],
        },
        {
            driver: rahul._id,
            origin: 'Salt Lake, Kolkata',
            destination: 'Howrah, Kolkata',
            departureTime: h(6),
            seatsAvailable: 1,
            vehicleType: 'bus',
            passengers: [priya._id, demo._id],
        },
        {
            driver: aarav._id,
            origin: 'Viman Nagar, Pune',
            destination: 'Hinjewadi, Pune',
            departureTime: h(8),
            seatsAvailable: 3,
            vehicleType: 'car',
            passengers: [],
        },
    ]);
    console.log(`Created ${rides.length} upcoming rides.`);

    // ─── COMPLETED RIDES ──────────────────────────────────────
    const d = (n) => new Date(now.getTime() - n * 24 * 60 * 60 * 1000); // n days ago

    const completedRides = await CompletedRide.insertMany([
        { rider: sneha._id, driver: aarav._id, origin: 'Bandra West, Mumbai', destination: 'Andheri East, Mumbai', distanceKm: 12, co2SavedKg: 2.4, greenPoints: 24, riderRating: 5, driverRating: 5, completedAt: d(1) },
        { rider: priya._id, driver: kunal._id, origin: 'Koramangala, Bangalore', destination: 'Whitefield, Bangalore', distanceKm: 18, co2SavedKg: 3.6, greenPoints: 36, riderRating: 4, driverRating: 5, completedAt: d(2) },
        { rider: demo._id, driver: rahul._id, origin: 'Connaught Place, Delhi', destination: 'Gurugram Cyber City', distanceKm: 25, co2SavedKg: 5.0, greenPoints: 50, riderRating: 5, driverRating: 4, completedAt: d(3) },
        { rider: sneha._id, driver: rahul._id, origin: 'Salt Lake, Kolkata', destination: 'Howrah, Kolkata', distanceKm: 9, co2SavedKg: 1.8, greenPoints: 18, riderRating: 4, driverRating: 5, completedAt: d(5) },
        { rider: priya._id, driver: aarav._id, origin: 'Powai, Mumbai', destination: 'BKC, Mumbai', distanceKm: 14, co2SavedKg: 2.8, greenPoints: 28, riderRating: 5, driverRating: 5, completedAt: d(7) },
        { rider: demo._id, driver: kunal._id, origin: 'HSR Layout, Bangalore', destination: 'Electronic City, Bangalore', distanceKm: 31, co2SavedKg: 6.2, greenPoints: 62, riderRating: 5, driverRating: 5, completedAt: d(10) },
    ]);
    console.log(`Created ${completedRides.length} completed rides.`);

    // ─── PAYMENT METHODS ──────────────────────────────────────
    await PaymentMethod.insertMany([
        { user: demo._id, type: 'upi', upiId: 'demo@okaxis', isDefault: true },
        { user: demo._id, type: 'green_wallet', greenWalletBalance: 120, isDefault: false },
        { user: sneha._id, type: 'credit_card', cardNumber: '4242', cardHolderName: 'Sneha Rao', expiryMonth: 8, expiryYear: 2027, isDefault: true },
        { user: aarav._id, type: 'eco_credits', ecoCredits: 980, isDefault: true },
        { user: rahul._id, type: 'debit_card', cardNumber: '1234', cardHolderName: 'Rahul Sharma', expiryMonth: 3, expiryYear: 2026, isDefault: true },
    ]);
    console.log('Created payment methods.');

    // ─── SAFETY (emergency contacts for demo user) ─────────────
    await SafetySettings.create({
        user: demo._id,
        emergencyContacts: [
            { name: 'Mom', phone: '9000000001', relationship: 'Mother' },
            { name: 'Friend Ravi', phone: '9000000002', relationship: 'Friend' },
        ],
        liveTracking: true,
        safetyAlerts: true,
        safetyScore: 4.5,
        totalRides: 5,
        positiveFeedback: 4,
    });
    console.log('Created safety data.');

    console.log('\n✅ Database seeded successfully!\n');
    console.log('─────────────────────────────────────');
    console.log('Demo login credentials (all use same password):');
    console.log('  Email:    demo@greencommute.com');
    console.log('  Password: password123');
    console.log('\nOther accounts (password: password123):');
    users.filter(u => u.email !== 'demo@greencommute.com').forEach(u => {
        console.log(`  ${u.email} (${u.role})`);
    });
    console.log('─────────────────────────────────────');

    await mongoose.disconnect();
    process.exit(0);
}

seed().catch(err => {
    console.error('Seed failed:', err);
    process.exit(1);
});
