const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  phone: { type: String, default: '' },
  role: { 
    type: String, 
    enum: ['patient', 'doctor', 'admin'], 
    default: 'patient' 
  },
  
  // Doctor-specific fields
  specialization: { type: String, default: '' },
  experience: { type: Number, default: 0 },
  education: { type: String, default: '' },
  consultationFee: { type: Number, default: 500 },
  
  // Common fields
  gender: { type: String, enum: ['male', 'female', 'other'], default: 'other' },
  age: { type: Number, default: 0 },
  address: { type: String, default: '' },
  
  // Patient-specific fields
  emergencyContact: { type: String, default: '' },
  emergencyContactName: { type: String, default: '' },
  
  // Payment security
  paymentPasskey: { type: String, default: '' }, // 4-digit payment passkey
  
  // Approval status for doctors
  approved: { type: Boolean, default: false },
  isApproved: { type: Boolean, default: false } // Alias for compatibility
}, { 
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Sync approved and isApproved fields
UserSchema.pre('save', function(next) {
  if (this.isModified('approved')) {
    this.isApproved = this.approved;
  } else if (this.isModified('isApproved')) {
    this.approved = this.isApproved;
  }
  next();
});

module.exports = mongoose.model('User', UserSchema);
