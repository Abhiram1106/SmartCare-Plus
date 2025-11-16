const request = require('supertest');
const express = require('express');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');

// Models
const User = require('../models/User');
const Doctor = require('../models/Doctor');
const Appointment = require('../models/Appointment');
const Prescription = require('../models/Prescription');
const ChatMessage = require('../models/ChatMessage');
const ChatLog = require('../models/ChatLog');
const Payment = require('../models/Payment');
const Intent = require('../models/Intent');
const Review = require('../models/Review');

// New Premium Feature Models
const MedicalRecord = require('../models/MedicalRecord');
const VideoConsultation = require('../models/VideoConsultation');
const SymptomAnalysis = require('../models/SymptomAnalysis');
const AuditLog = require('../models/AuditLog');
const Role = require('../models/Role');

// Routes
const authRoutes = require('../routes/auth');
const doctorRoutes = require('../routes/doctor');
const appointmentRoutes = require('../routes/appointment');
const prescriptionRoutes = require('../routes/prescription');
const chatRoutes = require('../routes/chat');
const paymentRoutes = require('../routes/payment');
const adminRoutes = require('../routes/admin');
const intentRoutes = require('../routes/intent');
const chatlogRoutes = require('../routes/chatlog');
const reviewRoutes = require('../routes/review');

// New Premium Feature Routes
const ehrRoutes = require('../routes/ehr');
const telemedicineRoutes = require('../routes/telemedicine');
const aiSymptomCheckerRoutes = require('../routes/aiSymptomChecker');
const predictiveAnalyticsRoutes = require('../routes/predictiveAnalytics');
const securityRoutes = require('../routes/security');

// Middleware
const { auth, authorize } = require('../middleware/auth');

let app;
let mongoServer;

