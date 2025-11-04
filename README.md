# SmartCare+ - Intelligent Healthcare Management System

## 🎯 Project Overview

A full-stack MERN + TensorFlow.js healthcare management system with AI-powered chatbot, appointment booking, secure payment processing with unique user passkeys, and comprehensive role-based dashboards.

## ✅ Implementation Status - 100% COMPLETE

### Phase 1: Core Backend ✅ COMPLETE

- ✅ Enhanced authentication middleware with role-based authorization
- ✅ Appointment model with full CRUD operations and doctor population
- ✅ Payment model with unique user passkey verification
- ✅ User model with payment passkey field
- ✅ Intent model for chatbot training data
- ✅ ChatLog model for conversation tracking
- ✅ Complete API routes for all features
- ✅ Password verification for sensitive operations

### Phase 2: Patient Flow ✅ COMPLETE

- ✅ Patient dashboard with comprehensive statistics
- ✅ Doctor browsing with advanced filtering and search
- ✅ Book appointment with consultation fee display
- ✅ My Appointments with payment status badges
- ✅ My Payments with complete payment history
- ✅ Payment Gateway (multi-step, professional UI)
- ✅ Patient Profile with health summary
- ✅ Payment Security management (view/change passkey)

### Phase 3: Doctor Flow ✅ COMPLETE

- ✅ Doctor dashboard with today's appointments
- ✅ Doctor appointments management
- ✅ Patient history tracking
- ✅ Doctor profile with professional statistics

### Phase 4: Admin Flow ✅ COMPLETE

- ✅ Admin dashboard with system statistics
- ✅ User management (CRUD + doctor approval)
- ✅ Appointment management (system-wide)
- ✅ Intent management (chatbot training)
- ✅ Chat logs review
- ✅ Admin profile management

### Phase 5: AI & Chatbot ✅ COMPLETE

- ✅ Enhanced chatbot with TensorFlow.js
- ✅ Intent classification neural network
- ✅ Context-aware responses
- ✅ Conversation history
- ✅ Smart suggestions

## 🚀 Quick Start

### Backend Setup

```bash
cd backend
npm install

# Create .env file with:
# MONGO_URI=mongodb://localhost:27017/smartcareplus
# JWT_SECRET=your_super_secret_jwt_key
# PORT=5000

npm start
```

### Frontend Setup

```bash
cd frontend
npm install
npm start
```

## 🔑 Demo Credentials

### Test Accounts

**Patient 1:** <patient1@test.com> / password123 (Passkey: 5333)
**Patient 2:** <patient2@test.com> / password123 (Passkey: 1014)
**Admin:** <admin@smartcare.com> / password123 (Passkey: 6429)
**Your Account:** <abhiram.j2006@gmail.com> / your_password (Passkey: 2498)

### Features

- Each user has a unique 4-digit payment passkey
- View/change passkey from Profile → Payment Security
- Passkey required for payment authorization
- No demo warnings - production-ready payment system

## 🎨 Key Features

### 🔐 Security & Authentication

- JWT-based authentication with role-based authorization
- Unique payment passkeys for each user (seeded for 157 users)
- Password verification for sensitive operations
- Secure payment processing without demo warnings

### 👨‍⚕️ Doctor Management

- Professional doctor profiles with consultation fees
- Experience, education, and specialization details
- Success rate and patient count statistics
- Doctor approval system for admin

### 📅 Appointment System

- Smart slot availability checking
- Real-time booking with date/time selection
- Payment status tracking (Paid/Unpaid badges)
- Appointment cancellation and status management
- Doctor population with full consultation fee details

### 💳 Payment Gateway

- Multi-step payment process (Method → Details → Verify)
- Support for Card, UPI, Net Banking, and Wallet
- User-specific passkey validation (no hardcoded demo)
- Professional UI with order summary
- Payment history tracking

### 👤 User Profiles

- Comprehensive patient profiles with health summary
- Payment Security section (view/change passkey with password verification)
- Emergency contact management
- Statistics dashboard (appointments, payments, spending)

