/**
 * AI Symptom Analysis Engine
 * Advanced disease prediction based on symptoms and patient data
 */

// Medical Knowledge Base with symptom-disease mappings
const medicalKnowledgeBase = {
  // Respiratory Conditions
  'Common Cold': {
    symptoms: ['runny nose', 'sore throat', 'cough', 'sneezing', 'mild fever', 'congestion'],
    severity: 'low',
    specialist: 'General Physician',
    tests: ['Physical Examination'],
    actions: ['Rest', 'Hydration', 'OTC medications', 'Monitor symptoms']
  },
  'Influenza (Flu)': {
    symptoms: ['high fever', 'body aches', 'fatigue', 'cough', 'sore throat', 'headache', 'chills'],
    severity: 'medium',
    specialist: 'General Physician',
    tests: ['Rapid Flu Test', 'Complete Blood Count'],
    actions: ['Antiviral medication', 'Rest', 'Hydration', 'Fever management']
  },
  'Pneumonia': {
    symptoms: ['chest pain', 'cough', 'fever', 'difficulty breathing', 'fatigue', 'phlegm'],
    severity: 'high',
    specialist: 'Pulmonologist',
    tests: ['Chest X-Ray', 'Blood Tests', 'Sputum Culture'],
    actions: ['Immediate medical attention', 'Antibiotics', 'Hospitalization may be needed']
  },
  'Asthma Attack': {
    symptoms: ['shortness of breath', 'wheezing', 'chest tightness', 'cough'],
    severity: 'high',
    specialist: 'Pulmonologist',
    tests: ['Peak Flow Test', 'Spirometry'],
    actions: ['Use rescue inhaler', 'Seek immediate care if severe', 'Avoid triggers']
  },

  // Cardiac Conditions
  'Heart Attack': {
    symptoms: ['chest pain', 'shortness of breath', 'arm pain', 'jaw pain', 'nausea', 'sweating', 'dizziness'],
    severity: 'critical',
    specialist: 'Cardiologist',
    tests: ['ECG', 'Cardiac Enzymes', 'Coronary Angiography'],
    actions: ['CALL EMERGENCY IMMEDIATELY', 'Chew aspirin if not allergic', 'Do not drive yourself']
  },
  'Hypertension': {
    symptoms: ['headache', 'dizziness', 'blurred vision', 'chest pain', 'nosebleeds'],
    severity: 'medium',
    specialist: 'Cardiologist',
    tests: ['Blood Pressure Monitoring', 'ECG', 'Lipid Profile'],
    actions: ['Regular BP monitoring', 'Lifestyle changes', 'Medication compliance']
  },

  // Gastrointestinal
  'Gastroenteritis': {
    symptoms: ['diarrhea', 'vomiting', 'abdominal pain', 'nausea', 'fever', 'dehydration'],
    severity: 'medium',
    specialist: 'Gastroenterologist',
    tests: ['Stool Test', 'Blood Tests'],
    actions: ['Hydration', 'Electrolyte replacement', 'Bland diet', 'Rest']
  },
  'Appendicitis': {
    symptoms: ['abdominal pain', 'nausea', 'vomiting', 'fever', 'loss of appetite'],
    severity: 'high',
    specialist: 'Surgeon',
    tests: ['Ultrasound', 'CT Scan', 'Blood Tests'],
    actions: ['Immediate medical attention', 'Do not eat or drink', 'Possible surgery']
  },
  'GERD': {
    symptoms: ['heartburn', 'acid reflux', 'chest pain', 'difficulty swallowing', 'chronic cough'],
    severity: 'low',
    specialist: 'Gastroenterologist',
    tests: ['Endoscopy', 'pH Monitoring'],
    actions: ['Avoid trigger foods', 'Smaller meals', 'Antacids', 'Elevate head while sleeping']
  },

  // Neurological
  'Migraine': {
    symptoms: ['severe headache', 'nausea', 'sensitivity to light', 'sensitivity to sound', 'visual disturbances'],
    severity: 'medium',
    specialist: 'Neurologist',
    tests: ['MRI', 'CT Scan'],
    actions: ['Dark quiet room', 'Pain medication', 'Identify triggers', 'Preventive medication']
  },
  'Stroke': {
    symptoms: ['facial drooping', 'arm weakness', 'speech difficulty', 'confusion', 'severe headache', 'vision problems'],
    severity: 'critical',
    specialist: 'Neurologist',
    tests: ['CT Scan', 'MRI', 'Carotid Ultrasound'],
    actions: ['CALL EMERGENCY IMMEDIATELY', 'Note time of symptom onset', 'Do not give food or water']
  },

  // Infections
  'Urinary Tract Infection': {
    symptoms: ['painful urination', 'frequent urination', 'cloudy urine', 'pelvic pain', 'fever', 'blood in urine'],
    severity: 'medium',
    specialist: 'Urologist',
    tests: ['Urinalysis', 'Urine Culture'],
    actions: ['Antibiotics', 'Increased hydration', 'Cranberry juice', 'Complete medication course']
  },
  'COVID-19': {
    symptoms: ['fever', 'dry cough', 'fatigue', 'loss of taste', 'loss of smell', 'difficulty breathing', 'body aches'],
    severity: 'medium',
    specialist: 'General Physician',
    tests: ['RT-PCR Test', 'Rapid Antigen Test', 'Chest CT'],
    actions: ['Self-isolate', 'Monitor oxygen levels', 'Hydration', 'Seek care if breathing worsens']
  },
  'Dengue Fever': {
    symptoms: ['high fever', 'severe headache', 'pain behind eyes', 'joint pain', 'muscle pain', 'rash', 'bleeding'],
    severity: 'high',
    specialist: 'Infectious Disease Specialist',
    tests: ['NS1 Antigen Test', 'Complete Blood Count', 'Platelet Count'],
    actions: ['Hospitalization may be needed', 'Hydration', 'Platelet monitoring', 'Avoid aspirin']
  },

  // Dermatological
  'Eczema': {
    symptoms: ['itchy skin', 'dry skin', 'rash', 'red patches', 'skin inflammation'],
    severity: 'low',
    specialist: 'Dermatologist',
    tests: ['Skin Patch Test', 'Physical Examination'],
    actions: ['Moisturizers', 'Avoid triggers', 'Topical steroids', 'Keep skin hydrated']
  },

  // Endocrine
  'Diabetes': {
    symptoms: ['increased thirst', 'frequent urination', 'fatigue', 'blurred vision', 'slow healing', 'weight loss'],
    severity: 'medium',
    specialist: 'Endocrinologist',
    tests: ['Fasting Blood Sugar', 'HbA1c', 'Oral Glucose Tolerance Test'],
    actions: ['Blood sugar monitoring', 'Diet control', 'Exercise', 'Medication compliance']
  },
  'Hyperthyroidism': {
    symptoms: ['weight loss', 'rapid heartbeat', 'sweating', 'nervousness', 'tremors', 'fatigue'],
    severity: 'medium',
    specialist: 'Endocrinologist',
    tests: ['Thyroid Function Tests', 'TSH', 'T3/T4 levels'],
    actions: ['Medication', 'Regular monitoring', 'Avoid caffeine', 'Stress management']
  },
  'Hypothyroidism': {
    symptoms: ['fatigue', 'weight gain', 'cold sensitivity', 'dry skin', 'constipation', 'depression', 'muscle weakness'],
    severity: 'medium',
    specialist: 'Endocrinologist',
    tests: ['Thyroid Function Tests', 'TSH', 'T3/T4 levels'],
    actions: ['Thyroid hormone replacement', 'Regular monitoring', 'Balanced diet']
  },

  // Musculoskeletal
  'Arthritis': {
    symptoms: ['joint pain', 'stiffness', 'swelling', 'reduced range of motion', 'redness'],
    severity: 'medium',
    specialist: 'Rheumatologist',
    tests: ['X-Ray', 'MRI', 'Blood Tests', 'Joint Fluid Analysis'],
    actions: ['Pain management', 'Physical therapy', 'Anti-inflammatory medication', 'Joint protection']
  },
  'Osteoporosis': {
    symptoms: ['back pain', 'loss of height', 'stooped posture', 'bone fractures'],
    severity: 'medium',
    specialist: 'Orthopedist',
    tests: ['Bone Density Scan', 'X-Ray', 'Blood Tests'],
    actions: ['Calcium and Vitamin D supplements', 'Weight-bearing exercises', 'Fall prevention', 'Medication']
  },
  'Fibromyalgia': {
    symptoms: ['widespread pain', 'fatigue', 'sleep problems', 'cognitive difficulties', 'headache'],
    severity: 'medium',
    specialist: 'Rheumatologist',
    tests: ['Physical Examination', 'Blood Tests', 'Sleep Study'],
    actions: ['Pain management', 'Sleep improvement', 'Stress reduction', 'Exercise therapy']
  },

  // Mental Health
  'Anxiety Disorder': {
    symptoms: ['excessive worry', 'restlessness', 'fatigue', 'difficulty concentrating', 'irritability', 'muscle tension', 'sleep problems'],
    severity: 'medium',
    specialist: 'Psychiatrist',
    tests: ['Psychological Evaluation', 'Anxiety Screening Tests'],
    actions: ['Therapy', 'Medication if needed', 'Stress management', 'Relaxation techniques']
  },
  'Depression': {
    symptoms: ['persistent sadness', 'loss of interest', 'fatigue', 'sleep changes', 'appetite changes', 'difficulty concentrating', 'feelings of worthlessness'],
    severity: 'medium',
    specialist: 'Psychiatrist',
    tests: ['Depression Screening', 'Psychological Evaluation'],
    actions: ['Therapy', 'Antidepressants if needed', 'Exercise', 'Social support', 'Sleep hygiene']
  },

  // Allergies
  'Seasonal Allergies': {
    symptoms: ['sneezing', 'runny nose', 'itchy eyes', 'nasal congestion', 'watery eyes', 'post-nasal drip'],
    severity: 'low',
    specialist: 'Allergist',
    tests: ['Skin Prick Test', 'Blood Test for Allergens'],
    actions: ['Antihistamines', 'Nasal sprays', 'Avoid allergens', 'Air filtration']
  },
  'Food Allergy': {
    symptoms: ['hives', 'itching', 'swelling', 'nausea', 'vomiting', 'diarrhea', 'difficulty breathing'],
    severity: 'high',
    specialist: 'Allergist',
    tests: ['Skin Prick Test', 'Blood Tests', 'Oral Food Challenge'],
    actions: ['Avoid trigger foods', 'Carry epinephrine', 'Read food labels', 'Emergency action plan']
  },

  // Eye Conditions
  'Conjunctivitis': {
    symptoms: ['red eyes', 'itchy eyes', 'watery eyes', 'discharge', 'gritty feeling', 'swollen eyelids'],
    severity: 'low',
    specialist: 'Ophthalmologist',
    tests: ['Eye Examination', 'Swab Test if bacterial'],
    actions: ['Antibiotic drops if bacterial', 'Cold compress', 'Avoid touching eyes', 'Frequent hand washing']
  },
  'Glaucoma': {
    symptoms: ['blurred vision', 'eye pain', 'headache', 'halos around lights', 'vision loss'],
    severity: 'high',
    specialist: 'Ophthalmologist',
    tests: ['Eye Pressure Test', 'Visual Field Test', 'Optic Nerve Examination'],
    actions: ['Eye drops', 'Laser treatment', 'Surgery if needed', 'Regular monitoring']
  },

  // Kidney Conditions
  'Kidney Stones': {
    symptoms: ['severe pain', 'blood in urine', 'nausea', 'vomiting', 'frequent urination', 'painful urination', 'fever'],
    severity: 'high',
    specialist: 'Urologist',
    tests: ['CT Scan', 'Ultrasound', 'Urinalysis', 'Blood Tests'],
    actions: ['Pain management', 'Increased hydration', 'Medical or surgical stone removal', 'Dietary changes']
  },
  'Chronic Kidney Disease': {
    symptoms: ['fatigue', 'swelling', 'changes in urination', 'nausea', 'loss of appetite', 'sleep problems', 'muscle cramps'],
    severity: 'high',
    specialist: 'Nephrologist',
    tests: ['Blood Tests', 'Urine Tests', 'Kidney Ultrasound', 'Kidney Biopsy'],
    actions: ['Control blood pressure', 'Manage diabetes', 'Diet modification', 'Medication', 'Dialysis if advanced']
  },

  // Liver Conditions
  'Hepatitis': {
    symptoms: ['fatigue', 'jaundice', 'abdominal pain', 'loss of appetite', 'nausea', 'dark urine', 'pale stool'],
    severity: 'high',
    specialist: 'Gastroenterologist',
    tests: ['Liver Function Tests', 'Hepatitis Viral Markers', 'Ultrasound', 'Liver Biopsy'],
    actions: ['Rest', 'Avoid alcohol', 'Antiviral medication', 'Vaccination', 'Regular monitoring']
  },
  'Fatty Liver Disease': {
    symptoms: ['fatigue', 'abdominal discomfort', 'weight loss', 'weakness'],
    severity: 'medium',
    specialist: 'Gastroenterologist',
    tests: ['Liver Function Tests', 'Ultrasound', 'CT Scan', 'Liver Biopsy'],
    actions: ['Weight loss', 'Exercise', 'Avoid alcohol', 'Control diabetes', 'Healthy diet']
  },

  // Blood Disorders
  'Anemia': {
    symptoms: ['fatigue', 'weakness', 'pale skin', 'shortness of breath', 'dizziness', 'cold hands', 'headache'],
    severity: 'medium',
    specialist: 'Hematologist',
    tests: ['Complete Blood Count', 'Iron Studies', 'Vitamin B12 and Folate Levels'],
    actions: ['Iron supplements', 'Vitamin supplements', 'Diet modification', 'Treat underlying cause']
  },
  'Leukemia': {
    symptoms: ['fatigue', 'frequent infections', 'easy bruising', 'bleeding', 'weight loss', 'swollen lymph nodes', 'fever', 'night sweats'],
    severity: 'critical',
    specialist: 'Oncologist',
    tests: ['Complete Blood Count', 'Bone Marrow Biopsy', 'Genetic Tests'],
    actions: ['Immediate specialist referral', 'Chemotherapy', 'Radiation', 'Stem cell transplant']
  },

  // Autoimmune
  'Lupus': {
    symptoms: ['fatigue', 'joint pain', 'rash', 'fever', 'kidney problems', 'chest pain', 'hair loss'],
    severity: 'high',
    specialist: 'Rheumatologist',
    tests: ['ANA Test', 'Anti-dsDNA', 'Complete Blood Count', 'Kidney Function Tests'],
    actions: ['Immunosuppressants', 'Anti-inflammatory drugs', 'Sun protection', 'Regular monitoring']
  },
  'Multiple Sclerosis': {
    symptoms: ['numbness', 'tingling', 'weakness', 'vision problems', 'balance problems', 'fatigue', 'dizziness'],
    severity: 'high',
    specialist: 'Neurologist',
    tests: ['MRI', 'Lumbar Puncture', 'Evoked Potential Tests'],
    actions: ['Disease-modifying therapy', 'Physical therapy', 'Symptom management', 'Lifestyle adjustments']
  },

  // Additional Common Conditions
  'Bronchitis': {
    symptoms: ['cough', 'mucus production', 'fatigue', 'shortness of breath', 'chest discomfort', 'mild fever'],
    severity: 'medium',
    specialist: 'Pulmonologist',
    tests: ['Chest X-Ray', 'Pulmonary Function Tests', 'Sputum Culture'],
    actions: ['Rest', 'Fluids', 'Humidifier', 'Avoid irritants', 'Bronchodilators if needed']
  },
  'Sinusitis': {
    symptoms: ['facial pain', 'nasal congestion', 'thick nasal discharge', 'reduced sense of smell', 'headache', 'cough'],
    severity: 'low',
    specialist: 'ENT Specialist',
    tests: ['Physical Examination', 'CT Scan', 'Nasal Endoscopy'],
    actions: ['Nasal irrigation', 'Decongestants', 'Antibiotics if bacterial', 'Steam inhalation']
  },
  'Insomnia': {
    symptoms: ['difficulty falling asleep', 'difficulty staying asleep', 'waking too early', 'daytime fatigue', 'irritability'],
    severity: 'low',
    specialist: 'Sleep Specialist',
    tests: ['Sleep Study', 'Sleep Diary', 'Psychological Evaluation'],
    actions: ['Sleep hygiene', 'Cognitive behavioral therapy', 'Relaxation techniques', 'Medication if needed']
  },
  'Vertigo': {
    symptoms: ['spinning sensation', 'dizziness', 'balance problems', 'nausea', 'vomiting', 'abnormal eye movements'],
    severity: 'medium',
    specialist: 'ENT Specialist',
    tests: ['Vestibular Tests', 'MRI', 'Hearing Test'],
    actions: ['Vestibular rehabilitation', 'Medication', 'Canalith repositioning', 'Balance exercises']
  }
};

