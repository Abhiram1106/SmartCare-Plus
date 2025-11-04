# SmartCare+ Database Seeding & Migration Guide

Complete guide for setting up and managing your SmartCare+ database.

---

## 🎯 Quick Start

### Fresh Database Setup

```bash
cd backend
npm run seed
```

This single command seeds everything you need:

- Admin users (2)
- Doctors (50+) with professional profiles
- Sample patients (10)
- Appointments (30) with various statuses
- Payments with unique passkeys
- Chatbot intents (12)
- Chat logs (15 sample conversations)

### Migrate Existing Database

```bash
cd backend
npm run migrate
```

Updates existing data with:

- Missing user fields (phone, gender, age, education)
- Doctor professional data (success rate, consultations, ratings)
- Safe and idempotent (run anytime)

---

## 📂 Available Scripts

### Main Commands

| Command | File | Purpose |
|---------|------|---------|
| `npm run seed` | `allInOneSeeder.js` | Complete database seeding (recommended) |
| `npm run migrate` | `allInOneMigrator.js` | Update existing data to latest schema |
| `npm run db:setup` | Both files | Seed + Migrate in one command |
| `npm run seed:old` | `seedDatabase.js` | Legacy seeder (deprecated) |

---

## 🗂️ What Gets Seeded

### 1. Admin Users (2 accounts)

**System Admin:**

- Email: `admin@smartcare.com`
- Password: `admin123`
- Passkey: `6429`
- Role: Full system access

**Abhiram Admin:**

- Email: `abhiram.j2006@gmail.com`
- Password: `admin123`
- Passkey: `2498`
- Role: Full system access

### 2. Doctors (50+ specialists)

**Data loaded from:** `SmartCarePlus_full_dataset.json`

Each doctor includes:

- User account with credentials
- Doctor profile with specialization
- Professional data: success rate, consultations, patients
- Rating breakdown (5-star distribution)
- Languages (English + Indian regional)
- Clinic address
- Unique payment passkey
- Auto-approved status

**Specializations covered:**

- Cardiology, Neurology, Orthopedics
- Dermatology, Pediatrics, Gynecology
- ENT, General Medicine, Urology
- Ophthalmology, Psychiatry, Gastroenterology
- Oncology, Pulmonology, Nephrology

**Default credentials:**

- Email: From JSON dataset
- Password: `doctor123`
- Passkey: Unique per doctor (shown in seeder output)

### 3. Sample Patients (10 accounts)

**Test patients with Indian names:**

- `patient1@test.com` - Rahul Kumar
- `patient2@test.com` - Priya Sharma
- `patient3@test.com` - Amit Patel
- `patient4@test.com` - Sneha Gupta
- `patient5@test.com` - Vikram Singh
- ... and 5 more

**Default credentials:**

- Email: `patient{1-10}@test.com`
- Password: `patient123`
- Passkey: Unique per patient

**Each includes:**

- Full profile (name, age, gender, phone)
- Unique payment passkey
- Indian phone number format

### 4. Appointments (30 records)

**Time distribution:**

- Past appointments (last 30 days)
- Current/upcoming appointments (next 30 days)

**Status variety:**

- Pending: Awaiting doctor confirmation
- Confirmed: Scheduled and confirmed
- Completed: Finished with diagnosis & prescription
- Cancelled: Patient/doctor cancelled

**Completed appointments include:**

- Medical diagnosis
- Prescription with medicines
- Patient ratings (4-5 stars)

### 5. Payments (Auto-generated)

**Linked to appointments:**

- Created for all `completed` and `confirmed` appointments
- Payment amounts from doctor consultation fees
- Transaction IDs: `TXN{timestamp}{random}`

**Payment methods:**

- Card, UPI, Net Banking, Wallet
- Randomly distributed
- Passkey verification for completed payments

**Revenue tracking:**

- Total revenue calculated and displayed
- Status synced with appointment status

### 6. Chatbot Intents (12 patterns)

**Categories:**

- General: greeting, goodbye, about, working hours
- Appointment: booking, cancellation
- Doctor: find doctors, departments
- Medical: symptoms, prescription
- Payment: fees, payment methods
- Emergency: urgent help

**Each intent includes:**

- Multiple patterns (user inputs)
- Professional responses
- Categorization for filtering
- Active status

### 7. Chat Logs (15 conversations)

**Sample conversations:**

