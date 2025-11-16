const express = require('express');
const router = express.Router();
const Prescription = require('../models/Prescription');
const Appointment = require('../models/Appointment');
const { auth, authorize } = require('../middleware/auth');

// @route   GET /api/prescriptions/patient
// @desc    Get all prescriptions for patient
// @access  Private (Patient only)
router.get('/patient', auth, authorize('patient'), async (req, res) => {
  try {
    const { page = 1, limit = 10, status } = req.query;
    
    const filter = { patient: req.userId };
    if (status) filter.status = status;

    const prescriptions = await Prescription.find(filter)
      .populate('doctor', 'name email specialization')
      .populate('appointment', 'appointmentDate symptoms')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Prescription.countDocuments(filter);

    res.json({
      prescriptions,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (error) {
    console.error('Error fetching patient prescriptions:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   GET /api/prescriptions/doctor
// @desc    Get all prescriptions issued by doctor
// @access  Private (Doctor only)
router.get('/doctor', auth, authorize('doctor'), async (req, res) => {
  try {
    const { page = 1, limit = 10, status } = req.query;
    
    const filter = { doctor: req.userId };
    if (status) filter.status = status;

    const prescriptions = await Prescription.find(filter)
      .populate('patient', 'name email phone age')
      .populate('appointment', 'appointmentDate symptoms')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Prescription.countDocuments(filter);

    res.json({
      prescriptions,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (error) {
    console.error('Error fetching doctor prescriptions:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   GET /api/prescriptions/:id
// @desc    Get prescription by ID
// @access  Private (Patient/Doctor/Admin)
router.get('/:id', auth, async (req, res) => {
  try {
    const prescription = await Prescription.findById(req.params.id)
      .populate('patient', 'name email phone age gender')
      .populate('doctor', 'name email specialization experience education')
      .populate('appointment', 'appointmentDate symptoms');

    if (!prescription) {
      return res.status(404).json({ message: 'Prescription not found' });
    }

    // Check access
    const isPatient = req.user.role === 'patient' && prescription.patient._id.toString() === req.userId;
    const isDoctor = req.user.role === 'doctor' && prescription.doctor._id.toString() === req.userId;
    const isAdmin = req.user.role === 'admin';

    if (!isPatient && !isDoctor && !isAdmin) {
      return res.status(403).json({ message: 'Access denied' });
    }

    res.json(prescription);
  } catch (error) {
    console.error('Error fetching prescription:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   POST /api/prescriptions
// @desc    Create new prescription
// @access  Private (Doctor only)
router.post('/', auth, authorize('doctor'), async (req, res) => {
  try {
    const { appointmentId, diagnosis, medications, generalInstructions, followUp, testsRecommended, lifestyleRecommendations } = req.body;

    // Verify appointment exists and belongs to doctor
    const appointment = await Appointment.findById(appointmentId);
    if (!appointment) {
      return res.status(404).json({ message: 'Appointment not found' });
    }

    if (appointment.doctor.toString() !== req.userId) {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Check if prescription already exists
    const existingPrescription = await Prescription.findOne({ appointment: appointmentId });
    if (existingPrescription) {
      return res.status(400).json({ message: 'Prescription already exists for this appointment' });
    }

    const prescription = new Prescription({
      appointment: appointmentId,
      patient: appointment.patient,
      doctor: req.userId,
      diagnosis,
      medications: medications || [],
      generalInstructions,
      followUp,
      testsRecommended: testsRecommended || [],
      lifestyleRecommendations,
      doctorSignature: {
        signed: true,
        signedAt: new Date(),
        digitalSignature: `DR_${req.userId}_${Date.now()}` // Simple digital signature simulation
      }
    });

    await prescription.save();
    await prescription.populate('patient', 'name email');
    await prescription.populate('doctor', 'name specialization');

    // Update appointment with prescription reference
    appointment.prescription = prescription._id;
    await appointment.save();

    res.status(201).json({
      message: 'Prescription created successfully',
      prescription
    });
  } catch (error) {
    console.error('Error creating prescription:', error);
    
    // Handle validation errors
    if (error.name === 'ValidationError') {
      const validationErrors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({ 
        message: 'Validation failed', 
        errors: validationErrors 
      });
    }
    
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   PUT /api/prescriptions/:id
// @desc    Update prescription
// @access  Private (Doctor only)
router.put('/:id', auth, authorize('doctor'), async (req, res) => {
  try {
    const prescription = await Prescription.findById(req.params.id);

    if (!prescription) {
      return res.status(404).json({ message: 'Prescription not found' });
    }

    // Verify doctor owns this prescription
    if (prescription.doctor.toString() !== req.userId) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const { diagnosis, medications, generalInstructions, followUp, testsRecommended, lifestyleRecommendations, status } = req.body;

    if (diagnosis) prescription.diagnosis = diagnosis;
    if (medications) prescription.medications = medications;
    if (generalInstructions) prescription.generalInstructions = generalInstructions;
    if (followUp) prescription.followUp = followUp;
    if (testsRecommended) prescription.testsRecommended = testsRecommended;
    if (lifestyleRecommendations) prescription.lifestyleRecommendations = lifestyleRecommendations;
    if (status) prescription.status = status;

    await prescription.save();
    await prescription.populate('patient', 'name email');
    await prescription.populate('doctor', 'name specialization');

    res.json({
      message: 'Prescription updated successfully',
      prescription
    });
  } catch (error) {
    console.error('Error updating prescription:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   GET /api/prescriptions/:id/download
// @desc    Download prescription as PDF
// @access  Private (Patient/Doctor)
router.get('/:id/download', auth, async (req, res) => {
  try {
    const prescription = await Prescription.findById(req.params.id)
      .populate('patient', 'name email phone age gender address')
      .populate('doctor', 'name email specialization experience education phone')
      .populate('appointment', 'appointmentDate symptoms');

    if (!prescription) {
      return res.status(404).json({ message: 'Prescription not found' });
    }

    // Check access
    const isPatient = req.user.role === 'patient' && prescription.patient._id.toString() === req.userId;
    const isDoctor = req.user.role === 'doctor' && prescription.doctor._id.toString() === req.userId;
    const isAdmin = req.user.role === 'admin';

    if (!isPatient && !isDoctor && !isAdmin) {
      return res.status(403).json({ message: 'Access denied' });
    }

    // For now, return prescription data. 
    // TODO: Implement PDF generation using libraries like puppeteer or pdfkit
    res.json({
      message: 'Prescription download ready',
      prescription,
      downloadUrl: `/api/prescriptions/${prescription._id}/pdf` // Future PDF endpoint
    });
  } catch (error) {
    console.error('Error downloading prescription:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   DELETE /api/prescriptions/:id
// @desc    Delete prescription
// @access  Private (Doctor only)
router.delete('/:id', auth, authorize('doctor'), async (req, res) => {
  try {
    const prescription = await Prescription.findById(req.params.id);
    
    if (!prescription) {
      return res.status(404).json({ message: 'Prescription not found' });
    }

    // Verify doctor owns this prescription
    if (prescription.doctor.toString() !== req.userId) {
      return res.status(403).json({ message: 'Access denied' });
    }

    await prescription.deleteOne();
    res.json({ message: 'Prescription deleted successfully' });
  } catch (error) {
    console.error('Error downloading prescription:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   DELETE /api/prescriptions/:id
// @desc    Delete prescription
// @access  Private (Doctor only - who created it)
router.delete('/:id', auth, authorize('doctor'), async (req, res) => {
  try {
    const prescription = await Prescription.findById(req.params.id);
    
    if (!prescription) {
      return res.status(404).json({ message: 'Prescription not found' });
    }

    // Verify doctor owns this prescription
    if (prescription.doctor.toString() !== req.userId) {
      return res.status(403).json({ message: 'Access denied' });
    }

    await prescription.deleteOne();
    res.json({ message: 'Prescription deleted successfully' });
  } catch (error) {
    console.error('Error deleting prescription:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;