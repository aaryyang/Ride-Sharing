// tests/auth.test.js
const request = require('supertest');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config({ path: require('path').join(__dirname, '../.env') });

// Import app without starting the server
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const authRoutes = require('../routes/auth');

const app = express();
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use('/api/auth', authRoutes);

const TEST_USER = {
    name: 'Test User',
    email: `testuser_${Date.now()}@example.com`,
    password: 'password123',
};

beforeAll(async () => {
    await mongoose.connect(process.env.MONGO_URI);
});

afterAll(async () => {
    // Clean up test user
    await mongoose.connection.collection('users').deleteMany({ email: TEST_USER.email });
    await mongoose.connection.close();
});

describe('POST /api/auth/register', () => {
    it('should register a new user successfully', async () => {
        const res = await request(app).post('/api/auth/register').send(TEST_USER);
        expect(res.statusCode).toBe(201);
        expect(res.body).toHaveProperty('token');
        expect(res.body.user.email).toBe(TEST_USER.email);
    });

    it('should reject registration with duplicate email', async () => {
        const res = await request(app).post('/api/auth/register').send(TEST_USER);
        expect(res.statusCode).toBe(400);
        expect(res.body.message).toBe('User already exists');
    });

    it('should reject registration with invalid email', async () => {
        const res = await request(app)
            .post('/api/auth/register')
            .send({ name: 'Bad User', email: 'not-an-email', password: 'password123' });
        expect(res.statusCode).toBe(400);
        expect(res.body).toHaveProperty('errors');
    });

    it('should reject registration with short password', async () => {
        const res = await request(app)
            .post('/api/auth/register')
            .send({ name: 'Bad User', email: 'valid@example.com', password: '123' });
        expect(res.statusCode).toBe(400);
        expect(res.body).toHaveProperty('errors');
    });
});

describe('POST /api/auth/login', () => {
    it('should login successfully with correct credentials', async () => {
        const res = await request(app)
            .post('/api/auth/login')
            .send({ email: TEST_USER.email, password: TEST_USER.password });
        expect(res.statusCode).toBe(200);
        expect(res.body).toHaveProperty('token');
    });

    it('should reject login with wrong password', async () => {
        const res = await request(app)
            .post('/api/auth/login')
            .send({ email: TEST_USER.email, password: 'wrongpassword' });
        expect(res.statusCode).toBe(401);
    });

    it('should reject login with non-existent email', async () => {
        const res = await request(app)
            .post('/api/auth/login')
            .send({ email: 'nobody@example.com', password: 'password123' });
        expect(res.statusCode).toBe(401);
    });

    it('should reject login with invalid email format', async () => {
        const res = await request(app)
            .post('/api/auth/login')
            .send({ email: 'not-valid', password: 'password123' });
        expect(res.statusCode).toBe(400);
        expect(res.body).toHaveProperty('errors');
    });
});
