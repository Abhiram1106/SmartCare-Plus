const express = require('express');
const router = express.Router();
const Intent = require('../models/Intent');
const ChatLog = require('../models/ChatLog');
const { auth, authorize } = require('../middleware/auth');

// @route   GET /api/intents
// @desc    Get all intents
// @access  Private (Admin)
router.get('/', auth, authorize('admin'), async (req, res) => {
  try {
    const { category, isActive } = req.query;
    let query = {};

    if (category) query.category = category;
    if (isActive !== undefined) query.isActive = isActive === 'true';

    const intents = await Intent.find(query).sort({ category: 1, tag: 1 });
    res.json(intents);
  } catch (error) {
    console.error('Error fetching intents:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   GET /api/intents/active
// @desc    Get active intents for training
// @access  Public
router.get('/active', async (req, res) => {
  try {
    const intents = await Intent.find({ isActive: true });
    res.json(intents);
  } catch (error) {
    console.error('Error fetching active intents:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   POST /api/intents
// @desc    Create new intent
// @access  Private (Admin)
router.post('/', auth, authorize('admin'), async (req, res) => {
  try {
    const { tag, patterns, responses, context, category } = req.body;

    const existingIntent = await Intent.findOne({ tag });
    if (existingIntent) {
      return res.status(400).json({ message: 'Intent with this tag already exists' });
    }

    const intent = new Intent({
      tag,
      patterns,
      responses,
      context,
      category
    });

    await intent.save();
    res.status(201).json(intent);
  } catch (error) {
    console.error('Error creating intent:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   PUT /api/intents/:id
// @desc    Update intent
// @access  Private (Admin)
router.put('/:id', auth, authorize('admin'), async (req, res) => {
  try {
    const { patterns, responses, context, category, isActive } = req.body;

    const intent = await Intent.findById(req.params.id);
    if (!intent) {
      return res.status(404).json({ message: 'Intent not found' });
    }

    if (patterns) intent.patterns = patterns;
    if (responses) intent.responses = responses;
    if (context !== undefined) intent.context = context;
    if (category) intent.category = category;
    if (isActive !== undefined) intent.isActive = isActive;

    await intent.save();
    res.json(intent);
  } catch (error) {
    console.error('Error updating intent:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   DELETE /api/intents/:id
// @desc    Delete intent
// @access  Private (Admin)
router.delete('/:id', auth, authorize('admin'), async (req, res) => {
  try {
    const intent = await Intent.findByIdAndDelete(req.params.id);
    
    if (!intent) {
      return res.status(404).json({ message: 'Intent not found' });
    }

    res.json({ message: 'Intent deleted successfully' });
  } catch (error) {
    console.error('Error deleting intent:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   POST /api/intents/seed/enhanced
// @desc    Seed enhanced intents dataset
// @access  Private (Admin)
router.post('/seed/enhanced', auth, authorize('admin'), async (req, res) => {
  try {
    const enhancedIntents = require('../data/enhancedIntents');
    
    let created = 0;
    let updated = 0;
    
    for (const intentData of enhancedIntents) {
      const existingIntent = await Intent.findOne({ tag: intentData.tag });
      if (existingIntent) {
        // Update existing intent
        existingIntent.patterns = intentData.patterns;
        existingIntent.responses = intentData.responses;
        existingIntent.category = intentData.category;
        existingIntent.context = intentData.context;
        await existingIntent.save();
        updated++;
      } else {
        // Create new intent
        await Intent.create(intentData);
        created++;
      }
    }

    res.json({ 
      message: 'Enhanced intents seeded successfully', 
      created,
      updated,
      total: enhancedIntents.length 
    });
  } catch (error) {
    console.error('Error seeding enhanced intents:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   POST /api/intents/seed
// @desc    Seed basic intents
// @access  Private (Admin)
router.post('/seed', auth, authorize('admin'), async (req, res) => {
  try {
    const defaultIntents = [
      {
        tag: 'greeting',
        patterns: ['hi', 'hello', 'hey', 'good morning', 'good afternoon', 'good evening'],
        responses: ['Hello! How can I help you today?', 'Hi there! What can I do for you?', 'Hey! How may I assist you?'],
        category: 'general'
      },
      {
        tag: 'goodbye',
        patterns: ['bye', 'goodbye', 'see you', 'talk to you later', 'catch you later'],
        responses: ['Goodbye! Take care!', 'See you later! Stay healthy!', 'Bye! Have a great day!'],
        category: 'general'
      },
      {
        tag: 'thanks',
        patterns: ['thank you', 'thanks', 'appreciate it', 'thank you very much'],
        responses: ['You\'re welcome!', 'Happy to help!', 'My pleasure!', 'Anytime!'],
        category: 'general'
      },
      {
        tag: 'appointment_booking',
        patterns: ['book appointment', 'schedule appointment', 'make appointment', 'i need to see a doctor', 'book doctor'],
        responses: ['I can help you book an appointment. Please go to the Doctors page and select your preferred doctor.', 'To book an appointment, visit our Doctors section and choose a doctor based on your needs.'],
        category: 'appointment'
      },
      {
        tag: 'appointment_cancel',
        patterns: ['cancel appointment', 'cancel my appointment', 'i want to cancel', 'remove appointment'],
        responses: ['You can cancel your appointment from the My Appointments page. Would you like me to guide you there?'],
        category: 'appointment'
      },
      {
        tag: 'find_doctor',
        patterns: ['find doctor', 'search doctor', 'available doctors', 'list of doctors', 'show doctors'],
        responses: ['You can browse all available doctors in the Doctors section. You can filter by specialization too!'],
        category: 'doctor'
      },
      {
        tag: 'doctor_specialization',
        patterns: ['what specializations', 'types of doctors', 'specialist available', 'cardiology', 'dermatology'],
        responses: ['We have doctors from various specializations including Cardiology, Dermatology, Pediatrics, Orthopedics, and more. Visit the Doctors page to see all.'],
        category: 'doctor'
      },
      {
        tag: 'payment_info',
        patterns: ['payment', 'how to pay', 'payment methods', 'can i pay online', 'payment options'],
        responses: ['We accept Card, UPI, Net Banking, and Wallet payments. All payments are secured with passkey verification.'],
        category: 'payment'
      },
      {
        tag: 'payment_status',
        patterns: ['payment status', 'check payment', 'payment history', 'transaction history'],
        responses: ['You can view your payment history in the My Payments section of your dashboard.'],
        category: 'payment'
      },
      {
        tag: 'emergency',
        patterns: ['emergency', 'urgent', 'critical', 'help immediately', 'emergency contact'],
        responses: ['For medical emergencies, please call 108 or visit the nearest emergency room immediately. This is not for emergency services.'],
        category: 'emergency'
      },
      {
        tag: 'symptoms',
        patterns: ['i have fever', 'headache', 'stomach pain', 'feeling sick', 'not feeling well'],
        responses: ['I recommend booking an appointment with a doctor. Please describe your symptoms when booking so the doctor can prepare.'],
        category: 'medical'
      }
    ];

    // Clear existing intents (optional)
    // await Intent.deleteMany({});

    for (const intentData of defaultIntents) {
      const existingIntent = await Intent.findOne({ tag: intentData.tag });
      if (!existingIntent) {
        await Intent.create(intentData);
      }
    }

    res.json({ message: 'Intents seeded successfully', count: defaultIntents.length });
  } catch (error) {
    console.error('Error seeding intents:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;
