const express = require('express');
const router = express.Router();
const Payment = require('../models/Payment');
const Appointment = require('../models/Appointment');
const { auth, authorize } = require('../middleware/auth');

// @route   POST /api/payments
// @desc    Create payment
// @access  Private (Patient)
router.post('/', auth, authorize('patient'), async (req, res) => {
  try {
    const { appointment: appointmentId, amount, paymentMethod, passkey } = req.body;

    // Get user's payment passkey
    const User = require('../models/User');
    const user = await User.findById(req.userId);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Verify passkey - use user's custom passkey or default demo passkey
    const userPasskey = user.paymentPasskey || '1234';
    if (passkey !== userPasskey) {
      return res.status(400).json({ message: 'Invalid payment passkey' });
    }

    // Validate appointment
    const appointment = await Appointment.findById(appointmentId);
    if (!appointment) {
      return res.status(404).json({ message: 'Appointment not found' });
    }

    if (appointment.patient.toString() !== req.userId) {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Check if payment already exists
    const existingPayment = await Payment.findOne({ appointment: appointmentId });
    if (existingPayment && existingPayment.status === 'completed') {
      return res.status(400).json({ message: 'Payment already completed for this appointment' });
    }

    // Generate transaction ID
    const transactionId = `TXN${Date.now()}${Math.floor(Math.random() * 1000)}`;

    const payment = new Payment({
      patient: req.userId,
      appointment: appointmentId,
      amount,
      paymentMethod,
      transactionId,
      status: 'completed',
      passkeyVerified: true,
      description: `Payment for appointment on ${appointment.appointmentDate.toDateString()}`
    });

    await payment.save();

    // Update appointment with payment reference
    appointment.payment = payment._id;
    appointment.status = 'confirmed';
    await appointment.save();

    await payment.populate('appointment');

    res.status(201).json(payment);
  } catch (error) {
    console.error('Error processing payment:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   GET /api/payments
// @desc    Get payments (filtered by role)
// @access  Private
router.get('/', auth, async (req, res) => {
  try {
    const { status } = req.query;
    let query = {};

    if (req.user.role === 'patient') {
      query.patient = req.userId;
    }

    if (status) {
      query.status = status;
    }

    const payments = await Payment.find(query)
      .populate('patient', 'name email')
      .populate({
        path: 'appointment',
        populate: {
          path: 'doctor',
          select: 'name specialization'
        }
      })
      .sort({ createdAt: -1 });

    res.json(payments);
  } catch (error) {
    console.error('Error fetching payments:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   GET /api/payments/:id
// @desc    Get single payment
// @access  Private
router.get('/:id', auth, async (req, res) => {
  try {
    const payment = await Payment.findById(req.params.id)
      .populate('patient', 'name email')
      .populate({
        path: 'appointment',
        populate: {
          path: 'doctor',
          select: 'name specialization'
        }
      });

    if (!payment) {
      return res.status(404).json({ message: 'Payment not found' });
    }

    // Check authorization
    if (
      req.user.role !== 'admin' &&
      payment.patient._id.toString() !== req.userId
    ) {
      return res.status(403).json({ message: 'Access denied' });
    }

    res.json(payment);
  } catch (error) {
    console.error('Error fetching payment:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   POST /api/payments/:id/refund
// @desc    Refund payment
// @access  Private (Admin)
router.post('/:id/refund', auth, authorize('admin'), async (req, res) => {
  try {
    const { refundReason } = req.body;

    const payment = await Payment.findById(req.params.id);

    if (!payment) {
      return res.status(404).json({ message: 'Payment not found' });
    }

    if (payment.status !== 'completed') {
      return res.status(400).json({ message: 'Only completed payments can be refunded' });
    }

    payment.status = 'refunded';
    payment.refundReason = refundReason;
    payment.refundedAt = new Date();

    await payment.save();

    // Update appointment status
    const appointment = await Appointment.findById(payment.appointment);
    if (appointment) {
      appointment.status = 'cancelled';
      await appointment.save();
    }

    res.json(payment);
  } catch (error) {
    console.error('Error processing refund:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   GET /api/payments/stats/overview
// @desc    Get payment statistics
// @access  Private (Admin)
router.get('/stats/overview', auth, authorize('admin'), async (req, res) => {
  try {
    const totalPayments = await Payment.countDocuments({ status: 'completed' });
    const totalRevenue = await Payment.aggregate([
      { $match: { status: 'completed' } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);

    const pendingPayments = await Payment.countDocuments({ status: 'pending' });
    const refundedPayments = await Payment.countDocuments({ status: 'refunded' });

    res.json({
      totalPayments,
      totalRevenue: totalRevenue[0]?.total || 0,
      pendingPayments,
      refundedPayments
    });
  } catch (error) {
    console.error('Error fetching payment stats:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;
