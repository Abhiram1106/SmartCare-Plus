const express = require('express');
const router = express.Router();
const Appointment = require('../models/Appointment');
const User = require('../models/User');
const { auth, authorize } = require('../middleware/auth');

// @route   GET /api/appointments/doctor/:doctorId/availability
// @desc    Get doctor's available slots
// @access  Public
router.get('/doctor/:doctorId/availability', async (req, res) => {
  try {
    const { date } = req.query;
    
    if (!date) {
      return res.status(400).json({ message: 'Date is required' });
    }

    const doctor = await User.findById(req.params.doctorId);
    if (!doctor || doctor.role !== 'doctor') {
      return res.status(404).json({ message: 'Doctor not found' });
    }

    const allSlots = ['09:00-10:00', '10:00-11:00', '11:00-12:00', '14:00-15:00', '15:00-16:00', '16:00-17:00'];
    
    const bookedAppointments = await Appointment.find({
      doctor: req.params.doctorId,
      appointmentDate: new Date(date),
      status: { $nin: ['cancelled'] }
    }).select('timeSlot');

    const bookedSlots = bookedAppointments.map(app => app.timeSlot);
    const availableSlots = allSlots.filter(slot => !bookedSlots.includes(slot));

    res.json({ 
      date,
      availableSlots,
      bookedSlots
    });
  } catch (error) {
    console.error('Error fetching availability:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   POST /api/appointments
// @desc    Create new appointment
// @access  Private (Patient)
router.post('/', auth, authorize('patient'), async (req, res) => {
  try {
    const { doctorId, appointmentDate, timeSlot, symptoms, patientHistory } = req.body;

    // Validate doctor exists and is approved
    const doctor = await User.findById(doctorId);
    if (!doctor || doctor.role !== 'doctor' || !doctor.approved) {
      return res.status(400).json({ message: 'Invalid or unapproved doctor' });
    }

    // Check if slot is already booked
    const existingAppointment = await Appointment.findOne({
      doctor: doctorId,
      appointmentDate: new Date(appointmentDate),
      timeSlot,
      status: { $nin: ['cancelled'] }
    });

    if (existingAppointment) {
      return res.status(400).json({ message: 'This time slot is already booked' });
    }

    const appointment = new Appointment({
      patient: req.userId,
      doctor: doctorId,
      appointmentDate: new Date(appointmentDate),
      timeSlot,
      symptoms,
      patientHistory,
      status: 'pending', // Start with pending status for doctor approval
      amount: doctor.consultationFee,
      doctorResponse: {
        status: 'pending'
      }
    });

    await appointment.save();
    await appointment.populate('doctor', 'name email specialization consultationFee experience education');
    await appointment.populate('patient', 'name email');

    res.status(201).json(appointment);
  } catch (error) {
    console.error('Error creating appointment:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   GET /api/appointments
// @desc    Get appointments (filtered by role)
// @access  Private
router.get('/', auth, async (req, res) => {
  try {
    const { status, date } = req.query;
    let query = {};

    if (req.user.role === 'patient') {
      query.patient = req.userId;
    } else if (req.user.role === 'doctor') {
      query.doctor = req.userId;
    }

    if (status) {
      query.status = status;
    }

    if (date) {
      const startDate = new Date(date);
      const endDate = new Date(date);
      endDate.setDate(endDate.getDate() + 1);
      query.appointmentDate = { $gte: startDate, $lt: endDate };
    }

    const appointments = await Appointment.find(query)
      .populate('patient', 'name email phone')
      .populate('doctor', 'name email specialization phone consultationFee experience education')
      .sort({ appointmentDate: -1 });

    res.json(appointments);
  } catch (error) {
    console.error('Error fetching appointments:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   GET /api/appointments/:id
// @desc    Get single appointment
// @access  Private
router.get('/:id', auth, async (req, res) => {
  try {
    const appointment = await Appointment.findById(req.params.id)
      .populate('patient', 'name email phone')
      .populate('doctor', 'name email specialization phone consultationFee experience education')
      .populate('payment');

    if (!appointment) {
      return res.status(404).json({ message: 'Appointment not found' });
    }

    // Check authorization
    if (
      req.user.role !== 'admin' &&
      appointment.patient._id.toString() !== req.userId &&
      appointment.doctor._id.toString() !== req.userId
    ) {
      return res.status(403).json({ message: 'Access denied' });
    }

    res.json(appointment);
  } catch (error) {
    console.error('Error fetching appointment:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   PUT /api/appointments/:id
// @desc    Update appointment
// @access  Private
router.put('/:id', auth, async (req, res) => {
  try {
    const appointment = await Appointment.findById(req.params.id);

    if (!appointment) {
      return res.status(404).json({ message: 'Appointment not found' });
    }

    // Authorization check
    const isPatient = appointment.patient.toString() === req.userId;
    const isDoctor = appointment.doctor.toString() === req.userId;
    const isAdmin = req.user.role === 'admin';

    if (!isPatient && !isDoctor && !isAdmin) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const { status, diagnosis, prescription, notes, rating, feedback } = req.body;

    // Patients can only cancel or rate
    if (isPatient && !isAdmin) {
      if (status === 'cancelled') {
        appointment.status = status;
      }
      if (rating) appointment.rating = rating;
      if (feedback) appointment.feedback = feedback;
    }

    // Doctors can update medical info and status
    if (isDoctor || isAdmin) {
      if (status) appointment.status = status;
      if (diagnosis) appointment.diagnosis = diagnosis;
      if (prescription) appointment.prescription = prescription;
      if (notes) appointment.notes = notes;
    }

    await appointment.save();
    await appointment.populate('patient', 'name email phone');
    await appointment.populate('doctor', 'name email specialization phone');

    res.json(appointment);
  } catch (error) {
    console.error('Error updating appointment:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   PUT /api/appointments/:id/approve
// @desc    Doctor approve/reject appointment
// @access  Private (Doctor only)
router.put('/:id/approve', auth, authorize('doctor'), async (req, res) => {
  try {
    const { status, message } = req.body; // status: 'approved' or 'rejected'
    
    if (!['approved', 'rejected'].includes(status)) {
      return res.status(400).json({ message: 'Status must be approved or rejected' });
    }

    const appointment = await Appointment.findById(req.params.id);
    
    if (!appointment) {
      return res.status(404).json({ message: 'Appointment not found' });
    }

    // Verify doctor owns this appointment
    if (appointment.doctor.toString() !== req.userId) {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Update appointment
    appointment.status = status;
    appointment.doctorResponse = {
      status,
      message: message || '',
      respondedAt: new Date()
    };

    await appointment.save();
    await appointment.populate('patient', 'name email phone');
    await appointment.populate('doctor', 'name email specialization');

    res.json({ 
      message: `Appointment ${status} successfully`,
      appointment 
    });
  } catch (error) {
    console.error('Error approving appointment:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   PUT /api/appointments/:id/complete
// @desc    Mark appointment as completed and add prescription
// @access  Private (Doctor only)
router.put('/:id/complete', auth, authorize('doctor'), async (req, res) => {
  try {
    const { diagnosis, notes, prescriptionData } = req.body;

    const appointment = await Appointment.findById(req.params.id);
    
    if (!appointment) {
      return res.status(404).json({ message: 'Appointment not found' });
    }

    // Verify doctor owns this appointment
    if (appointment.doctor.toString() !== req.userId) {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Must be paid before completing
    if (appointment.paymentStatus !== 'paid') {
      return res.status(400).json({ message: 'Payment must be completed before marking as completed' });
    }

    // Create prescription if provided
    let prescription = null;
    if (prescriptionData) {
      const Prescription = require('../models/Prescription');
      prescription = new Prescription({
        appointment: appointment._id,
        patient: appointment.patient,
        doctor: appointment.doctor,
        ...prescriptionData,
        doctorSignature: {
          signed: true,
          signedAt: new Date()
        }
      });
      await prescription.save();
    }

    // Update appointment
    appointment.status = 'completed';
    appointment.diagnosis = diagnosis || '';
    appointment.notes = notes || '';
    if (prescription) {
      appointment.prescription = prescription._id;
    }

    await appointment.save();
    await appointment.populate('patient', 'name email phone');
    await appointment.populate('doctor', 'name email specialization');
    await appointment.populate('prescription');

    res.json({ 
      message: 'Appointment completed successfully',
      status: appointment.status,
      appointment,
      prescription 
    });
  } catch (error) {
    console.error('Error completing appointment:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   GET /api/appointments/:id/prescription
// @desc    Get prescription for appointment
// @access  Private (Patient/Doctor)
router.get('/:id/prescription', auth, async (req, res) => {
  try {
    const appointment = await Appointment.findById(req.params.id)
      .populate('prescription')
      .populate('patient', 'name email phone')
      .populate('doctor', 'name email specialization');
    
    if (!appointment) {
      return res.status(404).json({ message: 'Appointment not found' });
    }

    // Check access - patient or doctor involved in appointment
    const isPatient = req.user.role === 'patient' && appointment.patient._id.toString() === req.userId;
    const isDoctor = req.user.role === 'doctor' && appointment.doctor._id.toString() === req.userId;
    const isAdmin = req.user.role === 'admin';

    if (!isPatient && !isDoctor && !isAdmin) {
      return res.status(403).json({ message: 'Access denied' });
    }

    if (!appointment.prescription) {
      return res.status(404).json({ message: 'No prescription found for this appointment' });
    }

    res.json({
      appointment,
      prescription: appointment.prescription
    });
  } catch (error) {
    console.error('Error fetching prescription:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   DELETE /api/appointments/:id
// @desc    Delete appointment
// @access  Private (Admin only)
router.delete('/:id', auth, authorize('admin'), async (req, res) => {
  try {
    const appointment = await Appointment.findByIdAndDelete(req.params.id);

    if (!appointment) {
      return res.status(404).json({ message: 'Appointment not found' });
    }

    res.json({ message: 'Appointment deleted successfully' });
  } catch (error) {
    console.error('Error deleting appointment:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;
