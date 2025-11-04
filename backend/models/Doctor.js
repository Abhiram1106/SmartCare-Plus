const mongoose = require('mongoose');

const DoctorSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  specialization: String,
  experience: Number,
  rating: { type: Number, default: 0 },
  availableSlots: [String],
  
  // Professional Statistics
  successRate: { type: Number, default: 90, min: 0, max: 100 }, // Percentage
  totalConsultations: { type: Number, default: 0 },
  totalPatients: { type: Number, default: 0 },
  
  // Detailed Rating Breakdown
  ratingBreakdown: {
    5: { type: Number, default: 0 },
    4: { type: Number, default: 0 },
    3: { type: Number, default: 0 },
    2: { type: Number, default: 0 },
    1: { type: Number, default: 0 }
  },
  
  // Additional Professional Info
  verifiedBadge: { type: Boolean, default: false },
  languages: { type: [String], default: ['English'] },
  clinicAddress: { type: String, default: '' },
  consultationFee: { type: Number, default: 500 },
  
  // Contact Information
  phone: String,
  name: String,
  email: String,
}, {
  timestamps: true
});

// Create index for optimized queries
DoctorSchema.index({ verifiedBadge: 1, rating: -1, specialization: 1 });

module.exports = mongoose.model('Doctor', DoctorSchema);
