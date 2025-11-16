const mongoose = require('mongoose');

const ReviewSchema = new mongoose.Schema({
  // Relationships
  patient: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true,
    index: true
  },
  doctor: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true,
    index: true
  },
  appointment: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Appointment',
    index: true
  },
  
  // Rating & Review Content
  rating: { 
    type: Number, 
    required: true,
    min: 1,
    max: 5,
    validate: {
      validator: Number.isInteger,
      message: 'Rating must be an integer between 1 and 5'
    }
  },
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  comment: { 
    type: String, 
    required: true,
    trim: true,
    maxlength: 1000
  },
  
  // Detailed Ratings (Optional)
  detailedRatings: {
    professionalism: { type: Number, min: 1, max: 5 },
    communication: { type: Number, min: 1, max: 5 },
    waitTime: { type: Number, min: 1, max: 5 },
    facilityQuality: { type: Number, min: 1, max: 5 }
  },
  
  // Review Engagement
  helpfulVotes: { 
    type: Number, 
    default: 0 
  },
  notHelpfulVotes: { 
    type: Number, 
    default: 0 
  },
  votedBy: [{
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    vote: { type: String, enum: ['helpful', 'notHelpful'] }
  }],
  
  // Moderation & Status
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected', 'flagged'],
    default: 'approved' // Auto-approve by default, can be changed to 'pending'
  },
  moderationNote: {
    type: String,
    default: ''
  },
  moderatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  moderatedAt: {
    type: Date
  },
  
  // Verification
  verified: {
    type: Boolean,
    default: false // Set to true if patient actually had an appointment
  },
  
  // Doctor Response
  response: {
    comment: { type: String, maxlength: 500 },
    respondedAt: { type: Date }
  },
  
  // Metadata
  isEdited: {
    type: Boolean,
    default: false
  },
  editedAt: {
    type: Date
  },
  flagCount: {
    type: Number,
    default: 0
  },
  flagReasons: [{
    reason: String,
    flaggedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    flaggedAt: { type: Date, default: Date.now }
  }]
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for helpful ratio
ReviewSchema.virtual('helpfulRatio').get(function() {
  const total = this.helpfulVotes + this.notHelpfulVotes;
  if (total === 0) return 0;
  return (this.helpfulVotes / total * 100).toFixed(1);
});

// Virtual for net votes
ReviewSchema.virtual('netVotes').get(function() {
  return this.helpfulVotes - this.notHelpfulVotes;
});

// Virtual for doctor response presence
ReviewSchema.virtual('hasResponse').get(function() {
  return !!(this.response && this.response.comment);
});

// Virtual for doctor response with proper naming
ReviewSchema.virtual('doctorResponse').get(function() {
  return this.response;
});

// Compound indexes for efficient queries
ReviewSchema.index({ doctor: 1, status: 1, createdAt: -1 });
ReviewSchema.index({ patient: 1, doctor: 1 }, { unique: true }); // One review per patient-doctor pair
ReviewSchema.index({ status: 1, createdAt: -1 });
ReviewSchema.index({ helpfulVotes: -1 });

// Static method to calculate average rating for a doctor
ReviewSchema.statics.calculateDoctorRating = async function(doctorId) {
  const result = await this.aggregate([
    { 
      $match: { 
        doctor: new mongoose.Types.ObjectId(doctorId), 
        status: 'approved' 
      } 
    },
    {
      $group: {
        _id: null,
        averageRating: { $avg: '$rating' },
        totalReviews: { $sum: 1 },
        ratingBreakdown: {
          $push: '$rating'
        }
      }
    }
  ]);
  
  if (result.length > 0) {
    const breakdown = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    result[0].ratingBreakdown.forEach(rating => {
      breakdown[rating]++;
    });
    
    return {
      averageRating: Math.round(result[0].averageRating * 10) / 10,
      totalReviews: result[0].totalReviews,
      ratingBreakdown: breakdown
    };
  }
  
  return {
    averageRating: 0,
    totalReviews: 0,
    ratingBreakdown: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
  };
};

// Pre-save middleware to verify appointment
ReviewSchema.pre('save', async function(next) {
  if (this.isNew && this.appointment) {
    const Appointment = mongoose.model('Appointment');
    const appointment = await Appointment.findById(this.appointment);
    
    if (appointment && appointment.status === 'completed') {
      this.verified = true;
    }
  }
  next();
});

// Post-save middleware to update doctor rating
ReviewSchema.post('save', async function(doc) {
  if (doc.status === 'approved') {
    const User = mongoose.model('User');
    const stats = await doc.constructor.calculateDoctorRating(doc.doctor);
    
    await User.findByIdAndUpdate(doc.doctor, {
      averageRating: stats.averageRating,
      totalReviews: stats.totalReviews,
      ratingBreakdown: stats.ratingBreakdown
    });
  }
});

// Post-remove middleware to update doctor rating
ReviewSchema.post('remove', async function(doc) {
  const User = mongoose.model('User');
  const stats = await doc.constructor.calculateDoctorRating(doc.doctor);
  
  await User.findByIdAndUpdate(doc.doctor, {
    averageRating: stats.averageRating,
    totalReviews: stats.totalReviews,
    ratingBreakdown: stats.ratingBreakdown
  });
});

module.exports = mongoose.model('Review', ReviewSchema);
