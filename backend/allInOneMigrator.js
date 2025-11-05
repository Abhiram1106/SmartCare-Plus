/*
 * ═══════════════════════════════════════════════════════════════════════════
 * SmartCare+ ALL-IN-ONE DATABASE MIGRATOR
 * Comprehensive schema migration for all collections
 * 
 * Usage: node allInOneMigrator.js
 * 
 * This script migrates:
 * - User documents (phone, gender, age, education, consultationFee)
 * - Doctor documents (professional fields, ratings, languages, addresses)
 * 
 * Features:
 * - Idempotent: Safe to run multiple times
 * - Selective: Only updates missing fields
 * - Comprehensive: Handles all schema changes
 * - Detailed: Reports exactly what was changed
 * ═══════════════════════════════════════════════════════════════════════════
 */

const mongoose = require('mongoose');
require('dotenv').config();

// Import models
const User = require('./models/User');
const Doctor = require('./models/Doctor');
const Appointment = require('./models/Appointment');

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

// Generate random Indian phone number
const generatePhoneNumber = () => {
  const firstDigit = Math.floor(Math.random() * 4) + 6; // 6-9
  const remaining = Math.floor(Math.random() * 900000000) + 100000000;
  return `+91${firstDigit}${remaining}`;
};

// Generate random gender
const getRandomGender = () => {
  return ['male', 'female'][Math.floor(Math.random() * 2)];
};

