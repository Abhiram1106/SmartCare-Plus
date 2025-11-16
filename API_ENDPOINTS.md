# SmartCarePlus API Endpoints Documentation

## 📋 Overview

This document provides comprehensive information about all API endpoints available in the SmartCarePlus healthcare management system.

**Base URL:** `http://localhost:5000/api`  
**Total Endpoints:** 120+ HTTP endpoints + 8 Socket.io events  
**Authentication:** JWT Bearer Token  
**Database:** MongoDB with Mongoose ODM  
**Version:** 1.0.0  
**Last Updated:** November 8, 2025

## 🆕 New Features

- ✅ OTP email verification for registration
- ✅ Custom User ID system (SMP####)
- ✅ Professional email notifications
- ✅ Enhanced user profiles with userId display
- ✅ Email testing endpoints

**Premium Features:**

- 🏥 Electronic Health Records (EHR) - 9 endpoints
- 📹 Telemedicine Video Consultation - 9 endpoints
- 🤖 AI Symptom Checker & Disease Prediction - 7 endpoints
- 📈 Predictive Analytics System - 7 endpoints
- 🔒 RBAC & Security System - 10 endpoints

---

## 🔐 Authentication Endpoints

### POST `/auth/register`

**Description:** Register a new user with OTP email verification  
**Access:** Public  
**Method:** POST  

**Request Body:**

```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password123",
  "phone": "+1234567890",
  "role": "patient",
  
  // For doctors only:
  "specialization": "Cardiology",
  "experience": 5,
  "consultationFee": 100,
  "education": "MBBS, MD"
}
```

**Response:**

```json
{
  "message": "OTP sent to your email. Please verify to complete registration.",
  "email": "john@example.com",
  "otpSent": true
}
```

### POST `/auth/verify-otp`

**Description:** Verify OTP and complete registration  
**Access:** Public  
**Method:** POST  

**Request Body:**

```json
{
  "email": "john@example.com",
  "otp": "123456"
}
```

**Response:**

```json
{
  "message": "Email verified successfully. Registration complete!",
  "token": "jwt_token_here",
  "user": {
    "id": "user_id",
    "userId": "SMP1001",
    "name": "John Doe",
    "email": "john@example.com",
    "role": "patient"
  }
}
```

### POST `/auth/resend-otp`

**Description:** Resend OTP to email  
**Access:** Public  
**Method:** POST  

**Request Body:**

```json
{
  "email": "john@example.com"
}
```

**Response:**

```json
{
  "message": "New OTP sent to your email",
  "email": "john@example.com"
}
```

### POST `/auth/login`

**Description:** Authenticate user and get access token  
**Access:** Public  
**Method:** POST  

**Request Body:**

```json
{
  "email": "john@example.com",
  "password": "password123"
}
```

**Response:**

```json
{
  "token": "jwt_token_here",
  "user": {
    "id": "user_id",
    "name": "John Doe",
    "email": "john@example.com",
    "role": "patient"
  }
}
```

### GET `/auth/me`

**Description:** Get current authenticated user details  
**Access:** Private (All roles)  
**Method:** GET  
**Headers:** `Authorization: Bearer <token>`

**Response:**

```json
{
  "id": "user_id",
  "userId": "SMP1001",
  "name": "John Doe",
  "email": "john@example.com",
  "role": "patient",
  "phone": "+1234567890",
  "emailVerified": true
}
```

### POST `/auth/verify-password`

**Description:** Verify user's current password  
**Access:** Private (All roles)  
**Method:** POST  
**Headers:** `Authorization: Bearer <token>`

**Request Body:**

```json
{
  "password": "current_password"
}
```

**Response:**

```json
{
  "valid": true
}
```

### PUT `/auth/update-passkey`

**Description:** Update user's payment passkey  
**Access:** Private (All roles)  
**Method:** PUT  
**Headers:** `Authorization: Bearer <token>`

**Request Body:**

```json
{
  "currentPassword": "password123",
  "newPasskey": "5678"
}
```

**Response:**

```json
{
  "message": "Payment passkey updated successfully"
}
```

---

## 👨‍⚕️ Doctor Endpoints

### GET `/doctors/filters/options`

**Description:** Get available filter options for doctors  
**Access:** Public  
**Method:** GET  

**Response:**

```json
{
  "specializations": ["Cardiology", "Neurology", "Orthopedics"],
  "feeRange": {
    "minFee": 50,
    "maxFee": 500
  },
  "experienceRange": {
    "minExperience": 1,
    "maxExperience": 20
  }
}
```

### GET `/doctors`

**Description:** Get list of approved doctors with filtering and pagination  
**Access:** Public  
**Method:** GET  

**Query Parameters:**

- `specialization` - Filter by specialization
- `search` - Search by name, specialization, or education
- `minFee`, `maxFee` - Fee range filter
- `minExperience`, `maxExperience` - Experience range filter
- `minRating` - Minimum rating filter
- `gender` - Filter by gender
- `sortBy` - Sort by: name, experience, fee, rating
- `sortOrder` - asc or desc
- `page` - Page number (default: 1)
- `limit` - Items per page (default: 12)

**Response:**

```json
{
  "doctors": [
    {
      "_id": "doctor_id",
      "name": "Dr. John Smith",
      "specialization": "Cardiology",
      "experience": 10,
      "consultationFee": 200,
      "averageRating": 4.5,
      "totalReviews": 25,
      "upcomingSlots": 15,
      "isAvailableToday": true
    }
  ],
  "pagination": {
    "currentPage": 1,
    "totalPages": 5,
    "totalDoctors": 50,
    "hasNext": true,
    "hasPrev": false
  }
}
```

### GET `/doctors/:id`

**Description:** Get detailed information about a specific doctor  
**Access:** Public  
**Method:** GET  

**Response:**

```json
{
  "_id": "doctor_id",
  "name": "Dr. John Smith",
  "email": "doctor@example.com",
  "specialization": "Cardiology",
  "experience": 10,
  "consultationFee": 200,
  "education": "MBBS, MD Cardiology",
  "averageRating": 4.5,
  "totalReviews": 25,
  "recentReviews": [
    {
      "patientName": "Jane Doe",
      "rating": 5,
      "feedback": "Excellent doctor",
      "date": "2023-10-15"
    }
  ]
}
```

### GET `/doctors/:doctorId/availability`

**Description:** Get doctor's available time slots for a specific date  
**Access:** Public  
**Method:** GET  

**Query Parameters:**

- `date` - Date in YYYY-MM-DD format (required)

**Response:**

```json
{
  "date": "2023-11-06",
  "availableSlots": ["09:00-10:00", "10:00-11:00", "14:00-15:00"],
  "bookedSlots": ["11:00-12:00", "15:00-16:00"]
}
```

---

## 📅 Appointment Endpoints

### POST `/appointments`

**Description:** Create a new appointment  
**Access:** Private (Patient only)  
**Method:** POST  
**Headers:** `Authorization: Bearer <token>`

**Request Body:**

```json
{
  "doctorId": "doctor_id",
  "appointmentDate": "2023-11-10",
  "timeSlot": "10:00-11:00",
  "symptoms": "Chest pain and shortness of breath",
  "patientHistory": {
    "allergies": "None",
    "currentMedications": "Aspirin",
    "previousConditions": "Hypertension"
  }
}
```

**Response:**

```json
{
  "_id": "appointment_id",
  "patient": {
    "_id": "patient_id",
    "name": "John Doe",
    "email": "john@example.com"
  },
  "doctor": {
    "_id": "doctor_id",
    "name": "Dr. Smith",
    "specialization": "Cardiology",
    "consultationFee": 200
  },
  "appointmentDate": "2023-11-10T10:00:00.000Z",
  "timeSlot": "10:00-11:00",
  "symptoms": "Chest pain and shortness of breath",
  "status": "pending",
  "createdAt": "2023-11-05T08:00:00.000Z"
}
```

### GET `/appointments`

**Description:** Get appointments (filtered by user role)  
**Access:** Private (All roles)  
**Method:** GET  
**Headers:** `Authorization: Bearer <token>`

**Query Parameters:**

- `status` - Filter by status: pending, confirmed, completed, cancelled
- `date` - Filter by specific date

**Response:**

```json
[
  {
    "_id": "appointment_id",
    "patient": {
      "name": "John Doe",
      "email": "john@example.com"
    },
    "doctor": {
      "name": "Dr. Smith",
      "specialization": "Cardiology"
    },
    "appointmentDate": "2023-11-10T10:00:00.000Z",
    "timeSlot": "10:00-11:00",
    "symptoms": "Chest pain",
    "status": "pending"
  }
]
```

### PUT `/appointments/:id`

**Description:** Update appointment (status, diagnosis, prescription)  
**Access:** Private (Doctor for medical updates, Patient for cancellation)  
**Method:** PUT  
**Headers:** `Authorization: Bearer <token>`

**Request Body:**

```json
{
  "status": "confirmed", // pending, confirmed, completed, cancelled
  "diagnosis": "Mild angina", // Doctor only
  "prescription": "Rest and medication", // Doctor only
  "notes": "Patient responded well" // Doctor only
}
```

**Response:**

```json
{
  "_id": "appointment_id",
  "status": "confirmed",
  "diagnosis": "Mild angina",
  "prescription": "Rest and medication",
  "updatedAt": "2023-11-05T09:00:00.000Z"
}
```

---

## 💬 Chat Endpoints

### POST `/chat/send`

**Description:** Send a message in doctor-patient chat  
**Access:** Private (Patient and Doctor)  
**Method:** POST  
**Headers:** `Authorization: Bearer <token>`

**Request Body:**

```json
{
  "receiverId": "user_id",
  "message": "Hello, I have a question about my medication"
}
```

**Response:**

```json
{
  "_id": "message_id",
  "sender": "sender_id",
  "receiver": "receiver_id",
  "message": "Hello, I have a question about my medication",
  "timestamp": "2023-11-05T10:00:00.000Z",
  "isRead": false
}
```

### GET `/chat/messages/:userId`

**Description:** Get chat messages between current user and specified user  
**Access:** Private (Patient and Doctor)  
**Method:** GET  
**Headers:** `Authorization: Bearer <token>`

**Response:**

```json
[
  {
    "_id": "message_id",
    "sender": {
      "name": "John Doe",
      "role": "patient"
    },
    "receiver": {
      "name": "Dr. Smith",
      "role": "doctor"
    },
    "message": "Hello doctor",
    "timestamp": "2023-11-05T10:00:00.000Z",
    "isRead": true
  }
]
```

### GET `/chat/conversations`

**Description:** Get list of all conversations for current user  
**Access:** Private (Patient and Doctor)  
**Method:** GET  
**Headers:** `Authorization: Bearer <token>`

**Response:**

```json
[
  {
    "userId": "other_user_id",
    "userName": "Dr. Smith",
    "userRole": "doctor",
    "lastMessage": "Take care and follow the prescription",
    "lastMessageTime": "2023-11-05T15:30:00.000Z",
    "unreadCount": 2
  }
]
```

---

## 💳 Payment Endpoints

### POST `/payments`

**Description:** Create a new payment for an appointment  
**Access:** Private (Patient only)  
**Method:** POST  
**Headers:** `Authorization: Bearer <token>`

**Request Body:**

```json
{
  "appointment": "appointment_id",
  "amount": 200,
  "paymentMethod": "upi", // card, upi, netbanking, wallet
  "passkey": "1234",
  "phoneNumber": "+1234567890"
}
```

**Response:**

```json
{
  "_id": "payment_id",
  "patient": "patient_id",
  "appointment": "appointment_id",
  "amount": 200,
  "paymentMethod": "upi",
  "transactionId": "TXN123456789",
  "status": "completed", // pending, completed, failed, refunded
  "passkeyVerified": true,
  "createdAt": "2023-11-05T10:00:00.000Z"
}
```

### GET `/payments`

**Description:** Get payment history for current user  
**Access:** Private (All roles)  
**Method:** GET  
**Headers:** `Authorization: Bearer <token>`

**Response:**

```json
[
  {
    "_id": "payment_id",
    "appointment": {
      "doctor": {
        "name": "Dr. Smith"
      },
      "appointmentDate": "2023-11-10T10:00:00.000Z"
    },
    "amount": 200,
    "paymentMethod": "upi",
    "transactionId": "TXN123456789",
    "status": "completed",
    "createdAt": "2023-11-05T10:00:00.000Z"
  }
]
```

---

## 🏢 Admin Endpoints

### GET `/admin/users`

**Description:** Get all users with filtering options  
**Access:** Private (Admin only)  
**Method:** GET  
**Headers:** `Authorization: Bearer <token>`

**Query Parameters:**

- `role` - Filter by role: patient, doctor, admin
- `approved` - Filter doctors by approval status
- `search` - Search by name or email
- `page` - Page number
- `limit` - Items per page

**Response:**

```json
{
  "users": [
    {
      "_id": "user_id",
      "name": "Dr. Smith",
      "email": "doctor@example.com",
      "role": "doctor",
      "specialization": "Cardiology",
      "approved": false,
      "createdAt": "2023-11-01T00:00:00.000Z"
    }
  ],
  "pagination": {
    "currentPage": 1,
    "totalPages": 10,
    "totalUsers": 100
  }
}
```

### PUT `/admin/users/:id/approve`

**Description:** Approve a doctor's account  
**Access:** Private (Admin only)  
**Method:** PUT  
**Headers:** `Authorization: Bearer <token>`

**Response:**

```json
{
  "_id": "doctor_id",
  "name": "Dr. Smith",
  "approved": true,
  "approvedAt": "2023-11-05T10:00:00.000Z"
}
```

### GET `/admin/stats`

**Description:** Get system statistics and analytics  
**Access:** Private (Admin only)  
**Method:** GET  
**Headers:** `Authorization: Bearer <token>`

**Response:**

```json
{
  "totalPatients": 150,
  "totalDoctors": 25,
  "totalAppointments": 200,
  "totalPayments": 180,
  "pendingApprovals": 5,
  "recentActivity": [
    {
      "type": "new_registration",
      "user": "Dr. Johnson",
      "timestamp": "2023-11-05T09:00:00.000Z"
    }
  ],
  "monthlyStats": {
    "appointments": [10, 15, 20, 25, 30],
    "payments": [2000, 3000, 4000, 5000, 6000]
  }
}
```

---

## 🤖 Intent Endpoints (Chatbot)

### GET `/intents`

**Description:** Get all chatbot intents (admin view)  
**Access:** Private (Admin only)  
**Method:** GET  
**Headers:** `Authorization: Bearer <token>`

**Response:**

```json
[
  {
    "_id": "intent_id",
    "tag": "greeting",
    "patterns": ["hello", "hi", "good morning"],
    "responses": ["Hello! How can I help you today?"],
    "category": "general",
    "isActive": true
  }
]
```

### GET `/intents/active`

**Description:** Get active chatbot intents for training  
**Access:** Public  
**Method:** GET  

**Response:**

```json
[
  {
    "tag": "appointment_booking",
    "patterns": ["book appointment", "schedule meeting", "see doctor"],
    "responses": ["I can help you book an appointment. Please select a doctor."],
    "category": "appointment"
  }
]
```

### POST `/intents`

**Description:** Create new chatbot intent  
**Access:** Private (Admin only)  
**Method:** POST  
**Headers:** `Authorization: Bearer <token>`

**Request Body:**

```json
{
  "tag": "symptoms_check",
  "patterns": ["I have fever", "feeling sick", "symptoms"],
  "responses": ["I understand you're not feeling well. Please describe your symptoms."],
  "category": "medical",
  "isActive": true
}
```

---

## 📝 ChatLog Endpoints

### GET `/chatlogs`

**Description:** Get chatbot interaction logs  
**Access:** Private (Admin for all logs, Patient for own logs)  
**Method:** GET  
**Headers:** `Authorization: Bearer <token>`

**Response:**

```json
[
  {
    "_id": "chatlog_id",
    "user": {
      "name": "John Doe",
      "email": "john@example.com"
    },
    "userMessage": "I need to book an appointment",
    "botResponse": "I can help you book an appointment. Please select a doctor.",
    "intent": "appointment_booking",
    "confidence": 0.95,
    "feedback": "positive",
    "createdAt": "2023-11-05T10:00:00.000Z"
  }
]
```

### POST `/chatlogs/:id/review`

**Description:** Add feedback to chatbot interaction  
**Access:** Private (Patient only)  
**Method:** POST  
**Headers:** `Authorization: Bearer <token>`

**Request Body:**

```json
{
  "feedback": "positive", // positive, negative
  "needsReview": false
}
```

---

## ⭐ Review & Rating Endpoints

### POST `/reviews`

**Description:** Create a new review for a doctor  
**Access:** Private (Patient only)  
**Method:** POST  
**Headers:** `Authorization: Bearer <token>`

**Request Body:**

```json
{
  "doctor": "doctor_id",
  "appointment": "appointment_id",
  "rating": 5,
  "title": "Excellent Doctor!",
  "comment": "Very professional and caring. Highly recommend!",
  "detailedRatings": {
    "communication": 5,
    "punctuality": 5,
    "bedsideManner": 5
  }
}
```

**Response:**

```json
{
  "_id": "review_id",
  "patient": {
    "_id": "patient_id",
    "name": "John Doe"
  },
  "doctor": {
    "_id": "doctor_id",
    "name": "Dr. Smith"
  },
  "rating": 5,
  "title": "Excellent Doctor!",
  "comment": "Very professional and caring. Highly recommend!",
  "detailedRatings": {
    "communication": 5,
    "punctuality": 5,
    "bedsideManner": 5
  },
  "status": "approved",
  "verified": true,
  "helpfulVotes": 0,
  "notHelpfulVotes": 0,
  "createdAt": "2025-11-05T10:00:00.000Z"
}
```

### GET `/reviews/doctor/:doctorId`

**Description:** Get all approved reviews for a specific doctor  
**Access:** Public  
**Method:** GET  

**Query Parameters:**

- `page` - Page number (default: 1)
- `limit` - Reviews per page (default: 10)
- `sort` - Sort by: helpful, -createdAt, rating-high, rating-low
- `minRating` - Filter by minimum rating (1-5)
- `verified` - Filter verified patients only (true/false)

**Response:**

```json
{
  "reviews": [
    {
      "_id": "review_id",
      "patient": {
        "name": "John Doe",
        "profilePicture": "url"
      },
      "rating": 5,
      "title": "Excellent Doctor!",
      "comment": "Very professional and caring...",
      "detailedRatings": {
        "communication": 5,
        "punctuality": 5,
        "bedsideManner": 5
      },
      "verified": true,
      "helpfulVotes": 45,
      "notHelpfulVotes": 2,
      "hasResponse": true,
      "doctorResponse": {
        "comment": "Thank you for your kind words!",
        "respondedAt": "2025-11-05T11:00:00.000Z"
      },
      "createdAt": "2025-11-05T10:00:00.000Z"
    }
  ],
  "stats": {
    "averageRating": 4.8,
    "totalReviews": 127,
    "ratingBreakdown": {
      "5": 89,
      "4": 25,
      "3": 9,
      "2": 3,
      "1": 1
    }
  },
  "pagination": {
    "currentPage": 1,
    "totalPages": 13,
    "hasMore": true
  }
}
```

### GET `/reviews/my-reviews`

**Description:** Get all reviews written by the current patient  
**Access:** Private (Patient only)  
**Method:** GET  
**Headers:** `Authorization: Bearer <token>`

**Response:**

```json
[
  {
    "_id": "review_id",
    "doctor": {
      "_id": "doctor_id",
      "name": "Dr. Smith",
      "specialization": "Cardiology"
    },
    "rating": 5,
    "title": "Excellent Doctor!",
    "comment": "Very professional...",
    "status": "approved",
    "verified": true,
    "helpfulVotes": 45,
    "hasResponse": true,
    "doctorResponse": {
      "comment": "Thank you!",
      "respondedAt": "2025-11-05T11:00:00.000Z"
    },
    "createdAt": "2025-11-05T10:00:00.000Z"
  }
]
```

### PUT `/reviews/:id`

**Description:** Update own review  
**Access:** Private (Patient only - must be review owner)  
**Method:** PUT  
**Headers:** `Authorization: Bearer <token>`

**Request Body:**

```json
{
  "rating": 4,
  "title": "Updated Review",
  "comment": "Updated comment text...",
  "detailedRatings": {
    "communication": 5,
    "punctuality": 4,
    "bedsideManner": 4
  }
}
```

**Response:**

```json
{
  "_id": "review_id",
  "rating": 4,
  "title": "Updated Review",
  "comment": "Updated comment text...",
  "isEdited": true,
  "updatedAt": "2025-11-05T12:00:00.000Z"
}
```

### DELETE `/reviews/:id`

**Description:** Delete own review  
**Access:** Private (Patient only - must be review owner)  
**Method:** DELETE  
**Headers:** `Authorization: Bearer <token>`

**Response:**

```json
{
  "message": "Review deleted successfully"
}
```

### POST `/reviews/:id/vote`

**Description:** Vote review as helpful or not helpful  
**Access:** Private (All authenticated users)  
**Method:** POST  
**Headers:** `Authorization: Bearer <token>`

**Request Body:**

```json
{
  "vote": "helpful" // or "notHelpful"
}
```

**Response:**

```json
{
  "_id": "review_id",
  "helpfulVotes": 46,
  "notHelpfulVotes": 2,
  "userVote": "helpful"
}
```

### POST `/reviews/:id/flag`

**Description:** Flag review as inappropriate  
**Access:** Private (All authenticated users)  
**Method:** POST  
**Headers:** `Authorization: Bearer <token>`

**Request Body:**

```json
{
  "reason": "Inappropriate content or spam"
}
```

**Response:**

```json
{
  "message": "Review flagged successfully",
  "flagCount": 1
}
```

### POST `/reviews/:id/respond`

**Description:** Doctor responds to a review  
**Access:** Private (Doctor only - must be the reviewed doctor)  
**Method:** POST  
**Headers:** `Authorization: Bearer <token>`

**Request Body:**

```json
{
  "comment": "Thank you for your feedback. I'm glad I could help!"
}
```

**Response:**

```json
{
  "_id": "review_id",
  "hasResponse": true,
  "doctorResponse": {
    "comment": "Thank you for your feedback...",
    "respondedAt": "2025-11-05T13:00:00.000Z"
  }
}
```

### GET `/reviews/admin/all`

**Description:** Get all reviews for admin moderation  
**Access:** Private (Admin only)  
**Method:** GET  
**Headers:** `Authorization: Bearer <token>`

**Query Parameters:**

- `status` - Filter by status: pending, approved, rejected, flagged
- `page` - Page number (default: 1)
- `limit` - Reviews per page (default: 20)

**Response:**

```json
{
  "reviews": [
    {
      "_id": "review_id",
      "patient": { "name": "John Doe" },
      "doctor": { "name": "Dr. Smith" },
      "rating": 5,
      "comment": "Great doctor!",
      "status": "pending",
      "flagCount": 0,
      "createdAt": "2025-11-05T10:00:00.000Z"
    }
  ],
  "pagination": {
    "currentPage": 1,
    "totalPages": 5,
    "total": 100
  }
}
```

### PUT `/reviews/admin/:id/moderate`

**Description:** Moderate review (approve/reject/flag)  
**Access:** Private (Admin only)  
**Method:** PUT  
**Headers:** `Authorization: Bearer <token>`

**Request Body:**

```json
{
  "status": "approved", // approved, rejected, flagged
  "moderationNote": "Review meets guidelines"
}
```

**Response:**

```json
{
  "_id": "review_id",
  "status": "approved",
  "moderatedBy": "admin_id",
  "moderatedAt": "2025-11-05T14:00:00.000Z",
  "moderationNote": "Review meets guidelines"
}
```

### GET `/reviews/stats/overall`

**Description:** Get overall review system statistics  
**Access:** Private (Admin only)  
**Method:** GET  
**Headers:** `Authorization: Bearer <token>`

**Response:**

```json
{
  "totalReviews": 1247,
  "averageRating": 4.6,
  "statusBreakdown": {
    "approved": 1150,
    "pending": 45,
    "rejected": 32,
    "flagged": 20
  },
  "verifiedReviews": 1089,
  "reviewsWithResponses": 456,
  "recentReviews": [
    {
      "patient": "John Doe",
      "doctor": "Dr. Smith",
      "rating": 5,
      "createdAt": "2025-11-05T10:00:00.000Z"
    }
  ]
}
```

---

## 🔌 Socket.io Real-time Events

### Connection Events

```javascript
// Client connects to socket
socket.emit('user:register', { userId: 'user_id', role: 'patient' });

// User comes online
socket.emit('user:online', userId);

// User goes offline
socket.emit('user:offline', userId);
```

### Chat Events

```javascript
// Send message
socket.emit('chat:message', {
  senderId: 'sender_id',
  receiverId: 'receiver_id',
  message: 'Hello doctor'
});

// Receive new message
socket.on('chat:newMessage', (messageData) => {
  // Handle new message
});

// Typing indicators
socket.emit('chat:typing', { receiverId: 'receiver_id' });
socket.emit('chat:stopTyping', { receiverId: 'receiver_id' });
```

### Appointment Events

```javascript
// Appointment status update
socket.emit('appointment:update', {
  appointmentId: 'appointment_id',
  status: 'confirmed'
});
```

---

## 🔒 Authentication & Authorization

### JWT Token Structure

```json
{
  "userId": "user_id",
  "role": "patient",
  "iat": 1699180800,
  "exp": 1699267200
}
```

### Role-based Access Control

| Endpoint | Patient | Doctor | Admin |
|----------|---------|--------|-------|
| Auth endpoints | ✅ | ✅ | ✅ |
| Doctor listing | ✅ | ✅ | ✅ |
| Book appointment | ✅ | ❌ | ❌ |
| Update appointment | ❌ | ✅ | ✅ |
| Chat with doctors | ✅ | ✅ | ❌ |
| Make payments | ✅ | ❌ | ❌ |
| Admin functions | ❌ | ❌ | ✅ |
| Manage intents | ❌ | ❌ | ✅ |

---

## 📱 Error Responses

### Common Error Codes

| Status Code | Description | Example |
|-------------|-------------|---------|
| 400 | Bad Request | Invalid input data |
| 401 | Unauthorized | Missing or invalid token |
| 403 | Forbidden | Insufficient permissions |
| 404 | Not Found | Resource doesn't exist |
| 409 | Conflict | Duplicate resource |
| 500 | Server Error | Internal server error |

### Error Response Format

```json
{
  "message": "Validation error",
  "error": "Email already exists",
  "statusCode": 400,
  "timestamp": "2023-11-05T10:00:00.000Z"
}
```

---

## 🚀 Getting Started

### 1. Start the Server

```bash
cd backend
npm install
npm start
# Server runs on http://localhost:5000
```

### 2. Test Endpoints

```bash
# Register a new user
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"John Doe","email":"john@example.com","password":"password123","role":"patient"}'

# Login
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"john@example.com","password":"password123"}'

# Get doctors (with token)
curl -X GET http://localhost:5000/api/doctors \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### 3. Run Tests

```bash
cd backend
npm test                # Run all tests
npm run test:watch      # Run tests in watch mode
npm run test:coverage   # Run tests with coverage
```

---

## � Analytics Endpoints

### GET `/analytics/revenue`

**Description:** Get revenue analytics with daily/weekly/monthly breakdowns  
**Access:** Private (Admin)  
**Query Parameters:**

- `period` - daily, weekly, or monthly (default: monthly)
- `startDate` - ISO date string (default: 30 days ago)
- `endDate` - ISO date string (default: today)

**Response:**

```json
{
  "period": "monthly",
  "startDate": "2025-10-01",
  "endDate": "2025-11-05",
  "data": [
    {
      "_id": { "year": 2025, "month": 10 },
      "totalRevenue": 125000,
      "totalTransactions": 45,
      "averageAmount": 2777.78
    }
  ],
  "totalRevenue": 125000
}
```

### GET `/analytics/appointments`

**Description:** Get appointment trends and status distribution  
**Access:** Private (Admin/Doctor)  
**Query Parameters:**

- `period` - daily, weekly, or monthly
- `startDate` - ISO date string
- `endDate` - ISO date string

**Response:**

```json
{
  "trends": [
    {
      "_id": { "year": 2025, "month": 11 },
      "total": 150,
      "confirmed": 80,
      "completed": 50,
      "cancelled": 10,
      "pending": 10
    }
  ],
  "statusBreakdown": [
    { "_id": "completed", "count": 50 },
    { "_id": "confirmed", "count": 80 }
  ]
}
```

### GET `/analytics/peak-hours`

**Description:** Get peak booking hours heatmap data  
**Access:** Private (Admin/Doctor)  

**Response:**

```json
{
  "heatmapData": [[/* 7 days x 24 hours matrix */]],
  "dayNames": ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
  "peakHours": [
    {
      "_id": { "dayOfWeek": 2, "hour": 10 },
      "count": 45
    }
  ]
}
```

### GET `/analytics/doctor-performance`

**Description:** Get doctor performance metrics and leaderboard  
**Access:** Private (Admin)  
**Query Parameters:**

- `startDate` - ISO date string
- `endDate` - ISO date string
- `limit` - Number of top doctors to return (default: 10)

**Response:**

```json
{
  "leaderboard": [
    {
      "doctorId": "doc_id",
      "doctorName": "Dr. John Smith",
      "specialization": "Cardiology",
      "totalAppointments": 120,
      "completedAppointments": 110,
      "completionRate": "91.67",
      "cancellationRate": "8.33",
      "totalRevenue": 220000,
      "uniquePatients": 85,
      "rating": 4.8
    }
  ],
  "aggregateStats": {
    "totalDoctors": 150,
    "totalAppointments": 5000,
    "totalRevenue": 10000000,
    "averageCompletionRate": "89.50",
    "averageCancellationRate": "10.50"
  }
}
```

### GET `/analytics/payment-success-rate`

**Description:** Get payment success/failure rates and trends  
**Access:** Private (Admin)  
**Query Parameters:**

- `startDate` - ISO date string
- `endDate` - ISO date string

**Response:**

```json
{
  "statusBreakdown": [
    { "_id": "completed", "count": 450, "totalAmount": 900000 },
    { "_id": "pending", "count": 20, "totalAmount": 40000 },
    { "_id": "failed", "count": 10, "totalAmount": 20000 }
  ],
  "methodBreakdown": [
    { "_id": "card", "count": 300, "totalAmount": 600000 },
    { "_id": "upi", "count": 150, "totalAmount": 300000 }
  ],
  "successRate": "93.75",
  "totalPayments": 480,
  "completedPayments": 450
}
```

### GET `/analytics/cancellation-analysis`

**Description:** Get cancellation rate analysis and trends  
**Access:** Private (Admin/Doctor)  
**Query Parameters:**

- `startDate` - ISO date string
- `endDate` - ISO date string

**Response:**

```json
{
  "cancellationRate": "12.50",
  "totalAppointments": 400,
  "cancelledAppointments": 50,
  "trend": [
    {
      "_id": { "year": 2025, "month": 11 },
      "total": 150,
      "cancelled": 18,
      "cancellationRate": 12.0
    }
  ],
  "reasons": [
    { "_id": "Patient unavailable", "count": 20 },
    { "_id": "Doctor unavailable", "count": 15 }
  ]
}
```

### GET `/analytics/comparison`

**Description:** Get monthly/quarterly comparison data  
**Access:** Private (Admin)  

**Response:**

```json
{
  "monthly": {
    "current": {
      "period": "November 2025",
      "appointments": 150,
      "revenue": 300000,
      "patients": 120
    },
    "previous": {
      "period": "October 2025",
      "appointments": 130,
      "revenue": 260000,
      "patients": 100
    },
    "growth": {
      "appointments": "15.38",
      "revenue": "15.38",
      "patients": "20.00"
    }
  },
  "quarterly": { /* Similar structure */ }
}
```

### GET `/analytics/patient-stats`

**Description:** Get patient-specific analytics (for patient dashboard)  
**Access:** Private (Patient)  
**Query Parameters:**

- `startDate` - ISO date string (default: 1 year ago)
- `endDate` - ISO date string (default: today)

**Response:**

```json
{
  "appointmentTrend": [
    {
      "_id": { "year": 2025, "month": 10 },
      "count": 5
    }
  ],
  "spendingAnalysis": [
    {
      "_id": { "year": 2025, "month": 10 },
      "totalSpent": 5000,
      "count": 5
    }
  ],
  "topSpecializations": [
    { "_id": "Cardiology", "count": 3 },
    { "_id": "Dermatology", "count": 2 }
  ]
}
```

---

## �📊 Database Schema

### Collections

- `users` - Patients, Doctors, Admins
- `appointments` - Appointment bookings
- `payments` - Payment transactions
- `chatmessages` - Real-time chat messages
- `chatlogs` - Chatbot interactions
- `intents` - Chatbot training data

### Indexes

- Users: `email` (unique), `role`, `approved`
- Appointments: `patient`, `doctor`, `appointmentDate`, `status`
- Payments: `patient`, `transactionId` (unique), `status`
- Messages: `sender`, `receiver`, `timestamp`

---

---

## 🏥 Electronic Health Records (EHR) System

### GET `/ehr/:patientId`

**Description:** Get patient's complete medical record  
**Access:** Private (Patient can access own, Doctor/Admin can access any)  
**Method:** GET  

**Response:**

```json
{
  "success": true,
  "data": {
    "_id": "record_id",
    "patient": "patient_id",
    "bloodType": "O+",
    "allergies": [{
      "allergen": "Penicillin",
      "reaction": "Skin rash",
      "severity": "moderate",
      "diagnosedDate": "2024-01-15T00:00:00.000Z"
    }],
    "chronicConditions": ["Hypertension"],
    "currentMedications": [],
    "immunizations": [],
    "labResults": [],
    "vitalSigns": [],
    "familyHistory": {},
    "emergencyContact": {},
    "insuranceInfo": {}
  }
}
```

### PUT `/ehr/:patientId/basic`

**Description:** Update basic health information  
**Access:** Private (Patient)  
**Method:** PUT  

**Request Body:**

```json
{
  "bloodType": "O+",
  "height": 175,
  "weight": 70,
  "emergencyContact": {
    "name": "Emergency Contact",
    "phone": "+1234567890",
    "relationship": "Spouse"
  }
}
```

### POST `/ehr/:patientId/allergies`

**Description:** Add allergy to medical record  
**Access:** Private (Doctor/Admin only)  
**Method:** POST  

**Request Body:**

```json
{
  "allergen": "Penicillin",
  "reaction": "Skin rash",
  "severity": "moderate",
  "diagnosedDate": "2024-01-15T00:00:00.000Z"
}
```

### POST `/ehr/:patientId/vitals`

**Description:** Record vital signs  
**Access:** Private  
**Method:** POST  

**Request Body:**

```json
{
  "temperature": 98.6,
  "bloodPressure": {
    "systolic": 120,
    "diastolic": 80
  },
  "heartRate": 72,
  "respiratoryRate": 16,
  "oxygenSaturation": 98
}
```

### POST `/ehr/:patientId/immunizations`

**Description:** Add immunization record  
**Access:** Private (Doctor/Admin)  
**Method:** POST  

### POST `/ehr/:patientId/chronic-conditions`

**Description:** Add chronic condition  
**Access:** Private (Doctor/Admin)  
**Method:** POST  

### POST `/ehr/:patientId/lab-results`

**Description:** Add lab test results  
**Access:** Private (Doctor/Admin)  
**Method:** POST  

### POST `/ehr/:patientId/medications`

**Description:** Add current medication  
**Access:** Private (Doctor/Admin)  
**Method:** POST  

### GET `/ehr/:patientId/summary`

**Description:** Get health summary  
**Access:** Private  
**Method:** GET  

---

## 📹 Telemedicine Video Consultation

### POST `/telemedicine/create`

**Description:** Create video consultation room for appointment  
**Access:** Private (Doctor or Patient)  
**Method:** POST  

**Request Body:**

```json
{
  "appointmentId": "appointment_id",
  "scheduledTime": "2024-01-15T10:00:00.000Z",
  "recordingConsent": {
    "patient": true,
    "doctor": true
  }
}
```

**Response:**

```json
{
  "success": true,
  "message": "Video consultation room created",
  "data": {
    "_id": "consultation_id",
    "roomId": "unique_room_id",
    "appointment": "appointment_id",
    "patient": {...},
    "doctor": {...},
    "scheduledTime": "2024-01-15T10:00:00.000Z",
    "status": "scheduled"
  }
}
```

### GET `/telemedicine/room/:roomId`

**Description:** Get consultation room details  
**Access:** Private (Participants only)  
**Method:** GET  

### POST `/telemedicine/room/:roomId/join`

**Description:** Join consultation room  
**Access:** Private (Participants only)  
**Method:** POST  

**Response:**

```json
{
  "success": true,
  "message": "Joined consultation room",
  "data": {
    "roomId": "unique_room_id",
    "status": "ongoing",
    "participants": 2
  }
}
```

### POST `/telemedicine/room/:roomId/leave`

**Description:** Leave consultation room  
**Access:** Private  
**Method:** POST  

### POST `/telemedicine/room/:roomId/message`

**Description:** Send message in consultation chat  
**Access:** Private (Participants only)  
**Method:** POST  

**Request Body:**

```json
{
  "message": "Hello Doctor",
  "type": "text",
  "fileUrl": "optional_file_url"
}
```

### PUT `/telemedicine/room/:roomId/notes`

**Description:** Add consultation notes (Doctor only)  
**Access:** Private (Doctor)  
**Method:** PUT  

**Request Body:**

```json
{
  "chiefComplaint": "Headache",
  "symptoms": ["headache", "fever"],
  "diagnosis": "Tension headache",
  "treatment": "Rest and hydration",
  "followUp": "1 week",
  "prescriptionId": "prescription_id"
}
```

### POST `/telemedicine/room/:roomId/report-issue`

**Description:** Report technical issue  
**Access:** Private  
**Method:** POST  

### POST `/telemedicine/room/:roomId/rate`

**Description:** Rate consultation session  
**Access:** Private (Participants only)  
**Method:** POST  

**Request Body:**

```json
{
  "score": 5,
  "feedback": "Great consultation"
}
```

### GET `/telemedicine/my-consultations`

**Description:** Get user's consultations  
**Access:** Private  
**Method:** GET  

---

## 🤖 AI Symptom Checker & Disease Prediction

### POST `/ai-symptom-checker/analyze`

**Description:** Analyze symptoms and predict diseases  
**Access:** Private  
**Method:** POST  

**Request Body:**

```json
{
  "symptoms": [
    {
      "name": "headache",
      "severity": 7,
      "duration": "2 days"
    },
    {
      "name": "fever",
      "severity": 8,
      "duration": "1 day"
    }
  ],
  "age": 30,
  "gender": "male",
  "medicalHistory": ["hypertension"]
}
```

**Response:**

```json
{
  "success": true,
  "message": "Symptom analysis completed",
  "data": {
    "_id": "analysis_id",
    "predictions": [
      {
        "disease": "Influenza",
        "confidence": 85.5,
        "matchedSymptoms": ["fever", "headache"],
        "severity": "moderate",
        "recommendation": "Consult a doctor within 24 hours"
      }
    ],
    "urgency": "moderate",
    "recommendedSpecialist": "General Physician",
    "generalAdvice": "Rest and monitor symptoms"
  }
}
```

### GET `/ai-symptom-checker/history`

**Description:** Get user's symptom analysis history  
**Access:** Private  
**Method:** GET

### GET `/ai-symptom-checker/analysis/:id`

**Description:** Get specific analysis  
**Access:** Private  
**Method:** GET  

### GET `/ai-symptom-checker/symptoms-list`

**Description:** Get common symptoms list  
**Access:** Public  
**Method:** GET  

### GET `/ai-symptom-checker/specialists`

**Description:** Get specialists list  
**Access:** Public  
**Method:** GET  

### PUT `/ai-symptom-checker/analysis/:id/feedback`

**Description:** Provide feedback on analysis  
**Access:** Private  
**Method:** PUT  

### DELETE `/ai-symptom-checker/analysis/:id`

**Description:** Delete analysis  
**Access:** Private  
**Method:** DELETE  

---

## 📈 Predictive Analytics System

### GET `/predictive-analytics/no-show-prediction/:appointmentId`

**Description:** Predict appointment no-show probability  
**Access:** Private (Doctor/Admin)  
**Method:** GET  

**Response:**

```json
{
  "success": true,
  "data": {
    "appointmentId": "appointment_id",
    "noShowProbability": 25.5,
    "riskLevel": "low",
    "factors": {
      "historicalNoShowRate": 10,
      "leadTime": 7,
      "timeOfDay": "morning",
      "dayOfWeek": "Monday",
      "paymentStatus": "paid"
    },
    "recommendation": "Send reminder 24 hours before"
  }
}
```

### GET `/predictive-analytics/revenue-forecast`

**Description:** Forecast revenue for upcoming period  
**Access:** Private (Admin)  
**Method:** GET

**Query Parameters:**

- `period`: "week", "month", "quarter"

### GET `/predictive-analytics/peak-hours`

**Description:** Analyze peak appointment hours  
**Access:** Private (Doctor/Admin)  
**Method:** GET  

**Response:**

```json
{
  "success": true,
  "data": {
    "peakHour": {
      "hour": 10,
      "time": "10:00 - 11:00",
      "appointmentCount": 25,
      "revenue": 2500
    },
    "peakDay": {
      "day": "Monday",
      "appointmentCount": 45,
      "revenue": 4500
    },
    "hourlyDistribution": [...],
    "dailyDistribution": [...]
  }
}
```

### GET `/predictive-analytics/success-rate`

**Description:** Calculate treatment success rate  
**Access:** Private (Doctor/Admin)  
**Method:** GET  

### GET `/predictive-analytics/outbreak-detection`

**Description:** Detect potential disease outbreaks  
**Access:** Private (Admin)  
**Method:** GET  

### GET `/predictive-analytics/patient-retention`

**Description:** Analyze patient retention  
**Access:** Private (Admin)  
**Method:** GET  

### GET `/predictive-analytics/dashboard`

**Description:** Get comprehensive analytics dashboard  
**Access:** Private (Admin)  
**Method:** GET  

---

## 🔒 RBAC & Security System

### GET `/security/audit-logs`

**Description:** Get audit logs  
**Access:** Private (Admin only)  
**Method:** GET

**Query Parameters:**

- `action`: Filter by action type
- `userId`: Filter by user
- `startDate`: Filter from date
- `endDate`: Filter to date
- `limit`: Results per page
- `page`: Page number

**Response:**

```json
{
  "success": true,
  "data": {
    "logs": [
      {
        "_id": "log_id",
        "user": "user_id",
        "action": "LOGIN",
        "resource": "/api/auth/login",
        "timestamp": "2024-01-15T10:00:00.000Z",
        "ipAddress": "192.168.1.1",
        "userAgent": "Mozilla/5.0...",
        "status": "success"
      }
    ],
    "pagination": {
      "total": 100,
      "page": 1,
      "pages": 10
    }
  }
}
```

### GET `/security/audit-logs/user/:userId`

**Description:** Get audit logs for specific user  
**Access:** Private (Admin)  
**Method:** GET  

### GET `/security/audit-stats`

**Description:** Get audit statistics  
**Access:** Private (Admin)  
**Method:** GET  

### POST `/security/roles`

**Description:** Create custom role  
**Access:** Private (Admin)  
**Method:** POST  

**Request Body:**

```json
{
  "name": "Senior Doctor",
  "permissions": [
    "view_all_patients",
    "edit_medical_records",
    "prescribe_medications",
    "manage_appointments"
  ],
  "description": "Senior doctor with extended permissions"
}
```

### GET `/security/roles`

**Description:** Get all roles  
**Access:** Private (Admin)  
**Method:** GET  

### PUT `/security/roles/:roleId`

**Description:** Update role  
**Access:** Private (Admin)  
**Method:** PUT  

### POST `/security/check-permission`

**Description:** Check if user has permission  
**Access:** Private  
**Method:** POST  

**Request Body:**

```json
{
  "permission": "view_all_patients"
}
```

### POST `/security/encrypt-data`

**Description:** Encrypt sensitive data  
**Access:** Private  
**Method:** POST  

**Request Body:**

```json
{
  "data": "sensitive information"
}
```

**Response:**

```json
{
  "success": true,
  "encrypted": "encrypted_string_here"
}
```

### POST `/security/decrypt-data`

**Description:** Decrypt sensitive data  
**Access:** Private  
**Method:** POST  

### GET `/security/suspicious-activity`

**Description:** Detect suspicious activity patterns  
**Access:** Private (Admin)  
**Method:** GET

**Query Parameters:**

- `days`: Number of days to analyze (default: 7)

**Response:**

```json
{
  "success": true,
  "data": {
    "period": "Last 7 days",
    "totalAuditRecords": 5000,
    "suspiciousPatterns": [
      {
        "type": "Multiple Failed Logins",
        "severity": "high",
        "userId": "user_id",
        "count": 10,
        "recommendation": "Consider locking account"
      }
    ],
    "alertLevel": "MEDIUM"
  }
}
```

---

## 📚 Additional Resources

- [API Testing Guide](./API_TESTING_GUIDE.md)
- [Project Summary](./PROJECT_SUMMARY.md)
- [Feature Enhancements](./FEATURE_ENHANCEMENTS.md)
- [Database Seeding Guide](./SEEDING_GUIDE.md)

---

---

## 📊 Review & Rating System Summary

### Endpoints Count: 14 Total

**Patient Operations (8):**

- Create review
- Get own reviews
- Update own review
- Delete own review
- Get doctor reviews (public)
- Vote on reviews (helpful/not helpful)
- Flag inappropriate reviews
- View review statistics

**Doctor Operations (1):**

- Respond to reviews

**Admin Operations (3):**

- Get all reviews for moderation
- Moderate reviews (approve/reject/flag)
- View overall review statistics

**Utility Operations (2):**

- Get review statistics for a doctor
- Auto-moderation (flagging after 3 reports)

### Key Features

- ⭐ 5-star rating system with detailed sub-ratings
- 💬 Written reviews with title and comment
- ✅ Verified patient badges (completed appointments)
- 👍 Helpful/not helpful voting system
- 🏆 Top-rated doctor badges (4.5+ rating)
- 📊 Rating breakdown visualization
- 🚫 Admin moderation system
- 🚩 Community flagging mechanism
- 📝 Doctor response capability
- ✏️ Edit and delete functionality
- 🔄 Real-time rating calculations
- 📈 Comprehensive analytics

---

**Last Updated:** November 5, 2025  
**Version:** 2.0.0 (Added Review & Rating System)  
**Total Endpoints:** 86 HTTP endpoints (72 existing + 14 new) + 8 Socket.io events  
**Maintained by:** SmartCarePlus Development Team
