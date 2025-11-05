/*
 * ═══════════════════════════════════════════════════════════════════════════
 * SmartCare+ ALL-IN-ONE DATABASE SEEDER
 * Complete data seeding for all collections and roles
 * 
 * Usage: node allInOneSeeder.js
 * 
 * This script seeds:
 * - Admin users
 * - Doctors (with Users and Doctor profiles)
 * - Patients (with Users)
 * - Appointments (past, present, and future)
 * - Payments (with passkeys)
 * - Chatbot Intents
 * - Chat Logs (sample conversations)
 * 
 * Features:
 * - Idempotent: Safe to run multiple times
 * - Comprehensive: All necessary data for testing
 * - Realistic: Professional medical data
 * - Complete: Payment passkeys for all users
 * ═══════════════════════════════════════════════════════════════════════════
 */

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

// Import models
const User = require('./models/User');
const Doctor = require('./models/Doctor');
const Appointment = require('./models/Appointment');
const Payment = require('./models/Payment');
const Intent = require('./models/Intent');
const ChatLog = require('./models/ChatLog');

// ═══════════════════════════════════════════════════════════════════════════
// CONFIGURATION
// ═══════════════════════════════════════════════════════════════════════════

const CONFIG = {
  DEFAULT_PASSWORDS: {
    admin: 'admin123',
    doctor: 'doctor123',
    patient: 'patient123'
  },
  DATA_FILE: '../SmartCarePlus_full_dataset.json',
  SAMPLE_PATIENTS_COUNT: 10,
  APPOINTMENTS_COUNT: 30,
  CHAT_LOGS_COUNT: 15
};

// ═══════════════════════════════════════════════════════════════════════════
// DATABASE CONNECTION
// ═══════════════════════════════════════════════════════════════════════════

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ MongoDB Connected Successfully');
    return true;
  } catch (error) {
    console.error('❌ MongoDB Connection Error:', error.message);
    return false;
  }
};

// ═══════════════════════════════════════════════════════════════════════════
// UTILITY FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════

// Load JSON dataset
const loadJSONData = () => {
  try {
    const jsonPath = path.join(__dirname, CONFIG.DATA_FILE);
    const jsonData = fs.readFileSync(jsonPath, 'utf8');
    return JSON.parse(jsonData);
  } catch (error) {
    console.error('❌ Error loading JSON file:', error.message);
    return null;
  }
};

// Generate random Indian phone number
const generatePhoneNumber = () => {
  const firstDigit = Math.floor(Math.random() * 4) + 6; // 6-9
  const remaining = Math.floor(Math.random() * 900000000) + 100000000;
  return `+91${firstDigit}${remaining}`;
};

// Generate random 4-digit payment passkey
const generatePasskey = () => {
  return Math.floor(1000 + Math.random() * 9000).toString();
};

// Generate random gender
const getRandomGender = () => {
  return ['male', 'female'][Math.floor(Math.random() * 2)];
};

// Generate random age
const getRandomAge = (min = 18, max = 65) => {
  return Math.floor(Math.random() * (max - min + 1)) + min;
};

// Generate random consultation fee
const getRandomConsultationFee = () => {
  const fees = [300, 400, 500, 600, 700, 800, 1000, 1200, 1500, 2000];
  return fees[Math.floor(Math.random() * fees.length)];
};

// Generate realistic rating breakdown
const generateRatingBreakdown = (avgRating, totalRatings) => {
  const breakdown = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
  
  if (totalRatings === 0) return breakdown;
  
  if (avgRating >= 4.5) {
    breakdown[5] = Math.floor(totalRatings * 0.75);
    breakdown[4] = Math.floor(totalRatings * 0.20);
    breakdown[3] = Math.floor(totalRatings * 0.04);
    breakdown[2] = Math.floor(totalRatings * 0.01);
  } else if (avgRating >= 4.0) {
    breakdown[5] = Math.floor(totalRatings * 0.50);
    breakdown[4] = Math.floor(totalRatings * 0.35);
    breakdown[3] = Math.floor(totalRatings * 0.10);
    breakdown[2] = Math.floor(totalRatings * 0.04);
    breakdown[1] = Math.floor(totalRatings * 0.01);
  } else if (avgRating >= 3.5) {
    breakdown[5] = Math.floor(totalRatings * 0.30);
    breakdown[4] = Math.floor(totalRatings * 0.40);
    breakdown[3] = Math.floor(totalRatings * 0.20);
    breakdown[2] = Math.floor(totalRatings * 0.08);
    breakdown[1] = Math.floor(totalRatings * 0.02);
  } else {
    breakdown[5] = Math.floor(totalRatings * 0.20);
    breakdown[4] = Math.floor(totalRatings * 0.30);
    breakdown[3] = Math.floor(totalRatings * 0.30);
    breakdown[2] = Math.floor(totalRatings * 0.15);
    breakdown[1] = Math.floor(totalRatings * 0.05);
  }
  
  const sum = breakdown[5] + breakdown[4] + breakdown[3] + breakdown[2] + breakdown[1];
  const diff = totalRatings - sum;
  if (diff > 0) {
    breakdown[Math.round(avgRating)] += diff;
  }
  
  return breakdown;
};

// Hash password
const hashPassword = async (password) => {
  return await bcrypt.hash(password, 10);
};

