const mongoose = require('mongoose');

const videoConsultationSchema = new mongoose.Schema({
  appointment: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Appointment',
    required: true
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
  roomId: {
    type: String,
    required: true,
    unique: true
  },
  status: {
    type: String,
    enum: ['scheduled', 'waiting', 'ongoing', 'completed', 'cancelled', 'no-show'],
    default: 'scheduled'
  },
  scheduledTime: {
    type: Date,
    required: true
  },
  startTime: {
    type: Date
  },
  endTime: {
    type: Date
  },
  duration: {
    type: Number // in minutes
  },
  participants: [{
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    joinedAt: Date,
    leftAt: Date,
    connectionQuality: String
  }],
  recordingUrl: {
    type: String
  },
  isRecorded: {
    type: Boolean,
    default: false
  },
  recordingConsent: {
    patient: { type: Boolean, default: false },
    doctor: { type: Boolean, default: false }
  },
  chatMessages: [{
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    message: String,
    timestamp: {
      type: Date,
      default: Date.now
    },
    type: {
      type: String,
      enum: ['text', 'file', 'prescription'],
      default: 'text'
    },
    fileUrl: String
  }],
  consultationNotes: {
    chiefComplaint: String,
    symptoms: [String],
    diagnosis: String,
    treatment: String,
    followUp: String,
    prescriptionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Prescription'
    }
  },
  technicalIssues: [{
    reportedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    issue: String,
    timestamp: Date
  }],
  rating: {
    patientRating: {
      score: Number,
      feedback: String
    },
    doctorRating: {
      score: Number,
      feedback: String
    }
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Generate unique room ID
videoConsultationSchema.statics.generateRoomId = function() {
  return `room_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

// Calculate duration when session ends
videoConsultationSchema.methods.calculateDuration = function() {
  if (this.startTime && this.endTime) {
    const diff = this.endTime - this.startTime;
    this.duration = Math.round(diff / 1000 / 60); // Convert to minutes
  }
};

module.exports = mongoose.model('VideoConsultation', videoConsultationSchema);