- Greeting exchanges
- Appointment booking flows
- Doctor search queries
- Symptom discussions

**Distributed across:**

- 5 different patients
- 3 conversation patterns each
- Realistic dialogue flow

---

## 🔄 Migration Details

### User Field Migrations

**What gets added:**

- `phone`: Indian format (+91XXXXXXXXXX)
- `gender`: male/female
- `age`: Role-appropriate ranges (Doctors: 30-65, Admin: 30-50, Patients: 18-63)
- `education`: MD - {Specialization} (doctors only)
- `consultationFee`: ₹300-₹2000 (doctors only)
- `approved`/`isApproved` sync

### Doctor Field Migrations

**Professional enhancements:**

- `successRate`: 85-98% (based on experience)
- `totalConsultations`: Calculated from years × consultations/year
- `totalPatients`: 70-90% of total consultations
- `ratingBreakdown`: Realistic 5-star distribution
- `verifiedBadge`: true for all doctors
- `languages`: English + random Indian language
- `clinicAddress`: Realistic Indian addresses

---

## ⚙️ Configuration

### Environment Variables

Required in `.env`:

```env
MONGO_URI=mongodb://localhost:27017/smartcareplus
```

### Data Files

**Required:**

- `SmartCarePlus_full_dataset.json` (same directory as backend)
- Contains 50+ doctors with complete profiles

### Customization

Edit configuration in `allInOneSeeder.js`:

```javascript
const CONFIG = {
  DEFAULT_PASSWORDS: {
    admin: 'admin123',
    doctor: 'doctor123',
    patient: 'patient123'
  },
  SAMPLE_PATIENTS_COUNT: 10,
  APPOINTMENTS_COUNT: 30,
  CHAT_LOGS_COUNT: 15
};
```

---

## 🎭 Usage Scenarios

### Scenario 1: Fresh Development Setup

```bash
# Clone project
git clone <repo>
cd backend

# Install dependencies
npm install

# Create .env with MONGO_URI

# Seed database
npm run seed

# Start server
npm start
```

### Scenario 2: Schema Changed (Add New Fields)

```bash
# After updating models
npm run migrate

# Check output for migration status
```

### Scenario 3: Reset Database Completely

```bash
# Clear database manually or via MongoDB Compass
# Then reseed
npm run seed
```

### Scenario 4: Test Environment Setup

```bash
# Use separate test database in .env
MONGO_URI=mongodb://localhost:27017/smartcareplus_test

# Seed test data
npm run seed

# Run tests
npm test
```

### Scenario 5: Migrate to New Database

```bash
# Update .env with new MongoDB connection

# Seed complete dataset
npm run seed

# Verify in MongoDB Compass or CLI
```

---

## 🔍 Verification

### Check Seeding Success

**MongoDB Compass:**

1. Connect to your database
2. Verify collections:
   - `users`: ~60 documents
   - `doctors`: ~50 documents
   - `appointments`: 30 documents
   - `payments`: ~20+ documents
   - `intents`: 12 documents
   - `chatlogs`: 15 documents

**MongoDB CLI:**

```bash
mongo
use smartcareplus

db.users.countDocuments()        # Should be ~60
db.doctors.countDocuments()      # Should be ~50
db.appointments.countDocuments() # Should be 30
db.payments.countDocuments()     # Should be ~20
db.intents.countDocuments()      # Should be 12
db.chatlogs.countDocuments()     # Should be 15
```

### Test Login

**Admin Login:**

```text
URL: http://localhost:5173/login
Email: admin@smartcare.com
Password: admin123
Payment Passkey: 6429
```

**Doctor Login:**

```text
Check seeder output for email
Password: doctor123
Passkey: (unique, shown in output)
```

**Patient Login:**

```text
Email: patient1@test.com
Password: patient123
Passkey: (unique, shown in output)
```

---

## 🐛 Troubleshooting

### Issue: "MongoDB Connection Error"

**Solution:**

- Verify MongoDB is running: `mongod --version`
- Check `.env` has correct `MONGO_URI`
- Test connection: `mongosh` or MongoDB Compass

### Issue: "Failed to load dataset"

**Solution:**

- Ensure `SmartCarePlus_full_dataset.json` exists
- File should be one level up from backend: `../SmartCarePlus_full_dataset.json`
- Check JSON syntax is valid

### Issue: "Duplicate key error"

**Solution:**

- Data already exists in database
- Safe to ignore (seeder is idempotent)
- Or clear collections and re-run