// ═══════════════════════════════════════════════════════════════════════════
// SEEDING FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════

// 1. SEED ADMIN USERS
const seedAdmins = async () => {
  console.log('\n📋 SEEDING ADMIN USERS...');
  console.log('─'.repeat(70));
  
  const admins = [
    {
      name: 'System Administrator',
      email: 'admin@smartcare.com',
      phone: '+911234567890',
      gender: 'male',
      age: 35,
      paymentPasskey: '6429'
    },
    {
      name: 'Abhiram Admin',
      email: 'abhiram.j2006@gmail.com',
      phone: '+918125551995',
      gender: 'male',
      age: 20,
      paymentPasskey: '1106'
    }
  ];

  let created = 0, skipped = 0;

  for (const adminData of admins) {
    const existing = await User.findOne({ email: adminData.email });
    
    if (existing) {
      skipped++;
      console.log(`⏭️  Admin already exists: ${adminData.email}`);
      continue;
    }

    const hashedPassword = await hashPassword(CONFIG.DEFAULT_PASSWORDS.admin);
    
    await User.create({
      ...adminData,
      password: hashedPassword,
      role: 'admin'
    });

    created++;
    console.log(`✅ Created admin: ${adminData.name} (${adminData.email})`);
    console.log(`   Passkey: ${adminData.paymentPasskey}`);
  }

  console.log(`\n✅ Admins: ${created} created, ${skipped} skipped`);
  return { created, skipped };
};

// 2. SEED DOCTORS (with auto-update for existing)
const seedDoctors = async (doctorsData) => {
  console.log('\n👨‍⚕️ SEEDING DOCTORS...');
  console.log('─'.repeat(70));

  let created = 0, skipped = 0, updated = 0;

  for (const doctorData of doctorsData) {
    const email = doctorData.contact.replace('..', '.');
    const existingUser = await User.findOne({ email });
    
    // If user exists, update their doctor profile with ratings if needed
    if (existingUser && existingUser.role === 'doctor') {
      const existingDoctor = await Doctor.findOne({ user: existingUser._id });
      
      if (existingDoctor) {
        // Check if doctor needs rating update (if rating is 0 or no breakdown)
        const needsUpdate = !existingDoctor.rating || 
                           existingDoctor.rating === 0 || 
                           !existingDoctor.ratingBreakdown || 
                           Object.values(existingDoctor.ratingBreakdown).every(v => v === 0);
        
        if (needsUpdate) {
          // Calculate updated stats
          const experience = existingDoctor.experience || doctorData.experience;
          const consultationsPerYear = Math.floor(Math.random() * 150) + 100;
          const totalConsultations = Math.floor(consultationsPerYear * Math.min(experience, 20));
          const totalPatients = Math.floor(totalConsultations * (0.7 + Math.random() * 0.2));
          const ratingPercentage = 0.3 + (Math.min(experience, 20) / 20) * 0.2;
          const totalRatings = Math.floor(totalPatients * ratingPercentage);
          
          let avgRating = doctorData.rating || (4.0 + Math.random() * 1.0);
          avgRating = parseFloat(avgRating.toFixed(1));
          
          const baseSuccessRate = 85;
          const successRate = Math.min(98, baseSuccessRate + (experience * 0.5));
          const ratingBreakdown = generateRatingBreakdown(avgRating, totalRatings);
          
          // Update doctor profile
          existingDoctor.rating = avgRating;
          existingDoctor.totalConsultations = totalConsultations;
          existingDoctor.totalPatients = totalPatients;
          existingDoctor.successRate = parseFloat(successRate.toFixed(1));
          existingDoctor.ratingBreakdown = ratingBreakdown;
          existingDoctor.verifiedBadge = true;
          
          await existingDoctor.save();
          updated++;
          
          if (updated <= 3) {
            console.log(`🔄 Updated: ${doctorData.name}`);
            console.log(`   Rating: ${avgRating}⭐ (${totalRatings} reviews) | Experience: ${experience} years`);
          }
        } else {
          skipped++;
        }
        continue;
      }
    }
    
    if (existingUser) {
      skipped++;
      continue;
    }

    // Create User account
    const hashedPassword = await hashPassword(CONFIG.DEFAULT_PASSWORDS.doctor);
    const gender = getRandomGender();
    const age = getRandomAge(30, 65);
    const consultationFee = getRandomConsultationFee();
    const passkey = generatePasskey();
    
    const user = await User.create({
      name: doctorData.name,
      email: email,
      password: hashedPassword,
      phone: generatePhoneNumber(),
      role: 'doctor',
      gender: gender,
      age: age,
      specialization: doctorData.specialization,
      experience: doctorData.experience,
      education: `MD - ${doctorData.specialization}`,
      consultationFee: consultationFee,
      paymentPasskey: passkey,
      approved: true,
      isApproved: true
    });

    // Create Doctor profile with comprehensive ratings
    const experience = doctorData.experience;
    
    // Calculate success rate based on experience
    const baseSuccessRate = 85;
    const successRate = Math.min(98, baseSuccessRate + (experience * 0.5));
    
    // Calculate total consultations based on experience (100-250 per year)
    const consultationsPerYear = Math.floor(Math.random() * 150) + 100;
    const totalConsultations = Math.floor(consultationsPerYear * Math.min(experience, 20));
    
    // Calculate total patients (70-90% of consultations are unique patients)
    const totalPatients = Math.floor(totalConsultations * (0.7 + Math.random() * 0.2));
    
    // Calculate rating statistics (30-50% of patients leave reviews, more for experienced doctors)
    const ratingPercentage = 0.3 + (Math.min(experience, 20) / 20) * 0.2;
    const totalRatings = Math.floor(totalPatients * ratingPercentage);
    
    // Generate realistic rating based on experience
    let avgRating;
    if (doctorData.rating && doctorData.rating > 0) {
      avgRating = doctorData.rating; // Use dataset rating if present
    } else {
      // Generate rating: more experience = higher rating (4.0-5.0 range)
      const baseRating = 4.0;
      const experienceBonus = Math.min(experience / 20, 1) * 0.5; // Max 0.5 bonus
      const randomVariation = Math.random() * 0.5; // 0-0.5 variation
      avgRating = Math.min(5.0, baseRating + experienceBonus + randomVariation);
    }
    avgRating = parseFloat(avgRating.toFixed(1));
    
    // Generate realistic rating breakdown
    const ratingBreakdown = generateRatingBreakdown(avgRating, totalRatings);
    
    const indianLanguages = ['Hindi', 'Tamil', 'Telugu', 'Marathi', 'Bengali', 'Kannada', 'Malayalam'];
    const randomLanguage = indianLanguages[Math.floor(Math.random() * indianLanguages.length)];
    const languages = ['English', randomLanguage];
    
    const cities = ['Mumbai', 'Delhi', 'Bangalore', 'Chennai', 'Kolkata', 'Hyderabad', 'Pune', 'Ahmedabad'];
    const city = cities[Math.floor(Math.random() * cities.length)];
    const clinicAddress = `${Math.floor(Math.random() * 500) + 1}, MG Road, ${city} - ${Math.floor(Math.random() * 90) + 10}00${Math.floor(Math.random() * 90) + 10}`;
    
    await Doctor.create({
      user: user._id,
      name: doctorData.name,
      email: email,
      specialization: doctorData.specialization,
      experience: doctorData.experience,
      rating: doctorData.rating,
      availableSlots: doctorData.availableSlots,
      consultationFee: consultationFee,
      phone: user.phone,
      successRate: parseFloat(successRate.toFixed(1)),
      totalConsultations: totalConsultations,
      totalPatients: totalPatients,
      ratingBreakdown: ratingBreakdown,
      verifiedBadge: true,
      languages: languages,
      clinicAddress: clinicAddress
    });

    created++;
    
    if (created <= 5) {
      console.log(`✅ Created: ${doctorData.name}`);
      console.log(`   Email: ${email} | Passkey: ${passkey}`);
      console.log(`   Specialization: ${doctorData.specialization} | Fee: ₹${consultationFee}`);
      console.log(`   Rating: ${avgRating.toFixed(1)}⭐ (${totalRatings} reviews) | Experience: ${experience} years`);
      console.log(`   Success Rate: ${successRate}% | Consultations: ${totalConsultations}`);
    }
  }

  if (created > 5) {
    console.log(`   ... and ${created - 5} more doctors created`);
  }
  
  if (updated > 3) {
    console.log(`   ... and ${updated - 3} more doctors updated with ratings`);
  }

  console.log(`\n✅ Doctors: ${created} created, ${updated} updated, ${skipped} skipped`);
  return { created, skipped, updated };
};

