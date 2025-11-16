const mongoose = require('mongoose');

const symptomAnalysisSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  symptoms: [{
    symptom: { type: String, required: true },
    severity: { type: String, enum: ['mild', 'moderate', 'severe'], required: true },
    duration: { type: String }, // e.g., "2 days", "1 week"
    frequency: { type: String } // e.g., "constant", "occasional"
  }],
  additionalInfo: {
    age: Number,
    gender: String,
    existingConditions: [String],
    medications: [String],
    allergies: [String]
  },
  predictions: [{
    disease: { type: String, required: true },
    confidence: { type: Number, required: true }, // 0-100
    severity: { type: String, enum: ['low', 'medium', 'high', 'critical'] },
    description: String,
    recommendedActions: [String],
    specialistType: String
  }],
  urgencyLevel: {
    type: String,
    enum: ['low', 'moderate', 'high', 'emergency'],
    required: true
  },
  recommendedSpecialist: {
    type: String
  },
  recommendedTests: [String],
  aiModel: {
    type: String,
    default: 'symptom-analyzer-v1'
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  followedUp: {
    type: Boolean,
    default: false
  },
  appointmentBooked: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Appointment'
  }
});

// Index for quick retrieval
symptomAnalysisSchema.index({ user: 1, createdAt: -1 });

module.exports = mongoose.model('SymptomAnalysis', symptomAnalysisSchema);
