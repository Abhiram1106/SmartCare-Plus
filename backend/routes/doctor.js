const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Appointment = require('../models/Appointment');
const { auth, authorize } = require('../middleware/auth');

// @route   GET /api/doctors/specializations/list
// @desc    Get list of all specializations
// @access  Public
router.get('/specializations/list', async (req, res) => {
  try {
    const specializations = await User.distinct('specialization', { 
      role: 'doctor', 
      approved: true 
    });
    
    res.json(specializations.filter(s => s)); // Filter out null/undefined
  } catch (error) {
    console.error('Error fetching specializations:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   GET /api/doctors
// @desc    Get all approved doctors
// @access  Public
router.get('/', async (req, res) => {
  try {
    const { specialization, search } = req.query;
    let query = { role: 'doctor', approved: true };

    if (specialization) {
      query.specialization = specialization;
    }

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { specialization: { $regex: search, $options: 'i' } }
      ];
    }

    const doctors = await User.find(query)
      .select('-password')
      .sort({ name: 1 });

    // Calculate average rating for each doctor
    const doctorsWithRatings = await Promise.all(
      doctors.map(async (doctor) => {
        const appointments = await Appointment.find({ 
          doctor: doctor._id, 
          rating: { $exists: true } 
        });
        
        const avgRating = appointments.length > 0
          ? appointments.reduce((sum, app) => sum + app.rating, 0) / appointments.length
          : 0;

        return {
          ...doctor.toObject(),
          averageRating: avgRating.toFixed(1),
          totalReviews: appointments.length
        };
      })
    );

    res.json(doctorsWithRatings);
  } catch (error) {
    console.error('Error fetching doctors:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   GET /api/doctors/:id
// @desc    Get doctor by ID
// @access  Public
router.get('/:id', async (req, res) => {
  try {
    const doctor = await User.findById(req.params.id).select('-password');

    if (!doctor || doctor.role !== 'doctor') {
      return res.status(404).json({ message: 'Doctor not found' });
    }

    // Get appointments with ratings and feedback
    const appointments = await Appointment.find({ 
      doctor: doctor._id, 
      rating: { $exists: true } 
    }).populate('patient', 'name');

    const avgRating = appointments.length > 0
      ? appointments.reduce((sum, app) => sum + app.rating, 0) / appointments.length
      : 0;

    const reviews = appointments
      .filter(app => app.feedback)
      .map(app => ({
        rating: app.rating,
        feedback: app.feedback,
        patientName: app.patient.name,
        date: app.createdAt
      }));

    res.json({
      ...doctor.toObject(),
      averageRating: avgRating.toFixed(1),
      totalReviews: appointments.length,
      reviews
    });
  } catch (error) {
    console.error('Error fetching doctor:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   GET /api/doctors/:id/appointments
// @desc    Get doctor's appointments
// @access  Private (Doctor/Admin)
router.get('/:id/appointments', auth, async (req, res) => {
  try {
    // Check authorization
    if (req.user.role !== 'admin' && req.userId !== req.params.id) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const { status, date } = req.query;
    let query = { doctor: req.params.id };

    if (status) query.status = status;
    
    if (date) {
      const startDate = new Date(date);
      const endDate = new Date(date);
      endDate.setDate(endDate.getDate() + 1);
      query.appointmentDate = { $gte: startDate, $lt: endDate };
    }

    const appointments = await Appointment.find(query)
      .populate('patient', 'name email phone')
      .sort({ appointmentDate: 1 });

    res.json(appointments);
  } catch (error) {
    console.error('Error fetching doctor appointments:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   PUT /api/doctors/profile
// @desc    Update doctor profile
// @access  Private (Doctor)
router.put('/profile', auth, authorize('doctor'), async (req, res) => {
  try {
    const { specialization, experience, education, phone } = req.body;

    const doctor = await User.findById(req.userId);
    
    if (specialization) doctor.specialization = specialization;
    if (experience) doctor.experience = experience;
    if (education) doctor.education = education;
    if (phone) doctor.phone = phone;

    await doctor.save();

    res.json(doctor);
  } catch (error) {
    console.error('Error updating doctor profile:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;