// 3. SEED PATIENTS
const seedPatients = async () => {
  console.log('\n🧑‍🤝‍🧑 SEEDING PATIENTS...');
  console.log('─'.repeat(70));

  const indianNames = [
    { name: 'Rahul Kumar', age: 28, gender: 'male' },
    { name: 'Priya Sharma', age: 32, gender: 'female' },
    { name: 'Amit Patel', age: 45, gender: 'male' },
    { name: 'Sneha Gupta', age: 25, gender: 'female' },
    { name: 'Vikram Singh', age: 38, gender: 'male' },
    { name: 'Ananya Reddy', age: 29, gender: 'female' },
    { name: 'Karthik Menon', age: 41, gender: 'male' },
    { name: 'Divya Nair', age: 27, gender: 'female' },
    { name: 'Rohan Desai', age: 35, gender: 'male' },
    { name: 'Meera Iyer', age: 30, gender: 'female' }
  ];

  let created = 0, skipped = 0;

  for (let i = 0; i < Math.min(CONFIG.SAMPLE_PATIENTS_COUNT, indianNames.length); i++) {
    const patientData = indianNames[i];
    const email = `patient${i + 1}@test.com`;
    
    const existing = await User.findOne({ email });
    
    if (existing) {
      skipped++;
      continue;
    }

    const hashedPassword = await hashPassword(CONFIG.DEFAULT_PASSWORDS.patient);
    const passkey = generatePasskey();

    await User.create({
      name: patientData.name,
      email: email,
      password: hashedPassword,
      phone: generatePhoneNumber(),
      role: 'patient',
      gender: patientData.gender,
      age: patientData.age,
      paymentPasskey: passkey
    });

    created++;
    
    if (created <= 5) {
      console.log(`✅ Created: ${patientData.name} (${email})`);
      console.log(`   Passkey: ${passkey}`);
    }
  }

  if (created > 5) {
    console.log(`   ... and ${created - 5} more patients`);
  }

  console.log(`\n✅ Patients: ${created} created, ${skipped} skipped`);
  return { created, skipped };
};

