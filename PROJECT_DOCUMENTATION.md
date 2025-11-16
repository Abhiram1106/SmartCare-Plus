# SmartCare Plus - Project Documentation

## 📚 Complete System Overview

**Version**: 1.0.0  
**Last Updated**: November 8, 2025  
**Repository**: [SmartCare-Plus](https://github.com/Abhiram1106/SmartCare-Plus)

---

## 🎯 Project Description

SmartCare Plus is a comprehensive healthcare management system designed to streamline medical services through digital transformation. The platform connects patients, doctors, and administrators in a seamless, secure, and efficient ecosystem.

### Core Features

#### 🏥 Patient Portal

- **Account Management**: Custom User IDs (SMP####), profile management, password security
- **Doctor Discovery**: Browse verified doctors by specialization, ratings, and availability
- **Appointment Booking**: Schedule consultations with preferred doctors
- **Real-time Chat**: Communicate with assigned doctors instantly
- **AI Chatbot**: 24/7 intelligent assistant for health queries using TensorFlow.js
- **Payment Gateway**: Secure payment processing with 4-digit passkey protection
- **Medical Records**: Track appointment history, prescriptions, and payments
- **OTP Verification**: Secure email-based account verification

#### 👨‍⚕️ Doctor Portal

- **Professional Profile**: Showcase qualifications, experience, and specialization
- **Appointment Management**: View, approve, and manage patient appointments
- **Patient Communication**: Real-time chat with patients
- **Schedule Management**: Set availability and consultation fees
- **Patient History**: Access complete patient medical records
- **Analytics Dashboard**: Track consultation statistics and ratings
- **Verification Badge**: Verified doctor status with admin approval

#### 🔐 Admin Dashboard

- **User Management**: CRUD operations for patients, doctors, and admins
- **Doctor Verification**: Approve/reject doctor registrations
- **Appointment Oversight**: Monitor and manage all appointments
- **Analytics**: System-wide statistics and performance metrics
- **Chatbot Training**: Manage and update AI chatbot intents
- **Chat Log Monitoring**: Review all patient-doctor conversations
- **Payment Tracking**: Monitor transaction history and revenue

---

## 🏗️ Technical Architecture

### Tech Stack

#### Backend

- **Runtime**: Node.js v18+
- **Framework**: Express.js v4.21.1
- **Database**: MongoDB Atlas (Cloud NoSQL)
- **ODM**: Mongoose v8.8.3
- **Authentication**: JWT (JSON Web Tokens) + bcryptjs
- **Real-time**: Socket.IO v4.8.1
- **Email Service**: Nodemailer v7.0.10 (Gmail SMTP)
- **PDF Generation**: PDFKit v0.17.2

#### Frontend

- **Framework**: React v18.3.1
- **Routing**: React Router DOM v7.0.2
- **Build Tool**: Vite v6.0.1
- **Styling**: Tailwind CSS v3.4.15
- **HTTP Client**: Axios v1.7.9
- **Real-time Client**: Socket.IO Client v4.8.1
- **AI/ML**: TensorFlow.js v4.22.0
- **Icons**: Lucide React v0.460.0

#### Development Tools

- **Testing**: Jest v29.7.0 + Supertest v7.0.0
- **Mocking**: MongoDB Memory Server v10.1.2
- **Dev Server**: Nodemon v3.1.7
- **Environment**: dotenv v16.4.7
- **Package Manager**: npm v9+

### System Architecture

```text
┌─────────────────────────────────────────────────────────────┐
│                     CLIENT LAYER                             │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐         │
│  │   Patient   │  │   Doctor    │  │    Admin    │         │
│  │   Portal    │  │   Portal    │  │  Dashboard  │         │
│  └─────────────┘  └─────────────┘  └─────────────┘         │
│         │                │                 │                 │
│         └────────────────┴─────────────────┘                │
│                          │                                   │
│                    React + Vite                             │
│                  Tailwind CSS                               │
└─────────────────────────────────────────────────────────────┘
                           │
                    HTTP/WebSocket
                           │
┌─────────────────────────────────────────────────────────────┐
│                    API LAYER (Express)                       │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Authentication  │  Authorization  │  Rate Limiting  │  │
│  └──────────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────────┐  │
│  │ /auth  │ /appointments │ /payments │ /chat │ /admin │  │
│  └──────────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────────┐  │
│  │   Socket.IO   │   Nodemailer   │   PDF Generator   │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                           │
                      Mongoose ODM
                           │
┌─────────────────────────────────────────────────────────────┐
│                DATABASE LAYER (MongoDB Atlas)                │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐          │
│  │  Users  │ │  Appts  │ │Payments │ │  Chats  │          │
│  └─────────┘ └─────────┘ └─────────┘ └─────────┘          │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐                      │
│  │  Intents│ │   OTP   │ │ ChatLog │                      │
│  └─────────┘ └─────────┘ └─────────┘                      │
└─────────────────────────────────────────────────────────────┘
```

---

## 📁 Project Structure

```text
SmartCarePlus/
├── backend/
│   ├── config/
│   │   └── db.js                    # MongoDB connection
│   ├── data/
│   │   └── enhancedIntents.js       # AI chatbot intents
│   ├── middleware/
│   │   └── auth.js                  # JWT authentication
│   ├── models/
│   │   ├── User.js                  # User schema with custom IDs
│   │   ├── Appointment.js           # Appointment schema
│   │   ├── Payment.js               # Payment schema
│   │   ├── ChatMessage.js           # Real-time chat
│   │   ├── ChatLog.js               # Chat history
│   │   ├── OTP.js                   # OTP verification
│   │   ├── Intent.js                # Chatbot intents
│   │   └── Doctor.js                # Doctor profiles
│   ├── routes/
│   │   ├── auth.js                  # Authentication routes
│   │   ├── appointment.js           # Appointment management
│   │   ├── payment.js               # Payment processing
│   │   ├── chat.js                  # Real-time chat
│   │   ├── chatlog.js               # Chat history
│   │   ├── doctor.js                # Doctor operations
│   │   ├── admin.js                 # Admin operations
│   │   ├── intent.js                # Chatbot management
│   │   └── analytics.js             # System analytics
│   ├── scripts/
│   │   ├── allInOneSeeder.js        # Database seeding
│   │   ├── allInOneMigrator.js      # Database migration
│   │   └── assignCustomUserIds.js   # User ID assignment
│   ├── tests/
│   │   ├── api.test.js              # API tests
│   │   ├── server.test.js           # Server tests
│   │   ├── jest.setup.js            # Jest configuration
│   │   ├── emailTestRoutes.js       # Email test endpoints
│   │   └── test-email.html          # Email test page
│   ├── utils/
│   │   └── emailService.js          # Email utilities (OTP/Welcome)
│   ├── .env                         # Environment variables
│   ├── package.json                 # Backend dependencies
│   ├── server.js                    # Express server entry
│   ├── socketManager.js             # Socket.IO configuration
│   └── jest.config.js               # Jest configuration
│
├── frontend/
│   ├── public/
│   │   └── index.html               # HTML template
│   ├── src/
│   │   ├── components/
│   │   │   ├── Navbar.jsx           # Navigation bar
│   │   │   ├── PrivateRoute.jsx     # Route protection
│   │   │   ├── FloatingChatButton.jsx
│   │   │   ├── RealTimeChat.jsx     # Chat component
│   │   │   ├── OnlineStatusIndicator.jsx
│   │   │   ├── NotificationCenter.jsx
│   │   │   ├── TypingIndicator.jsx
│   │   │   └── ChangePasswordForm.jsx
│   │   ├── context/
│   │   │   ├── AuthContext.jsx      # Authentication state
│   │   │   └── ThemeContext.jsx     # Theme management
│   │   ├── pages/
│   │   │   ├── Home.jsx             # Landing page
│   │   │   ├── Login.jsx            # Login page
│   │   │   ├── Register.jsx         # Registration with OTP
│   │   │   ├── patient/
│   │   │   │   ├── PatientDashboard.jsx
│   │   │   │   ├── PatientProfile.jsx    # WITH USER ID
│   │   │   │   ├── Doctors.jsx
│   │   │   │   ├── BookAppointment.jsx
│   │   │   │   ├── MyAppointments.jsx
│   │   │   │   ├── MyPayments.jsx
│   │   │   │   ├── PaymentGateway.jsx
│   │   │   │   ├── EnhancedChatbot.jsx
│   │   │   │   └── ChatWithDoctor.jsx
│   │   │   ├── doctor/
│   │   │   │   ├── DoctorDashboard.jsx
│   │   │   │   ├── DoctorProfile.jsx     # WITH USER ID
│   │   │   │   ├── DoctorAppointments.jsx
│   │   │   │   ├── PatientHistory.jsx
│   │   │   │   └── DoctorChat.jsx
│   │   │   └── admin/
│   │   │       ├── AdminDashboard.jsx
│   │   │       ├── AdminProfile.jsx      # WITH USER ID
│   │   │       ├── ManageUsers.jsx
│   │   │       ├── ManageAppointments.jsx
│   │   │       ├── ManageIntents.jsx
│   │   │       └── ChatLogs.jsx
│   │   ├── services/
│   │   │   └── api.js               # Axios configuration
│   │   ├── tfjs/
│   │   │   └── chatbotModel.js      # TensorFlow.js model
│   │   ├── theme/
│   │   │   └── colors.js            # Theme configuration
│   │   ├── App.jsx                  # Main app component
│   │   ├── index.jsx                # React entry point
│   │   └── styles.css               # Global styles
│   ├── .env                         # Frontend environment
│   ├── package.json                 # Frontend dependencies
│   ├── vite.config.js               # Vite configuration
│   ├── tailwind.config.js           # Tailwind configuration
│   └── postcss.config.js            # PostCSS configuration
│
├── .gitignore                       # Git ignore rules
├── README.md                        # Project overview
├── SETUP_GUIDE.md                   # Installation guide
├── PROJECT_DOCUMENTATION.md         # This file
├── API_ENDPOINTS.md                 # API documentation
├── API_TESTING_GUIDE.md             # Testing guide
├── FEATURE_ENHANCEMENTS.md          # Feature documentation
├── SEEDING_GUIDE.md                 # Database setup
└── PROJECT_SUMMARY.md               # Project summary
```

---

## 🔐 Security Features

### Authentication & Authorization

- **JWT Tokens**: Secure stateless authentication
- **Password Hashing**: bcryptjs with salt rounds
- **Role-Based Access**: Patient, Doctor, Admin roles
- **Protected Routes**: Middleware authentication
- **Token Expiration**: 7-day token validity
- **Session Management**: Secure session handling

### Email Security

- **OTP Verification**: 6-digit OTP for registration
- **Email Validation**: Format and domain checking
- **Rate Limiting**: Max 5 OTP attempts
- **OTP Expiration**: 10-minute validity
- **Secure SMTP**: TLS encryption for Gmail

### Payment Security

- **4-Digit Passkey**: Additional payment authorization
- **Password Verification**: Required before passkey access
- **Encrypted Storage**: Secure passkey hashing
- **Transaction Logs**: Complete audit trail

### Data Protection

- **Input Validation**: Server-side validation
- **SQL Injection Prevention**: Mongoose sanitization
- **XSS Protection**: React's built-in escaping
- **CORS Configuration**: Controlled origin access
- **Environment Variables**: Sensitive data protection

---

## 🆔 Custom User ID System

### Implementation Details

**Format**: `SMP####` (e.g., SMP1000, SMP1001, SMP1002)

**Features**:

- Sequential auto-generation starting from SMP1000
- Unique constraint in database
- Displayed on all profile pages
- Included in welcome emails
- Used for user identification across system

**Database Schema**:

```javascript
userId: { 
  type: String, 
  unique: true, 
  sparse: true 
}
```

**Auto-Generation Hook**:

```javascript
UserSchema.pre('save', async function(next) {
  if (!this.userId && this.isNew) {
    // Find highest existing ID
    // Increment by 1
    // Assign new ID: SMP####
  }
  next();
});
```

**Migration Script**:

```bash
npm run assign-ids
```

This assigns IDs to existing users without them.

---

## 📧 Email System

### OTP Verification Email

- **Subject**: "Your OTP for SmartCare Plus Registration"
- **Design**: Blue gradient professional template
- **Content**: 6-digit OTP code, validity info
- **Features**: Mobile responsive, anti-spam headers

### Welcome Email

- **Subject**: "Welcome to SmartCare Plus - Your Healthcare Journey Begins!"
- **Design**: Green gradient professional template
- **Content**: Account confirmation, User ID (SMP####), quick start guide
- **Features**: Professional branding, actionable links

### Email Testing

- **Test Page**: `http://localhost:5000/test/test-email.html`
- **API Endpoints**:
  - POST `/api/test-email/otp` - Send test OTP
  - POST `/api/test-email/welcome` - Send test welcome
  - POST `/api/test-email/both` - Send both emails
  - GET `/api/test-email/info` - Endpoint documentation

### Anti-Spam Measures

1. Plain text + HTML versions
2. Proper SPF/DKIM headers
3. Professional sender name
4. Valid reply-to address
5. Proper content structure
6. No URL shorteners
7. Clear unsubscribe info
8. Reasonable email frequency
9. Valid HTML markup
10. TLS encryption

---

## 🤖 AI Chatbot

### Technology

- **Framework**: TensorFlow.js
- **Model**: Intent classification
- **Training**: 50+ predefined intents
- **Accuracy**: 85%+ intent recognition

### Features

- **24/7 Availability**: Always-on support
- **Health Queries**: Symptoms, medications, conditions
- **Appointment Guidance**: Booking instructions
- **Emergency Detection**: Urgent care recommendations
- **Multi-language**: English primary support
- **Context Awareness**: Conversation history

### Intent Categories

1. Greetings & Farewells
2. Appointment Booking
3. Symptom Checking
4. Emergency Situations
5. Medication Information
6. Doctor Recommendations
7. Payment Queries
8. Technical Support

### Admin Management

- Add/Edit/Delete intents
- Update responses
- View intent analytics
- Test intent recognition
- Export/Import intent data

---

## 💬 Real-Time Chat System

### Socket.IO Implementation

**Events**:

- `join_room` - User joins chat room
- `send_message` - Send message to room
- `receive_message` - Receive message from room
- `typing` - User typing indicator
- `stop_typing` - Stop typing indicator
- `user_online` - User online status
- `user_offline` - User offline status

**Features**:

- **Real-time Messaging**: Instant message delivery
- **Typing Indicators**: See when others are typing
- **Online Status**: Real-time presence detection
- **Message History**: Persistent chat logs
- **Unread Counts**: Track unread messages
- **File Sharing**: Send documents/images (future)
- **Read Receipts**: Message read status (future)

**Room Management**:

- Rooms named: `patient_<patientId>_doctor_<doctorId>`
- Automatic room creation on appointment
- Private doctor-patient conversations
- Admin monitoring capability

---

## 💳 Payment System

### Payment Flow

1. User views appointment details
2. Enters payment amount
3. Verifies account password
4. Enters 4-digit payment passkey
5. Payment processed and confirmed
6. Receipt generated (PDF)
7. Email confirmation sent

### Security Layers

1. **Authentication**: Valid JWT token
2. **Password Verification**: Account password required
3. **Payment Passkey**: 4-digit PIN required
4. **Transaction Logging**: All payments audited
5. **Amount Validation**: Server-side checking

### Payment Passkey Management

- **Initial Setup**: Required on first payment
- **Change Passkey**: Via profile settings
- **Reset**: Requires password verification
- **Format**: Exactly 4 digits (0-9)
- **Storage**: Hashed in database

---

## 📊 Analytics & Reporting

### Patient Analytics

- Total appointments
- Upcoming appointments
- Completed consultations
- Total payments
- Total amount spent
- Health metrics

### Doctor Analytics

- Total consultations
- Patients treated
- Average rating
- Today's appointments
- Monthly revenue
- Appointment success rate

### Admin Analytics

- Total users (patients, doctors, admins)
- Total appointments
- Pending doctor approvals
- System revenue
- Daily active users
- Popular specializations
- Appointment trends
- Payment statistics

---

## 🧪 Testing

### Test Coverage

- **API Routes**: 85%+ coverage
- **Models**: 90%+ coverage
- **Services**: 80%+ coverage
- **Integration**: Critical paths covered

### Test Files

- `api.test.js` - API endpoint tests
- `server.test.js` - Server functionality tests
- `jest.setup.js` - Test environment setup

### Testing Commands

```bash
# Run all tests
npm test

# Watch mode (auto-rerun on changes)
npm run test:watch

# Generate coverage report
npm run test:coverage

# Test specific file
npm test -- api.test.js
```

### Email Testing Commands

```bash
# Start server
npm run dev

# Open test page in browser
http://localhost:5000/test/test-email.html

# Test OTP email
curl -X POST http://localhost:5000/api/test-email/otp \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","name":"Test User"}'

# Test welcome email
curl -X POST http://localhost:5000/api/test-email/welcome \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","name":"Test User","userId":"SMP9999"}'
```

---

## 📝 API Documentation

### Base URL

```text
http://localhost:5000/api
```

### Authentication Endpoints

#### Register (Send OTP)

```http
POST /auth/send-otp
Content-Type: application/json

{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "securepassword123",
  "role": "patient",
  "phone": "1234567890"
}
```

#### Verify OTP

```http
POST /auth/verify-otp
Content-Type: application/json

{
  "email": "john@example.com",
  "otp": "123456"
}
```

#### Login

```http
POST /auth/login
Content-Type: application/json

{
  "email": "john@example.com",
  "password": "securepassword123"
}

Response:
{
  "token": "jwt_token_here",
  "user": { "id", "name", "email", "role", "userId" }
}
```

#### Change Password

```http
POST /auth/change-password
Authorization: Bearer <token>
Content-Type: application/json

{
  "currentPassword": "oldpass",
  "newPassword": "newpass"
}
```

### User Endpoints

#### Get Profile

```http
GET /admin/users/:id
Authorization: Bearer <token>
```

#### Update Profile

```http
PUT /admin/users/:id
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "Updated Name",
  "phone": "9876543210",
  "address": "New Address"
}
```

### Appointment Endpoints

#### Create Appointment

```http
POST /appointments
Authorization: Bearer <token>
Content-Type: application/json

{
  "doctor": "doctor_id",
  "appointmentDate": "2025-11-15",
  "timeSlot": "10:00 AM",
  "symptoms": "Fever and headache"
}
```

#### Get Appointments

```http
GET /appointments
Authorization: Bearer <token>
```

#### Update Appointment Status

```http
PUT /appointments/:id/status
Authorization: Bearer <token>
Content-Type: application/json

{
  "status": "confirmed"
}
```

### Payment Endpoints

#### Create Payment

```http
POST /payments
Authorization: Bearer <token>
Content-Type: application/json

{
  "appointment": "appointment_id",
  "amount": 500,
  "paymentPasskey": "1234"
}
```

#### Get Payments

```http
GET /payments
Authorization: Bearer <token>
```

### Chat Endpoints

#### Get Chat Messages

```http
GET /chat/messages/:roomId
Authorization: Bearer <token>
```

#### Send Message

```http
POST /chat/messages
Authorization: Bearer <token>
Content-Type: application/json

{
  "roomId": "room_id",
  "content": "Hello doctor"
}
```

For complete API documentation, see [API_ENDPOINTS.md](./API_ENDPOINTS.md)

---

## 🚀 Deployment Guide

### Environment Requirements

- Node.js v18+
- npm v9+
- MongoDB Atlas account
- SSL certificate (for production)
- Domain name (optional)

### Production Checklist

- [ ] Update .env files with production values
- [ ] Set NODE_ENV=production
- [ ] Configure CORS for production domain
- [ ] Enable SSL/HTTPS
- [ ] Set up MongoDB Atlas production cluster
- [ ] Configure email service for production
- [ ] Set up error logging (e.g., Sentry)
- [ ] Configure backup strategy
- [ ] Set up monitoring (e.g., PM2)
- [ ] Configure CDN (optional)
- [ ] Set up load balancer (for scaling)

### Deployment Platforms

**Backend Options**:

- Heroku (recommended for beginners)
- AWS EC2
- Google Cloud Platform
- Azure App Service
- DigitalOcean Droplets
- Railway
- Render

**Frontend Options**:

- Vercel (recommended)
- Netlify
- GitHub Pages
- AWS S3 + CloudFront
- Firebase Hosting

### Security Considerations

1. Use environment variables for all secrets
2. Enable HTTPS/SSL
3. Set secure HTTP headers
4. Implement rate limiting
5. Use helmet.js for Express
6. Configure CORS properly
7. Regular security updates
8. Database backup strategy
9. Monitor for suspicious activity
10. Implement API versioning

---

## 🔄 Version History

### Version 1.0.0 (November 8, 2025)

- ✅ Initial release
- ✅ Complete authentication system
- ✅ OTP email verification
- ✅ Custom User ID system (SMP####)
- ✅ Real-time chat functionality
- ✅ AI chatbot with TensorFlow.js
- ✅ Payment gateway with passkey
- ✅ Admin dashboard
- ✅ Doctor verification system
- ✅ Professional email templates
- ✅ Comprehensive testing suite
- ✅ Complete documentation

### Planned Features (v1.1.0)

- [ ] Video consultation
- [ ] Prescription management
- [ ] Medical report upload
- [ ] Multi-language support
- [ ] Mobile app (React Native)
- [ ] SMS notifications
- [ ] Calendar integration
- [ ] Insurance integration
- [ ] Telemedicine features
- [ ] Health tracking

---

## 📞 Support & Contact

**Project Maintainer**: `Abhiram1106`  
**Email**: `smartcareplus.team@gmail.com`  
**GitHub**: [Abhiram1106/SmartCare-Plus](https://github.com/Abhiram1106/SmartCare-Plus)  
**Issues**: [GitHub Issues](https://github.com/Abhiram1106/SmartCare-Plus/issues)

---

## 📄 License

MIT License - See LICENSE file for details

---

## 🙏 Acknowledgments

- React Team for the amazing framework
- Express.js community
- MongoDB for the flexible database
- Socket.IO for real-time capabilities
- TensorFlow.js team
- Tailwind CSS for beautiful styling
- All open-source contributors

---

**Documentation Last Updated**: November 8, 2025  
**Version**: 1.0.0  
**Status**: Production Ready ✅