// Generate random age based on role
const getRandomAge = (role) => {
  if (role === 'doctor') {
    return Math.floor(Math.random() * 36) + 30; // 30-65
  } else if (role === 'admin') {
    return Math.floor(Math.random() * 21) + 30; // 30-50
  } else {
    return Math.floor(Math.random() * 46) + 18; // 18-63
  }
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

// ═══════════════════════════════════════════════════════════════════════════
// MIGRATION FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════

// 1. MIGRATE USER FIELDS
const migrateUserFields = async () => {
  console.log('\n👤 MIGRATING USER FIELDS...');
  console.log('─'.repeat(70));

  const users = await User.find();
  let updated = 0, skipped = 0;
  const updateSummary = {
    phone: 0,
    gender: 0,
    age: 0,
    education: 0,
    consultationFee: 0,
    approvedSync: 0
  };

  for (const user of users) {
    let needsUpdate = false;
    const updates = {};

    // Add phone if missing
    if (!user.phone || user.phone === '') {
      updates.phone = generatePhoneNumber();
      updateSummary.phone++;
      needsUpdate = true;
    }

    // Add gender if missing
    if (!user.gender || user.gender === '') {
      updates.gender = getRandomGender();
      updateSummary.gender++;
      needsUpdate = true;
    }

    // Add age if missing
    if (!user.age || user.age === 0) {
      updates.age = getRandomAge(user.role);
      updateSummary.age++;
      needsUpdate = true;
    }

    // Add education for doctors
    if (user.role === 'doctor' && (!user.education || user.education === '')) {
      const specialization = user.specialization || 'General Medicine';
      updates.education = `MD - ${specialization}`;
      updateSummary.education++;
      needsUpdate = true;
    }

    // Add consultation fee for doctors
    if (user.role === 'doctor' && (!user.consultationFee || user.consultationFee === 0)) {
      updates.consultationFee = getRandomConsultationFee();
      updateSummary.consultationFee++;
      needsUpdate = true;
    }

    // Sync approved/isApproved fields
    if (user.approved !== user.isApproved) {
      updates.isApproved = user.approved;
      updateSummary.approvedSync++;
      needsUpdate = true;
    }

    if (needsUpdate) {
      await User.findByIdAndUpdate(user._id, updates);
      updated++;
      
      if (updated <= 5) {
        console.log(`✅ Updated: ${user.name} (${user.email})`);
        console.log(`   Fields: ${Object.keys(updates).join(', ')}`);
      }
    } else {
      skipped++;
    }
  }

  if (updated > 5) {
    console.log(`   ... and ${updated - 5} more users`);
  }

  console.log(`\n📊 User Migration Summary:`);
  console.log(`   Total Users:          ${users.length}`);
  console.log(`   Updated:              ${updated}`);
  console.log(`   Skipped (no changes): ${skipped}`);
  console.log(`\n   Fields Added:`);
  console.log(`   • Phone numbers:      ${updateSummary.phone}`);
  console.log(`   • Genders:            ${updateSummary.gender}`);
  console.log(`   • Ages:               ${updateSummary.age}`);
  console.log(`   • Education:          ${updateSummary.education}`);
  console.log(`   • Consultation Fees:  ${updateSummary.consultationFee}`);
  console.log(`   • Approval Synced:    ${updateSummary.approvedSync}`);

  return { updated, skipped, details: updateSummary };
};

// 2. MIGRATE DOCTOR FIELDS
const migrateDoctorFields = async () => {
  console.log('\n👨‍⚕️ MIGRATING DOCTOR PROFESSIONAL FIELDS...');
  console.log('─'.repeat(70));

  const doctors = await Doctor.find();
  let updated = 0, skipped = 0;
  const updateSummary = {
    successRate: 0,
    totalConsultations: 0,
    totalPatients: 0,
    ratingBreakdown: 0,
    verifiedBadge: 0,
    languages: 0,
    clinicAddress: 0
  };

  const indianLanguages = ['Hindi', 'Tamil', 'Telugu', 'Marathi', 'Bengali', 'Kannada', 'Malayalam', 'Gujarati', 'Punjabi'];
  const cities = ['Mumbai', 'Delhi', 'Bangalore', 'Chennai', 'Kolkata', 'Hyderabad', 'Pune', 'Ahmedabad', 'Jaipur', 'Lucknow'];

  for (const doctor of doctors) {
    let needsUpdate = false;
    const updates = {};

    // Add success rate if missing
    if (!doctor.successRate || doctor.successRate === 0) {
      const experience = doctor.experience || 5;
      const baseSuccessRate = 85;
      updates.successRate = parseFloat(Math.min(98, baseSuccessRate + (experience * 0.5)).toFixed(1));
      updateSummary.successRate++;
      needsUpdate = true;
    }

    // Add total consultations if missing
    if (!doctor.totalConsultations || doctor.totalConsultations === 0) {
      const experience = doctor.experience || 5;
      const consultationsPerYear = Math.floor(Math.random() * 150) + 100;
      updates.totalConsultations = Math.floor(consultationsPerYear * Math.min(experience, 20));
      updateSummary.totalConsultations++;
      needsUpdate = true;
    }

    // Add total patients if missing
    if (!doctor.totalPatients || doctor.totalPatients === 0) {
      const consultations = updates.totalConsultations || doctor.totalConsultations || 500;
      updates.totalPatients = Math.floor(consultations * (0.7 + Math.random() * 0.2));
      updateSummary.totalPatients++;
      needsUpdate = true;
    }

    // Add rating breakdown if missing
    if (!doctor.ratingBreakdown || Object.keys(doctor.ratingBreakdown).length === 0) {
      const totalPatients = updates.totalPatients || doctor.totalPatients || 500;
      const totalRatings = Math.floor(totalPatients * 0.3);
      const avgRating = doctor.rating || 4.5;
      updates.ratingBreakdown = generateRatingBreakdown(avgRating, totalRatings);
      updateSummary.ratingBreakdown++;
      needsUpdate = true;
    }

    // Add verified badge if missing
    if (doctor.verifiedBadge === undefined || doctor.verifiedBadge === null) {
      updates.verifiedBadge = true;
      updateSummary.verifiedBadge++;
      needsUpdate = true;
    }

    // Add languages if missing
    if (!doctor.languages || doctor.languages.length === 0) {
      const randomLanguage = indianLanguages[Math.floor(Math.random() * indianLanguages.length)];
      updates.languages = ['English', randomLanguage];
      updateSummary.languages++;
      needsUpdate = true;
    }

    // Add clinic address if missing
    if (!doctor.clinicAddress || doctor.clinicAddress === '') {
      const city = cities[Math.floor(Math.random() * cities.length)];
      const streetNum = Math.floor(Math.random() * 500) + 1;
      const pincode = `${Math.floor(Math.random() * 90) + 10}00${Math.floor(Math.random() * 90) + 10}`;
      updates.clinicAddress = `${streetNum}, MG Road, ${city} - ${pincode}`;
      updateSummary.clinicAddress++;
      needsUpdate = true;
    }

    if (needsUpdate) {
      await Doctor.findByIdAndUpdate(doctor._id, updates);
      updated++;
      
      if (updated <= 5) {
        console.log(`✅ Updated: ${doctor.name}`);
        console.log(`   Fields: ${Object.keys(updates).join(', ')}`);
      }
    } else {
      skipped++;
    }
  }

  if (updated > 5) {
    console.log(`   ... and ${updated - 5} more doctors`);
  }

  console.log(`\n📊 Doctor Migration Summary:`);
  console.log(`   Total Doctors:        ${doctors.length}`);
  console.log(`   Updated:              ${updated}`);
  console.log(`   Skipped (no changes): ${skipped}`);
  console.log(`\n   Fields Added:`);
  console.log(`   • Success Rates:      ${updateSummary.successRate}`);
  console.log(`   • Total Consultations:${updateSummary.totalConsultations}`);
  console.log(`   • Total Patients:     ${updateSummary.totalPatients}`);
  console.log(`   • Rating Breakdowns:  ${updateSummary.ratingBreakdown}`);
  console.log(`   • Verified Badges:    ${updateSummary.verifiedBadge}`);
  console.log(`   • Languages:          ${updateSummary.languages}`);
  console.log(`   • Clinic Addresses:   ${updateSummary.clinicAddress}`);

  return { updated, skipped, details: updateSummary };
};

// 3. ENSURE ALL DOCTORS HAVE RATINGS
const ensureDoctorRatings = async () => {
  console.log('\n⭐ ENSURING ALL DOCTORS HAVE RATINGS...');
  console.log('─'.repeat(70));

  // Only use predefined test patients (patient1@test.com through patient10@test.com)
  const predefinedPatientEmails = Array.from({ length: 10 }, (_, i) => `patient${i + 1}@test.com`);
  const patients = await User.find({ 
    role: 'patient',
    email: { $in: predefinedPatientEmails }
  });

  if (patients.length === 0) {
    console.log('⚠️  No test patients found. Skipping rating migration.');
    return { updated: 0, skipped: 0 };
  }

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

  if (doctorsNeedingRatings.length === 0) {
    console.log('✅ All doctors already have sufficient ratings.');
    return { updated: 0, skipped: allDoctors.length };
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
    console.log(`   Adding ratings for Dr. ${doctor.name} (${doctor.specialization})`);
    
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

  console.log(`✅ Added ${ratingsAdded} rated appointments for ${doctorsNeedingRatings.length} doctors`);
  console.log(`   All ${allDoctors.length} doctors now have sufficient ratings!`);
  
  return { updated: ratingsAdded, skipped: allDoctors.length - doctorsNeedingRatings.length };
};

// 4. FUTURE MIGRATION PLACEHOLDER
const futureSchemaUpdates = async () => {
  console.log('\n🔄 CHECKING FOR FUTURE SCHEMA UPDATES...');
  console.log('─'.repeat(70));
  console.log('   No additional migrations required at this time.');
  console.log('   This function is a placeholder for future schema changes.');
  
  return { updated: 0, skipped: 0 };
};

// ═══════════════════════════════════════════════════════════════════════════
// MAIN MIGRATION ORCHESTRATOR
// ═══════════════════════════════════════════════════════════════════════════

const migrateAll = async () => {
  console.log('\n');
  console.log('═'.repeat(70));
  console.log('  SmartCare+ ALL-IN-ONE DATABASE MIGRATOR');
  console.log('  Comprehensive Schema Migration for All Collections');
  console.log('═'.repeat(70));

  const startTime = Date.now();
  const results = {
    users: { updated: 0, skipped: 0 },
    doctors: { updated: 0, skipped: 0 },
    doctorRatings: { updated: 0, skipped: 0 },
    future: { updated: 0, skipped: 0 }
  };

  try {
    // Connect to database
    const connected = await connectDB();
    if (!connected) {
      throw new Error('Failed to connect to database');
    }

    // Execute migrations in order
    results.users = await migrateUserFields();
    results.doctors = await migrateDoctorFields();
    results.doctorRatings = await ensureDoctorRatings();
    results.future = await futureSchemaUpdates();

    // Calculate statistics
    const endTime = Date.now();
    const duration = ((endTime - startTime) / 1000).toFixed(2);
    const totalUpdated = results.users.updated + results.doctors.updated + results.doctorRatings.updated + results.future.updated;
    const totalSkipped = results.users.skipped + results.doctors.skipped + results.doctorRatings.skipped + results.future.skipped;

    // Display summary
    console.log('\n');
    console.log('═'.repeat(70));
    console.log('  ✅ MIGRATION COMPLETED SUCCESSFULLY!');
    console.log('═'.repeat(70));
    console.log('\n📊 OVERALL SUMMARY:');
    console.log('─'.repeat(70));
    console.log(`   Users Updated:        ${results.users.updated}`);
    console.log(`   Users Skipped:        ${results.users.skipped}`);
    console.log(`   Doctors Updated:      ${results.doctors.updated}`);
    console.log(`   Doctors Skipped:      ${results.doctors.skipped}`);
    console.log(`   Doctor Ratings Added: ${results.doctorRatings.updated} (${results.doctorRatings.skipped} doctors already had ratings)`);
    console.log('─'.repeat(70));
    console.log(`   Total Updated:        ${totalUpdated}`);
    console.log(`   Total Skipped:        ${totalSkipped}`);
    console.log(`   ⏱️  Completed in:      ${duration} seconds`);
    console.log('═'.repeat(70));

    console.log('\n💡 NOTES:');
    console.log('   • All missing fields have been populated');
    console.log('   • Existing data was preserved');
    console.log('   • Safe to run multiple times (idempotent)');
    console.log('   • Only updates documents with missing fields');
    console.log('');

    if (totalUpdated === 0) {
      console.log('✨ DATABASE IS ALREADY UP TO DATE!');
      console.log('   All documents have the latest schema fields.');
      console.log('');
    }

    return true;
  } catch (error) {
    console.error('\n❌ MIGRATION FAILED:', error.message);
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

migrateAll()
  .then(success => {
    process.exit(success ? 0 : 1);
  })
  .catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