// 4. SEED APPOINTMENTS
const seedAppointments = async () => {
  console.log('\n📅 SEEDING APPOINTMENTS...');
  console.log('─'.repeat(70));

  // Only use predefined test patients (patient1@test.com through patient10@test.com)
  const predefinedPatientEmails = Array.from({ length: 10 }, (_, i) => `patient${i + 1}@test.com`);
  const patients = await User.find({ 
    role: 'patient',
    email: { $in: predefinedPatientEmails }
  });
  const doctors = await User.find({ role: 'doctor' });

  if (patients.length === 0 || doctors.length === 0) {
    console.log('⚠️  Insufficient patients or doctors for appointments');
    return { created: 0, skipped: 0 };
  }

  const statuses = ['pending', 'confirmed', 'completed', 'cancelled'];
  const symptoms = [
    'Fever and headache',
    'Chest pain and discomfort',
    'Back pain for 3 days',
    'Skin rash on arms',
    'Stomach pain after meals',
    'Difficulty breathing',
    'Joint pain in knees',
    'Persistent cough',
    'Dizziness and fatigue',
    'Migraine headaches'
  ];

  const diagnoses = [
    'Viral fever - prescribed medication and rest',
    'Mild hypertension - lifestyle changes recommended',
    'Muscle strain - rest and physiotherapy advised',
    'Allergic reaction - antihistamines prescribed',
    'Gastritis - dietary changes recommended',
    'Anxiety disorder - counseling suggested',
    'Vitamin D deficiency - supplements prescribed',
    'Upper respiratory infection - antibiotics given',
    'Tension headache - pain management prescribed',
    'General fatigue - nutrition plan advised'
  ];

  const prescriptions = [
    'Paracetamol 500mg - 3 times daily for 5 days\nRest and plenty of fluids',
    'Amlodipine 5mg - once daily\nFollow-up in 2 weeks',
    'Ibuprofen 400mg - twice daily for 7 days\nPhysiotherapy sessions',
    'Cetirizine 10mg - once daily for 10 days\nAvoid triggers',
    'Pantoprazole 40mg - once daily before breakfast\nAvoid spicy food',
    'Lorazepam 0.5mg - as needed\nCounseling sessions recommended',
    'Vitamin D3 60000 IU - weekly for 8 weeks\nSunlight exposure',
    'Azithromycin 500mg - once daily for 3 days\nComplete the course',
    'Sumatriptan 50mg - as needed for headache\nStress management',
    'Multivitamin - once daily for 3 months\nBalanced diet'
  ];

  const timeSlots = ['09:00-10:00', '10:00-11:00', '11:00-12:00', '14:00-15:00', '15:00-16:00', '16:00-17:00'];
  
  let created = 0;
  const today = new Date();

  for (let i = 0; i < CONFIG.APPOINTMENTS_COUNT; i++) {
    const patient = patients[Math.floor(Math.random() * patients.length)];
    const doctor = doctors[Math.floor(Math.random() * doctors.length)];
    const status = statuses[Math.floor(Math.random() * statuses.length)];
    
    const daysOffset = Math.floor(Math.random() * 60) - 30; // -30 to +30 days
    const appointmentDate = new Date(today);
    appointmentDate.setDate(appointmentDate.getDate() + daysOffset);
    
    const timeSlot = timeSlots[Math.floor(Math.random() * timeSlots.length)];

    const appointmentData = {
      patient: patient._id,
      doctor: doctor._id,
      appointmentDate: appointmentDate,
      timeSlot: timeSlot,
      symptoms: symptoms[Math.floor(Math.random() * symptoms.length)],
      status: status
    };

    if (status === 'completed') {
      appointmentData.diagnosis = diagnoses[Math.floor(Math.random() * diagnoses.length)];
      appointmentData.prescription = prescriptions[Math.floor(Math.random() * prescriptions.length)];
      appointmentData.rating = Math.floor(Math.random() * 2) + 4; // 4-5 stars
    }

    await Appointment.create(appointmentData);
    created++;
  }

  console.log(`✅ Appointments: ${created} created across ${patients.length} patients and ${doctors.length} doctors`);
  return { created, skipped: 0 };
};