### Issue: "No doctors seeded"

**Solution:**

- Check JSON file path in `allInOneSeeder.js`
- Verify JSON contains `doctors` array
- Check console for specific error messages

### Issue: "Payments not created"

**Solution:**

- Payments only created for `confirmed` or `completed` appointments
- Ensure appointments exist first
- Check appointment statuses in database

---

## 📊 Seeder Output Example

```text
═══════════════════════════════════════════════════════════════════════
  SmartCare+ ALL-IN-ONE DATABASE SEEDER
  Complete Data Seeding for Production-Ready Application
═══════════════════════════════════════════════════════════════════════

✅ MongoDB Connected Successfully

📂 Loading dataset...
✅ Loaded: 50 doctors, 15 departments, 100 diseases

📋 SEEDING ADMIN USERS...
──────────────────────────────────────────────────────────────────────
✅ Created admin: System Administrator (admin@smartcare.com)
   Passkey: 6429
✅ Created admin: Abhiram Admin (abhiram.j2006@gmail.com)
   Passkey: 2498

✅ Admins: 2 created, 0 skipped

👨‍⚕️ SEEDING DOCTORS...
──────────────────────────────────────────────────────────────────────
✅ Created: Dr. Rajesh Kumar
   Email: dr.rajesh@hospital.com | Passkey: 3847
   Specialization: Cardiology | Fee: ₹1200
...
✅ Doctors: 50 created, 0 skipped

🧑‍🤝‍🧑 SEEDING PATIENTS...
──────────────────────────────────────────────────────────────────────
✅ Created: Rahul Kumar (patient1@test.com)
   Passkey: 7291
...
✅ Patients: 10 created, 0 skipped

📅 SEEDING APPOINTMENTS...
──────────────────────────────────────────────────────────────────────
✅ Appointments: 30 created across 10 patients and 50 doctors

💳 SEEDING PAYMENTS...
──────────────────────────────────────────────────────────────────────
✅ Payments: 22 created, 0 skipped
   Total Revenue: ₹18,900

🤖 SEEDING CHATBOT INTENTS...
──────────────────────────────────────────────────────────────────────
✅ Intents: 12 created

💬 SEEDING CHAT LOGS...
──────────────────────────────────────────────────────────────────────
✅ Chat Logs: 15 conversation histories created

═══════════════════════════════════════════════════════════════════════
  ✅ SEEDING COMPLETED SUCCESSFULLY!
═══════════════════════════════════════════════════════════════════════

📊 SUMMARY:
──────────────────────────────────────────────────────────────────────
   Admins:       2 created, 0 skipped
   Doctors:      50 created, 0 skipped
   Patients:     10 created, 0 skipped
   Appointments: 30 created
   Payments:     22 created (₹18,900 revenue)
   Intents:      12 created, 0 skipped
   Chat Logs:    15 created
──────────────────────────────────────────────────────────────────────
   ⏱️  Completed in: 8.43 seconds
═══════════════════════════════════════════════════════════════════════
```

---

## 📝 Notes

### Idempotency

- Safe to run multiple times
- Skips existing records automatically
- Only creates missing data
- No duplicate entries

### Data Quality

- Realistic Indian names and phone numbers
- Professional medical data
- Proper date distributions
- Accurate relationships between collections

### Security

- All passwords are bcrypt hashed
- Unique payment passkeys per user
- Passkeys shown in output for testing

### Performance

- Typically completes in 5-15 seconds
- Batched operations where possible
- Progress indicators throughout

---

## 🔗 Related Files

**Legacy Seeders (Deprecated):**

- `seedDatabase.js` - Original main seeder
- `seedPaymentPasskeys.js` - Passkey seeder
- `seedPayments.js` - Payment seeder

**Legacy Migrators (Deprecated):**

- `migrateUsers.js` - User field migration
- `migrateDoctors.js` - Doctor field migration

**New All-In-One (Recommended):**

- `allInOneSeeder.js` - Complete seeding solution ✅
- `allInOneMigrator.js` - Complete migration solution ✅

---

## 📚 Additional Resources

- **Project Documentation:** `README.md`
- **Project Summary:** `PROJECT_SUMMARY.md`
- **Data Models:** `backend/models/`
- **API Routes:** `backend/routes/`

---

**Last Updated:** January 2025  
**Version:** 1.0.0  
**Maintained by:** SmartCare+ Development Team
