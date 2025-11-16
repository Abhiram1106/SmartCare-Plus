# SmartCare Plus - Complete Setup Guide

## 📋 Table of Contents

1. [Prerequisites](#-prerequisites)
2. [Installation](#-installation)
3. [Environment Configuration](#️-environment-configuration)
4. [Database Setup](#️-database-setup)
5. [Running the Application](#-running-the-application)
6. [Testing](#-testing)
7. [Deployment](#-deployment)
8. [Troubleshooting](#-troubleshooting)

---

## 🔧 Prerequisites

### Required Software

- **Node.js**: v18.0.0 or higher ([Download](https://nodejs.org/))
- **npm**: v9.0.0 or higher (comes with Node.js)
- **MongoDB Atlas Account**: Free tier available ([Sign up](https://www.mongodb.com/cloud/atlas))
- **Git**: Latest version ([Download](https://git-scm.com/))
- **Gmail Account**: For email service (OTP verification)

### System Requirements

- **RAM**: Minimum 4GB (8GB recommended)
- **Storage**: 500MB free space
- **OS**: Windows 10/11, macOS 10.14+, or Linux

---

## 📥 Installation

### 1. Clone the Repository

```bash
git clone https://github.com/Abhiram1106/SmartCare-Plus.git
cd SmartCare-Plus
```

### 2. Install Backend Dependencies

```bash
cd backend
npm install
```

**Backend Dependencies:**

- `express` - Web framework
- `mongoose` - MongoDB ODM
- `bcryptjs` - Password hashing
- `jsonwebtoken` - JWT authentication
- `nodemailer` - Email service
- `socket.io` - Real-time communication
- `cors` - Cross-origin resource sharing
- `dotenv` - Environment variables
- `pdfkit` - PDF generation

**Dev Dependencies:**

- `nodemon` - Auto-restart server
- `jest` - Testing framework
- `supertest` - HTTP testing
- `mongodb-memory-server` - In-memory MongoDB for tests

### 3. Install Frontend Dependencies

```bash
cd ../frontend
npm install
```

**Frontend Dependencies:**

- `react` - UI library
- `react-router-dom` - Routing
- `axios` - HTTP client
- `socket.io-client` - Real-time client
- `@tensorflow/tfjs` - AI/ML for chatbot
- `lucide-react` - Icons
- `tailwindcss` - CSS framework

---

## ⚙️ Environment Configuration

### Backend Configuration

Create `.env` file in `backend/` directory:

```env
# MongoDB Connection
MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/smartcareplus?retryWrites=true&w=majority

# JWT Configuration
JWT_SECRET=your_super_secret_jwt_key_min_32_characters_long
JWT_EXPIRES_IN=7d

# Server Configuration
PORT=5000
NODE_ENV=development

# CORS Configuration
CORS_ORIGIN=http://localhost:3000

# Gmail Configuration (for OTP emails)
GMAIL_USER=your-email@gmail.com
GMAIL_APP_PASSWORD=your-16-digit-app-password

# Session Secret
SESSION_SECRET=your_session_secret_key_min_32_characters
```

### Frontend Configuration

Create `.env` file in `frontend/` directory:

```env
# API Configuration
VITE_API_URL=http://localhost:5000/api
VITE_SOCKET_URL=http://localhost:5000
```

### Gmail App Password Setup

1. Go to [Google Account Security](https://myaccount.google.com/security)
2. Enable 2-Factor Authentication
3. Go to "App passwords"
4. Generate password for "Mail"
5. Copy the 16-digit password to `GMAIL_APP_PASSWORD`

### MongoDB Atlas Setup

1. Create account at [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Create a new cluster (free M0 tier)
3. Click "Connect" → "Connect your application"
4. Copy connection string
5. Replace `<username>`, `<password>`, and database name
6. Add your IP address to whitelist (or use `0.0.0.0/0` for all IPs)

---

## 🗄️ Database Setup

### 1. Seed the Database

```bash
cd backend
npm run seed
```

This creates:

- **Admin Account**: `admin@smartcare.com` / admin123
- **3 Doctors**: `doctor1@test.com` / doctor123 (and doctor2, doctor3)
- **5 Patients**: `patient1@test.com` / patient123 (patient1-5)
- Sample appointments, payments, and chat logs

### 2. Assign Custom User IDs

```bash
npm run assign-ids
```

This assigns unique IDs (SMP1000, SMP1001, etc.) to all users.

### 3. Database Migration (if needed)

```bash
npm run migrate
```

---

## 🚀 Running the Application

### Development Mode

**Terminal 1 - Backend:**

```bash
cd backend
npm run dev
```

Backend runs on: `http://localhost:5000`

**Terminal 2 - Frontend:**

```bash
cd frontend
npm run dev
```

Frontend runs on: `http://localhost:3000`

### Production Mode

**Build Frontend:**

```bash
cd frontend
npm run build
```

**Start Backend (serves static frontend):**

```bash
cd backend
npm start
```

Access application at: `http://localhost:5000`

---

## 🧪 Testing

### Backend Tests

```bash
cd backend

# Run all tests
npm test

# Watch mode
npm run test:watch

# Coverage report
npm run test:coverage
```

### Email Testing

```bash
# Start backend server first
npm run dev

# In browser, visit:
# http://localhost:5000/test/test-email.html
```

### API Testing

```bash
# Use Postman or curl
curl http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"patient1@test.com","password":"patient123"}'
```

---

## 📦 Deployment

### Heroku Deployment

1. **Install Heroku CLI:**

   ```bash
   npm install -g heroku
   ```

2. **Login and Create App:**

   ```bash
   heroku login
   heroku create smartcareplus-app
   ```

3. **Set Environment Variables:**

   ```bash
   heroku config:set MONGO_URI=your_mongodb_uri
   heroku config:set JWT_SECRET=your_jwt_secret
   heroku config:set GMAIL_USER=your_email
   heroku config:set GMAIL_APP_PASSWORD=your_password
   ```

4. **Deploy:**

   ```bash
   git push heroku main
   ```

### Vercel Deployment (Frontend)

1. **Install Vercel CLI:**

   ```bash
   npm install -g vercel
   ```

2. **Deploy:**

   ```bash
   cd frontend
   vercel
   ```

3. **Update API URL in `.env`:**

   ```env
   VITE_API_URL=https://your-backend.herokuapp.com/api
   ```

### AWS EC2 Deployment

See [AWS_DEPLOYMENT.md](./AWS_DEPLOYMENT.md) for detailed instructions.

---

## 🔍 Troubleshooting

### Common Issues

#### 1. MongoDB Connection Failed

**Error:** `MongooseError: connect ECONNREFUSED`

**Solutions:**

- Check MONGO_URI in .env
- Verify MongoDB Atlas IP whitelist
- Ensure internet connection
- Check cluster status on MongoDB Atlas

#### 2. Port Already in Use

**Error:** `EADDRINUSE: address already in use :::5000`

**Solutions:**

```bash
# Windows
netstat -ano | findstr :5000
taskkill /PID <PID> /F

# Linux/Mac
lsof -ti:5000 | xargs kill -9
```

#### 3. JWT Secret Too Short

**Error:** `secretOrPrivateKey must have a minimum length of 32 characters`

**Solution:**

Generate strong secret:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

#### 4. Email Not Sending

**Errors:** `Invalid login` or `Authentication failed`

**Solutions:**

- Enable 2FA on Gmail
- Generate app password
- Check GMAIL_USER and GMAIL_APP_PASSWORD in .env
- Verify no spaces in credentials

#### 5. CORS Errors

**Error:** `Access-Control-Allow-Origin header`

**Solution:**

Update CORS_ORIGIN in backend .env:

```env
CORS_ORIGIN=http://localhost:3000
```

#### 6. Build Errors (Frontend)

**Error:** `Failed to resolve import`

**Solutions:**

```bash
cd frontend
rm -rf node_modules package-lock.json
npm install
```

#### 7. Module Not Found

**Error:** `Cannot find module`

**Solutions:**

```bash
# Backend
cd backend
npm install

# Frontend
cd frontend
npm install
```

### Performance Issues

**Slow API Responses:**

- Check MongoDB Atlas cluster region
- Add database indexes
- Enable caching
- Optimize queries

**Frontend Lag:**

- Run production build: `npm run build`
- Enable code splitting
- Optimize images
- Use lazy loading

### Database Issues

**Clear and Reseed Database:**

```bash
# In MongoDB Atlas
# 1. Go to Collections
# 2. Drop all collections
# 3. Run seed script
cd backend
npm run seed
```

**Reset User IDs:**

```bash
cd backend
npm run assign-ids
```

---

## 📞 Support

- **GitHub Issues**: [Create an issue](https://github.com/Abhiram1106/SmartCare-Plus/issues)
- **Email**: <smartcareplus.team@gmail.com>
- **Documentation**: See [README.md](./README.md)

---

## 📄 Additional Documentation

- [API Documentation](./API_ENDPOINTS.md)
- [Feature Guide](./FEATURE_ENHANCEMENTS.md)
- [Testing Guide](./API_TESTING_GUIDE.md)
- [Database Seeding](./SEEDING_GUIDE.md)
- [Project Structure](./PROJECT_SUMMARY.md)

---

## ✅ Quick Start Checklist

- [ ] Node.js v18+ installed
- [ ] MongoDB Atlas cluster created
- [ ] Gmail app password generated
- [ ] Repository cloned
- [ ] Backend dependencies installed
- [ ] Frontend dependencies installed
- [ ] .env files created and configured
- [ ] Database seeded
- [ ] User IDs assigned
- [ ] Backend server running on port 5000
- [ ] Frontend server running on port 3000
- [ ] Test login with `admin@smartcare.com` / admin123
- [ ] Email testing page works

---

**Last Updated**: November 8, 2025  
**Version**: 1.0.0