// 4.5. ADD RATINGS FOR ALL DOCTORS
const addRatingsForAllDoctors = async () => {
  console.log('\n⭐ ADDING RATINGS FOR ALL DOCTORS...');
  console.log('─'.repeat(70));

  // Only use predefined test patients (patient1@test.com through patient10@test.com)
  const predefinedPatientEmails = Array.from({ length: 10 }, (_, i) => `patient${i + 1}@test.com`);
  const patients = await User.find({ 
    role: 'patient',
    email: { $in: predefinedPatientEmails }
  });

  // Get all doctors
  const allDoctors = await User.find({ role: 'doctor' });
  
  // Check which doctors don't have enough ratings
  const doctorsNeedingRatings = [];
  for (const doctor of allDoctors) {
    const existingRatings = await Appointment.countDocuments({
      doctor: doctor._id,
      rating: { $exists: true }
    });
    
    if (existingRatings < 3) { // Ensure every doctor has at least 3 ratings
      doctorsNeedingRatings.push({ doctor, needsRatings: 3 - existingRatings });
    }
  }

  let ratingsAdded = 0;
  const timeSlots = ['09:00-10:00', '10:00-11:00', '11:00-12:00', '14:00-15:00', '15:00-16:00', '16:00-17:00'];
  const symptoms = [
    'Regular checkup', 'Consultation', 'Follow-up visit', 'Health screening',
    'Preventive care', 'Routine examination', 'Medical advice', 'Health assessment'
  ];
  const diagnoses = [
    'Normal health status - continue regular lifestyle',
    'Mild condition managed with lifestyle changes',
    'Regular monitoring advised - good progress',
    'Excellent health status - maintain current routine',
    'Minor condition resolved - follow preventive care',
    'Satisfactory health - recommended annual checkup'
  ];
  const prescriptions = [
    'Maintain healthy diet and regular exercise',
    'Continue current medications as prescribed',
    'Follow-up in 6 months for routine checkup',
    'Vitamin supplements recommended',
    'Regular monitoring advised - good health status',
    'Preventive care measures discussed'
  ];

  for (const { doctor, needsRatings } of doctorsNeedingRatings) {
    for (let i = 0; i < needsRatings + Math.floor(Math.random() * 5); i++) { // Add 3-8 ratings per doctor
      const randomPatient = patients[Math.floor(Math.random() * patients.length)];
      
      // Create appointment date in the past (last 6 months)
      const appointmentDate = new Date();
      appointmentDate.setDate(appointmentDate.getDate() - Math.floor(Math.random() * 180));
      
      const appointmentData = {
        patient: randomPatient._id,
        doctor: doctor._id,
        appointmentDate: appointmentDate,
        timeSlot: timeSlots[Math.floor(Math.random() * timeSlots.length)],
        symptoms: symptoms[Math.floor(Math.random() * symptoms.length)],
        status: 'completed',
        diagnosis: diagnoses[Math.floor(Math.random() * diagnoses.length)],
        prescription: prescriptions[Math.floor(Math.random() * prescriptions.length)],
        rating: Math.floor(Math.random() * 2) + 4 // 4-5 stars for realistic high ratings
      };

      await Appointment.create(appointmentData);
      ratingsAdded++;
    }
  }

  console.log(`✅ Ratings: ${ratingsAdded} additional rated appointments created for ${doctorsNeedingRatings.length} doctors`);
  console.log(`   Now all ${allDoctors.length} doctors have sufficient ratings!`);
  return { created: ratingsAdded, skipped: allDoctors.length - doctorsNeedingRatings.length };
};

// 5. SEED PAYMENTS
const seedPayments = async () => {
  console.log('\n💳 SEEDING PAYMENTS...');
  console.log('─'.repeat(70));

  const appointments = await Appointment.find({
    status: { $in: ['completed', 'confirmed'] }
  }).populate('patient doctor');

  let created = 0, skipped = 0;
  let totalRevenue = 0;

  for (const appointment of appointments) {
    const existingPayment = await Payment.findOne({ appointment: appointment._id });
    if (existingPayment) {
      skipped++;
      continue;
    }

    const doctor = await User.findById(appointment.doctor._id);
    const amount = doctor?.consultationFee || 500;

    const paymentStatus = appointment.status === 'completed' ? 'completed' : 'pending';
    const paymentMethods = ['card', 'upi', 'netbanking', 'wallet'];
    const paymentMethod = paymentMethods[Math.floor(Math.random() * paymentMethods.length)];

    await Payment.create({
      appointment: appointment._id,
      patient: appointment.patient._id,
      amount: amount,
      status: paymentStatus,
      paymentMethod: paymentMethod,
      transactionId: `TXN${Date.now()}${Math.floor(Math.random() * 100000)}`,
      passkeyVerified: paymentStatus === 'completed',
      description: `Consultation with Dr. ${appointment.doctor.name} - ${doctor.specialization || 'General'}`
    });

    if (paymentStatus === 'completed') {
      totalRevenue += amount;
    }

    created++;
    await new Promise(resolve => setTimeout(resolve, 5));
  }

  console.log(`✅ Payments: ${created} created, ${skipped} skipped`);
  console.log(`   Total Revenue: ₹${totalRevenue.toLocaleString()}`);
  return { created, skipped, revenue: totalRevenue };
};

