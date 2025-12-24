/**
 * ═══════════════════════════════════════════════════════════════════════════
 * SmartCare+ Professional Test Server
 * Automated testing with analytics dashboard
 * ═══════════════════════════════════════════════════════════════════════════
 */

const express = require('express');
const { spawn } = require('child_process');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = 3001;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname)));

// Test results storage
const testResults = {
  endpoint: {
    status: 'idle', // idle, running, passed, failed
    output: '',
    stats: {
      total: 0,
      passed: 0,
      failed: 0,
      duration: '0s',
      suites: 0
    },
    history: [],
    startTime: null,
    endTime: null
  },
  email: {
    status: 'idle',
    results: [],
    stats: {
      total: 0,
      sent: 0,
      failed: 0
    }
  }
};

// ═══════════════════════════════════════════════════════════════════════════
// ENDPOINT TEST ROUTES
// ═══════════════════════════════════════════════════════════════════════════

// Get endpoint test results
app.get('/api/endpoint-test-results', (req, res) => {
  console.log('📤 Sending test results to frontend:', {
    status: testResults.endpoint.status,
    stats: testResults.endpoint.stats
  });
  res.json(testResults.endpoint);
});

// Run endpoint tests
app.post('/api/run-endpoint-tests', (req, res) => {
  if (testResults.endpoint.status === 'running') {
    return res.status(400).json({ message: 'Tests are already running' });
  }

  testResults.endpoint.status = 'running';
  testResults.endpoint.output = '';
  testResults.endpoint.startTime = new Date().toISOString();
  testResults.endpoint.endTime = null;
  
  res.json({ message: 'Tests started', status: 'running' });

  // Run Jest tests (removed --colors to avoid ANSI escape codes that break parsing)
  const jest = spawn('npx', ['jest', 'tests/allEndpoints.test.js', '--verbose', '--forceExit'], {
    cwd: path.join(__dirname, '..'),
    shell: true
  });

  jest.stdout.on('data', (data) => {
    const output = data.toString();
    testResults.endpoint.output += output;
    console.log(output);
  });

  jest.stderr.on('data', (data) => {
    const output = data.toString();
    testResults.endpoint.output += output;
    console.error(output);
  });

  jest.on('close', (code) => {
    // Small delay to ensure all output is captured
    setTimeout(() => {
      testResults.endpoint.endTime = new Date().toISOString();
      testResults.endpoint.status = code === 0 ? 'passed' : 'failed';
      
      console.log(`\n✅ Tests completed with exit code: ${code}`);
      
      // Parse test results
      parseTestResults();
      
      // Add to history
      testResults.endpoint.history.push({
        timestamp: testResults.endpoint.endTime,
        status: testResults.endpoint.status,
        stats: { ...testResults.endpoint.stats }
      });

      // Keep only last 10 runs
      if (testResults.endpoint.history.length > 10) {
        testResults.endpoint.history = testResults.endpoint.history.slice(-10);
      }
    }, 500);
  });
});

