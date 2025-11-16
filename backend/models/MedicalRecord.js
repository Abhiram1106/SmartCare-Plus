const mongoose = require('mongoose');

const allergySchema = new mongoose.Schema({
  allergen: { type: String, required: true },
  reaction: { type: String, required: true },
  severity: { type: String, enum: ['mild', 'moderate', 'severe'], required: true },
  diagnosedDate: { type: Date }
});

const immunizationSchema = new mongoose.Schema({
  vaccineName: { type: String, required: true },
  dateAdministered: { type: Date, required: true },
  nextDueDate: { type: Date },
  administeredBy: { type: String },
  batchNumber: { type: String }
});

const chronicConditionSchema = new mongoose.Schema({
  condition: { type: String, required: true },
  diagnosedDate: { type: Date, required: true },
  status: { type: String, enum: ['active', 'controlled', 'resolved'], default: 'active' },
  medications: [{ type: String }],
  notes: { type: String }
});

const labResultSchema = new mongoose.Schema({
  testName: { type: String, required: true },
  testDate: { type: Date, required: true },
  result: { type: String, required: true },
  normalRange: { type: String },
  unit: { type: String },
  status: { type: String, enum: ['normal', 'abnormal', 'critical'], default: 'normal' },
  orderedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  labName: { type: String },
  attachments: [{ type: String }]
});

const vitalSignsSchema = new mongoose.Schema({
  recordedDate: { type: Date, required: true, default: Date.now },
  bloodPressure: {
    systolic: { type: Number },
    diastolic: { type: Number }
  },
  heartRate: { type: Number },
  temperature: { type: Number },
  respiratoryRate: { type: Number },
  oxygenSaturation: { type: Number },
  weight: { type: Number },
  height: { type: Number },
  bmi: { type: Number },
  recordedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
});

const familyHistorySchema = new mongoose.Schema({
  relationship: { type: String, required: true },
  condition: { type: String, required: true },
  ageOfOnset: { type: Number },
  notes: { type: String }
});

const medicalRecordSchema = new mongoose.Schema({
  patient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  bloodType: {
    type: String,
    enum: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-', 'Unknown']
  },
  allergies: [allergySchema],
  immunizations: [immunizationSchema],
  chronicConditions: [chronicConditionSchema],
  labResults: [labResultSchema],
  vitalSigns: [vitalSignsSchema],
  familyHistory: [familyHistorySchema],
  surgicalHistory: [{
    procedure: { type: String, required: true },
    date: { type: Date, required: true },
    hospital: { type: String },
    surgeon: { type: String },
    complications: { type: String },
    notes: { type: String }
  }],
  medications: [{
    name: { type: String, required: true },
    dosage: { type: String, required: true },
    frequency: { type: String, required: true },
    startDate: { type: Date, required: true },
    endDate: { type: Date },
    prescribedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    status: { type: String, enum: ['active', 'completed', 'discontinued'], default: 'active' }
  }],
  emergencyContact: {
    name: { type: String },
    relationship: { type: String },
    phone: { type: String },
    email: { type: String }
  },
  insuranceInfo: {
    provider: { type: String },
    policyNumber: { type: String },
    groupNumber: { type: String },
    validUntil: { type: Date }
  },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Update timestamp on save
medicalRecordSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Calculate BMI if height and weight are provided
medicalRecordSchema.methods.calculateBMI = function(weight, height) {
  if (weight && height) {
    const heightInMeters = height / 100;
    return (weight / (heightInMeters * heightInMeters)).toFixed(2);
  }
  return null;
};

module.exports = mongoose.model('MedicalRecord', medicalRecordSchema);