// 6. SEED CHATBOT INTENTS
const seedIntents = async () => {
  console.log('\n🤖 SEEDING CHATBOT INTENTS...');
  console.log('─'.repeat(70));

  const existingCount = await Intent.countDocuments();
  if (existingCount > 0) {
    console.log(`⏭️  ${existingCount} intents already exist, skipping...`);
    return { created: 0, skipped: existingCount };
  }

  const defaultIntents = [
    {
      tag: 'greeting',
      patterns: ['Hi', 'Hello', 'Hey', 'Good morning', 'Good evening', 'Greetings', 'Namaste'],
      responses: [
        'Hello! Welcome to SmartCare+ Hospital. How can I help you today?',
        'Hi there! I\'m your SmartCare+ assistant. What can I do for you?',
        'Greetings! How may I assist you with your healthcare needs today?'
      ],
      category: 'general',
      isActive: true
    },
    {
      tag: 'goodbye',
      patterns: ['Bye', 'Goodbye', 'See you', 'Talk to you later', 'Thank you', 'Thanks', 'Dhanyavad'],
      responses: [
        'Goodbye! Take care and stay healthy!',
        'Thank you for choosing SmartCare+. Have a great day!',
        'See you soon! Don\'t hesitate to reach out if you need any help.'
      ],
      category: 'general',
      isActive: true
    },
    {
      tag: 'book_appointment',
      patterns: [
        'I want to book an appointment',
        'Schedule appointment',
        'Book a doctor',
        'Need appointment',
        'Can I see a doctor',
        'Reserve appointment',
        'Appointment booking'
      ],
      responses: [
        'I can help you book an appointment! Please visit our Doctors page to browse available doctors and schedule a consultation.',
        'To book an appointment, go to the Doctors section and select your preferred specialist.',
        'You can easily book an appointment by browsing our doctors and choosing an available time slot.'
      ],
      category: 'appointment',
      isActive: true
    },
    {
      tag: 'find_doctor',
      patterns: [
        'Find a doctor',
        'Show me doctors',
        'Available doctors',
        'List of doctors',
        'Search doctor',
        'Doctor specialization',
        'Specialist doctors'
      ],
      responses: [
        'We have specialists across 15 departments including Cardiology, Neurology, Orthopedics, and more. Visit the Doctors page to browse.',
        'You can find doctors by specialization on our Doctors page. We have experienced specialists ready to help you.',
        'Our platform has doctors in various specializations. Check the Doctors section to find the right specialist for you.'
      ],
      category: 'doctor',
      isActive: true
    },
    {
      tag: 'symptoms',
      patterns: [
        'I have symptoms',
        'Check symptoms',
        'What are my symptoms',
        'Feeling sick',
        'Not feeling well',
        'Health problem',
        'Medical issue'
      ],
      responses: [
        'I recommend consulting with a doctor about your symptoms. Would you like to book an appointment with a specialist?',
        'For accurate diagnosis, please book a consultation with our doctors. Which department might be relevant to your symptoms?',
        'It\'s important to get professional medical advice. I can help you find the right doctor based on your symptoms.'
      ],
      category: 'medical',
      isActive: true
    },
    {
      tag: 'payment',
      patterns: [
        'Payment information',
        'How to pay',
        'Payment methods',
        'Consultation fees',
        'How much does it cost',
        'Pricing',
        'Payment options'
      ],
      responses: [
        'Consultation fees vary by doctor and specialization, typically ranging from ₹300 to ₹2000. You can see exact fees on each doctor\'s profile.',
        'Payment can be made securely through our platform after booking. You\'ll find fee details on the doctor\'s profile.',
        'We accept card, UPI, net banking, and wallet payments. Consultation fees are displayed when you book an appointment.'
      ],
      category: 'payment',
      isActive: true
    },
    {
      tag: 'emergency',
      patterns: [
        'Emergency',
        'Urgent help',
        'Critical condition',
        'Need immediate help',
        'Medical emergency',
        'Ambulance',
        'Help me'
      ],
      responses: [
        '🚨 For medical emergencies, please call 102 (India Emergency) or visit the nearest hospital immediately!',
        '⚠️ This is a booking platform. For emergencies, dial 102 or go to the nearest emergency room right away!',
        '🚑 Please call emergency services (102) immediately if you\'re experiencing a medical emergency!'
      ],
      category: 'emergency',
      isActive: true
    },
    {
      tag: 'working_hours',
      patterns: [
        'Working hours',
        'When are you open',
        'Availability',
        'Operating hours',
        'Clinic timings',
        'What time',
        'Schedule'
      ],
      responses: [
        'Our doctors have varying schedules. You can check available time slots when booking an appointment with a specific doctor.',
        'Doctor availability varies. Each doctor\'s profile shows their available days and time slots.',
        'We have doctors available throughout the week. Check individual doctor profiles for their specific schedules.'
      ],
      category: 'general',
      isActive: true
    },
    {
      tag: 'departments',
      patterns: [
        'What departments',
        'Specializations available',
        'Types of doctors',
        'Medical departments',
        'What specialists',
        'Categories',
        'Departments list'
      ],
      responses: [
        'We have 15 departments: Cardiology, Neurology, Orthopedics, Dermatology, Pediatrics, Gynecology, ENT, General Medicine, Urology, Ophthalmology, Psychiatry, Gastroenterology, Oncology, Pulmonology, and Nephrology.',
        'Our specialists cover all major medical departments including heart, brain, bones, skin, children, women\'s health, and more.',
        'We offer comprehensive healthcare across 15 specializations. You can browse doctors by department on our platform.'
      ],
      category: 'general',
      isActive: true
    },
    {
      tag: 'cancel_appointment',
      patterns: [
        'Cancel appointment',
        'Cancel booking',
        'Remove appointment',
        'Delete appointment',
        'Don\'t want appointment',
        'Cancel consultation'
      ],
      responses: [
        'You can cancel your appointment from the My Appointments page. Please cancel at least 24 hours in advance if possible.',
        'To cancel, go to My Appointments and click the cancel button. Refunds are processed according to our cancellation policy.',
        'Visit your My Appointments section to cancel. We recommend canceling in advance so the slot can be offered to other patients.'
      ],
      category: 'appointment',
      isActive: true
    },
    {
      tag: 'about',
      patterns: [
        'What is SmartCare',
        'About SmartCare',
        'Tell me about this hospital',
        'What do you do',
        'About hospital',
        'Hospital information'
      ],
      responses: [
        'SmartCare+ is a comprehensive healthcare platform connecting patients with qualified doctors across 15 specializations. We make healthcare accessible and convenient.',
        'We\'re SmartCare+ - your trusted healthcare partner. Book appointments, consult experienced doctors, and manage your health records all in one place.',
        'SmartCare+ provides easy access to quality healthcare. Browse our specialist doctors, book appointments, and get expert medical consultation.'
      ],
      category: 'general',
      isActive: true
    },
    {
      tag: 'prescription',
      patterns: [
        'Get prescription',
        'My prescription',
        'Medicine prescription',
        'Doctor prescription',
        'View prescription'
      ],
      responses: [
        'Prescriptions are provided by doctors after completed consultations. You can view them in your appointment history.',
        'Your prescription will be available in the My Appointments section after your consultation is completed.',
        'Doctors provide prescriptions during completed appointments. Check your appointment details to view prescriptions.'
      ],
      category: 'medical',
      isActive: true
    }
  ];

  await Intent.insertMany(defaultIntents);
  console.log(`✅ Intents: ${defaultIntents.length} created`);
  return { created: defaultIntents.length, skipped: 0 };
};

