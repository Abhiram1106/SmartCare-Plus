const mongoose = require('mongoose');

const prescriptionSchema = new mongoose.Schema({
  // References
  appointment: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Appointment',
    required: true,
    unique: true // One prescription per appointment
  },
  patient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  doctor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  
  // Medical Information
  diagnosis: {
    type: String,
    required: true,
    trim: true,
    maxlength: 500
  },
  symptoms: {
    type: String,
    trim: true,
    maxlength: 300
  },
  
  // Medications Array
  medications: [{
    name: {
      type: String,
      required: true,
      trim: true
    },
    dosage: {
      type: String,
      required: true,
      trim: true
    },
    frequency: {
      type: String,
      required: true,
      enum: [
        'Once daily',
        'Twice daily', 
        'Thrice daily',
        'Four times daily',
        'Every 4 hours',
        'Every 6 hours',
        'Every 8 hours',
        'Every 12 hours',
        'As needed',
        'Before meals',
        'After meals',
        'At bedtime'
      ]
    },
    duration: {
      type: String,
      required: true,
      trim: true // e.g., "7 days", "2 weeks", "1 month"
    },
    instructions: {
      type: String,
      trim: true,
      maxlength: 200 // Special instructions for this medication
    }
  }],
  
  // General Instructions
  generalInstructions: {
    type: String,
    trim: true,
    maxlength: 500
  },
  
  // Follow-up Information
  followUp: {
    required: {
      type: Boolean,
      default: false
    },
    date: Date,
    instructions: String
  },
  
  // Tests/Lab Work
  testsRecommended: [{
    testName: {
      type: String,
      required: true,
      trim: true
    },
    reason: {
      type: String,
      trim: true
    },
    urgent: {
      type: Boolean,
      default: false
    }
  }],
  
  // Lifestyle Recommendations
  lifestyleRecommendations: {
    diet: String,
    exercise: String,
    restrictions: String,
    other: String
  },
  
  // Prescription Metadata
  prescriptionNumber: {
    type: String,
    unique: true
    // Note: This is auto-generated in pre-save middleware, so not required in schema
  },
  issueDate: {
    type: Date,
    default: Date.now
  },
  validUntil: {
    type: Date,
    default: function() {
      // Valid for 6 months by default
      const date = new Date();
      date.setMonth(date.getMonth() + 6);
      return date;
    }
  },
  
  // Status
  status: {
    type: String,
    enum: ['active', 'completed', 'cancelled'],
    default: 'active'
  },
  
  // Digital Signature
  doctorSignature: {
    signed: {
      type: Boolean,
      default: false
    },
    signedAt: Date,
    digitalSignature: String // Base64 encoded signature or certificate
  },
  
  // Pharmacy Information
  pharmacy: {
    name: String,
    address: String,
    phone: String,
    dispensedAt: Date
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual to check if prescription is expired
prescriptionSchema.virtual('isExpired').get(function() {
  return new Date() > this.validUntil;
});

// Virtual to get prescription age
prescriptionSchema.virtual('ageInDays').get(function() {
  const diffTime = Math.abs(new Date() - this.issueDate);
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
});

// Pre-save middleware to generate prescription number
prescriptionSchema.pre('save', async function(next) {
  if (this.isNew) {
    const count = await this.constructor.countDocuments();
    const year = new Date().getFullYear();
    const month = String(new Date().getMonth() + 1).padStart(2, '0');
    this.prescriptionNumber = `RX${year}${month}${String(count + 1).padStart(6, '0')}`;
  }
  next();
});

// Indexes for efficient queries
prescriptionSchema.index({ patient: 1, createdAt: -1 });
prescriptionSchema.index({ doctor: 1, createdAt: -1 });
prescriptionSchema.index({ appointment: 1 });
prescriptionSchema.index({ prescriptionNumber: 1 });
prescriptionSchema.index({ status: 1 });
prescriptionSchema.index({ validUntil: 1 });

module.exports = mongoose.model('Prescription', prescriptionSchema);