// Enhanced symptom synonym mapping for better matching
const symptomSynonyms = {
  'fever': ['high temperature', 'pyrexia', 'febrile', 'hot', 'burning'],
  'headache': ['head pain', 'migraine', 'cephalalgia'],
  'fatigue': ['tiredness', 'exhaustion', 'weakness', 'lethargy', 'low energy'],
  'nausea': ['sick feeling', 'queasiness', 'upset stomach'],
  'dizziness': ['lightheadedness', 'vertigo', 'spinning', 'unsteady'],
  'pain': ['ache', 'discomfort', 'soreness', 'hurt'],
  'difficulty breathing': ['shortness of breath', 'breathlessness', 'dyspnea'],
  'cough': ['coughing', 'hacking'],
  'vomiting': ['throwing up', 'being sick', 'emesis'],
  'diarrhea': ['loose stools', 'watery stool'],
  'rash': ['skin eruption', 'hives', 'skin redness'],
  'joint pain': ['arthralgia', 'joint ache'],
  'abdominal pain': ['stomach pain', 'belly pain', 'stomach ache'],
  'chest pain': ['chest discomfort', 'chest pressure'],
  'blurred vision': ['vision problems', 'unclear vision', 'foggy vision']
};

/**
 * Enhanced symptom matching with synonym support
 */
