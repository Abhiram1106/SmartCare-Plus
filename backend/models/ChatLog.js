const mongoose = require('mongoose');

const chatLogSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  userMessage: {
    type: String,
    required: true
  },
  botResponse: {
    type: String,
    required: true
  },
  intent: {
    type: String
  },
  confidence: {
    type: Number
  },
  entities: {
    type: String // JSON string of extracted entities
  },
  feedback: {
    type: String,
    enum: ['positive', 'negative', null],
    default: null
  },
  isResolved: {
    type: Boolean,
    default: true
  },
  needsReview: {
    type: Boolean,
    default: false
  },
  sessionId: {
    type: String
  }
}, {
  timestamps: true
});

// Index for efficient queries
chatLogSchema.index({ user: 1, createdAt: -1 });
chatLogSchema.index({ needsReview: 1 });
chatLogSchema.index({ sessionId: 1 });

module.exports = mongoose.model('ChatLog', chatLogSchema);
