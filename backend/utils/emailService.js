const nodemailer = require('nodemailer');

// Create reusable transporter with enhanced anti-spam configuration
const createTransporter = () => {
  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.GMAIL_USER || 'smartcareplus.team@gmail.com',
      pass: process.env.GMAIL_APP_PASSWORD || 'osrthsgmsvxxaeul'
    },
    // Enhanced SMTP settings
    secure: true,
    tls: {
      rejectUnauthorized: true
    }
  });
};

// Generate 6-digit OTP
const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// Send OTP email with professional design and anti-spam measures
const sendOTPEmail = async (email, otp, name = 'User') => {
  try {
    const transporter = createTransporter();

    const mailOptions = {
      from: {
        name: 'SmartCare+ Healthcare',
        address: process.env.GMAIL_USER || 'smartcareplus.team@gmail.com'
      },
      to: email,
      subject: '🔐 Your SmartCare+ Verification Code',
      // Plain text version (anti-spam measure)
      text: `Hello ${name},\n\nYour SmartCare+ verification code is: ${otp}\n\nThis code will expire in 10 minutes.\n\nIf you didn't request this code, please ignore this email.\n\nBest regards,\nSmartCare+ Healthcare Team`,
      html: `
        <!DOCTYPE html>
        <html lang="en">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>SmartCare+ Verification</title>
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
              line-height: 1.6;
              color: #2d3748;
              background-color: #f7fafc;
              padding: 20px;
            }
            .email-wrapper {
              max-width: 600px;
              margin: 0 auto;
              background: #ffffff;
              border-radius: 8px;
              overflow: hidden;
              box-shadow: 0 2px 8px rgba(0,0,0,0.08);
            }
            .header {
              background: linear-gradient(135deg, #0ea5e9 0%, #2563eb 50%, #7c3aed 100%);
              padding: 40px 30px;
              text-align: center;
              color: #ffffff;
            }
            .logo { font-size: 32px; font-weight: 700; margin-bottom: 8px; }
            .tagline { font-size: 14px; opacity: 0.95; }
            .content { padding: 40px; }
            .greeting { font-size: 24px; color: #1a202c; font-weight: 600; margin-bottom: 16px; }
            .message { font-size: 16px; color: #4a5568; margin-bottom: 16px; line-height: 1.8; }
            .otp-container {
              background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%);
              border: 2px solid #0ea5e9;
              border-radius: 12px;
              padding: 35px 25px;
              margin: 30px 0;
              text-align: center;
            }
            .otp-label {
              font-size: 13px;
              color: #0369a1;
              font-weight: 600;
              text-transform: uppercase;
              letter-spacing: 1px;
              margin-bottom: 16px;
            }
            .otp-code {
              font-size: 42px;
              font-weight: 700;
              color: #0c4a6e;
              letter-spacing: 10px;
              font-family: 'Courier New', monospace;
              user-select: all;
            }
            .otp-validity {
              font-size: 13px;
              color: #0369a1;
              margin-top: 16px;
              font-weight: 500;
            }
            .info-box {
              background: #f8fafc;
              border-left: 4px solid #3b82f6;
              padding: 20px;
              margin: 25px 0;
              border-radius: 6px;
            }
            .info-title { font-weight: 600; color: #1e40af; margin-bottom: 8px; font-size: 15px; }
            .info-text { font-size: 14px; color: #475569; line-height: 1.6; }
            .security-notice {
              background: #fef3c7;
              border-left: 4px solid #f59e0b;
              padding: 16px 20px;
              margin: 25px 0;
              border-radius: 6px;
            }
            .security-text { font-size: 13px; color: #78350f; font-weight: 500; }
            .footer {
              background: #f8fafc;
              padding: 30px;
              text-align: center;
              border-top: 1px solid #e2e8f0;
            }
            .footer-text { font-size: 13px; color: #718096; margin: 6px 0; }
            .footer-brand { font-weight: 600; color: #2d3748; font-size: 14px; margin-bottom: 8px; }
            .footer-links { margin-top: 16px; }
            .footer-link { color: #2563eb; text-decoration: none; margin: 0 10px; font-size: 13px; }
            @media only screen and (max-width: 600px) {
              .content { padding: 30px 20px; }
              .otp-code { font-size: 32px; letter-spacing: 6px; }
            }
          </style>
        </head>
        <body>
          <div class="email-wrapper">
            <div class="header">
              <div style="font-size: 48px; margin-bottom: 12px;">🏥</div>
              <div class="logo">SmartCare+</div>
              <div class="tagline">Advanced Healthcare Management System</div>
            </div>
            
            <div class="content">
              <div class="greeting">Hello, ${name}! 👋</div>
              
              <p class="message">
                Thank you for choosing <strong>SmartCare+</strong> as your healthcare management partner. 
                We're excited to welcome you to our platform.
              </p>
              
              <p class="message">
                To complete your account registration, please use the verification code below:
              </p>
              
              <div class="otp-container">
                <div class="otp-label">Your Verification Code</div>
                <div class="otp-code">${otp}</div>
                <div class="otp-validity">⏱️ Valid for 10 minutes</div>
              </div>
              
              <div class="info-box">
                <div class="info-title">🔐 Security Information</div>
                <div class="info-text">
                  Your verification code is encrypted and will expire after one use or 10 minutes. 
                  Please enter this code on the registration page to activate your account.
                </div>
              </div>
              
              <div class="security-notice">
                <div class="security-text">
                  ⚠️ <strong>Important:</strong> SmartCare+ will <strong>never</strong> ask you to share this code via email, phone, or text. 
                  If you didn't request this code, please disregard this email.
                </div>
              </div>
              
              <p class="message" style="font-size: 14px; color: #718096; margin-top: 30px;">
                Need assistance? Contact our 24/7 support team at 
                <a href="mailto:support@smartcareplus.com" style="color: #2563eb;">support@smartcareplus.com</a>
              </p>
            </div>
            
            <div class="footer">
              <p class="footer-brand">SmartCare+ Healthcare Management</p>
              <p class="footer-text">© 2025 SmartCare+. All rights reserved.</p>
              <p class="footer-text">This is an automated secure message. Please do not reply.</p>
              <div class="footer-links">
                <a href="#" class="footer-link">Privacy Policy</a>
                <a href="#" class="footer-link">Terms of Service</a>
                <a href="#" class="footer-link">Help Center</a>
              </div>
              <p class="footer-text" style="margin-top: 16px; font-size: 11px;">
                Delivering Quality Healthcare Solutions Worldwide
              </p>
            </div>
          </div>
        </body>
        </html>
      `,
      // Anti-spam headers
      headers: {
        'X-Priority': '1',
        'X-MSMail-Priority': 'High',
        'Importance': 'high',
        'X-Mailer': 'SmartCare+ Healthcare System',
        'List-Unsubscribe': '<mailto:unsubscribe@smartcareplus.com>'
      },
      priority: 'high'
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('OTP email sent successfully:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Error sending OTP email:', error);
    throw error;
  }
};

// Send professional welcome email after successful registration
const sendWelcomeEmail = async (email, name, userId) => {
  try {
    const transporter = createTransporter();

    const mailOptions = {
      from: {
        name: 'SmartCare+ Healthcare',
        address: process.env.GMAIL_USER || 'smartcareplus.team@gmail.com'
      },
      to: email,
      subject: '🎉 Welcome to SmartCare+ - Your Account is Ready!',
      // Plain text version (anti-spam measure)
      text: `Hello ${name},\n\nWelcome to SmartCare+! Your account has been successfully created and verified.\n\nYour User ID: ${userId}\n\nYou can now access all our healthcare services including booking appointments, chatting with doctors, and using our AI health assistant.\n\nLogin at: http://localhost:3000/login\n\nBest regards,\nSmartCare+ Healthcare Team`,
      html: `
        <!DOCTYPE html>
        <html lang="en">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Welcome to SmartCare+</title>
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
              line-height: 1.6;
              color: #2d3748;
              background-color: #f7fafc;
              padding: 20px;
            }
            .email-wrapper {
              max-width: 600px;
              margin: 0 auto;
              background: #ffffff;
              border-radius: 8px;
              overflow: hidden;
              box-shadow: 0 2px 8px rgba(0,0,0,0.08);
            }
            .header {
              background: linear-gradient(135deg, #10b981 0%, #059669 50%, #047857 100%);
              padding: 45px 30px;
              text-align: center;
              color: #ffffff;
            }
            .celebration { font-size: 56px; margin-bottom: 16px; }
            .header-title { font-size: 32px; font-weight: 700; margin-bottom: 8px; }
            .header-subtitle { font-size: 15px; opacity: 0.95; }
            .content { padding: 40px; }
            .success-badge {
              background: linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%);
              border: 2px solid #10b981;
              border-radius: 12px;
              padding: 25px;
              text-align: center;
              margin: 25px 0;
            }
            .success-icon { font-size: 40px; margin-bottom: 12px; }
            .success-title { font-size: 20px; font-weight: 700; color: #065f46; margin-bottom: 6px; }
            .success-text { font-size: 13px; color: #047857; }
            .greeting { font-size: 22px; color: #1a202c; font-weight: 600; margin-bottom: 16px; }
            .message { font-size: 15px; color: #4a5568; margin-bottom: 16px; line-height: 1.8; }
            .user-id-box {
              background: #f8fafc;
              border: 2px dashed #cbd5e0;
              border-radius: 10px;
              padding: 20px;
              margin: 25px 0;
              text-align: center;
            }
            .user-id-label {
              font-size: 12px;
              color: #718096;
              text-transform: uppercase;
              letter-spacing: 1px;
              margin-bottom: 10px;
              font-weight: 600;
            }
            .user-id-value {
              font-size: 18px;
              font-weight: 700;
              color: #2d3748;
              font-family: 'Courier New', monospace;
              background: #ffffff;
              padding: 10px 16px;
              border-radius: 6px;
              display: inline-block;
              border: 1px solid #e2e8f0;
            }
            .section-title {
              font-size: 19px;
              font-weight: 700;
              color: #1a202c;
              margin: 30px 0 18px 0;
              padding-bottom: 10px;
              border-bottom: 2px solid #e2e8f0;
            }
            .feature {
              display: table;
              width: 100%;
              padding: 16px 0;
              border-bottom: 1px solid #f1f5f9;
            }
            .feature-icon {
              display: table-cell;
              font-size: 28px;
              width: 50px;
              vertical-align: top;
            }
            .feature-content {
              display: table-cell;
              padding-left: 12px;
              vertical-align: top;
            }
            .feature-title {
              font-size: 15px;
              font-weight: 600;
              color: #2d3748;
              margin-bottom: 4px;
            }
            .feature-description {
              font-size: 13px;
              color: #64748b;
              line-height: 1.6;
            }
            .cta-section {
              background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%);
              border-radius: 12px;
              padding: 30px 25px;
              text-align: center;
              margin: 30px 0;
            }
            .cta-title { font-size: 18px; font-weight: 700; color: #1e40af; margin-bottom: 14px; }
            .cta-button {
              display: inline-block;
              padding: 14px 35px;
              background: linear-gradient(135deg, #10b981 0%, #059669 100%);
              color: #ffffff;
              text-decoration: none;
              border-radius: 8px;
              font-weight: 600;
              font-size: 15px;
              box-shadow: 0 4px 6px rgba(16, 185, 129, 0.3);
            }
            .footer {
              background: #f8fafc;
              padding: 30px;
              text-align: center;
              border-top: 1px solid #e2e8f0;
            }
            .footer-text { font-size: 13px; color: #718096; margin: 6px 0; }
            .footer-brand { font-weight: 600; color: #2d3748; font-size: 14px; margin-bottom: 8px; }
            .footer-links { margin-top: 16px; }
            .footer-link { color: #2563eb; text-decoration: none; margin: 0 10px; font-size: 13px; }
            @media only screen and (max-width: 600px) {
              .content { padding: 30px 20px; }
              .header-title { font-size: 26px; }
            }
          </style>
        </head>
        <body>
          <div class="email-wrapper">
            <div class="header">
              <div class="celebration">🎉</div>
              <div class="header-title">Welcome to SmartCare+!</div>
              <div class="header-subtitle">Your journey to better healthcare starts here</div>
            </div>
            
            <div class="content">
              <div class="success-badge">
                <div class="success-icon">✅</div>
                <div class="success-title">Account Successfully Created</div>
                <div class="success-text">You're all set! Your SmartCare+ account is now active</div>
              </div>
              
              <p class="greeting">Hello <strong>${name}</strong>,</p>
              
              <p class="message">
                Thank you for joining <strong>SmartCare+</strong>! We're thrilled to have you as part of our healthcare community. 
                Your account has been successfully verified and is ready to use.
              </p>
              
              <div class="user-id-box">
                <div class="user-id-label">Your Unique User ID</div>
                <div class="user-id-value">${userId}</div>
                <p style="font-size: 12px; color: #718096; margin-top: 10px;">
                  Keep this ID safe for reference
                </p>
              </div>
              
              <div class="section-title">✨ What You Can Do Now</div>
              
              <div class="feature">
                <div class="feature-icon">📅</div>
                <div class="feature-content">
                  <div class="feature-title">Book Appointments</div>
                  <div class="feature-description">
                    Schedule consultations with our network of experienced healthcare professionals
                  </div>
                </div>
              </div>
              
              <div class="feature">
                <div class="feature-icon">💬</div>
                <div class="feature-content">
                  <div class="feature-title">Chat with Doctors</div>
                  <div class="feature-description">
                    Get instant medical advice through our secure real-time chat system
                  </div>
                </div>
              </div>
              
              <div class="feature">
                <div class="feature-icon">🤖</div>
                <div class="feature-content">
                  <div class="feature-title">AI Health Assistant</div>
                  <div class="feature-description">
                    Access our intelligent chatbot for quick health information 24/7
                  </div>
                </div>
              </div>
              
              <div class="feature">
                <div class="feature-icon">�</div>
                <div class="feature-content">
                  <div class="feature-title">Health Dashboard</div>
                  <div class="feature-description">
                    Track your medical history, appointments, and health records
                  </div>
                </div>
              </div>
              
              <div class="feature" style="border-bottom: none;">
                <div class="feature-icon">�</div>
                <div class="feature-content">
                  <div class="feature-title">Secure Payments</div>
                  <div class="feature-description">
                    Manage payments and billing with our encrypted payment gateway
                  </div>
                </div>
              </div>
              
              <div class="cta-section">
                <div class="cta-title">Ready to Get Started?</div>
                <p style="font-size: 13px; color: #1e40af; margin-bottom: 18px;">
                  Login to explore all the features SmartCare+ has to offer
                </p>
                <a href="http://localhost:3000/login" class="cta-button">
                  Login to Your Account →
                </a>
              </div>
              
              <p style="font-size: 13px; color: #718096; text-align: center; line-height: 1.8; margin-top: 25px;">
                Need help? Our support team is here for you 24/7.<br>
                Contact us at <a href="mailto:support@smartcareplus.com" style="color: #2563eb;">support@smartcareplus.com</a>
              </p>
            </div>
            
            <div class="footer">
              <p class="footer-brand">🏥 SmartCare+ Healthcare Management</p>
              <p class="footer-text">© 2025 SmartCare+. All rights reserved.</p>
              <p class="footer-text">This email was sent to ${email}</p>
              <div class="footer-links">
                <a href="#" class="footer-link">Privacy Policy</a>
                <a href="#" class="footer-link">Terms of Service</a>
                <a href="#" class="footer-link">Help Center</a>
              </div>
              <p class="footer-text" style="margin-top: 16px; font-size: 11px;">
                Delivering Quality Healthcare Solutions Worldwide
              </p>
            </div>
          </div>
        </body>
        </html>
      `,
      // Anti-spam headers
      headers: {
        'X-Mailer': 'SmartCare+ Healthcare System',
        'List-Unsubscribe': '<mailto:unsubscribe@smartcareplus.com>'
      }
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('Welcome email sent successfully:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Error sending welcome email:', error);
    throw error;
  }
};

module.exports = {
  generateOTP,
  sendOTPEmail,
  sendWelcomeEmail
};
