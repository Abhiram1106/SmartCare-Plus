const express = require('express');
const router = express.Router();
const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { auth } = require('../middleware/auth');

// @route   POST /api/auth/register
// @desc    Register user
// @access  Public
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, role, phone, specialization, experience, education } = req.body;
    
    let user = await User.findOne({ email });
    if (user) {
      return res.status(400).json({ message: 'User already exists' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    
    user = new User({ 
      name, 
      email, 
      password: hashedPassword, 
      role: role || 'patient',
      phone,
      specialization,
      experience,
      education,
      approved: role === 'doctor' ? false : true
    });
    
    await user.save();
    
    const payload = { userId: user.id, role: user.role };
    const token = jwt.sign(payload, process.env.JWT_SECRET, { 
      expiresIn: process.env.JWT_EXPIRES_IN || '7d' 
    });
    
    const userResponse = user.toObject();
    delete userResponse.password;
    
    res.status(201).json({ token, user: userResponse });
  } catch (err) {
    console.error('Registration error:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// @route   POST /api/auth/login
// @desc    Login user
// @access  Public
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }
    
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }
    
    if (user.role === 'doctor' && !user.approved) {
      return res.status(403).json({ 
        message: 'Your account is pending admin approval. Please wait for approval.' 
      });
    }
    
    const payload = { userId: user.id, role: user.role };
    const token = jwt.sign(payload, process.env.JWT_SECRET, { 
      expiresIn: process.env.JWT_EXPIRES_IN || '7d' 
    });
    
    const userResponse = user.toObject();
    delete userResponse.password;
    
    res.json({ token, user: userResponse });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// @route   GET /api/auth/me
// @desc    Get current user
// @access  Private
router.get('/me', auth, async (req, res) => {
  try {
    const user = await User.findById(req.userId).select('-password');
    res.json(user);
  } catch (err) {
    console.error('Get user error:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// @route   POST /api/auth/verify-password
// @desc    Verify user password (for sensitive operations)
// @access  Private
router.post('/verify-password', auth, async (req, res) => {
  try {
    const { password } = req.body;
    
    if (!password) {
      return res.status(400).json({ message: 'Password is required' });
    }
    
    const user = await User.findById(req.userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid password' });
    }
    
    res.json({ verified: true });
  } catch (err) {
    console.error('Password verification error:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// @route   POST /api/auth/update-payment-passkey
// @desc    Update payment passkey (requires password verification)
// @access  Private
router.post('/update-payment-passkey', auth, async (req, res) => {
  try {
    const { password, newPasskey } = req.body;
    
    if (!password || !newPasskey) {
      return res.status(400).json({ message: 'Password and new passkey are required' });
    }
    
    // Validate passkey format (4 digits)
    if (!/^\d{4}$/.test(newPasskey)) {
      return res.status(400).json({ message: 'Passkey must be exactly 4 digits' });
    }
    
    const user = await User.findById(req.userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Verify password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid password' });
    }
    
    // Update passkey
    user.paymentPasskey = newPasskey;
    await user.save();
    
    res.json({ 
      message: 'Payment passkey updated successfully',
      passkey: newPasskey
    });
  } catch (err) {
    console.error('Update passkey error:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// @route   GET /api/auth/payment-passkey
// @desc    Get current payment passkey (requires password verification)
// @access  Private
router.post('/payment-passkey', auth, async (req, res) => {
  try {
    const { password } = req.body;
    
    if (!password) {
      return res.status(400).json({ message: 'Password is required' });
    }
    
    const user = await User.findById(req.userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Verify password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid password' });
    }
    
    res.json({ 
      passkey: user.paymentPasskey || '1234', // Default if not set
      hasCustomPasskey: !!user.paymentPasskey
    });
  } catch (err) {
    console.error('Get passkey error:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

module.exports = router;