function matchSymptom(userSymptom, diseaseSymptom) {
  const userText = userSymptom.toLowerCase();
  const diseaseText = diseaseSymptom.toLowerCase();
  
  // Direct match
  if (userText.includes(diseaseText) || diseaseText.includes(userText)) {
    return 1.0; // Full match
  }
  
  // Check synonyms
  for (const [mainSymptom, synonyms] of Object.entries(symptomSynonyms)) {
    if (diseaseText.includes(mainSymptom) || mainSymptom.includes(diseaseText)) {
      if (synonyms.some(syn => userText.includes(syn) || syn.includes(userText))) {
        return 0.9; // Synonym match
      }
    }
  }
  
  // Partial word match (e.g., "painful" matches "pain")
  const userWords = userText.split(/\s+/);
  const diseaseWords = diseaseText.split(/\s+/);
  for (const uw of userWords) {
    for (const dw of diseaseWords) {
      if (uw.length > 3 && dw.length > 3) {
        if (uw.includes(dw) || dw.includes(uw)) {
          return 0.7; // Partial match
        }
      }
    }
  }
  
  return 0; // No match
}

/**
 * Calculate disease probability based on symptom matching
 */
function calculateDiseaseMatch(userSymptoms, diseaseData) {
  const diseaseSymptoms = diseaseData.symptoms;
  let matchScore = 0;
  let severityBoost = 0;

  userSymptoms.forEach(userSymptom => {
    const symptomText = userSymptom.symptom.toLowerCase();
    
    // Check for matches with enhanced scoring
    diseaseSymptoms.forEach(diseaseSymptom => {
      const matchStrength = matchSymptom(symptomText, diseaseSymptom);
      if (matchStrength > 0) {
        matchScore += matchStrength;
        
        // Boost confidence for severe symptoms
        if (userSymptom.severity === 'severe') {
          severityBoost += 15 * matchStrength;
        } else if (userSymptom.severity === 'moderate') {
          severityBoost += 8 * matchStrength;
        } else {
          severityBoost += 3 * matchStrength;
        }
      }
    });
  });

  // Calculate base confidence with weighted scoring
  const baseConfidence = (matchScore / diseaseSymptoms.length) * 100;
  
  // Adjust with severity boost (cap at 100)
  return Math.min(baseConfidence + severityBoost, 100);
}