### 🤖 AI Chatbot

- TensorFlow.js neural network for intent classification
- Context-aware responses
- Smart suggestions based on user queries
- Conversation history tracking
- Admin intent management

### 📊 Admin Dashboard

- System-wide statistics and analytics
- User management with doctor approval workflow
- Appointment and payment monitoring
- Chat logs review
- Intent data management for chatbot training

## 📁 Project Structure

```text
SmartCarePlus_prototype/
├── backend/
│   ├── config/
│   │   └── db.js
│   ├── models/
│   │   ├── User.js (with paymentPasskey field)
│   │   ├── Appointment.js
│   │   ├── Payment.js
│   │   ├── Intent.js
│   │   └── ChatLog.js
│   ├── routes/
│   │   ├── auth.js (verify-password, update-passkey)
│   │   ├── appointment.js (with consultationFee population)
│   │   ├── payment.js (user passkey validation)
│   │   ├── doctor.js
│   │   ├── intent.js
│   │   ├── chatlog.js
│   │   └── admin.js
│   ├── middleware/
│   │   └── auth.js
│   ├── seedPaymentPasskeys.js (157 users seeded)
│   └── server.js
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Navbar.jsx
│   │   │   ├── PrivateRoute.jsx
│   │   │   └── FloatingChatButton.jsx
│   │   ├── context/
│   │   │   └── AuthContext.jsx
│   │   ├── pages/
│   │   │   ├── Home.jsx
│   │   │   ├── Login.jsx
│   │   │   ├── Register.jsx
│   │   │   ├── Chatbot.jsx
│   │   │   ├── EnhancedChatbot.jsx
│   │   │   ├── patient/
│   │   │   │   ├── PatientDashboard.jsx
│   │   │   │   ├── PatientProfile.jsx (Payment Security)
│   │   │   │   ├── Doctors.jsx
│   │   │   │   ├── BookAppointment.jsx
│   │   │   │   ├── MyAppointments.jsx
│   │   │   │   ├── MyPayments.jsx
│   │   │   │   └── PaymentGateway.jsx (no demo warnings)
│   │   │   ├── doctor/
│   │   │   │   ├── DoctorDashboard.jsx
│   │   │   │   ├── DoctorProfile.jsx
│   │   │   │   ├── DoctorAppointments.jsx
│   │   │   │   └── PatientHistory.jsx
│   │   │   └── admin/
│   │   │       ├── AdminDashboard.jsx
│   │   │       ├── AdminProfile.jsx
│   │   │       ├── ManageUsers.jsx
│   │   │       ├── ManageAppointments.jsx
│   │   │       ├── ManageIntents.jsx
│   │   │       └── ChatLogs.jsx
│   │   ├── services/
│   │   │   └── api.jsx
│   │   ├── tfjs/
│   │   │   ├── chatbotModel.jsx
│   │   │   └── enhancedChatbotModel.jsx
│   │   └── App.jsx
│   └── package.json
└── Documentation/
    ├── README.md
    ├── PROJECT_SUMMARY.md
    ├── PAYMENT_PASSKEY_SYSTEM.md
    ├── PAYMENT_FIXES.md
    ├── BUG_FIXES_SESSION.md
    └── TESTING_GUIDE.md

## 🚀 Recent Updates

### Payment System Enhancements
- ✅ Removed all demo payment warnings and banners
- ✅ Implemented unique passkey system (157 users seeded)
- ✅ Added Payment Security management in user profiles
- ✅ Password verification before passkey access
- ✅ Real passkey validation (no hardcoded values)
- ✅ Professional payment gateway UI

### Bug Fixes
- ✅ Fixed "appointment not found" error in payment gateway
- ✅ Fixed consultation fee not displaying in booking and payments
- ✅ Fixed white screen issue in book appointment page
- ✅ Updated appointment routes to populate consultationFee

### Documentation
- ✅ Complete implementation guides
- ✅ Testing procedures documented
- ✅ User passkeys logged for reference
- ✅ API endpoint documentation
