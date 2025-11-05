const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Appointment = require('../models/Appointment');
const { auth, authorize } = require('../middleware/auth');

// @route   GET /api/doctors/filters/options
// @desc    Get all available filter options
// @access  Public
router.get('/filters/options', async (req, res) => {
  try {
    const specializations = await User.distinct('specialization', { 
      role: 'doctor', 
      approved: true 
    });
    
    const feeRange = await User.aggregate([
      { $match: { role: 'doctor', approved: true } },
      { 
        $group: {
          _id: null,
          minFee: { $min: '$consultationFee' },
          maxFee: { $max: '$consultationFee' }
        }
      }
    ]);

    const experienceRange = await User.aggregate([
      { $match: { role: 'doctor', approved: true } },
      { 
        $group: {
          _id: null,
          minExperience: { $min: '$experience' },
          maxExperience: { $max: '$experience' }
        }
      }
    ]);

    const languages = ['English', 'Hindi', 'Tamil', 'Telugu', 'Kannada', 'Malayalam', 'Bengali', 'Marathi', 'Gujarati'];
    
    res.json({
      specializations: specializations.filter(s => s),
      feeRange: feeRange[0] || { minFee: 0, maxFee: 2000 },
      experienceRange: experienceRange[0] || { minExperience: 0, maxExperience: 30 },
      languages,
      genders: ['male', 'female'],
      sortOptions: [
        { value: 'name', label: 'Name (A-Z)' },
        { value: 'rating', label: 'Highest Rated' },
        { value: 'experience', label: 'Most Experienced' },
        { value: 'fee', label: 'Lowest Fee' }
      ]
    });
  } catch (error) {
    console.error('Error fetching filter options:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

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
// @desc    Get all approved doctors with advanced filtering
// @access  Public
router.get('/', async (req, res) => {
  try {
    const { 
      specialization, 
      search, 
      minFee, 
      maxFee, 
      minExperience, 
      maxExperience,
      minRating,
      gender,
      sortBy,
      sortOrder,
      page = 1,
      limit = 12
    } = req.query;
    
    let query = { role: 'doctor', approved: true };

    // Specialization filter
    if (specialization) {
      query.specialization = specialization;
    }

    // Search filter (name, specialization, education)
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { specialization: { $regex: search, $options: 'i' } },
        { education: { $regex: search, $options: 'i' } }
      ];
    }

    // Fee range filter
    if (minFee || maxFee) {
      query.consultationFee = {};
      if (minFee) query.consultationFee.$gte = parseInt(minFee);
      if (maxFee) query.consultationFee.$lte = parseInt(maxFee);
    }

    // Experience range filter
    if (minExperience || maxExperience) {
      query.experience = {};
      if (minExperience) query.experience.$gte = parseInt(minExperience);
      if (maxExperience) query.experience.$lte = parseInt(maxExperience);
    }

    // Gender filter
    if (gender) {
      query.gender = gender;
    }

    // Build sort object
    let sort = {};
    if (sortBy) {
      const order = sortOrder === 'desc' ? -1 : 1;
      switch (sortBy) {
        case 'name':
          sort.name = order;
          break;
        case 'experience':
          sort.experience = order;
          break;
        case 'fee':
          sort.consultationFee = order;
          break;
        default:
          sort.name = 1;
      }
    } else {
      sort.name = 1;
    }

    // Pagination
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    const doctors = await User.find(query)
      .select('-password')
      .sort(sort)
      .skip(skip)
      .limit(limitNum);

    // Calculate average rating for each doctor and apply rating filter
    let doctorsWithRatings = await Promise.all(
      doctors.map(async (doctor) => {
        const appointments = await Appointment.find({ 
          doctor: doctor._id, 
          rating: { $exists: true } 
        });
        
        const avgRating = appointments.length > 0
          ? appointments.reduce((sum, app) => sum + app.rating, 0) / appointments.length
          : 0;

        // Get upcoming availability (next 7 days)
        const today = new Date();
        const nextWeek = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
        const upcomingAppointments = await Appointment.find({
          doctor: doctor._id,
          appointmentDate: { $gte: today, $lte: nextWeek }
        });

        return {
          ...doctor.toObject(),
          averageRating: parseFloat(avgRating.toFixed(1)),
          totalReviews: appointments.length,
          upcomingSlots: 21 - upcomingAppointments.length, // Assume 3 slots per day for 7 days
          isAvailableToday: upcomingAppointments.filter(apt => 
            apt.appointmentDate.toDateString() === today.toDateString()
          ).length < 3
        };
      })
    );

    // Apply rating filter after calculating ratings
    if (minRating) {
      const minRatingNum = parseFloat(minRating);
      doctorsWithRatings = doctorsWithRatings.filter(doctor => 
        doctor.averageRating >= minRatingNum
      );
    }

    // Apply rating sort if specified
    if (sortBy === 'rating') {
      const order = sortOrder === 'desc' ? -1 : 1;
      doctorsWithRatings.sort((a, b) => {
        if (order === 1) {
          return a.averageRating - b.averageRating;
        } else {
          return b.averageRating - a.averageRating;
        }
      });
    }

    // Get total count for pagination
    const totalDoctors = await User.countDocuments(query);
    
    res.json({
      doctors: doctorsWithRatings,
      pagination: {
        currentPage: pageNum,
        totalPages: Math.ceil(totalDoctors / limitNum),
        totalDoctors,
        hasNext: pageNum < Math.ceil(totalDoctors / limitNum),
        hasPrev: pageNum > 1
      }
    });
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
