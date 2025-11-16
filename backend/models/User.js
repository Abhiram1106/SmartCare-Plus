const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  userId: { type: String, unique: true, sparse: true }, // Custom ID format: SMP####
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
  
  // Doctor review fields
  averageRating: { type: Number, default: 0, min: 0, max: 5 },
  totalReviews: { type: Number, default: 0, min: 0 },
  ratingBreakdown: {
    type: Map,
    of: Number,
    default: () => new Map([['1', 0], ['2', 0], ['3', 0], ['4', 0], ['5', 0]])
  },
  
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

// Generate custom user ID before saving
UserSchema.pre('save', async function(next) {
  // Generate userId if it doesn't exist
  if (!this.userId && this.isNew) {
    try {
      // Find the highest existing user ID number
      const lastUser = await mongoose.model('User').findOne({ userId: { $exists: true } })
        .sort({ userId: -1 })
        .select('userId')
        .lean();
      
      let nextNumber = 1000; // Start from SMP1000
      
      if (lastUser && lastUser.userId) {
        // Extract number from format SMP####
        const lastNumber = parseInt(lastUser.userId.replace('SMP', ''));
        if (!isNaN(lastNumber)) {
          nextNumber = lastNumber + 1;
        }
      }
      
      this.userId = `SMP${nextNumber}`;
    } catch (error) {
      console.error('Error generating userId:', error);
      // Fallback to random number if error
      this.userId = `SMP${Math.floor(1000 + Math.random() * 9000)}`;
    }
  }
  
  // Sync approved and isApproved fields
  if (this.isModified('approved')) {
    this.isApproved = this.approved;
  } else if (this.isModified('isApproved')) {
    this.approved = this.isApproved;
  }
  
  next();
});

module.exports = mongoose.model('User', UserSchema);