/**
 * Determine urgency level based on symptoms and predictions
 */
function determineUrgency(symptoms, predictions) {
  // Check for critical symptoms
  const criticalSymptoms = [
    'chest pain', 'difficulty breathing', 'severe bleeding', 
    'loss of consciousness', 'severe headache', 'facial drooping',
    'arm weakness', 'speech difficulty', 'severe abdominal pain'
  ];

  for (const symptom of symptoms) {
    const symptomText = symptom.symptom.toLowerCase();
    if (criticalSymptoms.some(cs => symptomText.includes(cs))) {
      return 'emergency';
    }
  }

  // Check predictions
  if (predictions.some(p => p.severity === 'critical')) {
    return 'emergency';
  } else if (predictions.some(p => p.severity === 'high')) {
    return 'high';
  } else if (predictions.some(p => p.severity === 'medium')) {
    return 'moderate';
  }

  return 'low';
}

/**
 * Main AI Analysis Function
 */
function analyzeSymptoms(symptomsData, additionalInfo) {
  const { symptoms } = symptomsData;
  const predictions = [];

  // Analyze against each disease in knowledge base
  Object.entries(medicalKnowledgeBase).forEach(([diseaseName, diseaseData]) => {
    const confidencePercent = calculateDiseaseMatch(symptoms, diseaseData);

    // Only include predictions with confidence > 20%
    if (confidencePercent > 20) {
      // Find matched symptoms for this disease
      const matchedSymptoms = [];
      symptoms.forEach(userSymptom => {
        const symptomText = userSymptom.symptom.toLowerCase();
        diseaseData.symptoms.forEach(diseaseSymptom => {
          if (symptomText.includes(diseaseSymptom) || diseaseSymptom.includes(symptomText)) {
            if (!matchedSymptoms.includes(userSymptom.symptom)) {
              matchedSymptoms.push(userSymptom.symptom);
            }
          }
        });
      });

      predictions.push({
        disease: diseaseName,
        confidence: confidencePercent / 100, // Convert to 0-1 range for frontend
        severity: diseaseData.severity,
        description: `${diseaseName} is indicated by the symptoms provided. Common in patients with these symptoms.`,
        recommendedActions: diseaseData.actions,
        specialistType: diseaseData.specialist,
        matchedSymptoms: matchedSymptoms
      });
    }
  });

  // Sort by confidence
  predictions.sort((a, b) => b.confidence - a.confidence);

  // Take top 5 predictions
  const topPredictions = predictions.slice(0, 5);

  // Determine urgency
  const urgencyLevel = determineUrgency(symptoms, topPredictions);

  // Get recommended specialist (from highest confidence prediction)
  const recommendedSpecialist = topPredictions.length > 0 
    ? topPredictions[0].specialistType 
    : 'General Physician';

  // Aggregate recommended tests
  const recommendedTests = new Set();
  topPredictions.forEach(pred => {
    const diseaseData = medicalKnowledgeBase[pred.disease];
    if (diseaseData && diseaseData.tests) {
      diseaseData.tests.forEach(test => recommendedTests.add(test));
    }
  });

  return {
    predictions: topPredictions,
    urgencyLevel,
    recommendedSpecialist,
    recommendedTests: Array.from(recommendedTests)
  };
}

module.exports = {
  analyzeSymptoms,
  medicalKnowledgeBase
};
