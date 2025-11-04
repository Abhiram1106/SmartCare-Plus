const mongoose = require('mongoose');

const intentSchema = new mongoose.Schema({
  tag: {
    type: String,
    required: true,
    unique: true
  },
  patterns: [{
    type: String,
    required: true
  }],
  responses: [{
    type: String,
    required: true
  }],
  context: {
    type: String,
    default: ''
  },
  category: {
    type: String,
    enum: ['general', 'appointment', 'doctor', 'payment', 'medical', 'emergency'],
    default: 'general'
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Index for efficient searches
intentSchema.index({ tag: 1 });
intentSchema.index({ category: 1 });
intentSchema.index({ isActive: 1 });

module.exports = mongoose.model('Intent', intentSchema);