// 7. SEED CHAT LOGS
const seedChatLogs = async () => {
  console.log('\n💬 SEEDING CHAT LOGS...');
  console.log('─'.repeat(70));

  // Only use predefined test patients (patient1@test.com through patient5@test.com)
  const predefinedPatientEmails = Array.from({ length: 5 }, (_, i) => `patient${i + 1}@test.com`);
  const patients = await User.find({ 
    role: 'patient',
    email: { $in: predefinedPatientEmails }
  }).limit(5);
  
  if (patients.length === 0) {
    console.log('⚠️  No patients found for chat logs');
    return { created: 0, skipped: 0 };
  }

  const sampleConversations = [
    { userMessage: 'Hello', botResponse: 'Hello! Welcome to SmartCare+ Hospital. How can I help you today?', intent: 'greeting' },
    { userMessage: 'I want to book an appointment', botResponse: 'I can help you book an appointment! Please visit our Doctors page to browse available doctors and schedule a consultation.', intent: 'book_appointment' },
    { userMessage: 'Find a cardiologist', botResponse: 'We have specialists across 15 departments including Cardiology. Visit the Doctors page to browse our cardiologists.', intent: 'find_doctor' },
    { userMessage: 'What are the consultation fees?', botResponse: 'Consultation fees vary by doctor and specialization, typically ranging from ₹300 to ₹2000. You can see exact fees on each doctor\'s profile.', intent: 'payment' },
    { userMessage: 'I have fever and headache', botResponse: 'I recommend consulting with a doctor about your symptoms. Would you like to book an appointment with a specialist?', intent: 'symptoms' },
    { userMessage: 'Show me available doctors', botResponse: 'You can find doctors by specialization on our Doctors page. We have experienced specialists ready to help you.', intent: 'find_doctor' },
    { userMessage: 'How do I cancel my appointment?', botResponse: 'You can cancel your appointment from the My Appointments page. Please cancel at least 24 hours in advance if possible.', intent: 'cancel_appointment' },
    { userMessage: 'What are your working hours?', botResponse: 'Our doctors have varying schedules. You can check available time slots when booking an appointment with a specific doctor.', intent: 'working_hours' },
    { userMessage: 'Tell me about SmartCare+', botResponse: 'SmartCare+ is a comprehensive healthcare platform connecting patients with qualified doctors across 15 specializations. We make healthcare accessible and convenient.', intent: 'about' },
    { userMessage: 'Emergency help needed', botResponse: '🚨 For medical emergencies, please call 102 (India Emergency) or visit the nearest hospital immediately!', intent: 'emergency' },
    { userMessage: 'Where is my prescription?', botResponse: 'Prescriptions are provided by doctors after completed consultations. You can view them in your appointment history.', intent: 'prescription' },
    { userMessage: 'What departments do you have?', botResponse: 'We have 15 departments: Cardiology, Neurology, Orthopedics, Dermatology, Pediatrics, Gynecology, ENT, General Medicine, Urology, Ophthalmology, Psychiatry, Gastroenterology, Oncology, Pulmonology, and Nephrology.', intent: 'departments' },
    { userMessage: 'Thank you', botResponse: 'Thank you for choosing SmartCare+. Have a great day!', intent: 'goodbye' },
    { userMessage: 'How to pay for consultation?', botResponse: 'Payment can be made securely through our platform after booking. You\'ll find fee details on the doctor\'s profile.', intent: 'payment' },
    { userMessage: 'Good morning', botResponse: 'Greetings! How may I assist you with your healthcare needs today?', intent: 'greeting' }
  ];

  let created = 0;

  for (let i = 0; i < Math.min(CONFIG.CHAT_LOGS_COUNT, sampleConversations.length); i++) {
    const patient = patients[i % patients.length];
    const conversation = sampleConversations[i];

    await ChatLog.create({
      user: patient._id,
      userMessage: conversation.userMessage,
      botResponse: conversation.botResponse,
      intent: conversation.intent,
      confidence: 0.85 + Math.random() * 0.14, // 0.85-0.99
      sessionId: `session_${Date.now()}_${i}`,
      isResolved: true
    });

    created++;
  }

  console.log(`✅ Chat Logs: ${created} conversation histories created`);
  return { created, skipped: 0 };
};

