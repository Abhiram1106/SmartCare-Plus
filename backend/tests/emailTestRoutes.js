const express = require('express');
const router = express.Router();
const { sendOTPEmail, sendWelcomeEmail } = require('../utils/emailService');

// @route   POST /api/test-email/otp
// @desc    Test OTP email sending in real-time
// @access  Public (for testing only - remove in production)
router.post('/otp', async (req, res) => {
  try {
    const { email, name } = req.body;

    if (!email) {
      return res.status(400).json({ 
        success: false,
        message: 'Email is required' 
      });
    }

    // Generate test OTP
    const testOTP = '123456';
    const testName = name || 'Test User';

    console.log(`📧 Sending test OTP email to: ${email}`);
    
    // Send test OTP email
    await sendOTPEmail(email, testOTP, testName);

    res.status(200).json({ 
      success: true,
      message: `Test OTP email sent successfully to ${email}`,
      data: {
        email,
        name: testName,
        otp: testOTP,
        note: 'Check your inbox (and spam folder) for the email'
      }
    });
  } catch (error) {
    console.error('❌ Test OTP email error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Failed to send test email',
      error: error.message,
      details: error.stack
    });
  }
});

// @route   POST /api/test-email/welcome
// @desc    Test welcome email sending in real-time
// @access  Public (for testing only - remove in production)
router.post('/welcome', async (req, res) => {
  try {
    const { email, name, userId } = req.body;

    if (!email) {
      return res.status(400).json({ 
        success: false,
        message: 'Email is required' 
      });
    }

    const testName = name || 'Test User';
    const testUserId = userId || 'SMP9999';

    console.log(`📧 Sending test welcome email to: ${email}`);
    
    // Send test welcome email
    await sendWelcomeEmail(email, testName, testUserId);

    res.status(200).json({ 
      success: true,
      message: `Test welcome email sent successfully to ${email}`,
      data: {
        email,
        name: testName,
        userId: testUserId,
        note: 'Check your inbox (and spam folder) for the email'
      }
    });
  } catch (error) {
    console.error('❌ Test welcome email error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Failed to send test email',
      error: error.message,
      details: error.stack
    });
  }
});

// @route   POST /api/test-email/both
// @desc    Test both OTP and welcome emails
// @access  Public (for testing only - remove in production)
router.post('/both', async (req, res) => {
  try {
    const { email, name } = req.body;

    if (!email) {
      return res.status(400).json({ 
        success: false,
        message: 'Email is required' 
      });
    }

    const testName = name || 'Test User';
    const testOTP = '123456';
    const testUserId = 'SMP9999';

    console.log(`📧 Sending both test emails to: ${email}`);
    
    // Send OTP email
    await sendOTPEmail(email, testOTP, testName);
    console.log('✅ OTP email sent');

    // Wait 2 seconds between emails
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Send welcome email
    await sendWelcomeEmail(email, testName, testUserId);
    console.log('✅ Welcome email sent');

    res.status(200).json({ 
      success: true,
      message: `Both test emails sent successfully to ${email}`,
      data: {
        email,
        name: testName,
        otp: testOTP,
        userId: testUserId,
        note: 'Check your inbox (and spam folder) for both emails'
      }
    });
  } catch (error) {
    console.error('❌ Test emails error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Failed to send test emails',
      error: error.message,
      details: error.stack
    });
  }
});

// @route   GET /api/test-email/info
// @desc    Get email configuration info
// @access  Public (for testing only - remove in production)
router.get('/info', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Email Testing Endpoints',
    endpoints: {
      testOTP: {
        method: 'POST',
        url: '/api/test-email/otp',
        body: { email: 'your@email.com', name: 'Your Name (optional)' }
      },
      testWelcome: {
        method: 'POST',
        url: '/api/test-email/welcome',
        body: { email: 'your@email.com', name: 'Your Name (optional)', userId: 'SMP1234 (optional)' }
      },
      testBoth: {
        method: 'POST',
        url: '/api/test-email/both',
        body: { email: 'your@email.com', name: 'Your Name (optional)' }
      }
    },
    configuration: {
      gmailUser: process.env.GMAIL_USER || 'Not configured',
      gmailPasswordSet: process.env.GMAIL_APP_PASSWORD ? 'Yes' : 'No'
    },
    note: '⚠️ These endpoints are for testing only. Remove in production!'
  });
});

module.exports = router;
