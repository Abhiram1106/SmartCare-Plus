const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
require('dotenv').config();

// Connect to database
mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/smartcareplus')
  .then(() => {
    console.log('✓ Connected to MongoDB');
    console.log('  Database:', mongoose.connection.name);
  })
  .catch(err => console.error('✗ MongoDB connection error:', err));

const User = require('./models/User');
const Appointment = require('./models/Appointment');
const Payment = require('./models/Payment');

async function testAnalytics() {
  try {
    console.log('\n=== Testing Analytics Data ===\n');

    // 1. Check Users
    const userCount = await User.countDocuments();
    const adminCount = await User.countDocuments({ role: 'admin' });
    const doctorCount = await User.countDocuments({ role: 'doctor' });
    const patientCount = await User.countDocuments({ role: 'patient' });
    console.log('👥 Users:');
    console.log(`   Total: ${userCount}`);
    console.log(`   Admins: ${adminCount}`);
    console.log(`   Doctors: ${doctorCount}`);
    console.log(`   Patients: ${patientCount}`);

    // 2. Check Appointments
    const appointmentCount = await Appointment.countDocuments();
    const appointmentsByStatus = await Appointment.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]);
    console.log('\n📅 Appointments:');
    console.log(`   Total: ${appointmentCount}`);
    appointmentsByStatus.forEach(s => {
      console.log(`   ${s._id}: ${s.count}`);
    });

    // 3. Check date range of appointments
    const dateRange = await Appointment.aggregate([
      {
        $group: {
          _id: null,
          minDate: { $min: '$appointmentDate' },
          maxDate: { $max: '$appointmentDate' }
        }
      }
    ]);
    if (dateRange.length > 0) {
      console.log(`   Date Range: ${dateRange[0].minDate.toISOString().split('T')[0]} to ${dateRange[0].maxDate.toISOString().split('T')[0]}`);
    }

    // 4. Check Payments
    const paymentCount = await Payment.countDocuments();
    const totalRevenue = await Payment.aggregate([
      { $match: { status: 'completed' } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);
    const paymentsByStatus = await Payment.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]);
    console.log('\n💰 Payments:');
    console.log(`   Total: ${paymentCount}`);
    paymentsByStatus.forEach(s => {
      console.log(`   ${s._id}: ${s.count}`);
    });
    if (totalRevenue.length > 0) {
      console.log(`   Total Revenue: ₹${totalRevenue[0].total.toLocaleString()}`);
    }

    // 5. Test Revenue Analytics Query
    console.log('\n📊 Testing Revenue Analytics Query...');
    const end = new Date();
    const start = new Date(end.getTime() - 30 * 24 * 60 * 60 * 1000);
    
    const revenueData = await Payment.aggregate([
      {
        $match: {
          status: 'completed',
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
          revenue: { $sum: '$amount' },
          transactions: { $sum: 1 }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 } },
      { $limit: 5 }
    ]);
    console.log(`   Found ${revenueData.length} revenue data points in last 30 days`);
    if (revenueData.length > 0) {
      console.log('   Sample:', JSON.stringify(revenueData[0], null, 2));
    }

    // 6. Test Appointment Analytics Query
    console.log('\n📊 Testing Appointment Analytics Query...');
    const appointmentData = await Appointment.aggregate([
      {
        $match: {
          appointmentDate: { $gte: start, $lte: end }
        }
      },
      {
        $group: {
          _id: {
            year: { $year: '$appointmentDate' },
            month: { $month: '$appointmentDate' },
            day: { $dayOfMonth: '$appointmentDate' }
          },
          total: { $sum: 1 },
          confirmed: {
            $sum: { $cond: [{ $eq: ['$status', 'confirmed'] }, 1, 0] }
          }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 } },
      { $limit: 5 }
    ]);
    console.log(`   Found ${appointmentData.length} appointment data points in last 30 days`);
    if (appointmentData.length > 0) {
      console.log('   Sample:', JSON.stringify(appointmentData[0], null, 2));
    }

    // 7. Get an admin user for testing
    const adminUser = await User.findOne({ role: 'admin' });
    if (adminUser) {
      console.log('\n🔑 Admin User for Testing:');
      console.log(`   Email: ${adminUser.email}`);
      console.log(`   ID: ${adminUser._id}`);
      
      // Generate a test token
      const token = jwt.sign(
        { userId: adminUser._id },
        process.env.JWT_SECRET || 'your-secret-key-here',
        { expiresIn: '1h' }
      );
      console.log('\n   Test Token (valid for 1 hour):');
      console.log(`   ${token}`);
      console.log('\n   Test with curl:');
      console.log(`   curl -H "Authorization: Bearer ${token}" http://localhost:5000/api/analytics/revenue`);
    }

    console.log('\n=== Test Complete ===\n');
    process.exit(0);
  } catch (error) {
    console.error('Error during test:', error);
    process.exit(1);
  }
}

// Run test after connection is established
setTimeout(testAnalytics, 1000);