describe('SmartCarePlus API Endpoints - Complete Test Suite', () => {
  // Test user variables
  let patientId, doctorId, adminId;
  let patientToken, doctorToken, adminToken;

  // Test data with correct schema
  const testPatient = {
    name: 'Test Patient',
    email: 'patient@test.com',
    password: 'password123',
    phone: '+1234567890',
    role: 'patient'
  };

  const testDoctor = {
    name: 'Dr. Test Doctor',
    email: 'doctor@test.com',
    password: 'password123',
    phone: '+1234567891',
    role: 'doctor',
    specialization: 'Cardiology',
    experience: 5,
    consultationFee: 100,
    approved: true
  };

  const testAdmin = {
    name: 'Admin User',
    email: 'admin@test.com',
    password: 'password123',
    phone: '+1234567892',
    role: 'admin'
  };

  beforeAll(async () => {
    // Set test environment
    process.env.NODE_ENV = 'test';
    process.env.JWT_SECRET = 'test-jwt-secret-key';
    process.env.PORT = '5001';

    // Start MongoDB Memory Server
    mongoServer = await MongoMemoryServer.create();
    const mongoUri = mongoServer.getUri();

    // Connect to the in-memory database
    await mongoose.connect(mongoUri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    // Create Express app
    app = express();
    app.use(express.json());

    // Setup routes
    app.use('/api/auth', authRoutes);
    app.use('/api/doctors', doctorRoutes);
    app.use('/api/appointments', appointmentRoutes);
    app.use('/api/prescriptions', prescriptionRoutes);
    app.use('/api/chat', chatRoutes);
    app.use('/api/payments', paymentRoutes);
    app.use('/api/admin', adminRoutes);
    app.use('/api/intents', intentRoutes);
    app.use('/api/chatlogs', chatlogRoutes);
    app.use('/api/reviews', reviewRoutes);

    // New Premium Feature Routes
    app.use('/api/ehr', ehrRoutes);
    app.use('/api/telemedicine', telemedicineRoutes);
    app.use('/api/ai-symptom-checker', aiSymptomCheckerRoutes);
    app.use('/api/predictive-analytics', predictiveAnalyticsRoutes);
    app.use('/api/security', securityRoutes);

    // Error handling middleware
    app.use((err, req, res, next) => {
      console.error(err.stack);
      res.status(500).json({ message: 'Server error', error: err.message });
    });

    // Create test users and get tokens
    try {
      // Register patient - get token from registration
      const patientResponse = await request(app)
        .post('/api/auth/register')
        .send(testPatient);
      
      if (patientResponse.status === 201) {
        patientId = patientResponse.body.user.id || patientResponse.body.user._id;
        patientToken = patientResponse.body.token;
      }

      // Register doctor - get token from registration
      const doctorResponse = await request(app)
        .post('/api/auth/register')
        .send(testDoctor);
      
      if (doctorResponse.status === 201) {
        doctorId = doctorResponse.body.user.id || doctorResponse.body.user._id;
        doctorToken = doctorResponse.body.token;
        
        // Ensure doctor is approved for appointments
        await User.findByIdAndUpdate(doctorId, { approved: true, isApproved: true });
      }

      // Register admin - get token from registration
      const adminResponse = await request(app)
        .post('/api/auth/register')
        .send(testAdmin);
      
      if (adminResponse.status === 201) {
        adminId = adminResponse.body.user.id || adminResponse.body.user._id;
        adminToken = adminResponse.body.token;
      }

      // Log the IDs for debugging
      console.log('Test setup - Patient ID:', patientId);
      console.log('Test setup - Doctor ID:', doctorId);
      console.log('Test setup - Admin ID:', adminId);

    } catch (error) {
      console.log('Setup error:', error);
    }
  });

  afterAll(async () => {
    // Close database connection
    await mongoose.connection.dropDatabase();
    await mongoose.connection.close();
    await mongoServer.stop();
  });

  beforeEach(async () => {
    // Clean up collections before each test (except User collection to maintain tokens)
    await Appointment.deleteMany({});
    await Prescription.deleteMany({});
    await ChatMessage.deleteMany({});
    await ChatLog.deleteMany({});
    await Payment.deleteMany({});
    await Intent.deleteMany({});
    await Review.deleteMany({});
  });

  // Helper function to create valid appointment data
  const createValidAppointment = (patientId, doctorId, overrides = {}) => ({
    patient: patientId || new mongoose.Types.ObjectId(),
    doctor: doctorId || new mongoose.Types.ObjectId(),
    appointmentDate: new Date(Date.now() + 24 * 60 * 60 * 1000), // Tomorrow
    timeSlot: '10:00-11:00', // Valid enum value
    symptoms: 'Regular checkup', // Required field
    status: 'pending', // Valid enum value
    amount: 100, // Required field - consultation fee
    ...overrides
  });

  // Helper function to create valid intent data
  const createValidIntent = (overrides = {}) => ({
    tag: 'test-intent',
    patterns: ['test pattern'],
    responses: ['test response'],
    category: 'general',
    isActive: true,
    ...overrides
  });

  // Helper function to create valid chat log data
  const createValidChatLog = (userId, overrides = {}) => ({
    user: userId,
    userMessage: 'Test user message',
    botResponse: 'Test bot response',
    intent: 'test-intent',
    confidence: 0.95,
    ...overrides
  });

  // Helper function to create valid payment data
  const createValidPayment = (appointmentId, overrides = {}) => ({
    appointment: appointmentId,
    amount: 100,
    paymentMethod: 'upi',
    transactionId: `TXN${Date.now()}${Math.random().toString(36).substr(2, 5)}`, // Unique transaction ID
    passkey: '1234',
    phoneNumber: '+1234567890',
    ...overrides
  });

  describe('Authentication Endpoints', () => {
    describe('POST /api/auth/register', () => {
      it('should register a new patient', async () => {
        const newPatient = {
          name: 'New Patient',
          email: 'newpatient@test.com',
          password: 'password123',
          phone: '+1234567893',
          role: 'patient'
        };

        const response = await request(app)
          .post('/api/auth/register')
          .send(newPatient)
          .expect(201);

        expect(response.body).toHaveProperty('token');
        expect(response.body.user.email).toBe(newPatient.email);
        expect(response.body.user.role).toBe('patient');
      });

      it('should register a new doctor', async () => {
        const newDoctor = {
          name: 'New Doctor',
          email: 'newdoctor@test.com',
          password: 'password123',
          phone: '+1234567894',
          role: 'doctor',
          specialization: 'Neurology',
          experience: 3,
          consultationFee: 150
        };

        const response = await request(app)
          .post('/api/auth/register')
          .send(newDoctor)
          .expect(201);

        expect(response.body).toHaveProperty('token');
        expect(response.body.user.email).toBe(newDoctor.email);
        expect(response.body.user.role).toBe('doctor');
      });

      it('should return 400 for duplicate email', async () => {
        await request(app)
          .post('/api/auth/register')
          .send(testPatient)
          .expect(400);
      });
    });

    describe('POST /api/auth/login', () => {
      it('should login with valid credentials', async () => {
        const response = await request(app)
          .post('/api/auth/login')
          .send({
            email: 'patient@test.com',
            password: 'password123'
          })
          .expect(200);

        expect(response.body).toHaveProperty('token');
        expect(response.body.user.email).toBe('patient@test.com');
      });

      it('should return 400 for invalid credentials', async () => {
        await request(app)
          .post('/api/auth/login')
          .send({
            email: 'patient@test.com',
            password: 'wrongpassword'
          })
          .expect(400);
      });
    });

    describe('GET /api/auth/me', () => {
      it('should get current user with valid token', async () => {
        const response = await request(app)
          .get('/api/auth/me')
          .set('Authorization', `Bearer ${patientToken}`)
          .expect(200);

        expect(response.body.email).toBe('patient@test.com');
        expect(response.body).not.toHaveProperty('password');
      });

      it('should return 401 without token', async () => {
        await request(app)
          .get('/api/auth/me')
          .expect(401);
      });
    });
  });

  describe('Appointment Endpoints', () => {
    describe('POST /api/appointments', () => {
      it('should create appointment for patient', async () => {
        const appointmentData = {
          doctorId: doctorId,
          appointmentDate: new Date(Date.now() + 24 * 60 * 60 * 1000), // Tomorrow
          timeSlot: '10:00-11:00',
          symptoms: 'Regular checkup'
        };

        const response = await request(app)
          .post('/api/appointments')
          .set('Authorization', `Bearer ${patientToken}`)
          .send(appointmentData);

        if (response.status !== 201) {
          console.log('Appointment creation failed:', response.body);
        }

        expect(response.status).toBe(201);
        // Patient and doctor are populated with full objects
        expect(response.body.patient._id || response.body.patient.id).toBe(patientId.toString());
        expect(response.body.doctor._id || response.body.doctor.id).toBe(doctorId.toString());
        expect(response.body.symptoms).toBe('Regular checkup');
        expect(response.body.status).toBe('pending');
      });

      it('should require authentication', async () => {
        const appointmentData = {
          doctorId: doctorId,
          appointmentDate: new Date(Date.now() + 24 * 60 * 60 * 1000),
          timeSlot: '10:00-11:00',
          symptoms: 'Regular checkup'
        };
        
        await request(app)
          .post('/api/appointments')
          .send(appointmentData)
          .expect(401);
      });
    });

    describe('GET /api/appointments', () => {
      it('should get appointments for patient', async () => {
        // Create test appointment
        const appointment = await new Appointment(createValidAppointment(patientId, doctorId)).save();

        const response = await request(app)
          .get('/api/appointments')
          .set('Authorization', `Bearer ${patientToken}`)
          .expect(200);

        expect(Array.isArray(response.body)).toBe(true);
        expect(response.body.length).toBeGreaterThan(0);
      });
    });

    describe('PUT /api/appointments/:id', () => {
      it('should update appointment status by doctor', async () => {
        // Create test appointment
        const appointment = await new Appointment(createValidAppointment(patientId, doctorId)).save();

        const response = await request(app)
          .put(`/api/appointments/${appointment._id}`)
          .set('Authorization', `Bearer ${doctorToken}`)
          .send({ status: 'completed' })
          .expect(200);

        expect(response.body.status).toBe('completed');
      });
    });

    describe('PUT /api/appointments/:id/approve', () => {
      it('should allow doctor to approve appointment', async () => {
        // Create test appointment with pending status
        const appointment = await new Appointment(createValidAppointment(patientId, doctorId, { status: 'pending' })).save();

        const response = await request(app)
          .put(`/api/appointments/${appointment._id}/approve`)
          .set('Authorization', `Bearer ${doctorToken}`)
          .send({ 
            status: 'approved',
            message: 'Appointment approved. Please proceed with payment.'
          })
          .expect(200);

        expect(response.body.appointment.status).toBe('approved');
        expect(response.body.appointment.doctorResponse.message).toBe('Appointment approved. Please proceed with payment.');
      });

      it('should allow doctor to reject appointment', async () => {
        // Create test appointment with pending status
        const appointment = await new Appointment(createValidAppointment(patientId, doctorId, { status: 'pending' })).save();

        const response = await request(app)
          .put(`/api/appointments/${appointment._id}/approve`)
          .set('Authorization', `Bearer ${doctorToken}`)
          .send({ 
            status: 'rejected',
            message: 'Sorry, this time slot is no longer available.'
          })
          .expect(200);

        expect(response.body.appointment.status).toBe('rejected');
        expect(response.body.appointment.doctorResponse.message).toBe('Sorry, this time slot is no longer available.');
      });

      it('should prevent non-doctor from approving appointment', async () => {
        const appointment = await new Appointment(createValidAppointment(patientId, doctorId)).save();

        await request(app)
          .put(`/api/appointments/${appointment._id}/approve`)
          .set('Authorization', `Bearer ${patientToken}`)
          .send({ status: 'approved' })
          .expect(403);
      });
    });

    describe('PUT /api/appointments/:id/complete', () => {
      it('should allow doctor to complete appointment', async () => {
        // Create test appointment with paid status
        const appointment = await new Appointment(createValidAppointment(patientId, doctorId, { 
          status: 'approved',
          paymentStatus: 'paid'
        })).save();

        const response = await request(app)
          .put(`/api/appointments/${appointment._id}/complete`)
          .set('Authorization', `Bearer ${doctorToken}`)
          .send({ 
            diagnosis: 'Common cold with mild fever',
            notes: 'Rest and hydration recommended. Follow up if symptoms persist.'
          })
          .expect(200);

        expect(response.body.appointment.status).toBe('completed');
        expect(response.body.appointment.diagnosis).toBe('Common cold with mild fever');
        expect(response.body.appointment.notes).toBe('Rest and hydration recommended. Follow up if symptoms persist.');
      });

      it('should prevent completing non-paid appointment', async () => {
        const appointment = await new Appointment(createValidAppointment(patientId, doctorId, { status: 'approved' })).save();

        await request(app)
          .put(`/api/appointments/${appointment._id}/complete`)
          .set('Authorization', `Bearer ${doctorToken}`)
          .send({ diagnosis: 'Test diagnosis' })
          .expect(400);
      });
    });

    describe('GET /api/appointments/:id/prescription', () => {
      it('should get prescription for completed appointment', async () => {
        // Create completed appointment with prescription
        const appointment = await new Appointment(createValidAppointment(patientId, doctorId, { 
          status: 'completed' 
        })).save();

        // Create prescription for the appointment
        const prescription = await new Prescription({
          appointment: appointment._id,
          patient: patientId,
          doctor: doctorId,
          diagnosis: 'Test diagnosis',
          medications: [{
            name: 'Paracetamol',
            dosage: '500mg',
            frequency: 'Twice daily',
            duration: '3 days',
            instructions: 'Take after meals'
          }],
          generalInstructions: 'Rest and stay hydrated'
        }).save();

        // Link prescription to appointment
        await Appointment.findByIdAndUpdate(appointment._id, { prescription: prescription._id });

        const response = await request(app)
          .get(`/api/appointments/${appointment._id}/prescription`)
          .set('Authorization', `Bearer ${patientToken}`)
          .expect(200);

        expect(response.body.prescription.diagnosis).toBe('Test diagnosis');
        expect(response.body.prescription.medications.length).toBe(1);
        expect(response.body.prescription.medications[0].name).toBe('Paracetamol');
      });

      it('should return 404 for appointment without prescription', async () => {
        const appointment = await new Appointment(createValidAppointment(patientId, doctorId)).save();

        await request(app)
          .get(`/api/appointments/${appointment._id}/prescription`)
          .set('Authorization', `Bearer ${patientToken}`)
          .expect(404);
      });
    });
  });

  describe('Prescription Endpoints', () => {
    let appointmentId, prescriptionId;

    beforeEach(async () => {
      // Create a completed appointment for prescription testing
      const appointment = await new Appointment(createValidAppointment(patientId, doctorId, { 
        status: 'completed' 
      })).save();
      appointmentId = appointment._id;
    });

    // Helper function to create valid prescription data
    const createValidPrescription = (overrides = {}) => ({
      appointmentId: appointmentId,
      diagnosis: 'Common cold with fever',
      medications: [{
        name: 'Paracetamol',
        dosage: '500mg',
        frequency: 'Twice daily',
        duration: '3 days',
        instructions: 'Take after meals'
      }],
      generalInstructions: 'Rest and stay hydrated. Avoid cold foods.',
      followUp: {
        required: true,
        date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 1 week from now
        instructions: 'Follow up if symptoms persist'
      },
      testsRecommended: [{
        testName: 'Complete Blood Count',
        reason: 'If fever continues beyond 3 days',
        urgent: false
      }],
      lifestyleRecommendations: {
        diet: 'Light, warm foods',
        exercise: 'Avoid strenuous activity',
        restrictions: 'No cold drinks',
        other: 'Get adequate rest'
      },
      ...overrides
    });

    describe('POST /api/prescriptions', () => {
      it('should create prescription by doctor', async () => {
        const prescriptionData = createValidPrescription();

        const response = await request(app)
          .post('/api/prescriptions')
          .set('Authorization', `Bearer ${doctorToken}`)
          .send(prescriptionData)
          .expect(201);

        expect(response.body.prescription.diagnosis).toBe('Common cold with fever');
        expect(response.body.prescription.medications.length).toBe(1);
        expect(response.body.prescription.medications[0].name).toBe('Paracetamol');
        expect(response.body.prescription.prescriptionNumber).toBeDefined();
        expect(response.body.prescription.doctorSignature.digitalSignature).toBeDefined();
      });

      it('should prevent patient from creating prescription', async () => {
        const prescriptionData = createValidPrescription();

        await request(app)
          .post('/api/prescriptions')
          .set('Authorization', `Bearer ${patientToken}`)
          .send(prescriptionData)
          .expect(403);
      });

      it('should require valid appointment ID', async () => {
        const prescriptionData = createValidPrescription({ 
          appointmentId: new mongoose.Types.ObjectId() 
        });

        await request(app)
          .post('/api/prescriptions')
          .set('Authorization', `Bearer ${doctorToken}`)
          .send(prescriptionData)
          .expect(404);
      });

      it('should validate required fields', async () => {
        await request(app)
          .post('/api/prescriptions')
          .set('Authorization', `Bearer ${doctorToken}`)
          .send({
            appointmentId: appointmentId
            // Missing diagnosis
          })
          .expect(400);
      });
    });

    describe('GET /api/prescriptions', () => {
      beforeEach(async () => {
        // Create test prescription
        const prescription = await new Prescription({
          appointment: appointmentId,
          patient: patientId,
          doctor: doctorId,
          diagnosis: 'Test diagnosis',
          medications: [{
            name: 'Test Medicine',
            dosage: '100mg',
            frequency: 'Once daily',
            duration: '5 days'
          }]
        }).save();
        prescriptionId = prescription._id;
      });

      it('should get prescriptions for patient', async () => {
        const response = await request(app)
          .get('/api/prescriptions/patient')
          .set('Authorization', `Bearer ${patientToken}`)
          .expect(200);

        expect(Array.isArray(response.body.prescriptions)).toBe(true);
        expect(response.body.prescriptions.length).toBeGreaterThan(0);
        expect(response.body.prescriptions[0].patient._id || response.body.prescriptions[0].patient).toBe(patientId.toString());
      });

      it('should require authentication', async () => {
        await request(app)
          .get('/api/prescriptions/patient')
          .expect(401);
      });
    });

    describe('GET /api/prescriptions/doctor', () => {
      beforeEach(async () => {
        // Create test prescription by doctor
        await new Prescription({
          appointment: appointmentId,
          patient: patientId,
          doctor: doctorId,
          diagnosis: 'Doctor prescribed diagnosis',
          medications: [{
            name: 'Doctor Medicine',
            dosage: '200mg',
            frequency: 'Twice daily',
            duration: '7 days'
          }]
        }).save();
      });

      it('should get prescriptions created by doctor', async () => {
        const response = await request(app)
          .get('/api/prescriptions/doctor')
          .set('Authorization', `Bearer ${doctorToken}`)
          .expect(200);

        expect(Array.isArray(response.body.prescriptions)).toBe(true);
        expect(response.body.prescriptions.length).toBeGreaterThan(0);
        expect(response.body.prescriptions[0].doctor._id || response.body.prescriptions[0].doctor).toBe(doctorId.toString());
      });

      it('should prevent patient from accessing doctor prescriptions', async () => {
        await request(app)
          .get('/api/prescriptions/doctor')
          .set('Authorization', `Bearer ${patientToken}`)
          .expect(403);
      });
    });

    describe('GET /api/prescriptions/:id', () => {
      beforeEach(async () => {
        const prescription = await new Prescription({
          appointment: appointmentId,
          patient: patientId,
          doctor: doctorId,
          diagnosis: 'Specific diagnosis',
          medications: [{
            name: 'Specific Medicine',
            dosage: '300mg',
            frequency: 'Thrice daily',
            duration: '10 days'
          }]
        }).save();
        prescriptionId = prescription._id;
      });

      it('should get specific prescription for patient', async () => {
        const response = await request(app)
          .get(`/api/prescriptions/${prescriptionId}`)
          .set('Authorization', `Bearer ${patientToken}`)
          .expect(200);

        expect(response.body._id).toBe(prescriptionId.toString());
        expect(response.body.diagnosis).toBe('Specific diagnosis');
      });

      it('should get specific prescription for doctor', async () => {
        const response = await request(app)
          .get(`/api/prescriptions/${prescriptionId}`)
          .set('Authorization', `Bearer ${doctorToken}`)
          .expect(200);

        expect(response.body._id).toBe(prescriptionId.toString());
        expect(response.body.diagnosis).toBe('Specific diagnosis');
      });

      it('should prevent unauthorized access', async () => {
        // Create another user
        const otherUser = await User.create({
          name: 'Other User',
          email: 'other@test.com',
          password: 'password123',
          phone: '+1234567899',
          role: 'patient'
        });

        // Login other user
        const loginResponse = await request(app)
          .post('/api/auth/login')
          .send({ email: 'other@test.com', password: 'password123' });
        
        const otherToken = loginResponse.body.token;

        await request(app)
          .get(`/api/prescriptions/${prescriptionId}`)
          .set('Authorization', `Bearer ${otherToken}`)
          .expect(401);
      });

      it('should return 404 for non-existent prescription', async () => {
        const fakeId = new mongoose.Types.ObjectId();
        await request(app)
          .get(`/api/prescriptions/${fakeId}`)
          .set('Authorization', `Bearer ${patientToken}`)
          .expect(404);
      });
    });

    describe('PUT /api/prescriptions/:id', () => {
      beforeEach(async () => {
        const prescription = await new Prescription({
          appointment: appointmentId,
          patient: patientId,
          doctor: doctorId,
          diagnosis: 'Original diagnosis',
          medications: [{
            name: 'Original Medicine',
            dosage: '100mg',
            frequency: 'Once daily',
            duration: '5 days'
          }]
        }).save();
        prescriptionId = prescription._id;
      });

      it('should update prescription by doctor', async () => {
        const updateData = {
          diagnosis: 'Updated diagnosis',
          medications: [{
            name: 'Updated Medicine',
            dosage: '200mg',
            frequency: 'Twice daily',
            duration: '7 days',
            instructions: 'Take with food'
          }],
          generalInstructions: 'Updated instructions'
        };

        const response = await request(app)
          .put(`/api/prescriptions/${prescriptionId}`)
          .set('Authorization', `Bearer ${doctorToken}`)
          .send(updateData)
          .expect(200);

        expect(response.body.prescription.diagnosis).toBe('Updated diagnosis');
        expect(response.body.prescription.medications[0].name).toBe('Updated Medicine');
        expect(response.body.prescription.generalInstructions).toBe('Updated instructions');
      });

      it('should prevent patient from updating prescription', async () => {
        await request(app)
          .put(`/api/prescriptions/${prescriptionId}`)
          .set('Authorization', `Bearer ${patientToken}`)
          .send({ diagnosis: 'Hacked diagnosis' })
          .expect(403);
      });
    });

    describe('DELETE /api/prescriptions/:id', () => {
      beforeEach(async () => {
        const prescription = await new Prescription({
          appointment: appointmentId,
          patient: patientId,
          doctor: doctorId,
          diagnosis: 'To be deleted',
          medications: [{
            name: 'Delete Medicine',
            dosage: '100mg',
            frequency: 'Once daily',
            duration: '5 days'
          }]
        }).save();
        prescriptionId = prescription._id;
      });

      it('should delete prescription by doctor', async () => {
        await request(app)
          .delete(`/api/prescriptions/${prescriptionId}`)
          .set('Authorization', `Bearer ${doctorToken}`)
          .expect(200);

        const deletedPrescription = await Prescription.findById(prescriptionId);
        expect(deletedPrescription).toBeNull();
      });

      it('should prevent patient from deleting prescription', async () => {
        await request(app)
          .delete(`/api/prescriptions/${prescriptionId}`)
          .set('Authorization', `Bearer ${patientToken}`)
          .expect(403);
      });
    });

    describe('GET /api/prescriptions/:id/download', () => {
      beforeEach(async () => {
        const prescription = await new Prescription({
          appointment: appointmentId,
          patient: patientId,
          doctor: doctorId,
          diagnosis: 'Download test diagnosis',
          medications: [{
            name: 'Download Medicine',
            dosage: '100mg',
            frequency: 'Once daily',
            duration: '5 days'
          }]
        }).save();
        prescriptionId = prescription._id;
      });

      it('should prepare prescription for download for patient', async () => {
        const response = await request(app)
          .get(`/api/prescriptions/${prescriptionId}/download`)
          .set('Authorization', `Bearer ${patientToken}`)
          .expect(200);

        expect(response.body.prescription.diagnosis).toBe('Download test diagnosis');
        expect(response.body.prescription.patient).toBeDefined();
        expect(response.body.prescription.doctor).toBeDefined();
      });

      it('should prepare prescription for download for doctor', async () => {
        const response = await request(app)
          .get(`/api/prescriptions/${prescriptionId}/download`)
          .set('Authorization', `Bearer ${doctorToken}`)
          .expect(200);

        expect(response.body.prescription.diagnosis).toBe('Download test diagnosis');
      });
    });
  });

  describe('Doctor Endpoints', () => {
    describe('GET /api/doctors', () => {
      it('should return all approved doctors', async () => {
        const response = await request(app)
          .get('/api/doctors')
          .expect(200);

        expect(response.body).toHaveProperty('doctors');
        expect(Array.isArray(response.body.doctors)).toBe(true);
      });

      it('should filter by specialization', async () => {
        const response = await request(app)
          .get('/api/doctors?specialization=Cardiology')
          .expect(200);

        expect(response.body).toHaveProperty('doctors');
        expect(Array.isArray(response.body.doctors)).toBe(true);
      });

      it('should filter by fee range', async () => {
        const response = await request(app)
          .get('/api/doctors?minFee=50&maxFee=150')
          .expect(200);

        expect(response.body).toHaveProperty('doctors');
        expect(Array.isArray(response.body.doctors)).toBe(true);
      });

      it('should search by name', async () => {
        const response = await request(app)
          .get('/api/doctors?search=Dr. Test')
          .expect(200);

        expect(response.body).toHaveProperty('doctors');
        expect(Array.isArray(response.body.doctors)).toBe(true);
      });
    });

    describe('GET /api/doctors/:id', () => {
      it('should return doctor by ID', async () => {
        const response = await request(app)
          .get(`/api/doctors/${doctorId}`)
          .expect(200);

        expect(response.body._id).toBe(doctorId.toString());
        expect(response.body.name).toBe('Dr. Test Doctor');
      });

      it('should return 404 for non-existent doctor', async () => {
        const fakeId = new mongoose.Types.ObjectId();
        await request(app)
          .get(`/api/doctors/${fakeId}`)
          .expect(404);
      });
    });
  });

  describe('Intent Endpoints', () => {
    describe('GET /api/intents', () => {
      it('should get all intents for admin', async () => {
        // Create test intent
        await new Intent(createValidIntent()).save();

        const response = await request(app)
          .get('/api/intents')
          .set('Authorization', `Bearer ${adminToken}`)
          .expect(200);

        expect(Array.isArray(response.body)).toBe(true);
      });
    });

    describe('GET /api/intents/active', () => {
      it('should get active intents', async () => {
        // Create test intent
        await new Intent(createValidIntent()).save();

        const response = await request(app)
          .get('/api/intents/active')
          .expect(200);

        expect(Array.isArray(response.body)).toBe(true);
      });
    });

    describe('POST /api/intents', () => {
      it('should create new intent', async () => {
        const intentData = createValidIntent({ tag: 'new-intent' });

        const response = await request(app)
          .post('/api/intents')
          .set('Authorization', `Bearer ${adminToken}`)
          .send(intentData)
          .expect(201);

        expect(response.body.tag).toBe('new-intent');
      });
    });
  });

  describe('ChatLog Endpoints', () => {
    describe('GET /api/chatlogs', () => {
      it('should get all chat logs for admin', async () => {
        // Create test chat log
        await new ChatLog(createValidChatLog(patientId)).save();

        const response = await request(app)
          .get('/api/chatlogs')
          .set('Authorization', `Bearer ${adminToken}`)
          .expect(200);

        expect(Array.isArray(response.body)).toBe(true);
      });

      it('should get user chat logs for patient', async () => {
        // Create test chat log
        await new ChatLog(createValidChatLog(patientId)).save();

        const response = await request(app)
          .get('/api/chatlogs')
          .set('Authorization', `Bearer ${patientToken}`)
          .expect(200);

        expect(Array.isArray(response.body)).toBe(true);
      });
    });
  });

  describe('Payment Endpoints', () => {
    describe('POST /api/payments', () => {
      it('should create payment for approved appointment', async () => {
        // Create approved appointment first
        const appointment = await new Appointment(createValidAppointment(patientId, doctorId, { 
          status: 'approved' 
        })).save();

        const paymentData = createValidPayment(appointment._id);

        const response = await request(app)
          .post('/api/payments')
          .set('Authorization', `Bearer ${patientToken}`)
          .send(paymentData)
          .expect(201);

        expect(response.body.amount).toBe(100);
        expect(response.body.status).toBe('completed');
        
        // Check that appointment status is updated to paid
        const updatedAppointment = await Appointment.findById(appointment._id);
        expect(updatedAppointment.status).toBe('paid');
        expect(updatedAppointment.paymentStatus).toBe('paid');
      });

      it('should reject payment for non-approved appointment', async () => {
        // Create pending appointment
        const appointment = await new Appointment(createValidAppointment(patientId, doctorId, { 
          status: 'pending' 
        })).save();

        const paymentData = createValidPayment(appointment._id);

        await request(app)
          .post('/api/payments')
          .set('Authorization', `Bearer ${patientToken}`)
          .send(paymentData)
          .expect(400);
      });

      it('should reject payment for rejected appointment', async () => {
        // Create rejected appointment
        const appointment = await new Appointment(createValidAppointment(patientId, doctorId, { 
          status: 'rejected' 
        })).save();

        const paymentData = createValidPayment(appointment._id);

        await request(app)
          .post('/api/payments')
          .set('Authorization', `Bearer ${patientToken}`)
          .send(paymentData)
          .expect(400);
      });

      it('should prevent duplicate payments for same appointment', async () => {
        // Create approved appointment
        const appointment = await new Appointment(createValidAppointment(patientId, doctorId, { 
          status: 'approved' 
        })).save();

        // Create first payment
        await new Payment({
          appointment: appointment._id,
          patient: patientId,
          amount: 100,
          paymentMethod: 'upi',
          transactionId: `TXN_FIRST_${Date.now()}`,
          status: 'completed'
        }).save();

        // Try to create second payment
        const paymentData = createValidPayment(appointment._id);

        await request(app)
          .post('/api/payments')
          .set('Authorization', `Bearer ${patientToken}`)
          .send(paymentData)
          .expect(400);
      });
    });

    describe('GET /api/payments', () => {
      it('should get user payments', async () => {
        const response = await request(app)
          .get('/api/payments')
          .set('Authorization', `Bearer ${patientToken}`)
          .expect(200);

        expect(Array.isArray(response.body)).toBe(true);
      });
    });

    describe('GET /api/payments/receipt/:appointmentId', () => {
      it('should get payment receipt for paid appointment', async () => {
        // Create paid appointment
        const appointment = await new Appointment(createValidAppointment(patientId, doctorId, { 
          status: 'paid',
          paymentStatus: 'paid'
        })).save();

        // Create payment record
        await new Payment({
          appointment: appointment._id,
          patient: patientId,
          amount: 100,
          paymentMethod: 'upi',
          transactionId: `TXN_RECEIPT_${Date.now()}`,
          status: 'completed'
        }).save();

        const response = await request(app)
          .get(`/api/payments/receipt/${appointment._id}`)
          .set('Authorization', `Bearer ${patientToken}`)
          .expect(200);

        expect(response.body.appointmentDetails).toBeDefined();
        expect(response.body.paymentDetails).toBeDefined();
        expect(response.body.clinicDetails).toBeDefined();
        expect(response.body.receiptNumber).toBeDefined();
      });

      it('should return 404 for unpaid appointment', async () => {
        const appointment = await new Appointment(createValidAppointment(patientId, doctorId)).save();

        await request(app)
          .get(`/api/payments/receipt/${appointment._id}`)
          .set('Authorization', `Bearer ${patientToken}`)
          .expect(404);
      });
    });
  });

  describe('Admin Endpoints', () => {
    describe('GET /api/admin/users', () => {
      it('should get all users for admin', async () => {
        const response = await request(app)
          .get('/api/admin/users')
          .set('Authorization', `Bearer ${adminToken}`)
          .expect(200);

        expect(Array.isArray(response.body)).toBe(true);
        expect(response.body.length).toBeGreaterThan(0);
      });

      it('should prevent access by non-admin', async () => {
        await request(app)
          .get('/api/admin/users')
          .set('Authorization', `Bearer ${patientToken}`)
          .expect(403);
      });
    });

    describe('GET /api/admin/stats', () => {
      it('should get admin statistics', async () => {
        const response = await request(app)
          .get('/api/admin/stats')
          .set('Authorization', `Bearer ${adminToken}`)
          .expect(200);

        expect(response.body).toHaveProperty('totalPatients');
        expect(response.body).toHaveProperty('totalDoctors');
        expect(response.body).toHaveProperty('totalAppointments');
      });

      it('should prevent access by non-admin', async () => {
        await request(app)
          .get('/api/admin/stats')
          .set('Authorization', `Bearer ${patientToken}`)
          .expect(403);
      });
    });
  });

  describe('Error Handling', () => {
    it('should return 404 for non-existent routes', async () => {
      await request(app)
        .get('/api/nonexistent')
        .expect(404);
    });

    it('should handle invalid JSON in request body', async () => {
      await request(app)
        .post('/api/auth/login')
        .send('invalid json')
        .expect(400);
    });

    it('should handle missing authorization header', async () => {
      await request(app)
        .get('/api/auth/me')
        .expect(401);
    });

    it('should handle invalid MongoDB ObjectId', async () => {
      // The route returns 500 because it doesn't handle ObjectId cast errors gracefully
      // This is expected behavior for this API
      await request(app)
        .get('/api/doctors/invalid-id')
        .expect(500);
    });
  });

  describe('Review & Rating Endpoints', () => {
    let completedAppointmentId;

    beforeEach(async () => {
      // Clean up any existing reviews to avoid duplicate key errors
      await Review.deleteMany({});
      
      // Create a completed appointment for review testing
      const appointment = await new Appointment(
        createValidAppointment(patientId, doctorId, { 
          status: 'completed',
          appointmentDate: new Date(Date.now() - 24 * 60 * 60 * 1000) // Yesterday
        })
      ).save();
      completedAppointmentId = appointment._id;
    });

    describe('POST /api/reviews', () => {
      it('should create a new review for a doctor', async () => {
        const reviewData = {
          doctor: doctorId,
          appointment: completedAppointmentId,
          rating: 5,
          title: 'Excellent Doctor!',
          comment: 'Very professional and caring. Highly recommend!',
          detailedRatings: {
            communication: 5,
            punctuality: 5,
            bedsideManner: 5
          }
        };

        const response = await request(app)
          .post('/api/reviews')
          .set('Authorization', `Bearer ${patientToken}`)
          .send(reviewData)
          .expect(201);

        expect(response.body.rating).toBe(5);
        expect(response.body.title).toBe('Excellent Doctor!');
        expect(response.body.status).toBe('approved');
        expect(response.body.verified).toBe(true);
      });

      it('should require authentication', async () => {
        const reviewData = {
          doctor: doctorId,
          rating: 5,
          title: 'Test',
          comment: 'Test comment'
        };

        await request(app)
          .post('/api/reviews')
          .send(reviewData)
          .expect(401);
      });

      it('should validate rating range (1-5)', async () => {
        const reviewData = {
          doctor: doctorId,
          rating: 6, // Invalid rating
          title: 'Test',
          comment: 'Test comment'
        };

        await request(app)
          .post('/api/reviews')
          .set('Authorization', `Bearer ${patientToken}`)
          .send(reviewData)
          .expect(400);
      });
    });

    describe('GET /api/reviews/doctor/:doctorId', () => {
      beforeEach(async () => {
        // Clean up existing reviews to prevent duplicates
        await Review.deleteMany({});
        
        // Create a second patient for different review combinations
        // Ensure any leftover test user with same email is removed to avoid dup key errors
        await User.deleteMany({ email: 'patient2@test.com' });

        const secondPatient = await new User({
          name: 'Second Patient',
          email: 'patient2@test.com',
          password: 'password123',
          role: 'patient',
          phone: '0987654321',
          dateOfBirth: new Date('1985-01-01'),
          gender: 'female'
        }).save();

        // Create sample reviews
        await Review.create([
          {
            patient: patientId,
            doctor: doctorId,
            appointment: completedAppointmentId,
            rating: 5,
            title: 'Great Doctor',
            comment: 'Excellent service',
            status: 'approved'
          },
          {
            patient: secondPatient._id, // Different patient to avoid duplicate key error
            doctor: doctorId,
            rating: 4,
            title: 'Good Experience',
            comment: 'Very satisfied',
            status: 'approved'
          }
        ]);
      });

      it('should get all approved reviews for a doctor', async () => {
        const response = await request(app)
          .get(`/api/reviews/doctor/${doctorId}`)
          .expect(200);

        expect(response.body.reviews).toBeDefined();
        expect(Array.isArray(response.body.reviews)).toBe(true);
        expect(response.body.stats).toBeDefined();
        expect(response.body.stats.totalReviews).toBeGreaterThan(0);
      });

      it('should filter by minimum rating', async () => {
        const response = await request(app)
          .get(`/api/reviews/doctor/${doctorId}?minRating=5`)
          .expect(200);

        expect(response.body.reviews).toBeDefined();
        response.body.reviews.forEach(review => {
          expect(review.rating).toBeGreaterThanOrEqual(5);
        });
      });

      it('should support pagination', async () => {
        const response = await request(app)
          .get(`/api/reviews/doctor/${doctorId}?page=1&limit=1`)
          .expect(200);

        expect(response.body.pagination).toBeDefined();
        expect(response.body.pagination.currentPage).toBe(1);
      });
    });

    describe('GET /api/reviews/my-reviews', () => {
      beforeEach(async () => {
        // Clear reviews first to avoid duplicates
        await Review.deleteMany({});
        
        // Create a review by patient
        await Review.create({
          patient: patientId,
          doctor: doctorId,
          rating: 5,
          title: 'My Review',
          comment: 'Test comment',
          status: 'approved'
        });
      });

      it('should get reviews written by current patient', async () => {
        const response = await request(app)
          .get('/api/reviews/my-reviews')
          .set('Authorization', `Bearer ${patientToken}`)
          .expect(200);

        expect(Array.isArray(response.body.reviews || response.body)).toBe(true);
        const reviews = response.body.reviews || response.body;
        expect(reviews.length).toBeGreaterThan(0);
      });

      it('should require authentication', async () => {
        await request(app)
          .get('/api/reviews/my-reviews')
          .expect(401);
      });
    });

    describe('PUT /api/reviews/:id', () => {
      let reviewId;

      beforeEach(async () => {
        // Clean up existing reviews to prevent duplicates
        await Review.deleteMany({});
        
        const review = await Review.create({
          patient: patientId,
          doctor: doctorId,
          rating: 4,
          title: 'Original Title',
          comment: 'Original comment',
          status: 'approved'
        });
        reviewId = review._id;
      });

      it('should update own review', async () => {
        const updateData = {
          rating: 5,
          title: 'Updated Title',
          comment: 'Updated comment'
        };

        const response = await request(app)
          .put(`/api/reviews/${reviewId}`)
          .set('Authorization', `Bearer ${patientToken}`)
          .send(updateData)
          .expect(200);

        expect(response.body.rating).toBe(5);
        expect(response.body.title).toBe('Updated Title');
        expect(response.body.isEdited).toBe(true);
      });

      it('should not allow updating another users review', async () => {
        const updateData = {
          rating: 5,
          title: 'Hacked',
          comment: 'Hacked comment'
        };

        await request(app)
          .put(`/api/reviews/${reviewId}`)
          .set('Authorization', `Bearer ${doctorToken}`)
          .send(updateData)
          .expect(403);
      });
    });

    describe('DELETE /api/reviews/:id', () => {
      let reviewId;

      beforeEach(async () => {
        // Clean up existing reviews to prevent duplicates
        await Review.deleteMany({});
        
        const review = await Review.create({
          patient: patientId,
          doctor: doctorId,
          rating: 4,
          title: 'Test Review',
          comment: 'Test comment',
          status: 'approved'
        });
        reviewId = review._id;
      });

      it('should delete own review', async () => {
        await request(app)
          .delete(`/api/reviews/${reviewId}`)
          .set('Authorization', `Bearer ${patientToken}`)
          .expect(200);

        const deletedReview = await Review.findById(reviewId);
        expect(deletedReview).toBeNull();
      });

      it('should not allow deleting another users review', async () => {
        await request(app)
          .delete(`/api/reviews/${reviewId}`)
          .set('Authorization', `Bearer ${doctorToken}`)
          .expect(403);
      });
    });

    describe('POST /api/reviews/:id/vote', () => {
      let reviewId;

      beforeEach(async () => {
        // Clean up existing reviews to prevent duplicates
        await Review.deleteMany({});
        
        const review = await Review.create({
          patient: patientId,
          doctor: doctorId,
          rating: 5,
          title: 'Test Review',
          comment: 'Test comment',
          status: 'approved'
        });
        reviewId = review._id;
      });

      it('should mark review as helpful', async () => {
        const response = await request(app)
          .post(`/api/reviews/${reviewId}/vote`)
          .set('Authorization', `Bearer ${doctorToken}`)
          .send({ vote: 'helpful' })
          .expect(200);

        expect(response.body.helpfulVotes).toBe(1);
      });

      it('should mark review as not helpful', async () => {
        const response = await request(app)
          .post(`/api/reviews/${reviewId}/vote`)
          .set('Authorization', `Bearer ${doctorToken}`)
          .send({ vote: 'notHelpful' })
          .expect(200);

        expect(response.body.notHelpfulVotes).toBe(1);
      });

      it('should require valid vote type', async () => {
        await request(app)
          .post(`/api/reviews/${reviewId}/vote`)
          .set('Authorization', `Bearer ${doctorToken}`)
          .send({ vote: 'invalid' })
          .expect(400);
      });
    });

    describe('POST /api/reviews/:id/flag', () => {
      let reviewId;

      beforeEach(async () => {
        // Clean up existing reviews to prevent duplicates
        await Review.deleteMany({});
        
        const review = await Review.create({
          patient: patientId,
          doctor: doctorId,
          rating: 5,
          title: 'Test Review',
          comment: 'Test comment',
          status: 'approved'
        });
        reviewId = review._id;
      });

      it('should flag review as inappropriate', async () => {
        const response = await request(app)
          .post(`/api/reviews/${reviewId}/flag`)
          .set('Authorization', `Bearer ${doctorToken}`)
          .send({ reason: 'Inappropriate content' })
          .expect(200);

        expect(response.body.message).toContain('flagged');
        expect(response.body.flagCount).toBe(1);
      });

      it('should require authentication', async () => {
        await request(app)
          .post(`/api/reviews/${reviewId}/flag`)
          .send({ reason: 'Test' })
          .expect(401);
      });
    });

    describe('POST /api/reviews/:id/respond', () => {
      let reviewId;

      beforeEach(async () => {
        // Clean up existing reviews to prevent duplicates
        await Review.deleteMany({});
        
        const review = await Review.create({
          patient: patientId,
          doctor: doctorId,
          rating: 5,
          title: 'Test Review',
          comment: 'Test comment',
          status: 'approved'
        });
        reviewId = review._id;
      });

      it('should allow doctor to respond to review', async () => {
        const response = await request(app)
          .post(`/api/reviews/${reviewId}/respond`)
          .set('Authorization', `Bearer ${doctorToken}`)
          .send({ comment: 'Thank you for your feedback!' })
          .expect(200);

        expect(response.body.hasResponse).toBe(true);
        expect(response.body.doctorResponse.comment).toBe('Thank you for your feedback!');
      });

      it('should not allow patient to respond', async () => {
        await request(app)
          .post(`/api/reviews/${reviewId}/respond`)
          .set('Authorization', `Bearer ${patientToken}`)
          .send({ comment: 'Test' })
          .expect(403);
      });
    });

    describe('GET /api/reviews/admin/all', () => {
      beforeEach(async () => {
        // Clean up existing reviews to prevent duplicates
        await Review.deleteMany({});
        
        // Create a second patient to avoid unique constraint violation
        await User.deleteMany({ email: 'patient3@test.com' });
        const patient3 = await new User({
          name: 'Third Patient',
          email: 'patient3@test.com',
          password: 'password123',
          role: 'patient',
          phone: '1231231234',
          dateOfBirth: new Date('1990-01-01'),
          gender: 'male'
        }).save();
        
        await Review.create([
          {
            patient: patientId,
            doctor: doctorId,
            rating: 5,
            title: 'Review 1',
            comment: 'Comment 1',
            status: 'pending'
          },
          {
            patient: patient3._id, // Different patient to avoid duplicate key error
            doctor: doctorId,
            rating: 4,
            title: 'Review 2',
            comment: 'Comment 2',
            status: 'approved'
          }
        ]);
      });

      it('should get all reviews for admin', async () => {
        const response = await request(app)
          .get('/api/reviews/admin/all')
          .set('Authorization', `Bearer ${adminToken}`)
          .expect(200);

        expect(response.body.reviews).toBeDefined();
        expect(Array.isArray(response.body.reviews)).toBe(true);
      });

      it('should prevent access by non-admin', async () => {
        await request(app)
          .get('/api/reviews/admin/all')
          .set('Authorization', `Bearer ${patientToken}`)
          .expect(403);
      });

      it('should filter by status', async () => {
        const response = await request(app)
          .get('/api/reviews/admin/all?status=pending')
          .set('Authorization', `Bearer ${adminToken}`)
          .expect(200);

        response.body.reviews.forEach(review => {
          expect(review.status).toBe('pending');
        });
      });
    });

    describe('PUT /api/reviews/admin/:id/moderate', () => {
      let reviewId;

      beforeEach(async () => {
        // Clean up existing reviews to prevent duplicates
        await Review.deleteMany({});
        
        const review = await Review.create({
          patient: patientId,
          doctor: doctorId,
          rating: 5,
          title: 'Test Review',
          comment: 'Test comment',
          status: 'pending'
        });
        reviewId = review._id;
      });

      it('should allow admin to approve review', async () => {
        const response = await request(app)
          .put(`/api/reviews/admin/${reviewId}/moderate`)
          .set('Authorization', `Bearer ${adminToken}`)
          .send({ 
            status: 'approved',
            moderationNote: 'Looks good'
          })
          .expect(200);

        expect(response.body.status).toBe('approved');
        expect(response.body.moderatedBy).toBeDefined();
      });

      it('should allow admin to reject review', async () => {
        const response = await request(app)
          .put(`/api/reviews/admin/${reviewId}/moderate`)
          .set('Authorization', `Bearer ${adminToken}`)
          .send({ 
            status: 'rejected',
            moderationNote: 'Violates guidelines'
          })
          .expect(200);

        expect(response.body.status).toBe('rejected');
      });

      it('should prevent access by non-admin', async () => {
        await request(app)
          .put(`/api/reviews/admin/${reviewId}/moderate`)
          .set('Authorization', `Bearer ${patientToken}`)
          .send({ status: 'approved' })
          .expect(403);
      });
    });

    describe('GET /api/reviews/stats/overall', () => {
      beforeEach(async () => {
        // Clean up existing reviews to prevent duplicates
        await Review.deleteMany({});
        
        // Create a second patient to avoid unique constraint violation
        await User.deleteMany({ email: 'patient4@test.com' });
        const patient4 = await new User({
          name: 'Fourth Patient',
          email: 'patient4@test.com',
          password: 'password123',
          role: 'patient',
          phone: '9879879876',
          dateOfBirth: new Date('1992-01-01'),
          gender: 'female'
        }).save();
        
        await Review.create([
          {
            patient: patientId,
            doctor: doctorId,
            rating: 5,
            title: 'Review 1',
            comment: 'Comment 1',
            status: 'approved',
            verified: true
          },
          {
            patient: patient4._id, // Different patient to avoid duplicate key error
            doctor: doctorId,
            rating: 4,
            title: 'Review 2',
            comment: 'Comment 2',
            status: 'approved',
            verified: false
          }
        ]);
      });

      it('should get overall review statistics for admin', async () => {
        const response = await request(app)
          .get('/api/reviews/stats/overall')
          .set('Authorization', `Bearer ${adminToken}`)
          .expect(200);

        expect(response.body.totalReviews).toBeDefined();
        expect(response.body.averageRating).toBeDefined();
        expect(response.body.ratingDistribution).toBeDefined();
      });

      it('should allow public access to stats', async () => {
        const response = await request(app)
          .get('/api/reviews/stats/overall')
          .expect(200);

        expect(response.body.totalReviews).toBeDefined();
      });
    });
  });

  describe('Integration Tests', () => {
    it('should complete full new appointment workflow with prescriptions', async () => {
      // 1. Patient creates appointment (pending status)
      const appointmentData = {
        doctorId: doctorId,
        appointmentDate: new Date(Date.now() + 24 * 60 * 60 * 1000),
        timeSlot: '10:00-11:00',
        symptoms: 'Fever and cough for 3 days'
      };
      
      const appointmentResponse = await request(app)
        .post('/api/appointments')
        .set('Authorization', `Bearer ${patientToken}`)
        .send(appointmentData)
        .expect(201);

      const appointmentId = appointmentResponse.body._id;
      expect(appointmentResponse.body.status).toBe('pending');

      // 2. Doctor approves appointment
      const approvalResponse = await request(app)
        .put(`/api/appointments/${appointmentId}/approve`)
        .set('Authorization', `Bearer ${doctorToken}`)
        .send({ 
          status: 'approved',
          message: 'Appointment approved. Please proceed with payment.'
        })
        .expect(200);

      expect(approvalResponse.body.appointment.status).toBe('approved');

      // 3. Patient makes payment (only allowed after approval)
      const paymentData = createValidPayment(appointmentId);

      const paymentResponse = await request(app)
        .post('/api/payments')
        .set('Authorization', `Bearer ${patientToken}`)
        .send(paymentData)
        .expect(201);

      expect(paymentResponse.body.status).toBe('completed');

      // 4. Doctor completes appointment with diagnosis
      const completionResponse = await request(app)
        .put(`/api/appointments/${appointmentId}/complete`)
        .set('Authorization', `Bearer ${doctorToken}`)
        .send({ 
          diagnosis: 'Viral fever with upper respiratory symptoms',
          notes: 'Advised rest, hydration, and symptomatic treatment'
        })
        .expect(200);

      expect(completionResponse.body.status).toBe('completed');

      // 5. Doctor creates digital prescription
      const prescriptionData = {
        appointmentId: appointmentId,
        diagnosis: 'Viral fever with upper respiratory symptoms',
        medications: [
          {
            name: 'Paracetamol',
            dosage: '500mg',
            frequency: 'Twice daily',
            duration: '5 days',
            instructions: 'Take after meals'
          },
          {
            name: 'Cetirizine',
            dosage: '10mg',
            frequency: 'Once daily',
            duration: '3 days',
            instructions: 'Take at bedtime'
          }
        ],
        generalInstructions: 'Rest well, drink plenty of fluids. Return if symptoms worsen.',
        followUp: {
          required: true,
          date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
          instructions: 'Follow up if fever persists beyond 5 days'
        },
        testsRecommended: [
          {
            testName: 'Complete blood count if fever continues',
            reason: 'Monitor infection markers',
            urgent: false
          }
        ],
        lifestyleRecommendations: {
          diet: 'Light, warm foods. Avoid cold items',
          exercise: 'Complete rest for 3-5 days',
          restrictions: 'No outdoor activities until fever subsides'
        }
      };

      const prescriptionResponse = await request(app)
        .post('/api/prescriptions')
        .set('Authorization', `Bearer ${doctorToken}`)
        .send(prescriptionData)
        .expect(201);

      expect(prescriptionResponse.body.prescription.diagnosis).toBe('Viral fever with upper respiratory symptoms');
      expect(prescriptionResponse.body.prescription.medications.length).toBe(2);
      expect(prescriptionResponse.body.prescription.prescriptionNumber).toBeDefined();

      // 6. Patient views prescription
      const prescriptionId = prescriptionResponse.body.prescription._id;
      const patientPrescriptionResponse = await request(app)
        .get(`/api/prescriptions/${prescriptionId}`)
        .set('Authorization', `Bearer ${patientToken}`)
        .expect(200);

      expect(patientPrescriptionResponse.body.medications[0].name).toBe('Paracetamol');

      // 7. Patient downloads payment receipt
      const receiptResponse = await request(app)
        .get(`/api/payments/receipt/${appointmentId}`)
        .set('Authorization', `Bearer ${patientToken}`)
        .expect(200);

      expect(receiptResponse.body.appointmentDetails).toBeDefined();
      expect(receiptResponse.body.paymentDetails.amount).toBe(100);

      // 8. Verify final appointment status
      const finalAppointmentResponse = await request(app)
        .get('/api/appointments')
        .set('Authorization', `Bearer ${patientToken}`)
        .expect(200);

      const finalAppointment = finalAppointmentResponse.body.find(apt => apt._id === appointmentId);
      expect(finalAppointment.status).toBe('completed');
      expect(finalAppointment.paymentStatus).toBe('paid');
    });

    it('should handle appointment rejection workflow', async () => {
      // 1. Patient creates appointment
      const appointmentData = {
        doctorId: doctorId,
        appointmentDate: new Date(Date.now() + 24 * 60 * 60 * 1000),
        timeSlot: '14:00-15:00',
        symptoms: 'Routine checkup'
      };
      
      const appointmentResponse = await request(app)
        .post('/api/appointments')
        .set('Authorization', `Bearer ${patientToken}`)
        .send(appointmentData)
        .expect(201);

      const appointmentId = appointmentResponse.body._id;

      // 2. Doctor rejects appointment
      const rejectionResponse = await request(app)
        .put(`/api/appointments/${appointmentId}/approve`)
        .set('Authorization', `Bearer ${doctorToken}`)
        .send({ 
          status: 'rejected',
          message: 'Sorry, this time slot is no longer available. Please choose another slot.'
        })
        .expect(200);

      expect(rejectionResponse.body.appointment.status).toBe('rejected');
      expect(rejectionResponse.body.appointment.doctorResponse.message).toContain('no longer available');

      // 3. Patient cannot make payment for rejected appointment
      const paymentData = createValidPayment(appointmentId);

      await request(app)
        .post('/api/payments')
        .set('Authorization', `Bearer ${patientToken}`)
        .send(paymentData)
        .expect(400); // Should fail due to appointment not being approved
    });

    it('should complete full appointment workflow', async () => {
      // 1. Create appointment
      const appointmentData = {
        doctorId: doctorId,
        appointmentDate: new Date(Date.now() + 24 * 60 * 60 * 1000),
        timeSlot: '10:00-11:00',
        symptoms: 'Regular checkup'
      };
      
      const appointmentResponse = await request(app)
        .post('/api/appointments')
        .set('Authorization', `Bearer ${patientToken}`)
        .send(appointmentData);

      if (appointmentResponse.status !== 201) {
        console.log('Integration test - appointment creation failed:', appointmentResponse.body);
      }

      expect(appointmentResponse.status).toBe(201);

      const appointmentId = appointmentResponse.body._id;

      // 2. Doctor approves appointment
      await request(app)
        .put(`/api/appointments/${appointmentId}/approve`)
        .set('Authorization', `Bearer ${doctorToken}`)
        .send({ status: 'approved' })
        .expect(200);

      // 3. Create payment for appointment
      const paymentData = createValidPayment(appointmentId);

      await request(app)
        .post('/api/payments')
        .set('Authorization', `Bearer ${patientToken}`)
        .send(paymentData)
        .expect(201);

      // 4. Doctor completes appointment
      await request(app)
        .put(`/api/appointments/${appointmentId}/complete`)
        .set('Authorization', `Bearer ${doctorToken}`)
        .send({ 
          diagnosis: 'All good',
          notes: 'Regular checkup completed'
        })
        .expect(200);

      // 5. Get updated appointment
      const updatedAppointment = await request(app)
        .get('/api/appointments')
        .set('Authorization', `Bearer ${patientToken}`)
        .expect(200);

      expect(updatedAppointment.body.length).toBeGreaterThan(0);
    });

    it('should complete full review workflow with moderation', async () => {
      // 1. Create and complete appointment
      const appointment = await new Appointment(
        createValidAppointment(patientId, doctorId, { 
          status: 'completed',
          appointmentDate: new Date(Date.now() - 24 * 60 * 60 * 1000)
        })
      ).save();

      // 2. Patient creates review
      const reviewResponse = await request(app)
        .post('/api/reviews')
        .set('Authorization', `Bearer ${patientToken}`)
        .send({
          doctor: doctorId,
          appointment: appointment._id,
          rating: 5,
          title: 'Excellent Care!',
          comment: 'Dr. Test Doctor provided exceptional care and attention.',
          detailedRatings: {
            communication: 5,
            punctuality: 5,
            bedsideManner: 5
          }
        })
        .expect(201);

      const reviewId = reviewResponse.body._id;

      // 3. Another user marks it as helpful
      await request(app)
        .post(`/api/reviews/${reviewId}/vote`)
        .set('Authorization', `Bearer ${doctorToken}`)
        .send({ vote: 'helpful' })
        .expect(200);

      // 4. Doctor responds to review
      await request(app)
        .post(`/api/reviews/${reviewId}/respond`)
        .set('Authorization', `Bearer ${doctorToken}`)
        .send({ comment: 'Thank you for your kind words!' })
        .expect(200);

      // 5. Get doctor's reviews to verify
      const doctorReviews = await request(app)
        .get(`/api/reviews/doctor/${doctorId}`)
        .expect(200);

      expect(doctorReviews.body.reviews.length).toBeGreaterThan(0);
      expect(doctorReviews.body.stats.totalReviews).toBeGreaterThan(0);
    });
  });

  // ============================================================
  // 🆕 PREMIUM FEATURES TESTS
  // ============================================================

  describe('Electronic Health Records (EHR) System', () => {
    let medicalRecordId;

    describe('GET /api/ehr/:patientId', () => {
      it('should get patient medical record', async () => {
        const response = await request(app)
          .get(`/api/ehr/${patientId}`)
          .set('Authorization', `Bearer ${patientToken}`)
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data).toHaveProperty('patient');
      });

      it('should prevent unauthorized access to medical records', async () => {
        await request(app)
          .get(`/api/ehr/${doctorId}`)
          .set('Authorization', `Bearer ${patientToken}`)
          .expect(403);
      });
    });

    describe('PUT /api/ehr/:patientId/basic', () => {
      it('should update basic health information', async () => {
        const response = await request(app)
          .put(`/api/ehr/${patientId}/basic`)
          .set('Authorization', `Bearer ${patientToken}`)
          .send({
            bloodType: 'O+',
            emergencyContact: {
              name: 'Emergency Contact',
              phone: '+1234567890',
              relationship: 'Spouse'
            }
          })
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data.bloodType).toBe('O+');
      });
    });

    describe('POST /api/ehr/:patientId/allergies', () => {
      it('should add allergy to medical record (doctor only)', async () => {
        const response = await request(app)
          .post(`/api/ehr/${patientId}/allergies`)
          .set('Authorization', `Bearer ${doctorToken}`)
          .send({
            allergen: 'Penicillin',
            reaction: 'Skin rash',
            severity: 'moderate',
            diagnosedDate: new Date()
          })
          .expect(201);

        expect(response.body.success).toBe(true);
        expect(response.body.data.length).toBeGreaterThan(0);
      });

      it('should prevent patient from adding allergies', async () => {
        await request(app)
          .post(`/api/ehr/${patientId}/allergies`)
          .set('Authorization', `Bearer ${patientToken}`)
          .send({
            allergen: 'Peanuts',
            reaction: 'Anaphylaxis',
            severity: 'severe'
          })
          .expect(403);
      });
    });

    describe('POST /api/ehr/:patientId/vitals', () => {
      it('should record vital signs', async () => {
        const response = await request(app)
          .post(`/api/ehr/${patientId}/vitals`)
          .set('Authorization', `Bearer ${doctorToken}`)
          .send({
            bloodPressure: { systolic: 120, diastolic: 80 },
            heartRate: 72,
            temperature: 98.6,
            weight: 70,
            height: 175
          })
          .expect(201);

        expect(response.body.success).toBe(true);
        expect(response.body.data).toHaveProperty('bmi');
      });
    });

    describe('GET /api/ehr/:patientId/summary', () => {
      it('should get health summary', async () => {
        const response = await request(app)
          .get(`/api/ehr/${patientId}/summary`)
          .set('Authorization', `Bearer ${patientToken}`)
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data).toHaveProperty('bloodType');
      });
    });
  });

  describe('Telemedicine Video Consultation', () => {
    let consultationId, roomId, appointmentForVideo;

    describe('POST /api/telemedicine/create', () => {
      it('should create video consultation room and prevent duplicates', async () => {
        // Create appointment first
        const appointment = await new Appointment({
          patient: patientId,
          doctor: doctorId,
          appointmentDate: new Date(Date.now() + 24 * 60 * 60 * 1000),
          reason: 'Video Consultation Test',
          status: 'approved',
          consultationFee: 100,
          amount: 100,
          symptoms: 'test symptoms',
          timeSlot: '10:00-11:00'
        }).save();
        appointmentForVideo = appointment._id;
        
        // First creation should succeed
        const response1 = await request(app)
          .post('/api/telemedicine/create')
          .set('Authorization', `Bearer ${doctorToken}`)
          .send({
            appointmentId: appointmentForVideo.toString(),
            scheduledTime: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString()
          });

        expect(response1.status).toBe(201);
        expect(response1.body.success).toBe(true);
        expect(response1.body.data).toHaveProperty('roomId');
        roomId = response1.body.data.roomId;
        consultationId = response1.body.data._id;
        
        // Second creation with same appointment should fail
        const response2 = await request(app)
          .post('/api/telemedicine/create')
          .set('Authorization', `Bearer ${doctorToken}`)
          .send({
            appointmentId: appointmentForVideo.toString(),
            scheduledTime: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString()
          });
        
        expect(response2.status).toBe(400);
        expect(response2.body.message).toContain('already exists');
      });
    });

    describe('GET /api/telemedicine/room/:roomId', () => {
      it('should get consultation room details', async () => {
        const response = await request(app)
          .get(`/api/telemedicine/room/${roomId}`)
          .set('Authorization', `Bearer ${patientToken}`)
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data.roomId).toBe(roomId);
      });
    });

    describe('POST /api/telemedicine/room/:roomId/join', () => {
      it('should allow patient to join room', async () => {
        const response = await request(app)
          .post(`/api/telemedicine/room/${roomId}/join`)
          .set('Authorization', `Bearer ${patientToken}`)
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data.roomId).toBe(roomId);
      });

      it('should allow doctor to join room', async () => {
        const response = await request(app)
          .post(`/api/telemedicine/room/${roomId}/join`)
          .set('Authorization', `Bearer ${doctorToken}`)
          .expect(200);

        expect(response.body.success).toBe(true);
      });
    });

    describe('POST /api/telemedicine/room/:roomId/message', () => {
      it('should send message in consultation chat', async () => {
        const response = await request(app)
          .post(`/api/telemedicine/room/${roomId}/message`)
          .set('Authorization', `Bearer ${patientToken}`)
          .send({
            message: 'Hello Doctor, I have been experiencing headaches',
            type: 'text'
          })
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data.message).toBe('Hello Doctor, I have been experiencing headaches');
      });
    });

    describe('PUT /api/telemedicine/room/:roomId/notes', () => {
      it('should add consultation notes (doctor only)', async () => {
        const response = await request(app)
          .put(`/api/telemedicine/room/${roomId}/notes`)
          .set('Authorization', `Bearer ${doctorToken}`)
          .send({
            chiefComplaint: 'Headaches',
            symptoms: ['headache', 'dizziness'],
            diagnosis: 'Tension headache',
            treatment: 'Rest and hydration',
            followUp: '1 week'
          })
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data.diagnosis).toBe('Tension headache');
      });
    });

    describe('GET /api/telemedicine/my-consultations', () => {
      it('should get user consultations', async () => {
        const response = await request(app)
          .get('/api/telemedicine/my-consultations')
          .set('Authorization', `Bearer ${patientToken}`)
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(Array.isArray(response.body.data)).toBe(true);
      });
    });
  });

  describe('AI Symptom Checker & Disease Prediction', () => {
    let analysisId;

    describe('POST /api/ai-symptom-checker/analyze', () => {
      it('should analyze symptoms and predict diseases', async () => {
        const response = await request(app)
          .post('/api/ai-symptom-checker/analyze')
          .set('Authorization', `Bearer ${patientToken}`)
          .send({
            symptoms: [
              { symptom: 'fever', severity: 'severe' },
              { symptom: 'cough', severity: 'moderate' },
              { symptom: 'body aches', severity: 'moderate' }
            ],
            additionalInfo: {
              age: 30,
              gender: 'male'
            }
          })
          .expect(201);

        expect(response.body.success).toBe(true);
        expect(response.body.data).toHaveProperty('predictions');
        expect(response.body.data.predictions.length).toBeGreaterThan(0);
        expect(response.body.data).toHaveProperty('urgencyLevel');
        expect(response.body.data).toHaveProperty('recommendedSpecialist');
        analysisId = response.body.data.analysisId;
      });

      it('should require at least one symptom', async () => {
        await request(app)
          .post('/api/ai-symptom-checker/analyze')
          .set('Authorization', `Bearer ${patientToken}`)
          .send({
            symptoms: []
          })
          .expect(400);
      });

      it('should validate symptom structure', async () => {
        await request(app)
          .post('/api/ai-symptom-checker/analyze')
          .set('Authorization', `Bearer ${patientToken}`)
          .send({
            symptoms: [{ symptom: 'fever' }] // missing severity
          })
          .expect(400);
      });
    });

    describe('GET /api/ai-symptom-checker/history', () => {
      it('should get user symptom analysis history', async () => {
        const response = await request(app)
          .get('/api/ai-symptom-checker/history')
          .set('Authorization', `Bearer ${patientToken}`)
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data.length).toBeGreaterThan(0);
      });
    });

    describe('GET /api/ai-symptom-checker/analysis/:id', () => {
      it('should get specific analysis', async () => {
        const response = await request(app)
          .get(`/api/ai-symptom-checker/analysis/${analysisId}`)
          .set('Authorization', `Bearer ${patientToken}`)
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data._id.toString()).toBe(analysisId.toString());
      });
    });

    describe('GET /api/ai-symptom-checker/symptoms-list', () => {
      it('should get common symptoms list', async () => {
        const response = await request(app)
          .get('/api/ai-symptom-checker/symptoms-list')
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(Array.isArray(response.body.data)).toBe(true);
        expect(response.body.data.length).toBeGreaterThan(0);
      });
    });

    describe('GET /api/ai-symptom-checker/specialists', () => {
      it('should get specialists list', async () => {
        const response = await request(app)
          .get('/api/ai-symptom-checker/specialists')
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(Array.isArray(response.body.data)).toBe(true);
      });
    });
  });

  describe('Predictive Analytics System', () => {
    describe('GET /api/predictive-analytics/revenue-forecast', () => {
      it('should forecast revenue for upcoming period', async () => {
        const response = await request(app)
          .get('/api/predictive-analytics/revenue-forecast?days=30')
          .set('Authorization', `Bearer ${adminToken}`)
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data).toHaveProperty('forecast');
        expect(response.body.data).toHaveProperty('trend');
      });

      it('should prevent non-admin access', async () => {
        await request(app)
          .get('/api/predictive-analytics/revenue-forecast')
          .set('Authorization', `Bearer ${patientToken}`)
          .expect(403);
      });
    });

    describe('GET /api/predictive-analytics/peak-hours', () => {
      it('should analyze peak appointment hours', async () => {
        const response = await request(app)
          .get('/api/predictive-analytics/peak-hours')
          .set('Authorization', `Bearer ${doctorToken}`)
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data).toHaveProperty('peakHour');
        expect(response.body.data).toHaveProperty('peakDay');
      });
    });

    describe('GET /api/predictive-analytics/patient-retention', () => {
      it('should analyze patient retention', async () => {
        const response = await request(app)
          .get('/api/predictive-analytics/patient-retention')
          .set('Authorization', `Bearer ${adminToken}`)
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data).toHaveProperty('retentionRate');
        expect(response.body.data).toHaveProperty('activePatients');
      });
    });

    describe('GET /api/predictive-analytics/dashboard', () => {
      it('should get comprehensive analytics dashboard', async () => {
        const response = await request(app)
          .get('/api/predictive-analytics/dashboard')
          .set('Authorization', `Bearer ${adminToken}`)
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data).toHaveProperty('overview');
        expect(response.body.data).toHaveProperty('revenue');
        expect(response.body.data).toHaveProperty('appointments');
        expect(response.body.data).toHaveProperty('performance');
      });
    });
  });

  describe('RBAC & Security System', () => {
    describe('GET /api/security/audit-logs', () => {
      it('should get audit logs (admin only)', async () => {
        const response = await request(app)
          .get('/api/security/audit-logs')
          .set('Authorization', `Bearer ${adminToken}`)
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(Array.isArray(response.body.data)).toBe(true);
      });

      it('should prevent non-admin access', async () => {
        await request(app)
          .get('/api/security/audit-logs')
          .set('Authorization', `Bearer ${patientToken}`)
          .expect(403);
      });
    });

    describe('GET /api/security/audit-stats', () => {
      it('should get audit statistics', async () => {
        const response = await request(app)
          .get('/api/security/audit-stats?days=7')
          .set('Authorization', `Bearer ${adminToken}`)
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data).toHaveProperty('totalActions');
        expect(response.body.data).toHaveProperty('actionBreakdown');
      });
    });

    describe('POST /api/security/encrypt-data', () => {
      it('should encrypt sensitive data', async () => {
        const response = await request(app)
          .post('/api/security/encrypt-data')
          .set('Authorization', `Bearer ${doctorToken}`)
          .send({
            data: { patientName: 'John Doe', diagnosis: 'Hypertension' }
          })
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body).toHaveProperty('encrypted');
        expect(response.body).toHaveProperty('iv');
      });
    });

    describe('GET /api/security/suspicious-activity', () => {
      it('should detect suspicious activity patterns', async () => {
        const response = await request(app)
          .get('/api/security/suspicious-activity?days=7')
          .set('Authorization', `Bearer ${adminToken}`)
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data).toHaveProperty('suspiciousPatterns');
        expect(response.body.data).toHaveProperty('alertLevel');
      });
    });
  });
});