const express = require('express');
const router = express.Router();
const MedicalRecord = require('../models/MedicalRecord');
const { auth, authorize } = require('../middleware/auth');

// @route   GET /api/ehr/:patientId
// @desc    Get complete medical record for a patient
// @access  Private (Patient themselves or their doctors)
router.get('/:patientId', auth, async (req, res) => {
  try {
    const { patientId } = req.params;

    // Authorization check: patient can view their own, doctors can view their patients'
    if (req.user.id !== patientId && req.user.role !== 'doctor' && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to view this medical record' });
    }

    let medicalRecord = await MedicalRecord.findOne({ patient: patientId })
      .populate('patient', 'name email phone')
      .populate('labResults.orderedBy', 'name specialty')
      .populate('medications.prescribedBy', 'name specialty')
      .populate('vitalSigns.recordedBy', 'name');

    if (!medicalRecord) {
      // Create empty record if doesn't exist
      medicalRecord = await MedicalRecord.create({ patient: patientId });
    }

    res.json({
      success: true,
      data: medicalRecord
    });
  } catch (error) {
    console.error('Error fetching medical record:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   PUT /api/ehr/:patientId/basic
// @desc    Update basic health information
// @access  Private (Patient or Admin)
router.put('/:patientId/basic', auth, async (req, res) => {
  try {
    const { patientId } = req.params;
    const { bloodType, emergencyContact, insuranceInfo, height, weight } = req.body;

    if (req.user.id !== patientId && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized' });
    }

    let medicalRecord = await MedicalRecord.findOne({ patient: patientId });
    
    if (!medicalRecord) {
      medicalRecord = new MedicalRecord({ patient: patientId });
    }

    // Update basic info
    if (bloodType) medicalRecord.bloodType = bloodType;
    if (emergencyContact) medicalRecord.emergencyContact = emergencyContact;
    if (insuranceInfo) medicalRecord.insuranceInfo = insuranceInfo;
    
    // If height and weight provided, add to vital signs
    if (height || weight) {
      const currentHeight = height || (medicalRecord.vitalSigns.length > 0 ? 
        medicalRecord.vitalSigns[medicalRecord.vitalSigns.length - 1].height : null);
      const currentWeight = weight || (medicalRecord.vitalSigns.length > 0 ? 
        medicalRecord.vitalSigns[medicalRecord.vitalSigns.length - 1].weight : null);
      
      const bmi = medicalRecord.calculateBMI(currentWeight, currentHeight);
      
      medicalRecord.vitalSigns.push({
        height: currentHeight,
        weight: currentWeight,
        bmi,
        recordedBy: req.user.id,
        recordedDate: new Date()
      });
    }

    await medicalRecord.save();

    res.json({
      success: true,
      message: 'Basic health information updated',
      data: medicalRecord
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   POST /api/ehr/:patientId/allergies
// @desc    Add allergy to medical record
// @access  Private (Patient, Doctor, or Admin)
router.post('/:patientId/allergies', auth, async (req, res) => {
  try {
    const { patientId } = req.params;
    const { allergen, reaction, severity, diagnosedDate } = req.body;

    // Authorization: patient can add to their own record
    if (req.user.id !== patientId && req.user.role !== 'doctor' && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized' });
    }

    if (!allergen || !reaction || !severity) {
      return res.status(400).json({ message: 'Please provide allergen, reaction, and severity' });
    }

    let medicalRecord = await MedicalRecord.findOne({ patient: patientId });
    if (!medicalRecord) {
      medicalRecord = new MedicalRecord({ patient: patientId });
    }

    medicalRecord.allergies.push({ allergen, reaction, severity, diagnosedDate });
    await medicalRecord.save();

    res.status(201).json({
      success: true,
      message: 'Allergy added to medical record',
      data: medicalRecord.allergies
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   POST /api/ehr/:patientId/immunizations
// @desc    Add immunization record
// @access  Private (Doctor only)
router.post('/:patientId/immunizations', auth, authorize('doctor', 'admin'), async (req, res) => {
  try {
    const { patientId } = req.params;
    const { vaccineName, dateAdministered, nextDueDate, administeredBy, batchNumber } = req.body;

    if (!vaccineName || !dateAdministered) {
      return res.status(400).json({ message: 'Vaccine name and date are required' });
    }

    const medicalRecord = await MedicalRecord.findOne({ patient: patientId });
    if (!medicalRecord) {
      return res.status(404).json({ message: 'Medical record not found' });
    }

    medicalRecord.immunizations.push({
      vaccineName,
      dateAdministered,
      nextDueDate,
      administeredBy,
      batchNumber
    });
    await medicalRecord.save();

    res.status(201).json({
      success: true,
      message: 'Immunization record added',
      data: medicalRecord.immunizations
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   POST /api/ehr/:patientId/chronic-conditions
// @desc    Add chronic condition
// @access  Private (Patient, Doctor, or Admin)
router.post('/:patientId/chronic-conditions', auth, async (req, res) => {
  try {
    const { patientId } = req.params;
    const { condition, diagnosedDate, status, medications, notes } = req.body;

    // Authorization: patient can add to their own record
    if (req.user.id !== patientId && req.user.role !== 'doctor' && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized' });
    }

    if (!condition || !diagnosedDate) {
      return res.status(400).json({ message: 'Condition and diagnosed date are required' });
    }

    let medicalRecord = await MedicalRecord.findOne({ patient: patientId });
    if (!medicalRecord) {
      medicalRecord = new MedicalRecord({ patient: patientId });
    }

    medicalRecord.chronicConditions.push({
      condition,
      diagnosedDate,
      status: status || 'active',
      medications: medications || [],
      notes
    });
    await medicalRecord.save();

    res.status(201).json({
      success: true,
      message: 'Chronic condition added',
      data: medicalRecord.chronicConditions
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   POST /api/ehr/:patientId/lab-results
// @desc    Add lab result
// @access  Private (Doctor only)
router.post('/:patientId/lab-results', auth, authorize('doctor', 'admin'), async (req, res) => {
  try {
    const { patientId } = req.params;
    const { testName, testDate, result, normalRange, unit, status, labName, attachments } = req.body;

    if (!testName || !testDate || !result) {
      return res.status(400).json({ message: 'Test name, date, and result are required' });
    }

    const medicalRecord = await MedicalRecord.findOne({ patient: patientId });
    if (!medicalRecord) {
      return res.status(404).json({ message: 'Medical record not found' });
    }

    medicalRecord.labResults.push({
      testName,
      testDate,
      result,
      normalRange,
      unit,
      status: status || 'normal',
      orderedBy: req.user.id,
      labName,
      attachments: attachments || []
    });
    await medicalRecord.save();

    res.status(201).json({
      success: true,
      message: 'Lab result added',
      data: medicalRecord.labResults
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   POST /api/ehr/:patientId/vitals
// @desc    Record vital signs
// @access  Private (Patient, Doctor, or Admin)
router.post('/:patientId/vitals', auth, async (req, res) => {
  try {
    const { patientId } = req.params;
    const { bloodPressure, heartRate, temperature, respiratoryRate, oxygenSaturation, weight, height } = req.body;

    // Authorization: patient can add to their own record
    if (req.user.id !== patientId && req.user.role !== 'doctor' && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized' });
    }

    let medicalRecord = await MedicalRecord.findOne({ patient: patientId });
    if (!medicalRecord) {
      medicalRecord = new MedicalRecord({ patient: patientId });
    }

    const bmi = medicalRecord.calculateBMI(weight, height);

    medicalRecord.vitalSigns.push({
      bloodPressure,
      heartRate,
      temperature,
      respiratoryRate,
      oxygenSaturation,
      weight,
      height,
      bmi,
      recordedBy: req.user.id,
      recordedDate: new Date()
    });
    await medicalRecord.save();

    res.status(201).json({
      success: true,
      message: 'Vital signs recorded',
      data: medicalRecord.vitalSigns[medicalRecord.vitalSigns.length - 1]
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   POST /api/ehr/:patientId/medications
// @desc    Add medication to record (self-reported or prescribed)
// @access  Private (Patient, Doctor, or Admin)
router.post('/:patientId/medications', auth, async (req, res) => {
  try {
    const { patientId } = req.params;
    const { name, dosage, frequency, startDate, endDate } = req.body;

    // Authorization: patient can add to their own record
    if (req.user.id !== patientId && req.user.role !== 'doctor' && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized' });
    }

    if (!name || !dosage || !frequency || !startDate) {
      return res.status(400).json({ message: 'Name, dosage, frequency, and start date are required' });
    }

    let medicalRecord = await MedicalRecord.findOne({ patient: patientId });
    if (!medicalRecord) {
      medicalRecord = new MedicalRecord({ patient: patientId });
    }

    medicalRecord.medications.push({
      name,
      dosage,
      frequency,
      startDate,
      endDate,
      prescribedBy: req.user.role === 'doctor' ? req.user.id : null,
      status: 'active'
    });
    await medicalRecord.save();

    res.status(201).json({
      success: true,
      message: 'Medication added to record',
      data: medicalRecord.medications
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   GET /api/ehr/:patientId/summary
// @desc    Get health summary for patient
// @access  Private
router.get('/:patientId/summary', auth, async (req, res) => {
  try {
    const { patientId } = req.params;

    if (req.user.id !== patientId && req.user.role !== 'doctor' && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized' });
    }

    const medicalRecord = await MedicalRecord.findOne({ patient: patientId })
      .populate('patient', 'name email age gender');

    if (!medicalRecord) {
      return res.status(404).json({ message: 'Medical record not found' });
    }

    // Build summary
    const summary = {
      patient: medicalRecord.patient,
      bloodType: medicalRecord.bloodType,
      activeAllergies: medicalRecord.allergies.length,
      activeConditions: medicalRecord.chronicConditions.filter(c => c.status === 'active').length,
      activeMedications: medicalRecord.medications.filter(m => m.status === 'active').length,
      recentLabResults: medicalRecord.labResults.slice(-5),
      latestVitals: medicalRecord.vitalSigns[medicalRecord.vitalSigns.length - 1],
      upcomingImmunizations: medicalRecord.immunizations.filter(i => i.nextDueDate && new Date(i.nextDueDate) > new Date())
    };

    res.json({
      success: true,
      data: summary
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;
