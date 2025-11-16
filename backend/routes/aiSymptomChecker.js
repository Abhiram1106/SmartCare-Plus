const express = require('express');
const router = express.Router();
const SymptomAnalysis = require('../models/SymptomAnalysis');
const { analyzeSymptoms } = require('../utils/aiSymptomAnalyzer');
const { auth } = require('../middleware/auth');

// @route   POST /api/ai-symptom-checker/analyze
// @desc    Analyze symptoms and predict diseases
// @access  Private
router.post('/analyze', auth, async (req, res) => {
  try {
    const { symptoms, additionalInfo } = req.body;

    if (!symptoms || !Array.isArray(symptoms) || symptoms.length === 0) {
      return res.status(400).json({ message: 'Please provide at least one symptom' });
    }

    // Validate symptom structure
    for (const symptom of symptoms) {
      if (!symptom.symptom || !symptom.severity) {
        return res.status(400).json({ 
          message: 'Each symptom must have "symptom" and "severity" fields' 
        });
      }
    }

    // Perform AI analysis
    console.log('Analyzing symptoms:', symptoms);
    const analysis = analyzeSymptoms({ symptoms }, additionalInfo || {});
    console.log('Analysis result:', JSON.stringify(analysis, null, 2));

    // Check if we have predictions
    if (!analysis.predictions || analysis.predictions.length === 0) {
      return res.status(200).json({
        success: true,
        message: 'No matching conditions found for the provided symptoms',
        data: {
          predictions: [],
          recommendedSpecialist: 'General Physician',
          warning: 'Please consult a healthcare professional for accurate diagnosis.'
        }
      });
    }

    // Save analysis to database
    const symptomAnalysis = await SymptomAnalysis.create({
      user: req.user.id,
      symptoms,
      additionalInfo: additionalInfo || {},
      predictions: analysis.predictions,
      urgencyLevel: analysis.urgencyLevel,
      recommendedSpecialist: analysis.recommendedSpecialist,
      recommendedTests: analysis.recommendedTests
    });

    await symptomAnalysis.populate('user', 'name email age gender');

    res.status(201).json({
      success: true,
      message: 'Symptom analysis completed',
      data: {
        _id: symptomAnalysis._id,
        analysisId: symptomAnalysis._id,
        symptoms: symptomAnalysis.symptoms,
        predictions: symptomAnalysis.predictions,
        urgencyLevel: symptomAnalysis.urgencyLevel,
        recommendedSpecialist: symptomAnalysis.recommendedSpecialist,
        recommendedTests: symptomAnalysis.recommendedTests,
        createdAt: symptomAnalysis.createdAt,
        warning: symptomAnalysis.urgencyLevel === 'emergency' 
          ? '⚠️ EMERGENCY: Seek immediate medical attention!' 
          : symptomAnalysis.urgencyLevel === 'high'
          ? '⚠️ HIGH PRIORITY: Consult a doctor as soon as possible'
          : 'This is an AI prediction. Please consult a healthcare professional for accurate diagnosis.'
      }
    });
  } catch (error) {
    console.error('Error analyzing symptoms:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   GET /api/ai-symptom-checker/history
// @desc    Get user's symptom analysis history
// @access  Private
router.get('/history', auth, async (req, res) => {
  try {
    const analyses = await SymptomAnalysis.find({ user: req.user.id })
      .sort({ createdAt: -1 })
      .limit(20);

    res.json({
      success: true,
      count: analyses.length,
      data: analyses
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   GET /api/ai-symptom-checker/analysis/:id
// @desc    Get specific symptom analysis
// @access  Private
router.get('/analysis/:id', auth, async (req, res) => {
  try {
    const analysis = await SymptomAnalysis.findById(req.params.id)
      .populate('user', 'name email age gender')
      .populate('appointmentBooked');

    if (!analysis) {
      return res.status(404).json({ message: 'Analysis not found' });
    }

    // Check authorization
    if (analysis.user._id.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized' });
    }

    res.json({
      success: true,
      data: analysis
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   GET /api/ai-symptom-checker/symptoms-list
// @desc    Get list of common symptoms for autocomplete
// @access  Public
router.get('/symptoms-list', async (req, res) => {
  try {
    const commonSymptoms = [
      'Fever', 'Cough', 'Headache', 'Sore throat', 'Runny nose',
      'Body aches', 'Fatigue', 'Nausea', 'Vomiting', 'Diarrhea',
      'Abdominal pain', 'Chest pain', 'Shortness of breath', 'Dizziness',
      'Rash', 'Itchy skin', 'Joint pain', 'Muscle pain', 'Back pain',
      'Frequent urination', 'Painful urination', 'Blurred vision',
      'Loss of appetite', 'Weight loss', 'Weight gain', 'Sweating',
      'Chills', 'Congestion', 'Sneezing', 'Difficulty swallowing',
      'Heartburn', 'Bloating', 'Constipation', 'Insomnia',
      'Anxiety', 'Depression', 'Memory problems', 'Confusion',
      'Numbness', 'Tingling', 'Tremors', 'Seizures',
      'Palpitations', 'High blood pressure', 'Low blood pressure',
      'Swelling', 'Bruising', 'Bleeding', 'Nosebleeds'
    ].sort();

    res.json({
      success: true,
      data: commonSymptoms
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   GET /api/ai-symptom-checker/specialists
// @desc    Get list of medical specialists
// @access  Public
router.get('/specialists', async (req, res) => {
  try {
    const specialists = [
      'General Physician',
      'Cardiologist',
      'Dermatologist',
      'Endocrinologist',
      'Gastroenterologist',
      'Neurologist',
      'Pulmonologist',
      'Urologist',
      'Orthopedic Surgeon',
      'ENT Specialist',
      'Ophthalmologist',
      'Psychiatrist',
      'Gynecologist',
      'Pediatrician',
      'Oncologist',
      'Infectious Disease Specialist',
      'Rheumatologist',
      'Nephrologist'
    ].sort();

    res.json({
      success: true,
      data: specialists
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   PUT /api/ai-symptom-checker/analysis/:id/follow-up
// @desc    Mark analysis as followed up with appointment
// @access  Private
router.put('/analysis/:id/follow-up', auth, async (req, res) => {
  try {
    const { appointmentId } = req.body;

    const analysis = await SymptomAnalysis.findById(req.params.id);
    if (!analysis) {
      return res.status(404).json({ message: 'Analysis not found' });
    }

    if (analysis.user.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    analysis.followedUp = true;
    if (appointmentId) {
      analysis.appointmentBooked = appointmentId;
    }
    await analysis.save();

    res.json({
      success: true,
      message: 'Analysis marked as followed up',
      data: analysis
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   DELETE /api/ai-symptom-checker/analysis/:id
// @desc    Delete a symptom analysis review
// @access  Private
router.delete('/analysis/:id', auth, async (req, res) => {
  try {
    const analysis = await SymptomAnalysis.findById(req.params.id);

    if (!analysis) {
      return res.status(404).json({ 
        success: false,
        message: 'Analysis not found' 
      });
    }

    // Check authorization - user can only delete their own analyses
    if (analysis.user.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ 
        success: false,
        message: 'Not authorized to delete this analysis' 
      });
    }

    await SymptomAnalysis.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: 'Analysis deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting analysis:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error while deleting analysis', 
      error: error.message 
    });
  }
});

module.exports = router;
