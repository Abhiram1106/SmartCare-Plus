const mongoose = require('mongoose');
const Review = require('../models/Review');
const Doctor = require('../models/Doctor');
const User = require('../models/User');
require('dotenv').config();

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ MongoDB Connected for Review Seeding');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    process.exit(1);
  }
};

const sampleReviewTemplates = [
  {
    title: 'Excellent doctor, highly recommend!',
    comment: 'Dr. {name} is incredibly professional and caring. Took time to listen to all my concerns and explained everything clearly. The treatment plan was effective and I felt much better within days. The clinic was clean and staff were friendly.',
    rating: 5,
    detailedRatings: { professionalism: 5, communication: 5, waitTime: 5, facilityQuality: 5 }
  },
  {
    title: 'Very satisfied with the consultation',
    comment: 'Had a great experience with Dr. {name}. They were very thorough in their examination and diagnosis. Appreciated the detailed explanation of my condition and the treatment options available.',
    rating: 5,
    detailedRatings: { professionalism: 5, communication: 5, waitTime: 4, facilityQuality: 5 }
  },
  {
    title: 'Professional and knowledgeable',
    comment: 'Dr. {name} demonstrated excellent medical knowledge. The consultation was thorough and I felt confident in the treatment plan. Would definitely visit again.',
    rating: 4,
    detailedRatings: { professionalism: 5, communication: 4, waitTime: 4, facilityQuality: 4 }
  },
  {
    title: 'Good doctor but long wait time',
    comment: 'Dr. {name} is skilled and caring, but the wait time was quite long. The consultation itself was good and thorough. Would recommend if you have time to spare.',
    rating: 4,
    detailedRatings: { professionalism: 5, communication: 4, waitTime: 2, facilityQuality: 4 }
  },
  {
    title: 'Caring and patient doctor',
    comment: 'Dr. {name} was very patient and answered all my questions. Made me feel comfortable and explained the treatment options in simple terms. Great experience overall.',
    rating: 5,
    detailedRatings: { professionalism: 5, communication: 5, waitTime: 5, facilityQuality: 4 }
  },
  {
    title: 'Effective treatment, quick recovery',
    comment: 'The treatment prescribed by Dr. {name} worked wonderfully. I recovered much faster than expected. Professional service and clean clinic environment.',
    rating: 5,
    detailedRatings: { professionalism: 5, communication: 4, waitTime: 4, facilityQuality: 5 }
  },
  {
    title: 'Decent consultation',
    comment: 'Had a decent experience with Dr. {name}. The consultation was standard and the treatment seems to be working. Nothing exceptional but competent care.',
    rating: 3,
    detailedRatings: { professionalism: 4, communication: 3, waitTime: 3, facilityQuality: 3 }
  },
  {
    title: 'Compassionate and understanding',
    comment: 'Dr. {name} showed great compassion and understanding. Made me feel heard and valued as a patient. The medical advice was sound and I\'m seeing improvements.',
    rating: 5,
    detailedRatings: { professionalism: 5, communication: 5, waitTime: 4, facilityQuality: 4 }
  },
  {
    title: 'Great experience, will return',
    comment: 'Very impressed with Dr. {name}\'s approach to patient care. Thorough examination, clear communication, and effective treatment. Definitely coming back for future needs.',
    rating: 5,
    detailedRatings: { professionalism: 5, communication: 5, waitTime: 5, facilityQuality: 5 }
  },
  {
    title: 'Good doctor, helpful staff',
    comment: 'Dr. {name} was professional and helpful. The clinic staff were also very friendly and efficient. Overall a positive experience.',
    rating: 4,
    detailedRatings: { professionalism: 4, communication: 4, waitTime: 4, facilityQuality: 4 }
  }
];

const doctorResponses = [
  'Thank you so much for your kind words! It was a pleasure treating you. Wishing you continued good health.',
  'I appreciate your feedback. Patient satisfaction is my top priority. Feel free to reach out if you have any concerns.',
  'Thank you for taking the time to review. I\'m glad I could help with your recovery. Take care!',
  'I apologize for the wait time. We\'re working on improving our scheduling. Thank you for your patience and understanding.',
  'Your positive feedback means a lot to me. Thank you for trusting me with your care.',
];