// ═══════════════════════════════════════════════════════════════════════════
// MAIN SEEDING ORCHESTRATOR
// ═══════════════════════════════════════════════════════════════════════════

const seedAll = async () => {
  console.log('\n');
  console.log('═'.repeat(70));
  console.log('  SmartCare+ ALL-IN-ONE DATABASE SEEDER');
  console.log('  Complete Data Seeding for Production-Ready Application');
  console.log('═'.repeat(70));

  const startTime = Date.now();
  const results = {
    admins: { created: 0, skipped: 0 },
    doctors: { created: 0, skipped: 0 },
    patients: { created: 0, skipped: 0 },
    appointments: { created: 0, skipped: 0 },
    doctorRatings: { created: 0, skipped: 0 },
    payments: { created: 0, skipped: 0, revenue: 0 },
    intents: { created: 0, skipped: 0 },
    chatLogs: { created: 0, skipped: 0 }
  };

  try {
    // Connect to database
    const connected = await connectDB();
    if (!connected) {
      throw new Error('Failed to connect to database');
    }

    // Load data
    console.log('\n📂 Loading dataset...');
    const data = loadJSONData();
    if (!data) {
      throw new Error('Failed to load dataset');
    }
    console.log(`✅ Loaded: ${data.doctors.length} doctors, ${data.departments.length} departments, ${data.diseases.length} diseases`);

    // Execute seeding in order
    results.admins = await seedAdmins();
    results.doctors = await seedDoctors(data.doctors);
    results.patients = await seedPatients();
    results.appointments = await seedAppointments();
    results.doctorRatings = await addRatingsForAllDoctors();
    results.payments = await seedPayments();
    results.intents = await seedIntents();
    results.chatLogs = await seedChatLogs();

    // Calculate statistics
    const endTime = Date.now();
    const duration = ((endTime - startTime) / 1000).toFixed(2);

    // Display summary
    console.log('\n');
    console.log('═'.repeat(70));
    console.log('  ✅ SEEDING COMPLETED SUCCESSFULLY!');
    console.log('═'.repeat(70));
    console.log('\n📊 SUMMARY:');
    console.log('─'.repeat(70));
    console.log(`   Admins:       ${results.admins.created} created, ${results.admins.skipped} skipped`);
    console.log(`   Doctors:      ${results.doctors.created} created, ${results.doctors.updated || 0} updated, ${results.doctors.skipped} skipped`);
    console.log(`   Patients:     ${results.patients.created} created, ${results.patients.skipped} skipped`);
    console.log(`   Appointments: ${results.appointments.created} created`);
    console.log(`   Doctor Ratings: ${results.doctorRatings.created} rated appointments added (${results.doctorRatings.skipped} doctors already had ratings)`);
    console.log(`   Payments:     ${results.payments.created} created (₹${results.payments.revenue.toLocaleString()} revenue)`);
    console.log(`   Intents:      ${results.intents.created} created, ${results.intents.skipped} skipped`);
    console.log(`   Chat Logs:    ${results.chatLogs.created} created`);
    console.log('─'.repeat(70));
    console.log(`   ⏱️  Completed in: ${duration} seconds`);
    console.log('═'.repeat(70));

    // Login credentials
    console.log('\n🔐 LOGIN CREDENTIALS:');
    console.log('─'.repeat(70));
    console.log('   👤 Admin:');
    console.log('      Email:    admin@smartcare.com');
    console.log('      Password: admin123');
    console.log('      Passkey:  6429');
    console.log('');
    console.log('   👨‍⚕️ Doctor (any seeded doctor):');
    console.log('      Email:    [check console output above]');
    console.log('      Password: doctor123');
    console.log('      Passkey:  [unique per doctor]');
    console.log('');
    console.log('   🧑 Patient:');
    console.log('      Email:    patient1@test.com');
    console.log('      Password: patient123');
    console.log('      Passkey:  [unique per patient]');
    console.log('═'.repeat(70));

    console.log('\n💡 NOTES:');
    console.log('   • All users have unique payment passkeys');
    console.log('   • Doctors automatically get ratings (4.0-5.0) with reviews');
    console.log('   • Existing doctors are auto-updated with ratings if missing');
    console.log('   • Appointments span past 30 days and next 30 days');
    console.log('   • Completed appointments include diagnosis & prescriptions');
    console.log('   • All doctors are auto-approved and verified');
    console.log('   • Safe to run multiple times (idempotent)');
    console.log('');

    return true;
  } catch (error) {
    console.error('\n❌ SEEDING FAILED:', error.message);
    console.error(error);
    return false;
  } finally {
    await mongoose.connection.close();
    console.log('✅ Database connection closed\n');
  }
};

// ═══════════════════════════════════════════════════════════════════════════
// EXECUTE
// ═══════════════════════════════════════════════════════════════════════════

seedAll()
  .then(success => {
    process.exit(success ? 0 : 1);
  })
  .catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
