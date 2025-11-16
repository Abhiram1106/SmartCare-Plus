const express = require('express');
const router = express.Router();
const VideoConsultation = require('../models/VideoConsultation');
const Appointment = require('../models/Appointment');
const { auth, authorize } = require('../middleware/auth');

// @route   POST /api/telemedicine/create
// @desc    Create video consultation room for appointment
// @access  Private (Doctor or Patient)
router.post('/create', auth, async (req, res) => {
  try {
    const { appointmentId, scheduledTime, recordingConsent } = req.body;

    if (!appointmentId || !scheduledTime) {
      return res.status(400).json({ message: 'Appointment ID and scheduled time are required' });
    }

    // Verify appointment exists and user is part of it
    const appointment = await Appointment.findById(appointmentId);
    if (!appointment) {
      return res.status(404).json({ message: 'Appointment not found' });
    }

    if (appointment.patient.toString() !== req.user.id && appointment.doctor.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized for this appointment' });
    }

    // Check if consultation already exists
    const existing = await VideoConsultation.findOne({ appointment: appointmentId });
    if (existing) {
      return res.status(400).json({ message: 'Video consultation already exists for this appointment', data: existing });
    }

    // Generate unique room ID
    const roomId = VideoConsultation.generateRoomId();

    const consultation = await VideoConsultation.create({
      appointment: appointmentId,
      patient: appointment.patient,
      doctor: appointment.doctor,
      roomId,
      scheduledTime,
      recordingConsent: recordingConsent || { patient: false, doctor: false }
    });

    await consultation.populate(['patient', 'doctor'], 'name email');

    res.status(201).json({
      success: true,
      message: 'Video consultation room created',
      data: consultation
    });
  } catch (error) {
    console.error('Error creating consultation:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   GET /api/telemedicine/room/:roomId
// @desc    Get consultation room details
// @access  Private
router.get('/room/:roomId', auth, async (req, res) => {
  try {
    const { roomId } = req.params;

    const consultation = await VideoConsultation.findOne({ roomId })
      .populate('patient', 'name email phone')
      .populate('doctor', 'name email specialty')
      .populate('appointment');

    if (!consultation) {
      return res.status(404).json({ message: 'Consultation room not found' });
    }

    // Authorization check
    if (consultation.patient._id.toString() !== req.user.id && 
        consultation.doctor._id.toString() !== req.user.id &&
        req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to access this room' });
    }

    res.json({
      success: true,
      data: consultation
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   POST /api/telemedicine/room/:roomId/join
// @desc    Join consultation room
// @access  Private
router.post('/room/:roomId/join', auth, async (req, res) => {
  try {
    const { roomId } = req.params;

    const consultation = await VideoConsultation.findOne({ roomId });
    if (!consultation) {
      return res.status(404).json({ message: 'Consultation room not found' });
    }

    // Check authorization
    if (consultation.patient.toString() !== req.user.id && 
        consultation.doctor.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized to join this room' });
    }

    // Update status to ongoing if first person joins
    if (consultation.status === 'scheduled' || consultation.status === 'waiting') {
      consultation.status = 'ongoing';
      if (!consultation.startTime) {
        consultation.startTime = new Date();
      }
    }

    // Add participant
    consultation.participants.push({
      userId: req.user.id,
      joinedAt: new Date(),
      connectionQuality: 'good'
    });

    await consultation.save();

    res.json({
      success: true,
      message: 'Joined consultation room',
      data: {
        roomId: consultation.roomId,
        status: consultation.status,
        participants: consultation.participants.length
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   POST /api/telemedicine/room/:roomId/leave
// @desc    Leave consultation room
// @access  Private
router.post('/room/:roomId/leave', auth, async (req, res) => {
  try {
    const { roomId } = req.params;

    const consultation = await VideoConsultation.findOne({ roomId });
    if (!consultation) {
      return res.status(404).json({ message: 'Consultation room not found' });
    }

    // Update participant left time
    const participant = consultation.participants.find(p => 
      p.userId.toString() === req.user.id && !p.leftAt
    );
    if (participant) {
      participant.leftAt = new Date();
    }

    // Check if all participants have left
    const activeParticipants = consultation.participants.filter(p => !p.leftAt);
    if (activeParticipants.length === 0 && consultation.status === 'ongoing') {
      consultation.status = 'completed';
      consultation.endTime = new Date();
      consultation.calculateDuration();
    }

    await consultation.save();

    res.json({
      success: true,
      message: 'Left consultation room',
      data: {
        status: consultation.status,
        duration: consultation.duration
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   POST /api/telemedicine/room/:roomId/message
// @desc    Send message in consultation chat
// @access  Private
router.post('/room/:roomId/message', auth, async (req, res) => {
  try {
    const { roomId } = req.params;
    const { message, type, fileUrl } = req.body;

    if (!message && !fileUrl) {
      return res.status(400).json({ message: 'Message or file is required' });
    }

    const consultation = await VideoConsultation.findOne({ roomId });
    if (!consultation) {
      return res.status(404).json({ message: 'Consultation room not found' });
    }

    consultation.chatMessages.push({
      sender: req.user.id,
      message,
      type: type || 'text',
      fileUrl
    });

    await consultation.save();

    res.json({
      success: true,
      message: 'Message sent',
      data: consultation.chatMessages[consultation.chatMessages.length - 1]
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   PUT /api/telemedicine/room/:roomId/notes
// @desc    Add consultation notes (Doctor only)
// @access  Private (Doctor)
router.put('/room/:roomId/notes', auth, authorize('doctor', 'admin'), async (req, res) => {
  try {
    const { roomId } = req.params;
    const { chiefComplaint, symptoms, diagnosis, treatment, followUp, prescriptionId } = req.body;

    const consultation = await VideoConsultation.findOne({ roomId });
    if (!consultation) {
      return res.status(404).json({ message: 'Consultation room not found' });
    }

    if (consultation.doctor.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Only the assigned doctor can add notes' });
    }

    consultation.consultationNotes = {
      chiefComplaint,
      symptoms: symptoms || [],
      diagnosis,
      treatment,
      followUp,
      prescriptionId
    };

    await consultation.save();

    res.json({
      success: true,
      message: 'Consultation notes added',
      data: consultation.consultationNotes
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   POST /api/telemedicine/room/:roomId/report-issue
// @desc    Report technical issue during consultation
// @access  Private
router.post('/room/:roomId/report-issue', auth, async (req, res) => {
  try {
    const { roomId } = req.params;
    const { issue } = req.body;

    if (!issue) {
      return res.status(400).json({ message: 'Please describe the issue' });
    }

    const consultation = await VideoConsultation.findOne({ roomId });
    if (!consultation) {
      return res.status(404).json({ message: 'Consultation room not found' });
    }

    consultation.technicalIssues.push({
      reportedBy: req.user.id,
      issue,
      timestamp: new Date()
    });

    await consultation.save();

    res.json({
      success: true,
      message: 'Issue reported'
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   POST /api/telemedicine/room/:roomId/rate
// @desc    Rate consultation session
// @access  Private
router.post('/room/:roomId/rate', auth, async (req, res) => {
  try {
    const { roomId } = req.params;
    const { score, feedback } = req.body;

    if (!score || score < 1 || score > 5) {
      return res.status(400).json({ message: 'Rating score must be between 1 and 5' });
    }

    const consultation = await VideoConsultation.findOne({ roomId });
    if (!consultation) {
      return res.status(404).json({ message: 'Consultation not found' });
    }

    if (consultation.status !== 'completed') {
      return res.status(400).json({ message: 'Can only rate completed consultations' });
    }

    // Determine if patient or doctor is rating
    if (consultation.patient.toString() === req.user.id) {
      consultation.rating.patientRating = { score, feedback };
    } else if (consultation.doctor.toString() === req.user.id) {
      consultation.rating.doctorRating = { score, feedback };
    } else {
      return res.status(403).json({ message: 'Not authorized to rate this consultation' });
    }

    await consultation.save();

    res.json({
      success: true,
      message: 'Rating submitted',
      data: consultation.rating
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   GET /api/telemedicine/my-consultations
// @desc    Get user's consultations
// @access  Private
router.get('/my-consultations', auth, async (req, res) => {
  try {
    const query = req.user.role === 'doctor' 
      ? { doctor: req.user.id }
      : { patient: req.user.id };

    const consultations = await VideoConsultation.find(query)
      .populate('patient', 'name email')
      .populate('doctor', 'name specialty')
      .populate('appointment')
      .sort({ scheduledTime: -1 });

    res.json({
      success: true,
      count: consultations.length,
      data: consultations
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;
