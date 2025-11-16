const express = require('express');
const router = express.Router();
const Appointment = require('../models/Appointment');
const Payment = require('../models/Payment');
const User = require('../models/User');
const Review = require('../models/Review');
const SymptomAnalysis = require('../models/SymptomAnalysis');
const { auth, authorize } = require('../middleware/auth');
const {
  predictNoShow,
  forecastRevenue,
  analyzePeakHours,
  calculateSuccessRate,
  detectOutbreakPatterns,
  analyzePatientRetention
} = require('../utils/predictiveAnalytics');

// @route   POST /api/predictive-analytics/no-show-prediction
// @desc    Predict likelihood of appointment no-show
// @access  Private (Doctor/Admin)
router.post('/no-show-prediction', auth, authorize('doctor', 'admin'), async (req, res) => {
  try {
    const { appointmentId } = req.body;

    if (!appointmentId) {
      return res.status(400).json({ message: 'Appointment ID is required' });
    }

    const appointment = await Appointment.findById(appointmentId).populate('patient');
    if (!appointment) {
      return res.status(404).json({ message: 'Appointment not found' });
    }

    // Get patient's appointment history
    const patientAppointments = await Appointment.find({ patient: appointment.patient._id });
    const noShows = patientAppointments.filter(a => a.status === 'no-show').length;

    const userHistory = {
      totalAppointments: patientAppointments.length,
      noShows,
      completedAppointments: patientAppointments.filter(a => a.status === 'completed').length
    };

    const appointmentData = {
      appointmentDate: appointment.appointmentDate,
      isPaid: appointment.paymentStatus === 'paid'
    };

    const prediction = predictNoShow(appointmentData, userHistory);

    res.json({
      success: true,
      data: {
        appointmentId,
        patient: {
          name: appointment.patient.name,
          id: appointment.patient._id
        },
        prediction,
        recommendation: prediction.riskLevel === 'high' 
          ? 'Send reminder SMS/Email 24 hours before appointment'
          : prediction.riskLevel === 'medium'
          ? 'Send confirmation request'
          : 'Standard appointment handling'
      }
    });
  } catch (error) {
    console.error('Error predicting no-show:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   GET /api/predictive-analytics/revenue-forecast
// @desc    Forecast revenue for upcoming period
// @access  Private (Admin/Doctor)
router.get('/revenue-forecast', auth, authorize('doctor', 'admin'), async (req, res) => {
  try {
    const { days = 30 } = req.query;

    // Get historical payment data (last 90 days for better prediction)
    const historicalDays = 90;
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - historicalDays);

    const payments = await Payment.find({
      createdAt: { $gte: cutoffDate },
      status: 'completed'
    });

    // Group by date
    const dailyRevenue = {};
    payments.forEach(payment => {
      const date = new Date(payment.createdAt).toISOString().split('T')[0];
      dailyRevenue[date] = (dailyRevenue[date] || 0) + payment.amount;
    });

    const historicalData = Object.entries(dailyRevenue)
      .map(([date, revenue]) => ({ date, revenue }))
      .sort((a, b) => new Date(a.date) - new Date(b.date));

    const forecast = forecastRevenue(historicalData, parseInt(days));

    res.json({
      success: true,
      data: {
        ...forecast,
        historicalPeriod: `${historicalDays} days`,
        totalHistoricalRevenue: Math.round(historicalData.reduce((sum, d) => sum + d.revenue, 0)),
        dataPoints: historicalData.length
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   GET /api/predictive-analytics/peak-hours
// @desc    Analyze peak appointment hours and patterns
// @access  Private (Admin/Doctor)
router.get('/peak-hours', auth, authorize('doctor', 'admin'), async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    const query = {};
    if (startDate || endDate) {
      query.appointmentDate = {};
      if (startDate) query.appointmentDate.$gte = new Date(startDate);
      if (endDate) query.appointmentDate.$lte = new Date(endDate);
    }

    const appointments = await Appointment.find(query);
    
    if (appointments.length === 0) {
      // Return empty result instead of 404
      return res.json({
        success: true,
        message: 'No appointment data available for analysis',
        data: {
          peakHour: { hour: null, time: null, appointmentCount: 0, revenue: 0 },
          peakDay: { day: null, appointmentCount: 0, revenue: 0 },
          hourlyDistribution: [],
          dailyDistribution: [],
          totalAppointments: 0
        }
      });
    }

    const analysis = analyzePeakHours(appointments);

    res.json({
      success: true,
      data: {
        ...analysis,
        totalAppointments: appointments.length,
        analysisNote: 'Use this data to optimize staff scheduling and resource allocation'
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   GET /api/predictive-analytics/success-rate
// @desc    Calculate treatment success rate
// @access  Private (Doctor/Admin)
router.get('/success-rate', auth, authorize('doctor', 'admin'), async (req, res) => {
  try {
    const { doctorId } = req.query;

    const appointmentQuery = doctorId ? { doctor: doctorId } : {};
    const appointments = await Appointment.find(appointmentQuery);

    const reviewQuery = doctorId ? { doctor: doctorId, status: 'approved' } : { status: 'approved' };
    const reviews = await Review.find(reviewQuery);

    const successMetrics = calculateSuccessRate(appointments, reviews);

    res.json({
      success: true,
      data: {
        ...successMetrics,
        doctorId: doctorId || 'All Doctors',
        reviewPercentage: ((reviews.length / appointments.length) * 100).toFixed(2)
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   GET /api/predictive-analytics/outbreak-detection
// @desc    Detect disease outbreak patterns
// @access  Private (Admin)
router.get('/outbreak-detection', auth, authorize('admin'), async (req, res) => {
  try {
    const { days = 7 } = req.query;

    const symptomAnalyses = await SymptomAnalysis.find({});
    
    const patterns = detectOutbreakPatterns(symptomAnalyses, parseInt(days));

    res.json({
      success: true,
      data: patterns
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   GET /api/predictive-analytics/patient-retention
// @desc    Analyze patient retention and churn risk
// @access  Private (Admin)
router.get('/patient-retention', auth, authorize('admin'), async (req, res) => {
  try {
    const patients = await User.find({ role: 'patient' });
    const appointments = await Appointment.find({});

    const retention = analyzePatientRetention(patients, appointments);

    res.json({
      success: true,
      data: {
        ...retention,
        insights: {
          atRiskAction: `${retention.patientsNeedingFollowUp} patients need follow-up contact`,
          retentionStatus: parseFloat(retention.retentionRate) > 70 ? 'Good' : 
                          parseFloat(retention.retentionRate) > 50 ? 'Fair' : 'Needs Improvement'
        }
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   GET /api/predictive-analytics/dashboard
// @desc    Get comprehensive analytics dashboard
// @access  Private (Admin/Doctor)
router.get('/dashboard', auth, authorize('doctor', 'admin'), async (req, res) => {
  try {
    // Get data for last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const [appointments, payments, reviews, patients, symptomAnalyses] = await Promise.all([
      Appointment.find({ appointmentDate: { $gte: thirtyDaysAgo } }),
      Payment.find({ createdAt: { $gte: thirtyDaysAgo }, status: 'completed' }),
      Review.find({ status: 'approved' }),
      User.find({ role: 'patient' }),
      SymptomAnalysis.find({})
    ]);

    // Calculate metrics
    const totalRevenue = payments.reduce((sum, p) => sum + p.amount, 0);
    const peakAnalysis = appointments.length > 0 ? analyzePeakHours(appointments) : null;
    const successMetrics = calculateSuccessRate(appointments, reviews);
    const retention = analyzePatientRetention(patients, appointments);
    
    // Revenue forecast
    const dailyRevenue = {};
    payments.forEach(payment => {
      const date = new Date(payment.createdAt).toISOString().split('T')[0];
      dailyRevenue[date] = (dailyRevenue[date] || 0) + payment.amount;
    });
    const historicalData = Object.entries(dailyRevenue).map(([date, revenue]) => ({ date, revenue }));
    const revenueForecast = forecastRevenue(historicalData, 30);

    // Outbreak detection
    const outbreakPatterns = detectOutbreakPatterns(symptomAnalyses, 7);

    res.json({
      success: true,
      data: {
        overview: {
          period: 'Last 30 days',
          totalAppointments: appointments.length,
          totalRevenue: Math.round(totalRevenue),
          totalPatients: patients.length,
          activePatients: retention.activePatients
        },
        revenue: {
          current: Math.round(totalRevenue),
          forecast: revenueForecast
        },
        appointments: {
          total: appointments.length,
          completed: appointments.filter(a => a.status === 'completed').length,
          pending: appointments.filter(a => a.status === 'pending').length,
          cancelled: appointments.filter(a => a.status === 'cancelled').length,
          peakHours: peakAnalysis
        },
        performance: successMetrics,
        patientRetention: retention,
        healthAlerts: outbreakPatterns
      }
    });
  } catch (error) {
    console.error('Error generating dashboard:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;
