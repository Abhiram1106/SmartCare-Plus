const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Appointment = require('../models/Appointment');
const Payment = require('../models/Payment');
const User = require('../models/User');
const { auth, authorize } = require('../middleware/auth');

// @route   GET /api/analytics/revenue
// @desc    Get revenue analytics (daily/weekly/monthly)
// @access  Private (Admin)
router.get('/revenue', auth, authorize('admin'), async (req, res) => {
  try {
    const { period = 'monthly', startDate, endDate } = req.query;
    
    // Default to last 30 days if no dates provided
    const end = endDate ? new Date(endDate) : new Date();
    const start = startDate ? new Date(startDate) : new Date(end.getTime() - 30 * 24 * 60 * 60 * 1000);

    let groupBy;
    let dateFormat;

    switch (period) {
      case 'daily':
        groupBy = {
          year: { $year: '$createdAt' },
          month: { $month: '$createdAt' },
          day: { $dayOfMonth: '$createdAt' }
        };
        dateFormat = '%Y-%m-%d';
        break;
      case 'weekly':
        groupBy = {
          year: { $year: '$createdAt' },
          week: { $week: '$createdAt' }
        };
        dateFormat = '%Y-W%V';
        break;
      case 'monthly':
      default:
        groupBy = {
          year: { $year: '$createdAt' },
          month: { $month: '$createdAt' }
        };
        dateFormat = '%Y-%m';
        break;
    }

    const revenueData = await Payment.aggregate([
      {
        $match: {
          status: 'completed',
          createdAt: { $gte: start, $lte: end }
        }
      },
      {
        $group: {
          _id: groupBy,
          totalRevenue: { $sum: '$amount' },
          totalTransactions: { $sum: 1 },
          averageAmount: { $avg: '$amount' }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1, '_id.week': 1 } }
    ]);

    // Calculate total revenue for the period
    const totalRevenue = await Payment.aggregate([
      {
        $match: {
          status: 'completed',
          createdAt: { $gte: start, $lte: end }
        }
      },
      {
        $group: {
          _id: null,
          total: { $sum: '$amount' }
        }
      }
    ]);

    res.json({
      period,
      startDate: start,
      endDate: end,
      data: revenueData,
      totalRevenue: totalRevenue[0]?.total || 0
    });
  } catch (error) {
    console.error('Error fetching revenue analytics:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   GET /api/analytics/appointments
// @desc    Get appointment trends and analytics
// @access  Private (Admin/Doctor)
router.get('/appointments', auth, async (req, res) => {
  try {
    const { period = 'monthly', startDate, endDate } = req.query;
    const isAdmin = req.user.role === 'admin';
    
    const end = endDate ? new Date(endDate) : new Date();
    const start = startDate ? new Date(startDate) : new Date(end.getTime() - 30 * 24 * 60 * 60 * 1000);

    let groupBy;
    switch (period) {
      case 'daily':
        groupBy = {
          year: { $year: '$appointmentDate' },
          month: { $month: '$appointmentDate' },
          day: { $dayOfMonth: '$appointmentDate' }
        };
        break;
      case 'weekly':
        groupBy = {
          year: { $year: '$appointmentDate' },
          week: { $week: '$appointmentDate' }
        };
        break;
      case 'monthly':
      default:
        groupBy = {
          year: { $year: '$appointmentDate' },
          month: { $month: '$appointmentDate' }
        };
        break;
    }

    const matchCondition = {
      appointmentDate: { $gte: start, $lte: end }
    };

    // If doctor, only show their appointments
    if (!isAdmin) {
      matchCondition.doctor = new mongoose.Types.ObjectId(req.user.id);
    }

    const appointmentTrends = await Appointment.aggregate([
      { $match: matchCondition },
      {
        $group: {
          _id: groupBy,
          total: { $sum: 1 },
          confirmed: {
            $sum: { $cond: [{ $eq: ['$status', 'confirmed'] }, 1, 0] }
          },
          completed: {
            $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] }
          },
          cancelled: {
            $sum: { $cond: [{ $eq: ['$status', 'cancelled'] }, 1, 0] }
          },
          pending: {
            $sum: { $cond: [{ $eq: ['$status', 'pending'] }, 1, 0] }
          }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1, '_id.week': 1 } }
    ]);

    // Status breakdown
    const statusBreakdown = await Appointment.aggregate([
      { $match: matchCondition },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    res.json({
      period,
      startDate: start,
      endDate: end,
      trends: appointmentTrends,
      statusBreakdown
    });
  } catch (error) {
    console.error('Error fetching appointment analytics:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   GET /api/analytics/peak-hours
// @desc    Get peak booking hours heatmap data
// @access  Private (Admin/Doctor)
router.get('/peak-hours', auth, async (req, res) => {
  try {
    const isAdmin = req.user.role === 'admin';
    const matchCondition = {};

    if (!isAdmin) {
      matchCondition.doctor = new mongoose.Types.ObjectId(req.user.id);
    }

    const peakHours = await Appointment.aggregate([
      { $match: matchCondition },
      {
        $group: {
          _id: {
            dayOfWeek: { $dayOfWeek: '$appointmentDate' },
            hour: {
              $cond: {
                if: { $regexMatch: { input: '$timeSlot', regex: /^(\d{1,2}):/ } },
                then: {
                  $toInt: {
                    $arrayElemAt: [
                      { $split: ['$timeSlot', ':'] },
                      0
                    ]
                  }
                },
                else: 9 // default hour if parsing fails
              }
            }
          },
          count: { $sum: 1 }
        }
      },
      { $sort: { '_id.dayOfWeek': 1, '_id.hour': 1 } }
    ]);

    // Transform data for heatmap
    const heatmapData = Array.from({ length: 7 }, (_, day) => 
      Array.from({ length: 24 }, (_, hour) => {
        const match = peakHours.find(
          (p) => p._id.dayOfWeek === day + 1 && p._id.hour === hour
        );
        return match ? match.count : 0;
      })
    );

    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

    res.json({
      heatmapData,
      dayNames,
      peakHours: peakHours.sort((a, b) => b.count - a.count).slice(0, 10)
    });
  } catch (error) {
    console.error('Error fetching peak hours:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   GET /api/analytics/doctor-performance
// @desc    Get doctor performance metrics and leaderboard
// @access  Private (Admin)
router.get('/doctor-performance', auth, authorize('admin'), async (req, res) => {
  try {
    const { startDate, endDate, limit = 10 } = req.query;
    
    const end = endDate ? new Date(endDate) : new Date();
    const start = startDate ? new Date(startDate) : new Date(end.getTime() - 30 * 24 * 60 * 60 * 1000);

    // Get all approved doctors
    const doctors = await User.find({ role: 'doctor', approved: true }).select('name email specialization');

    const performance = await Promise.all(
      doctors.map(async (doctor) => {
        // Appointments stats
        const appointmentStats = await Appointment.aggregate([
          {
            $match: {
              doctor: doctor._id,
              appointmentDate: { $gte: start, $lte: end }
            }
          },
          {
            $group: {
              _id: null,
              total: { $sum: 1 },
              completed: {
                $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] }
              },
              cancelled: {
                $sum: { $cond: [{ $eq: ['$status', 'cancelled'] }, 1, 0] }
              }
            }
          }
        ]);

        // Revenue generated
        const revenueStats = await Payment.aggregate([
          {
            $lookup: {
              from: 'appointments',
              localField: 'appointment',
              foreignField: '_id',
              as: 'appointmentDetails'
            }
          },
          { $unwind: '$appointmentDetails' },
          {
            $match: {
              'appointmentDetails.doctor': doctor._id,
              status: 'completed',
              createdAt: { $gte: start, $lte: end }
            }
          },
          {
            $group: {
              _id: null,
              totalRevenue: { $sum: '$amount' },
              totalPayments: { $sum: 1 }
            }
          }
        ]);

        // Unique patients
        const uniquePatients = await Appointment.distinct('patient', {
          doctor: doctor._id,
          appointmentDate: { $gte: start, $lte: end }
        });

        const stats = appointmentStats[0] || { total: 0, completed: 0, cancelled: 0 };
        const revenue = revenueStats[0] || { totalRevenue: 0, totalPayments: 0 };

        const completionRate = stats.total > 0 ? (stats.completed / stats.total) * 100 : 0;
        const cancellationRate = stats.total > 0 ? (stats.cancelled / stats.total) * 100 : 0;

        return {
          doctorId: doctor._id,
          doctorName: doctor.name,
          specialization: doctor.specialization,
          email: doctor.email,
          totalAppointments: stats.total,
          completedAppointments: stats.completed,
          cancelledAppointments: stats.cancelled,
          completionRate: completionRate.toFixed(2),
          cancellationRate: cancellationRate.toFixed(2),
          totalRevenue: revenue.totalRevenue,
          averageRevenuePerAppointment: stats.completed > 0 ? (revenue.totalRevenue / stats.completed).toFixed(2) : 0,
          uniquePatients: uniquePatients.length,
          rating: doctor.rating || 0
        };
      })
    );

    // Sort by total revenue for leaderboard
    const leaderboard = performance
      .sort((a, b) => b.totalRevenue - a.totalRevenue)
      .slice(0, parseInt(limit));

    // Calculate aggregate stats
    const aggregateStats = {
      totalDoctors: doctors.length,
      totalAppointments: performance.reduce((sum, d) => sum + d.totalAppointments, 0),
      totalRevenue: performance.reduce((sum, d) => sum + d.totalRevenue, 0),
      averageCompletionRate: (
        performance.reduce((sum, d) => sum + parseFloat(d.completionRate), 0) / performance.length
      ).toFixed(2),
      averageCancellationRate: (
        performance.reduce((sum, d) => sum + parseFloat(d.cancellationRate), 0) / performance.length
      ).toFixed(2)
    };

    res.json({
      startDate: start,
      endDate: end,
      leaderboard,
      allPerformance: performance,
      aggregateStats
    });
  } catch (error) {
    console.error('Error fetching doctor performance:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   GET /api/analytics/payment-success-rate
// @desc    Get payment success/failure rates
// @access  Private (Admin)
router.get('/payment-success-rate', auth, authorize('admin'), async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    const end = endDate ? new Date(endDate) : new Date();
    const start = startDate ? new Date(startDate) : new Date(end.getTime() - 30 * 24 * 60 * 60 * 1000);

    const paymentStats = await Payment.aggregate([
      {
        $match: {
          createdAt: { $gte: start, $lte: end }
        }
      },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          totalAmount: { $sum: '$amount' }
        }
      }
    ]);

    // Payment method breakdown
    const methodBreakdown = await Payment.aggregate([
      {
        $match: {
          createdAt: { $gte: start, $lte: end },
          status: 'completed'
        }
      },
      {
        $group: {
          _id: '$paymentMethod',
          count: { $sum: 1 },
          totalAmount: { $sum: '$amount' }
        }
      }
    ]);

    // Daily success rate trend
    const dailyTrend = await Payment.aggregate([
      {
        $match: {
          createdAt: { $gte: start, $lte: end }
        }
      },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' },
            day: { $dayOfMonth: '$createdAt' }
          },
          total: { $sum: 1 },
          successful: {
            $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] }
          },
          failed: {
            $sum: { $cond: [{ $eq: ['$status', 'failed'] }, 1, 0] }
          },
          pending: {
            $sum: { $cond: [{ $eq: ['$status', 'pending'] }, 1, 0] }
          }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 } }
    ]);

    const totalPayments = paymentStats.reduce((sum, s) => sum + s.count, 0);
    const completedPayments = paymentStats.find(s => s._id === 'completed')?.count || 0;
    const successRate = totalPayments > 0 ? ((completedPayments / totalPayments) * 100).toFixed(2) : 0;

    res.json({
      startDate: start,
      endDate: end,
      statusBreakdown: paymentStats,
      methodBreakdown,
      dailyTrend,
      successRate,
      totalPayments,
      completedPayments
    });
  } catch (error) {
    console.error('Error fetching payment analytics:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   GET /api/analytics/cancellation-analysis
// @desc    Get cancellation rate analysis
// @access  Private (Admin/Doctor)
router.get('/cancellation-analysis', auth, async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const isAdmin = req.user.role === 'admin';
    
    const end = endDate ? new Date(endDate) : new Date();
    const start = startDate ? new Date(startDate) : new Date(end.getTime() - 30 * 24 * 60 * 60 * 1000);

    const matchCondition = {
      appointmentDate: { $gte: start, $lte: end }
    };

    if (!isAdmin) {
      matchCondition.doctor = new mongoose.Types.ObjectId(req.user.id);
    }

    // Cancellation trend over time
    const cancellationTrend = await Appointment.aggregate([
      { $match: matchCondition },
      {
        $group: {
          _id: {
            year: { $year: '$appointmentDate' },
            month: { $month: '$appointmentDate' }
          },
          total: { $sum: 1 },
          cancelled: {
            $sum: { $cond: [{ $eq: ['$status', 'cancelled'] }, 1, 0] }
          }
        }
      },
      {
        $project: {
          _id: 1,
          total: 1,
          cancelled: 1,
          cancellationRate: {
            $multiply: [
              { $divide: ['$cancelled', '$total'] },
              100
            ]
          }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } }
    ]);

    // Cancellation reasons (if stored)
    const cancellationReasons = await Appointment.aggregate([
      {
        $match: {
          ...matchCondition,
          status: 'cancelled',
          cancellationReason: { $exists: true, $ne: null }
        }
      },
      {
        $group: {
          _id: '$cancellationReason',
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } }
    ]);

    // Overall cancellation rate
    const overallStats = await Appointment.aggregate([
      { $match: matchCondition },
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          cancelled: {
            $sum: { $cond: [{ $eq: ['$status', 'cancelled'] }, 1, 0] }
          }
        }
      }
    ]);

    const stats = overallStats[0] || { total: 0, cancelled: 0 };
    const cancellationRate = stats.total > 0 ? ((stats.cancelled / stats.total) * 100).toFixed(2) : 0;

    res.json({
      startDate: start,
      endDate: end,
      cancellationRate,
      totalAppointments: stats.total,
      cancelledAppointments: stats.cancelled,
      trend: cancellationTrend,
      reasons: cancellationReasons
    });
  } catch (error) {
    console.error('Error fetching cancellation analysis:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   GET /api/analytics/comparison
// @desc    Get monthly/quarterly comparison data
// @access  Private (Admin)
router.get('/comparison', auth, authorize('admin'), async (req, res) => {
  try {
    const currentDate = new Date();
    
    // Current month
    const currentMonthStart = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    const currentMonthEnd = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
    
    // Previous month
    const previousMonthStart = new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1);
    const previousMonthEnd = new Date(currentDate.getFullYear(), currentDate.getMonth(), 0);
    
    // Current quarter
    const currentQuarter = Math.floor(currentDate.getMonth() / 3);
    const currentQuarterStart = new Date(currentDate.getFullYear(), currentQuarter * 3, 1);
    const currentQuarterEnd = new Date(currentDate.getFullYear(), (currentQuarter + 1) * 3, 0);
    
    // Previous quarter
    const previousQuarterStart = new Date(currentDate.getFullYear(), (currentQuarter - 1) * 3, 1);
    const previousQuarterEnd = new Date(currentDate.getFullYear(), currentQuarter * 3, 0);

    const getStats = async (startDate, endDate) => {
      const appointments = await Appointment.countDocuments({
        appointmentDate: { $gte: startDate, $lte: endDate }
      });

      const revenue = await Payment.aggregate([
        {
          $match: {
            status: 'completed',
            createdAt: { $gte: startDate, $lte: endDate }
          }
        },
        {
          $group: {
            _id: null,
            total: { $sum: '$amount' }
          }
        }
      ]);

      const patients = await Appointment.distinct('patient', {
        appointmentDate: { $gte: startDate, $lte: endDate }
      });

      return {
        appointments,
        revenue: revenue[0]?.total || 0,
        patients: patients.length
      };
    };

    const [currentMonthStats, previousMonthStats, currentQuarterStats, previousQuarterStats] = await Promise.all([
      getStats(currentMonthStart, currentMonthEnd),
      getStats(previousMonthStart, previousMonthEnd),
      getStats(currentQuarterStart, currentQuarterEnd),
      getStats(previousQuarterStart, previousQuarterEnd)
    ]);

    const calculateGrowth = (current, previous) => {
      if (previous === 0) return current > 0 ? 100 : 0;
      return (((current - previous) / previous) * 100).toFixed(2);
    };

    res.json({
      monthly: {
        current: {
          period: `${currentMonthStart.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}`,
          ...currentMonthStats
        },
        previous: {
          period: `${previousMonthStart.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}`,
          ...previousMonthStats
        },
        growth: {
          appointments: calculateGrowth(currentMonthStats.appointments, previousMonthStats.appointments),
          revenue: calculateGrowth(currentMonthStats.revenue, previousMonthStats.revenue),
          patients: calculateGrowth(currentMonthStats.patients, previousMonthStats.patients)
        }
      },
      quarterly: {
        current: {
          period: `Q${currentQuarter + 1} ${currentDate.getFullYear()}`,
          ...currentQuarterStats
        },
        previous: {
          period: `Q${currentQuarter} ${currentDate.getFullYear()}`,
          ...previousQuarterStats
        },
        growth: {
          appointments: calculateGrowth(currentQuarterStats.appointments, previousQuarterStats.appointments),
          revenue: calculateGrowth(currentQuarterStats.revenue, previousQuarterStats.revenue),
          patients: calculateGrowth(currentQuarterStats.patients, previousQuarterStats.patients)
        }
      }
    });
  } catch (error) {
    console.error('Error fetching comparison data:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   GET /api/analytics/patient-stats
// @desc    Get patient analytics (for patient dashboard)
// @access  Private (Patient)
router.get('/patient-stats', auth, authorize('patient'), async (req, res) => {
  try {
    const patientId = new mongoose.Types.ObjectId(req.user.id);
    const { startDate, endDate } = req.query;
    
    const end = endDate ? new Date(endDate) : new Date();
    const start = startDate ? new Date(startDate) : new Date(end.getTime() - 365 * 24 * 60 * 60 * 1000); // Last year

    // Appointment history trend
    const appointmentTrend = await Appointment.aggregate([
      {
        $match: {
          patient: patientId,
          appointmentDate: { $gte: start, $lte: end }
        }
      },
      {
        $group: {
          _id: {
            year: { $year: '$appointmentDate' },
            month: { $month: '$appointmentDate' }
          },
          count: { $sum: 1 }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } }
    ]);

    // Spending analysis
    const spendingAnalysis = await Payment.aggregate([
      {
        $match: {
          patient: patientId,
          status: 'completed',
          createdAt: { $gte: start, $lte: end }
        }
      },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' }
          },
          totalSpent: { $sum: '$amount' },
          count: { $sum: 1 }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } }
    ]);

    // Frequently visited specializations
    const specializations = await Appointment.aggregate([
      {
        $match: {
          patient: patientId
        }
      },
      {
        $lookup: {
          from: 'users',
          localField: 'doctor',
          foreignField: '_id',
          as: 'doctorDetails'
        }
      },
      { $unwind: '$doctorDetails' },
      {
        $group: {
          _id: '$doctorDetails.specialization',
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } },
      { $limit: 5 }
    ]);

    res.json({
      appointmentTrend,
      spendingAnalysis,
      topSpecializations: specializations
    });
  } catch (error) {
    console.error('Error fetching patient stats:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;
