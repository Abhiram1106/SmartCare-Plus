const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Appointment = require('../models/Appointment');
const Payment = require('../models/Payment');
const { auth, authorize } = require('../middleware/auth');

// @route   GET /api/admin/users
// @desc    Get all users
// @access  Private (Admin)
router.get('/users', auth, authorize('admin'), async (req, res) => {
  try {
    const { role, approved } = req.query;
    let query = {};

    if (role) query.role = role;
    if (approved !== undefined) query.approved = approved === 'true';

    const users = await User.find(query).select('-password').sort({ createdAt: -1 });
    res.json(users);
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   GET /api/admin/users/:id
// @desc    Get user details
// @access  Private (Admin)
router.get('/users/:id', auth, authorize('admin'), async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Get additional stats
    let stats = {};
    if (user.role === 'patient') {
      const appointments = await Appointment.countDocuments({ patient: user._id });
      const payments = await Payment.countDocuments({ patient: user._id, status: 'completed' });
      stats = { appointments, payments };
    } else if (user.role === 'doctor') {
      const appointments = await Appointment.countDocuments({ doctor: user._id });
      const completedAppointments = await Appointment.countDocuments({ doctor: user._id, status: 'completed' });
      stats = { appointments, completedAppointments };
    }

    res.json({ user, stats });
  } catch (error) {
    console.error('Error fetching user:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   PUT /api/admin/users/:id
// @desc    Update user profile
// @access  Private (Admin or User themselves)
router.put('/users/:id', auth, async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Check if user is admin or updating their own profile
    if (req.user.role !== 'admin' && req.user.id !== req.params.id) {
      return res.status(403).json({ message: 'Not authorized to update this profile' });
    }

    // Fields that can be updated
    const allowedUpdates = [
      'name',
      'phone',
      'gender',
      'age',
      'address',
      'emergencyContact',
      'emergencyContactName',
      'specialization',
      'experience',
      'education',
      'consultationFee'
    ];

    // Update only allowed fields
    allowedUpdates.forEach((field) => {
      if (req.body[field] !== undefined) {
        user[field] = req.body[field];
      }
    });

    await user.save();

    // Return user without password
    const updatedUser = await User.findById(user._id).select('-password');
    res.json({ message: 'Profile updated successfully', user: updatedUser });
  } catch (error) {
    console.error('Error updating user:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   PUT /api/admin/users/:id/approve
// @desc    Approve doctor
// @access  Private (Admin)
router.put('/users/:id/approve', auth, authorize('admin'), async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (user.role !== 'doctor') {
      return res.status(400).json({ message: 'Only doctors can be approved' });
    }

    user.approved = true;
    user.isApproved = true; // Set both fields for compatibility
    await user.save();

    res.json({ message: 'Doctor approved successfully', user });
  } catch (error) {
    console.error('Error approving doctor:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   PUT /api/admin/users/:id/reject
// @desc    Reject doctor
// @access  Private (Admin)
router.put('/users/:id/reject', auth, authorize('admin'), async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (user.role !== 'doctor') {
      return res.status(400).json({ message: 'Only doctors can be rejected' });
    }

    user.approved = false;
    user.isApproved = false; // Set both fields for compatibility
    await user.save();

    res.json({ message: 'Doctor approval revoked', user });
  } catch (error) {
    console.error('Error rejecting doctor:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   DELETE /api/admin/users/:id
// @desc    Delete user
// @access  Private (Admin)
router.delete('/users/:id', auth, authorize('admin'), async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Delete associated data
    if (user.role === 'patient') {
      await Appointment.deleteMany({ patient: user._id });
      await Payment.deleteMany({ patient: user._id });
    } else if (user.role === 'doctor') {
      await Appointment.deleteMany({ doctor: user._id });
    }

    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   POST /api/admin/users/bulk-approve
// @desc    Approve multiple doctors
// @access  Private (Admin)
router.post('/users/bulk-approve', auth, authorize('admin'), async (req, res) => {
  try {
    const { userIds } = req.body;

    if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
      return res.status(400).json({ message: 'User IDs array is required' });
    }

    const result = await User.updateMany(
      { _id: { $in: userIds }, role: 'doctor' },
      { $set: { approved: true, isApproved: true } }
    );

    res.json({ 
      message: `Successfully approved ${result.modifiedCount} doctor(s)`,
      modifiedCount: result.modifiedCount
    });
  } catch (error) {
    console.error('Error bulk approving doctors:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   POST /api/admin/users/bulk-reject
// @desc    Reject multiple doctors
// @access  Private (Admin)
router.post('/users/bulk-reject', auth, authorize('admin'), async (req, res) => {
  try {
    const { userIds } = req.body;

    if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
      return res.status(400).json({ message: 'User IDs array is required' });
    }

    const result = await User.updateMany(
      { _id: { $in: userIds }, role: 'doctor' },
      { $set: { approved: false, isApproved: false } }
    );

    res.json({ 
      message: `Successfully rejected ${result.modifiedCount} doctor(s)`,
      modifiedCount: result.modifiedCount
    });
  } catch (error) {
    console.error('Error bulk rejecting doctors:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   POST /api/admin/users/bulk-delete
// @desc    Delete multiple users
// @access  Private (Admin)
router.post('/users/bulk-delete', auth, authorize('admin'), async (req, res) => {
  try {
    const { userIds } = req.body;

    if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
      return res.status(400).json({ message: 'User IDs array is required' });
    }

    // Find users to delete
    const users = await User.find({ _id: { $in: userIds } });

    // Delete associated data for each user
    for (const user of users) {
      if (user.role === 'patient') {
        await Appointment.deleteMany({ patient: user._id });
        await Payment.deleteMany({ patient: user._id });
      } else if (user.role === 'doctor') {
        await Appointment.deleteMany({ doctor: user._id });
      }
    }

    // Delete users
    const result = await User.deleteMany({ _id: { $in: userIds } });

    res.json({ 
      message: `Successfully deleted ${result.deletedCount} user(s)`,
      deletedCount: result.deletedCount
    });
  } catch (error) {
    console.error('Error bulk deleting users:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   POST /api/admin/users/approve-all-doctors
// @desc    Approve all pending doctors
// @access  Private (Admin)
router.post('/users/approve-all-doctors', auth, authorize('admin'), async (req, res) => {
  try {
    const result = await User.updateMany(
      { role: 'doctor', approved: false },
      { $set: { approved: true, isApproved: true } }
    );

    res.json({ 
      message: `Successfully approved all ${result.modifiedCount} pending doctor(s)`,
      modifiedCount: result.modifiedCount
    });
  } catch (error) {
    console.error('Error approving all doctors:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   GET /api/admin/stats
// @desc    Get dashboard statistics
// @access  Private (Admin)
router.get('/stats', auth, authorize('admin'), async (req, res) => {
  try {
    const totalPatients = await User.countDocuments({ role: 'patient' });
    const totalDoctors = await User.countDocuments({ role: 'doctor', approved: true });
    const pendingDoctors = await User.countDocuments({ role: 'doctor', approved: false });
    const totalAppointments = await Appointment.countDocuments();
    const pendingAppointments = await Appointment.countDocuments({ status: 'pending' });
    const completedAppointments = await Appointment.countDocuments({ status: 'completed' });
    const totalPayments = await Payment.countDocuments({ status: 'completed' });
    
    const totalRevenue = await Payment.aggregate([
      { $match: { status: 'completed' } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);

    // Recent appointments
    const recentAppointments = await Appointment.find()
      .populate('patient', 'name')
      .populate('doctor', 'name')
      .sort({ createdAt: -1 })
      .limit(5);

    res.json({
      totalPatients,
      totalDoctors,
      pendingDoctors,
      totalAppointments,
      pendingAppointments,
      completedAppointments,
      totalPayments,
      totalRevenue: totalRevenue[0]?.total || 0,
      recentAppointments
    });
  } catch (error) {
    console.error('Error fetching stats:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   GET /api/admin/appointments
// @desc    Get all appointments
// @access  Private (Admin)
router.get('/appointments', auth, authorize('admin'), async (req, res) => {
  try {
    const { status } = req.query;
    let query = {};

    if (status) query.status = status;

    const appointments = await Appointment.find(query)
      .populate('patient', 'name email phone')
      .populate('doctor', 'name email specialization')
      .sort({ appointmentDate: -1 })
      .limit(50);

    res.json(appointments);
  } catch (error) {
    console.error('Error fetching appointments:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   GET /api/admin/payments
// @desc    Get all payments
// @access  Private (Admin)
router.get('/payments', auth, authorize('admin'), async (req, res) => {
  try {
    const payments = await Payment.find()
      .populate('patient', 'name email')
      .populate({
        path: 'appointment',
        populate: { path: 'doctor', select: 'name' }
      })
      .sort({ createdAt: -1 })
      .limit(50);

    res.json(payments);
  } catch (error) {
    console.error('Error fetching payments:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;
