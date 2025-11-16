const express = require('express');
const router = express.Router();
const Review = require('../models/Review');
const Appointment = require('../models/Appointment');
const User = require('../models/User');
const { auth, authorize } = require('../middleware/auth');

// @route   POST /api/reviews
// @desc    Create a new review
// @access  Private (Patient only)
router.post('/', auth, async (req, res) => {
  try {
    const { doctor, doctorId, appointment, appointmentId, rating, title, comment, detailedRatings } = req.body;
    
    // Accept both 'doctor' and 'doctorId' for flexibility
    const targetDoctorId = doctor || doctorId;
    const targetAppointmentId = appointment || appointmentId;
    
    // Validate user is a patient
    if (req.user.role !== 'patient') {
      return res.status(403).json({ message: 'Only patients can submit reviews' });
    }
    
    // Validate required fields
    if (!targetDoctorId || !rating || !title || !comment) {
      return res.status(400).json({ message: 'Doctor, rating, title, and comment are required' });
    }
    
    // Validate rating
    if (rating < 1 || rating > 5 || !Number.isInteger(rating)) {
      return res.status(400).json({ message: 'Rating must be an integer between 1 and 5' });
    }
    
    // Check if doctor exists
    const doctorUser = await User.findOne({ _id: targetDoctorId, role: 'doctor' });
    if (!doctorUser) {
      return res.status(404).json({ message: 'Doctor not found' });
    }
    
    // Check if review already exists
    const existingReview = await Review.findOne({
      patient: req.userId,
      doctor: targetDoctorId
    });
    
    if (existingReview) {
      return res.status(400).json({ 
        message: 'You have already reviewed this doctor. You can edit your existing review.' 
      });
    }
    
    // Verify appointment if provided
    let verified = false;
    if (targetAppointmentId) {
      const appointment = await Appointment.findOne({
        _id: targetAppointmentId,
        patient: req.userId,
        doctor: targetDoctorId,
        status: 'completed'
      });
      
      if (appointment) {
        verified = true;
      }
    }
    
    // Create review
    const review = new Review({
      patient: req.userId,
      doctor: targetDoctorId,
      appointment: targetAppointmentId,
      rating,
      title,
      comment,
      detailedRatings,
      verified,
      status: 'approved' // Auto-approve, can be changed to 'pending' for moderation
    });
    
    await review.save();
    
    // Populate patient info
    await review.populate('patient', 'name email');
    await review.populate('doctor');
    
    res.status(201).json(review);
    
  } catch (error) {
    console.error('Create review error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   GET /api/reviews/doctor/:doctorId
// @desc    Get all reviews for a doctor
// @access  Public
router.get('/doctor/:doctorId', async (req, res) => {
  try {
    const { doctorId } = req.params;
    const { 
      page = 1, 
      limit = 10, 
      sort = '-createdAt',
      minRating,
      verified
    } = req.query;
    
    // Build filter
    const filter = {
      doctor: doctorId,
      status: 'approved'
    };
    
    if (minRating) {
      filter.rating = { $gte: parseInt(minRating) };
    }
    
    if (verified === 'true') {
      filter.verified = true;
    }
    
    // Parse sort
    let sortOption = {};
    if (sort === 'helpful') {
      sortOption = { helpfulVotes: -1, createdAt: -1 };
    } else if (sort === 'rating-high') {
      sortOption = { rating: -1, createdAt: -1 };
    } else if (sort === 'rating-low') {
      sortOption = { rating: 1, createdAt: -1 };
    } else {
      sortOption = { createdAt: -1 };
    }
    
    const reviews = await Review.find(filter)
      .populate('patient', 'name email')
      .sort(sortOption)
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit));
    
    const total = await Review.countDocuments(filter);
    
    // Get rating statistics
    const stats = await Review.calculateDoctorRating(doctorId);
    
    res.json({
      reviews,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / parseInt(limit)),
        totalReviews: total,
        hasMore: parseInt(page) * parseInt(limit) < total
      },
      stats
    });
    
  } catch (error) {
    console.error('Get doctor reviews error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   GET /api/reviews/my-reviews
// @desc    Get current user's reviews
// @access  Private (Patient only)
router.get('/my-reviews', auth, async (req, res) => {
  try {
    if (req.user.role !== 'patient') {
      return res.status(403).json({ message: 'Only patients can view their reviews' });
    }
    
    const reviews = await Review.find({ patient: req.user.id })
      .populate('doctor')
      .sort({ createdAt: -1 });
    
    res.json({ reviews });
    
  } catch (error) {
    console.error('Get my reviews error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   PUT /api/reviews/:reviewId
// @desc    Update a review
// @access  Private (Patient - own review only)
router.put('/:reviewId', auth, async (req, res) => {
  try {
    const { reviewId } = req.params;
    const { rating, title, comment, detailedRatings } = req.body;
    
    const review = await Review.findById(reviewId);
    
    if (!review) {
      return res.status(404).json({ message: 'Review not found' });
    }
    
    // Check ownership
    if (review.patient.toString() !== req.user.id) {
      return res.status(403).json({ message: 'You can only edit your own reviews' });
    }
    
    // Update fields
    if (rating) {
      if (rating < 1 || rating > 5 || !Number.isInteger(rating)) {
        return res.status(400).json({ message: 'Rating must be an integer between 1 and 5' });
      }
      review.rating = rating;
    }
    
    if (title) review.title = title;
    if (comment) review.comment = comment;
    if (detailedRatings) review.detailedRatings = detailedRatings;
    
    review.isEdited = true;
    review.editedAt = new Date();
    review.status = 'approved'; // Can be set to 'pending' if moderation is required
    
    await review.save();
    
    await review.populate('patient', 'name email');
    await review.populate('doctor');
    
    res.json(review);
    
  } catch (error) {
    console.error('Update review error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   DELETE /api/reviews/:reviewId
// @desc    Delete a review
// @access  Private (Patient - own review, or Admin)
router.delete('/:reviewId', auth, async (req, res) => {
  try {
    const { reviewId } = req.params;
    
    const review = await Review.findById(reviewId);
    
    if (!review) {
      return res.status(404).json({ message: 'Review not found' });
    }
    
    // Check permission
    if (review.patient.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to delete this review' });
    }
    
    const doctorId = review.doctor;
    await review.deleteOne();
    
    res.json({ message: 'Review deleted successfully' });
    
  } catch (error) {
    console.error('Delete review error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   POST /api/reviews/:reviewId/vote
// @desc    Vote on a review (helpful/not helpful)
// @access  Private
router.post('/:reviewId/vote', auth, async (req, res) => {
  try {
    const { reviewId } = req.params;
    const { vote } = req.body; // 'helpful' or 'notHelpful'
    
    if (!['helpful', 'notHelpful'].includes(vote)) {
      return res.status(400).json({ message: 'Invalid vote type' });
    }
    
    const review = await Review.findById(reviewId);
    
    if (!review) {
      return res.status(404).json({ message: 'Review not found' });
    }
    
    // Check if user already voted
    const existingVoteIndex = review.votedBy.findIndex(
      v => v.user.toString() === req.user.id
    );
    
    if (existingVoteIndex !== -1) {
      const existingVote = review.votedBy[existingVoteIndex].vote;
      
      // Remove old vote counts
      if (existingVote === 'helpful') {
        review.helpfulVotes = Math.max(0, review.helpfulVotes - 1);
      } else {
        review.notHelpfulVotes = Math.max(0, review.notHelpfulVotes - 1);
      }
      
      // If same vote, remove it (toggle)
      if (existingVote === vote) {
        review.votedBy.splice(existingVoteIndex, 1);
      } else {
        // Change vote
        review.votedBy[existingVoteIndex].vote = vote;
        if (vote === 'helpful') {
          review.helpfulVotes++;
        } else {
          review.notHelpfulVotes++;
        }
      }
    } else {
      // Add new vote
      review.votedBy.push({ user: req.user.id, vote });
      if (vote === 'helpful') {
        review.helpfulVotes++;
      } else {
        review.notHelpfulVotes++;
      }
    }
    
    await review.save();
    
    res.json({
      message: 'Vote recorded',
      helpfulVotes: review.helpfulVotes,
      notHelpfulVotes: review.notHelpfulVotes
    });
    
  } catch (error) {
    console.error('Vote review error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   POST /api/reviews/:reviewId/flag
// @desc    Flag a review as inappropriate
// @access  Private
router.post('/:reviewId/flag', auth, async (req, res) => {
  try {
    const { reviewId } = req.params;
    const { reason } = req.body;
    
    if (!reason) {
      return res.status(400).json({ message: 'Reason is required' });
    }
    
    const review = await Review.findById(reviewId);
    
    if (!review) {
      return res.status(404).json({ message: 'Review not found' });
    }
    
    // Check if already flagged by this user
    const alreadyFlagged = review.flagReasons.some(
      flag => flag.flaggedBy.toString() === req.user.id
    );
    
    if (alreadyFlagged) {
      return res.status(400).json({ message: 'You have already flagged this review' });
    }
    
    review.flagReasons.push({
      reason,
      flaggedBy: req.user.id,
      flaggedAt: new Date()
    });
    
    review.flagCount++;
    
    // Auto-flag if multiple flags
    if (review.flagCount >= 3 && review.status !== 'flagged') {
      review.status = 'flagged';
    }
    
    await review.save();
    
    res.json({
      message: 'Review flagged successfully',
      flagCount: review.flagCount
    });
    
  } catch (error) {
    console.error('Flag review error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   POST /api/reviews/:reviewId/respond
// @desc    Doctor responds to a review
// @access  Private (Doctor only)
router.post('/:reviewId/respond', auth, async (req, res) => {
  try {
    const { reviewId } = req.params;
    const { comment } = req.body;
    
    if (req.user.role !== 'doctor') {
      return res.status(403).json({ message: 'Only doctors can respond to reviews' });
    }
    
    if (!comment) {
      return res.status(400).json({ message: 'Response comment is required' });
    }
    
    const review = await Review.findById(reviewId).populate('doctor');
    
    if (!review) {
      return res.status(404).json({ message: 'Review not found' });
    }
    
    // Check if review is for this doctor
    // `doctor` may be populated (object) or an id; handle both cases
    const reviewDoctorId = review.doctor && review.doctor._id ? review.doctor._id.toString() : (review.doctor ? review.doctor.toString() : null);
    if (!reviewDoctorId || reviewDoctorId !== req.userId) {
      return res.status(403).json({ message: 'You can only respond to reviews for your profile' });
    }
    
    review.response = {
      comment,
      respondedAt: new Date()
    };
    
    await review.save();
    await review.populate('patient', 'name email');
    await review.populate('doctor');
    
    res.json(review);
    
  } catch (error) {
    console.error('Respond to review error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// ========== ADMIN ROUTES ==========

// @route   GET /api/reviews/admin/all
// @desc    Get all reviews (for moderation)
// @access  Private (Admin only)
router.get('/admin/all', auth, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Admin access required' });
    }
    
    const { 
      page = 1, 
      limit = 20, 
      status,
      sort = '-createdAt'
    } = req.query;
    
    const filter = {};
    if (status) {
      filter.status = status;
    }
    
    const reviews = await Review.find(filter)
      .populate('patient', 'name email')
      .populate('doctor')
      .sort(sort)
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit));
    
    const total = await Review.countDocuments(filter);
    
    // Get status counts
    const statusCounts = await Review.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);
    
    res.json({
      reviews,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / parseInt(limit)),
        totalReviews: total
      },
      statusCounts
    });
    
  } catch (error) {
    console.error('Get all reviews error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   PUT /api/reviews/admin/:reviewId/moderate
// @desc    Moderate a review (approve/reject)
// @access  Private (Admin only)
router.put('/admin/:reviewId/moderate', auth, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Admin access required' });
    }
    
    const { reviewId } = req.params;
    const { status, moderationNote } = req.body;
    
    if (!['approved', 'rejected', 'flagged', 'pending'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }
    
    const review = await Review.findById(reviewId);
    
    if (!review) {
      return res.status(404).json({ message: 'Review not found' });
    }
    
    review.status = status;
    review.moderationNote = moderationNote || '';
    review.moderatedBy = req.userId;
    review.moderatedAt = new Date();
    
    await review.save();
    await review.populate('patient', 'name email');
    await review.populate('doctor');
    
    res.json(review);
    
  } catch (error) {
    console.error('Moderate review error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   GET /api/reviews/stats/overall
// @desc    Get overall review statistics
// @access  Public
router.get('/stats/overall', async (req, res) => {
  try {
    const totalReviews = await Review.countDocuments({ status: 'approved' });
    const averageRating = await Review.aggregate([
      { $match: { status: 'approved' } },
      { $group: { _id: null, avg: { $avg: '$rating' } } }
    ]);
    
    const ratingDistribution = await Review.aggregate([
      { $match: { status: 'approved' } },
      {
        $group: {
          _id: '$rating',
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: -1 } }
    ]);
    
    const topRatedDoctors = await User.find({ 
      role: 'doctor', 
      averageRating: { $gte: 4.5 } 
    })
      .select('name specialization averageRating')
      .sort({ averageRating: -1 })
      .limit(10);
    
    res.json({
      totalReviews,
      averageRating: averageRating[0]?.avg || 0,
      ratingDistribution,
      topRatedDoctors
    });
    
  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;
