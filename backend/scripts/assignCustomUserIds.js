/**
 * Script to assign custom User IDs (SMP####) to existing users
 * Run this once to update all existing users in the database
 */

const mongoose = require('mongoose');
const User = require('../models/User');
require('dotenv').config();

const assignCustomUserIds = async () => {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB\n');

    // Find all users without a custom userId
    const usersWithoutId = await User.find({ 
      $or: [
        { userId: { $exists: false } },
        { userId: null },
        { userId: '' }
      ]
    }).sort({ createdAt: 1 }); // Sort by creation date

    console.log(`📊 Found ${usersWithoutId.length} users without custom IDs\n`);

    if (usersWithoutId.length === 0) {
      console.log('✅ All users already have custom IDs!');
      await mongoose.connection.close();
      return;
    }

    // Get the highest existing userId number
    const userWithHighestId = await User.findOne({ userId: { $exists: true, $ne: null, $ne: '' } })
      .sort({ userId: -1 })
      .select('userId');

    let startNumber = 1000; // Default starting number

    if (userWithHighestId && userWithHighestId.userId) {
      const lastNumber = parseInt(userWithHighestId.userId.replace('SMP', ''));
      if (!isNaN(lastNumber)) {
        startNumber = lastNumber + 1;
      }
      console.log(`📌 Starting from: SMP${startNumber}\n`);
    }

    // Assign custom IDs to users
    let successCount = 0;
    let failCount = 0;

    for (let i = 0; i < usersWithoutId.length; i++) {
      const user = usersWithoutId[i];
      const newUserId = `SMP${startNumber + i}`;

      try {
        user.userId = newUserId;
        await user.save();
        
        console.log(`✅ Assigned ${newUserId} to ${user.name} (${user.email}) - ${user.role}`);
        successCount++;
      } catch (error) {
        console.error(`❌ Failed to assign ID to ${user.email}:`, error.message);
        failCount++;
      }
    }

    console.log('\n═══════════════════════════════════════');
    console.log('📊 SUMMARY:');
    console.log(`✅ Successfully assigned: ${successCount} IDs`);
    console.log(`❌ Failed: ${failCount} IDs`);
    console.log(`📈 ID Range: SMP${startNumber} to SMP${startNumber + successCount - 1}`);
    console.log('═══════════════════════════════════════\n');

    // Display all users with their new IDs
    console.log('👥 ALL USERS:');
    const allUsers = await User.find().select('userId name email role createdAt').sort({ userId: 1 });
    allUsers.forEach(user => {
      console.log(`  ${user.userId || 'NO_ID'} | ${user.name.padEnd(20)} | ${user.email.padEnd(30)} | ${user.role}`);
    });

    console.log('\n🎉 Custom User ID assignment completed!');
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.connection.close();
    console.log('\n🔌 Disconnected from MongoDB');
  }
};

// Run the script
assignCustomUserIds();