const seedReviews = async () => {
  try {
    await connectDB();

    console.log('🔍 Finding approved doctors...');
    const doctors = await Doctor.find().populate('user').limit(10);
    
    if (doctors.length === 0) {
      console.log('❌ No doctors found. Please seed doctors first.');
      process.exit(1);
    }

    console.log(`✅ Found ${doctors.length} doctors`);

    console.log('🔍 Finding patient users...');
    const patients = await User.find({ role: 'patient' }).limit(20);
    
    if (patients.length === 0) {
      console.log('❌ No patients found. Please seed users first.');
      process.exit(1);
    }

    console.log(`✅ Found ${patients.length} patients`);

    console.log('🗑️ Clearing existing reviews...');
    await Review.deleteMany({});

    console.log('📝 Creating sample reviews...');
    let reviewsCreated = 0;
    const reviewsToCreate = [];

    // Create 3-7 reviews per doctor
    for (const doctor of doctors) {
      const numReviews = Math.floor(Math.random() * 5) + 3; // 3-7 reviews
      const doctorName = doctor.name || doctor.user?.name || 'the doctor';
      
      // Randomly select patients for this doctor
      const shuffledPatients = [...patients].sort(() => 0.5 - Math.random());
      const selectedPatients = shuffledPatients.slice(0, numReviews);

      for (let i = 0; i < numReviews && i < selectedPatients.length; i++) {
        const template = sampleReviewTemplates[Math.floor(Math.random() * sampleReviewTemplates.length)];
        const patient = selectedPatients[i];

        const review = {
          patient: patient._id,
          doctor: doctor._id,
          rating: template.rating,
          title: template.title,
          comment: template.comment.replace('{name}', doctorName),
          detailedRatings: template.detailedRatings,
          status: 'approved',
          verified: Math.random() > 0.3, // 70% verified
          helpfulVotes: Math.floor(Math.random() * 15),
          notHelpfulVotes: Math.floor(Math.random() * 3),
          createdAt: new Date(Date.now() - Math.random() * 90 * 24 * 60 * 60 * 1000), // Random date within last 90 days
        };

        // 40% chance of doctor response
        if (Math.random() > 0.6 && review.rating >= 4) {
          review.response = {
            comment: doctorResponses[Math.floor(Math.random() * doctorResponses.length)],
            respondedAt: new Date(review.createdAt.getTime() + Math.random() * 7 * 24 * 60 * 60 * 1000)
          };
        }

        reviewsToCreate.push(review);
      }
    }

    // Insert all reviews
    await Review.insertMany(reviewsToCreate);
    reviewsCreated = reviewsToCreate.length;

    console.log(`✅ Created ${reviewsCreated} sample reviews`);

    // Update doctor ratings
    console.log('🔄 Updating doctor ratings...');
    for (const doctor of doctors) {
      const stats = await Review.calculateDoctorRating(doctor._id);
      await Doctor.findByIdAndUpdate(doctor._id, {
        rating: stats.averageRating,
        ratingBreakdown: stats.ratingBreakdown
      });
    }

    console.log('✅ Doctor ratings updated successfully');

    // Display summary
    console.log('\n📊 Review Seeding Summary:');
    console.log(`   Total Reviews: ${reviewsCreated}`);
    console.log(`   Doctors with Reviews: ${doctors.length}`);
    console.log(`   Average Reviews per Doctor: ${(reviewsCreated / doctors.length).toFixed(1)}`);
    
    const topRatedDoctors = await Doctor.find({ rating: { $gte: 4.5 } }).countDocuments();
    console.log(`   Top-Rated Doctors (4.5+): ${topRatedDoctors}`);

    console.log('\n✨ Review seeding completed successfully!');
    process.exit(0);

  } catch (error) {
    console.error('❌ Error seeding reviews:', error);
    process.exit(1);
  }
};

// Run seeder
seedReviews();