// Helper function to strip ANSI color codes
function stripAnsiCodes(str) {
  // Remove ANSI escape sequences
  return str.replace(/\x1B\[[0-9;]*[A-Za-z]/g, '');
}

// Parse test output for statistics
function parseTestResults() {
  // Strip ANSI color codes from output
  const cleanOutput = stripAnsiCodes(testResults.endpoint.output);
  
  console.log('\n🔍 Parsing test results...');
  console.log('Output length:', cleanOutput.length);
  
  // Find the summary section
  const summaryStart = cleanOutput.indexOf('Test Suites:');
  if (summaryStart > -1) {
    const summary = cleanOutput.substring(summaryStart, summaryStart + 300);
    console.log('📄 Clean summary section:', summary.substring(0, 150));
    
    // Parse Test Suites - handles both patterns:
    // "Test Suites: 1 passed, 1 total" (all passed)
    // "Test Suites: 1 failed, 1 total" (with failures)
    const suitesWithFailuresMatch = summary.match(/Test Suites:\s+(\d+)\s+failed,\s+(\d+)\s+total/);
    const suitesAllPassedMatch = summary.match(/Test Suites:\s+(\d+)\s+passed,\s+(\d+)\s+total/);
    
    if (suitesWithFailuresMatch) {
      testResults.endpoint.stats.suites = parseInt(suitesWithFailuresMatch[2]);
      console.log(`✅ Suites: ${suitesWithFailuresMatch[1]} failed, ${suitesWithFailuresMatch[2]} total`);
    } else if (suitesAllPassedMatch) {
      testResults.endpoint.stats.suites = parseInt(suitesAllPassedMatch[2]);
      console.log(`✅ Suites: ${suitesAllPassedMatch[1]} passed, ${suitesAllPassedMatch[2]} total`);
    }
    
    // Parse Tests - handles both patterns:
    // "Tests:       169 passed, 170 total" (all passed)
    // "Tests:       1 failed, 169 passed, 170 total" (with failures)
    const testsWithFailuresMatch = summary.match(/Tests:\s+(\d+)\s+failed,\s+(\d+)\s+passed,\s+(\d+)\s+total/);
    const testsAllPassedMatch = summary.match(/Tests:\s+(\d+)\s+passed,\s+(\d+)\s+total/);
    
    if (testsWithFailuresMatch) {
      testResults.endpoint.stats.failed = parseInt(testsWithFailuresMatch[1]);
      testResults.endpoint.stats.passed = parseInt(testsWithFailuresMatch[2]);
      testResults.endpoint.stats.total = parseInt(testsWithFailuresMatch[3]);
      console.log(`✅ Tests: ${testsWithFailuresMatch[1]} failed, ${testsWithFailuresMatch[2]} passed, ${testsWithFailuresMatch[3]} total`);
    } else if (testsAllPassedMatch) {
      testResults.endpoint.stats.passed = parseInt(testsAllPassedMatch[1]);
      testResults.endpoint.stats.total = parseInt(testsAllPassedMatch[2]);
      testResults.endpoint.stats.failed = 0;
      console.log(`✅ Tests: ${testsAllPassedMatch[1]} passed, ${testsAllPassedMatch[2]} total`);
    } else {
      console.log('⚠️  Could not parse tests');
    }
    
    // Parse Duration: "Time:        26.179 s"
    const durationMatch = summary.match(/Time:\s+([\d.]+)\s*s/);
    if (durationMatch) {
      testResults.endpoint.stats.duration = durationMatch[1] + 's';
      console.log(`✅ Duration: ${durationMatch[1]}s`);
    }
  } else {
    console.log('⚠️  Could not find Test Suites summary');
  }
  
  console.log('📊 Final stats:', testResults.endpoint.stats);
}

// Clear endpoint test history
app.post('/api/clear-endpoint-history', (req, res) => {
  testResults.endpoint.history = [];
  res.json({ message: 'History cleared' });
});

// ═══════════════════════════════════════════════════════════════════════════
// EMAIL TEST ROUTES
// ═══════════════════════════════════════════════════════════════════════════

const { sendOTPEmail, sendWelcomeEmail } = require('../utils/emailService');

// Get email test results
app.get('/api/email-test-results', (req, res) => {
  res.json(testResults.email);
});

// Send OTP email test
app.post('/api/test-email/otp', async (req, res) => {
  const { email, name } = req.body;
  
  if (!email) {
    return res.status(400).json({ message: 'Email is required' });
  }

  const startTime = Date.now();
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  
  try {
    await sendOTPEmail(email, otp, name || 'User');
    const duration = Date.now() - startTime;
    
    const result = {
      type: 'OTP',
      email,
      name: name || 'User',
      status: 'success',
      duration: `${duration}ms`,
      timestamp: new Date().toISOString(),
      otp: otp
    };
    
    testResults.email.results.unshift(result);
    testResults.email.stats.total++;
    testResults.email.stats.sent++;
    
    res.json({ success: true, message: 'OTP email sent successfully', result });
  } catch (error) {
    const duration = Date.now() - startTime;
    
    const result = {
      type: 'OTP',
      email,
      name: name || 'User',
      status: 'failed',
      duration: `${duration}ms`,
      timestamp: new Date().toISOString(),
      error: error.message
    };
    
    testResults.email.results.unshift(result);
    testResults.email.stats.total++;
    testResults.email.stats.failed++;
    
    res.status(500).json({ success: false, message: 'Failed to send OTP email', error: error.message });
  }
});

// Send Welcome email test
app.post('/api/test-email/welcome', async (req, res) => {
  const { email, name } = req.body;
  
  if (!email) {
    return res.status(400).json({ message: 'Email is required' });
  }

  const startTime = Date.now();
  const userId = `SMP${Math.floor(1000 + Math.random() * 9000)}`;
  
  try {
    await sendWelcomeEmail(email, name || 'User', userId);
    const duration = Date.now() - startTime;
    
    const result = {
      type: 'Welcome',
      email,
      name: name || 'User',
      status: 'success',
      duration: `${duration}ms`,
      timestamp: new Date().toISOString(),
      userId: userId
    };
    
    testResults.email.results.unshift(result);
    testResults.email.stats.total++;
    testResults.email.stats.sent++;
    
    res.json({ success: true, message: 'Welcome email sent successfully', result });
  } catch (error) {
    const duration = Date.now() - startTime;
    
    const result = {
      type: 'Welcome',
      email,
      name: name || 'User',
      status: 'failed',
      duration: `${duration}ms`,
      timestamp: new Date().toISOString(),
      error: error.message
    };
    
    testResults.email.results.unshift(result);
    testResults.email.stats.total++;
    testResults.email.stats.failed++;
    
    res.status(500).json({ success: false, message: 'Failed to send welcome email', error: error.message });
  }
});

// Send both emails
app.post('/api/test-email/both', async (req, res) => {
  const { email, name } = req.body;
  
  if (!email) {
    return res.status(400).json({ message: 'Email is required' });
  }

  try {
    // Send OTP
    await req.app.handle({ method: 'POST', url: '/api/test-email/otp', body: { email, name } }, { json: () => {} });
    
    // Wait 2 seconds
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Send Welcome
    await req.app.handle({ method: 'POST', url: '/api/test-email/welcome', body: { email, name } }, { json: () => {} });
    
    res.json({ success: true, message: 'Both emails sent successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to send emails', error: error.message });
  }
});

// Clear email results
app.post('/api/clear-email-results', (req, res) => {
  testResults.email.results = [];
  testResults.email.stats = { total: 0, sent: 0, failed: 0 };
  res.json({ message: 'Email results cleared' });
});

// Get email configuration
app.get('/api/email-config', (req, res) => {
  const configured = !!(process.env.GMAIL_USER && process.env.GMAIL_APP_PASSWORD);
  res.json({
    configured,
    user: process.env.GMAIL_USER || 'Not configured',
    hasPassword: !!process.env.GMAIL_APP_PASSWORD
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// START SERVER & AUTO-OPEN BROWSER
// ═══════════════════════════════════════════════════════════════════════════

app.listen(PORT, () => {
  console.log('\n');
  console.log('═'.repeat(70));
  console.log('  🚀 SmartCare+ Professional Test Server');
  console.log('═'.repeat(70));
  console.log(`  📊 Testing Dashboard: http://localhost:${PORT}/testing-dashboard.html`);
  console.log(`  🌐 Server running on port ${PORT}`);
  console.log('═'.repeat(70));
  console.log('\n  🔧 Opening testing dashboard in your browser...\n');

  // Auto-open browser with new fixed layout dashboard (NO GRAPHS, NO SCROLLING, TOAST NOTIFICATIONS)
  const url = `http://localhost:${PORT}/testing-dashboard.html`;
  const start = process.platform === 'darwin' ? 'open' : process.platform === 'win32' ? 'start' : 'xdg-open';
  
  require('child_process').exec(`${start} ${url}`, (error) => {
    if (error) {
      console.log(`  ⚠️  Could not auto-open browser. Please visit: ${url}\n`);
    }
  });
});
