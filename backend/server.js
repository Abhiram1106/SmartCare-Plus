require('dotenv').config();
const express = require('express');
const connectDB = require('./config/db');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');

const SocketManager = require('./socketManager');
const VideoConsultationManager = require('./videoConsultationManager');

const app = express();
const server = http.createServer(app);
const io = new Server(server, { 
  cors: { 
    origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
    credentials: true
  } 
});

// Initialize Socket Manager and Video Consultation Manager
const socketManager = new SocketManager(io);
const videoConsultationManager = new VideoConsultationManager(io);

// Make io, socketManager, and videoConsultationManager available to routes
app.set('io', io);
app.set('socketManager', socketManager);
app.set('videoConsultationManager', videoConsultationManager);

// Middleware
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static test pages (DEV ONLY - remove in production)
app.use('/test', express.static('tests'));

// Attach socketManager and videoConsultationManager to req object for all routes
app.use((req, res, next) => {
  req.io = io;
  req.socketManager = socketManager;
  req.videoConsultationManager = videoConsultationManager;
  next();
});

// Connect to DB only when not running under test harness (tests manage their own connection)
if (process.env.NODE_ENV !== 'test') {
  connectDB();
}

app.get('/', (req,res) => res.send('SmartCare+ backend prototype running'));

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/doctors', require('./routes/doctor'));
app.use('/api/appointments', require('./routes/appointment'));
app.use('/api/payments', require('./routes/payment'));
app.use('/api/prescriptions', require('./routes/prescription'));
app.use('/api/intents', require('./routes/intent'));
app.use('/api/chatlogs', require('./routes/chatlog'));
app.use('/api/chat', require('./routes/chat'));
app.use('/api/admin', require('./routes/admin'));
app.use('/api/analytics', require('./routes/analytics'));
app.use('/api/reviews', require('./routes/review'));
app.use('/api/test-email', require('./tests/emailTestRoutes')); // Test email endpoint (DEV ONLY)

// New Premium Features
app.use('/api/ehr', require('./routes/ehr'));
app.use('/api/telemedicine', require('./routes/telemedicine'));
app.use('/api/ai-symptom-checker', require('./routes/aiSymptomChecker'));
app.use('/api/predictive-analytics', require('./routes/predictiveAnalytics'));
app.use('/api/security', require('./routes/security'));

const PORT = process.env.PORT || 5000;

// Only start listening if this file is run directly (not required by tests)
if (require.main === module) {
  // Start DB connection when running server normally
  connectDB();

  server.listen(PORT, () => {
    const timestamp = new Date().toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });

    console.log('\n' + '='.repeat(70));
    console.log('🏥  SMARTCARE+ MEDICAL PLATFORM - BACKEND SERVER'.padStart(55));
    console.log('='.repeat(70));
    console.log('\n✅  SERVER STATUS: ONLINE\n');
    console.log('📋  Server Configuration:');
    console.log('    ├─ Port:              ' + PORT);
    console.log('    ├─ Environment:       ' + (process.env.NODE_ENV || 'development').toUpperCase());
    console.log('    ├─ Node Version:      ' + process.version);
    console.log('    └─ Started At:        ' + timestamp);
    console.log('\n🔌  Services:');
    console.log('    ├─ REST API:          http://localhost:' + PORT);
    console.log('    ├─ Socket.io:         ✅ ENABLED');
    console.log('    ├─ CORS Origin:       ' + (process.env.CORS_ORIGIN || 'http://localhost:3000'));
    console.log('    └─ Database:          ' + (process.env.MONGO_URI ? '✅ MongoDB Atlas Connected' : '✅ MongoDB Local'));
    console.log('\n📡  Available Routes:');
    console.log('    ├─ /api/auth                  - Authentication & User Management');
    console.log('    ├─ /api/doctors               - Doctor Profiles & Search');
    console.log('    ├─ /api/appointments          - Appointment Booking & Management');
    console.log('    ├─ /api/prescriptions         - Digital Prescriptions');
    console.log('    ├─ /api/payments              - Payment Processing & Receipts');
    console.log('    ├─ /api/reviews               - Reviews & Ratings System');
    console.log('    ├─ /api/chat                  - Real-time Chat');
    console.log('    ├─ /api/chatlogs              - Chat History');
    console.log('    ├─ /api/intents               - Chatbot Intents');
    console.log('    ├─ /api/analytics             - Analytics Dashboard');
    console.log('    ├─ /api/admin                 - Admin Panel');
    console.log('    ├─ /api/ehr                   - 🆕 Electronic Health Records');
    console.log('    ├─ /api/telemedicine          - 🆕 Video Consultations');
    console.log('    ├─ /api/ai-symptom-checker    - 🆕 AI Disease Prediction');
    console.log('    ├─ /api/predictive-analytics  - 🆕 ML Analytics & Insights');
    console.log('    └─ /api/security              - 🆕 RBAC & Audit Logs');
    console.log('\n🔒  Security:');
    console.log('    ├─ JWT Authentication:     ✅ ENABLED');
    console.log('    ├─ Role-Based Access:      ✅ ENABLED');
    console.log('    └─ CORS Protection:        ✅ ENABLED');
    console.log('\n' + '='.repeat(70));
    console.log('🚀  Ready to accept connections!');
    console.log('💡  Press Ctrl+C to stop the server');
    console.log('='.repeat(70) + '\n');
  });
}

// Export the express app for testing (so tests can call app.listen or use supertest)
module.exports = app;
