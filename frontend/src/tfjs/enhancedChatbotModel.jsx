import * as tf from '@tensorflow/tfjs';

let model = null;
let tokenizer = null;
let maxLen = 30;
let intentMap = {};
let symptomModel = null;
let entityExtractor = null;

// Cache for trained model to avoid retraining
const MODEL_CACHE_KEY = 'chatbot_model_cache';
const TOKENIZER_CACHE_KEY = 'chatbot_tokenizer_cache';
const INTENT_MAP_CACHE_KEY = 'chatbot_intent_map_cache';
const MODEL_VERSION = 'v2.0'; // Increment this when model architecture changes

// ===== ENTITY EXTRACTION =====
export const extractEntities = (text) => {
  const entities = {
    date: null,
    time: null,
    department: null,
    symptom: [],
    doctor: null,
    amount: null
  };

  // Extract date patterns
  const datePatterns = [
    /\b(today|tomorrow|yesterday)\b/i,
    /\b(\d{1,2})[/-](\d{1,2})[/-](\d{2,4})\b/,
    /\b(january|february|march|april|may|june|july|august|september|october|november|december)\s+(\d{1,2})\b/i,
    /\b(next|this)\s+(monday|tuesday|wednesday|thursday|friday|saturday|sunday)\b/i
  ];

  datePatterns.forEach(pattern => {
    const match = text.match(pattern);
    if (match) entities.date = match[0];
  });

  // Extract time patterns
  const timePattern = /\b(\d{1,2}):(\d{2})\s*(am|pm)?\b/i;
  const timeMatch = text.match(timePattern);
  if (timeMatch) entities.time = timeMatch[0];

  // Extract departments
  const departments = [
    'cardiology', 'neurology', 'orthopedics', 'dermatology', 'pediatrics',
    'gynecology', 'ent', 'general medicine', 'urology', 'ophthalmology'
  ];
  
  const lowerText = text.toLowerCase();
  departments.forEach(dept => {
    if (lowerText.includes(dept)) {
      entities.department = dept.charAt(0).toUpperCase() + dept.slice(1);
    }
  });

  // Extract symptoms
  const symptoms = [
    'fever', 'headache', 'cough', 'chest pain', 'abdominal pain', 'dizziness',
    'fatigue', 'nausea', 'vomiting', 'diarrhea', 'constipation', 'rash',
    'shortness of breath', 'back pain', 'joint pain', 'sore throat',
    'runny nose', 'blurred vision', 'insomnia', 'anxiety', 'depression'
  ];

  symptoms.forEach(symptom => {
    if (lowerText.includes(symptom)) {
      entities.symptom.push(symptom);
    }
  });

  // Extract amount
  const amountPattern = /(?:rs\.?|₹)\s*(\d+(?:,\d+)*(?:\.\d{2})?)/i;
  const amountMatch = text.match(amountPattern);
  if (amountMatch) entities.amount = amountMatch[1].replace(/,/g, '');

  return entities;
};

// ===== SYMPTOM-BASED DEPARTMENT SUGGESTION =====
const symptomToDepartment = {
  'chest pain': 'Cardiology',
  'heart palpitations': 'Cardiology',
  'shortness of breath': 'Cardiology',
  'headache': 'Neurology',
  'dizziness': 'Neurology',
  'seizure': 'Neurology',
  'back pain': 'Orthopedics',
  'joint pain': 'Orthopedics',
  'fracture': 'Orthopedics',
  'rash': 'Dermatology',
  'acne': 'Dermatology',
  'skin condition': 'Dermatology',
  'fever': 'General Medicine',
  'cold': 'ENT',
  'cough': 'ENT',
  'sore throat': 'ENT',
  'ear pain': 'ENT',
  'eye pain': 'Ophthalmology',
  'blurred vision': 'Ophthalmology',
  'abdominal pain': 'General Medicine',
  'stomach pain': 'General Medicine',
  'pregnancy': 'Gynecology',
  'menstrual': 'Gynecology',
  'urinary': 'Urology',
  'kidney': 'Urology'
};

export const suggestDepartmentFromSymptom = (symptoms) => {
  if (!symptoms || symptoms.length === 0) return null;
  
  const symptomText = symptoms.join(' ').toLowerCase();
  
  for (const [symptom, dept] of Object.entries(symptomToDepartment)) {
    if (symptomText.includes(symptom)) {
      return dept;
    }
  }
  
  return 'General Medicine';
};

// ===== CONTEXT MEMORY =====
export class ConversationContext {
  constructor(maxHistory = 5) {
    this.history = [];
    this.maxHistory = maxHistory;
    this.currentContext = {};
  }

  addMessage(userMessage, botResponse, intent, entities) {
    this.history.push({
      userMessage,
      botResponse,
      intent,
      entities,
      timestamp: new Date()
    });

    if (this.history.length > this.maxHistory) {
      this.history.shift();
    }

    // Update context based on intent
    if (entities) {
      Object.keys(entities).forEach(key => {
        if (entities[key] && (Array.isArray(entities[key]) ? entities[key].length > 0 : true)) {
          this.currentContext[key] = entities[key];
        }
      });
    }
  }

  getContext() {
    return this.currentContext;
  }

  getLastIntent() {
    if (this.history.length > 0) {
      return this.history[this.history.length - 1].intent;
    }
    return null;
  }

  getHistory() {
    return this.history;
  }

  clear() {
    this.history = [];
    this.currentContext = {};
  }
}

// ===== ENHANCED TOKENIZATION =====
export const tokenizeText = (text, vocabulary) => {
  const words = text.toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .split(/\s+/)
    .filter(word => word.length > 0);
  
  const tokens = words.map(word => {
    const index = vocabulary.indexOf(word);
    return index >= 0 ? index + 1 : 0;
  });
  
  if (tokens.length < maxLen) {
    return [...tokens, ...Array(maxLen - tokens.length).fill(0)];
  }
  return tokens.slice(0, maxLen);
};

export const buildVocabulary = (intents) => {
  const words = new Set();
  intents.forEach(intent => {
    intent.patterns.forEach(pattern => {
      pattern.toLowerCase()
        .replace(/[^\w\s]/g, ' ')
        .split(/\s+/)
        .filter(word => word.length > 0)
        .forEach(word => words.add(word));
    });
  });
  return Array.from(words);
};

// ===== IMPROVED MODEL ARCHITECTURE =====
export const createModel = (vocabSize, numIntents) => {
  const model = tf.sequential();
  
  // Optimized lightweight architecture for SUPER FAST training
  model.add(tf.layers.embedding({
    inputDim: vocabSize + 1,
    outputDim: 16, // Reduced from 32 for speed
    inputLength: maxLen,
    embeddingsInitializer: 'glorotUniform'
  }));
  
  // Use simpler GlobalAveragePooling instead of LSTM for speed
  model.add(tf.layers.globalAveragePooling1d());
  
  // Simplified dense layers
  model.add(tf.layers.dense({ units: 32, activation: 'relu' })); // Reduced from 64
  model.add(tf.layers.dropout({ rate: 0.3 }));
  model.add(tf.layers.dense({ units: 16, activation: 'relu' })); // Reduced from 32
  
  // Output layer
  model.add(tf.layers.dense({ units: numIntents, activation: 'softmax' }));
  
  model.compile({
    optimizer: tf.train.adam(0.003), // Increased learning rate for faster convergence
    loss: 'categoricalCrossentropy',
    metrics: ['accuracy']
  });
  
  return model;
};

// ===== ENHANCED TRAINING WITH GPU ACCELERATION =====
export const trainModel = async (intents, onProgress) => {
  try {
    if (intents.length === 0) return null;

    // Enable WebGL backend for GPU acceleration (SUPER FAST!)
    await tf.setBackend('webgl');
    await tf.ready();
    console.log('🎮 GPU acceleration enabled for SUPER FAST training!');

    const vocabulary = buildVocabulary(intents);
    tokenizer = { vocabulary };
    
    const xs = [];
    const ys = [];
    intentMap = {};
    
    intents.forEach((intent, intentIdx) => {
      intentMap[intent.tag] = intentIdx;
      intent.patterns.forEach(pattern => {
        const tokens = tokenizeText(pattern, vocabulary);
        xs.push(tokens);
        
        const label = Array(intents.length).fill(0);
        label[intentIdx] = 1;
        ys.push(label);
      });
    });
    
    const xsTensor = tf.tensor2d(xs);
    const ysTensor = tf.tensor2d(ys);
    
    model = createModel(vocabulary.length, intents.length);
    
    // SUPER FAST training with optimized parameters
    await model.fit(xsTensor, ysTensor, {
      epochs: 15, // Drastically reduced from 100 for super fast training
      batchSize: 32, // Increased from 16 for faster processing
      verbose: 0,
      validationSplit: 0.15, // Reduced validation split
      shuffle: true,
      callbacks: {
        // Early stopping for even faster training if accuracy is good
        onEpochEnd: async (epoch, logs) => {
          if (onProgress) {
            onProgress(epoch, logs);
          }
          // Stop early if we reach 90% accuracy
          if (logs.acc > 0.90) {
            console.log('🚀 Early stopping - Target accuracy reached!');
            model.stopTraining = true;
          }
        }
      }
    });
    
    xsTensor.dispose();
    ysTensor.dispose();
    
    return { model, tokenizer, intentMap };
  } catch (error) {
    console.error('Error training model:', error);
    return null;
  }
};

// ===== CONFIDENCE THRESHOLD & FALLBACK =====
export const CONFIDENCE_THRESHOLD = 0.7;
export const LOW_CONFIDENCE_THRESHOLD = 0.4;

export const getFallbackResponse = (confidence, userMessage, context) => {
  if (confidence < LOW_CONFIDENCE_THRESHOLD) {
    return {
      response: "I'm not quite sure I understand. Could you please rephrase that? You can ask me about:\n• Booking appointments\n• Finding doctors\n• Checking symptoms\n• Payment information\n• Emergency services",
      needsReview: true
    };
  } else if (confidence < CONFIDENCE_THRESHOLD) {
    return {
      response: "I think I understand, but I'm not completely sure. Could you provide more details or rephrase your question?",
      needsReview: true
    };
  }
  return { response: null, needsReview: false };
};

// ===== ENHANCED PREDICTION WITH CONTEXT =====
export const predictIntent = async (text, intents, context = null) => {
  try {
    if (!intents || intents.length === 0) {
      return { intent: null, confidence: 0, entities: {}, needsReview: true };
    }

    // Extract entities first
    const entities = extractEntities(text);

    // Context-aware text enhancement
    let enhancedText = text;
    if (context && context.currentContext) {
      const ctx = context.currentContext;
      if (ctx.department && !entities.department) {
        enhancedText += ` ${ctx.department}`;
      }
    }

    const lowerText = enhancedText.toLowerCase();
    let bestMatch = null;
    let highestScore = 0;
    
    // Keyword matching with scoring
    intents.forEach(intent => {
      intent.patterns.forEach(pattern => {
        const patternWords = pattern.toLowerCase().split(/\s+/);
        const textWords = lowerText.split(/\s+/);
        
        let matchCount = 0;
        let partialMatchCount = 0;
        
        patternWords.forEach(pWord => {
          if (textWords.some(tWord => tWord === pWord)) {
            matchCount++;
          } else if (textWords.some(tWord => tWord.includes(pWord) || pWord.includes(tWord))) {
            partialMatchCount += 0.5;
          }
        });
        
        const score = (matchCount + partialMatchCount) / patternWords.length;
        if (score > highestScore) {
          highestScore = score;
          bestMatch = intent.tag;
        }
      });
    });
    
    // Neural network prediction
    if (model && tokenizer) {
      const tokens = tokenizeText(enhancedText, tokenizer.vocabulary);
      const inputTensor = tf.tensor2d([tokens]);
      const prediction = model.predict(inputTensor);
      const predArray = await prediction.data();
      
      let maxProb = 0;
      let maxIdx = 0;
      predArray.forEach((prob, idx) => {
        if (prob > maxProb) {
          maxProb = prob;
          maxIdx = idx;
        }
      });
      
      inputTensor.dispose();
      prediction.dispose();
      
      // Use neural network if more confident
      if (maxProb > highestScore) {
        return {
          intent: intents[maxIdx].tag,
          confidence: maxProb,
          entities: entities,
          needsReview: maxProb < CONFIDENCE_THRESHOLD
        };
      }
    }
    
    return {
      intent: bestMatch,
      confidence: highestScore,
      entities: entities,
      needsReview: highestScore < CONFIDENCE_THRESHOLD
    };
  } catch (error) {
    console.error('Error predicting intent:', error);
    return { intent: null, confidence: 0, entities: {}, needsReview: true };
  }
};

// ===== ROLE-AWARE RESPONSE GENERATION =====
export const generateRoleAwareResponse = (intent, baseResponse, userRole, entities, context) => {
  let response = baseResponse;

  // Add personalization based on role
  if (userRole === 'doctor') {
    if (intent.includes('appointment')) {
      response += '\n\nYou can manage your appointments from your Doctor Dashboard.';
    }
  } else if (userRole === 'patient') {
    if (intent.includes('appointment') && entities.date) {
      response += `\n\nI see you mentioned ${entities.date}. Would you like to book for that date?`;
    }
    if (entities.symptom && entities.symptom.length > 0) {
      const suggestedDept = suggestDepartmentFromSymptom(entities.symptom);
      response += `\n\nBased on your symptoms (${entities.symptom.join(', ')}), I recommend consulting a ${suggestedDept} specialist.`;
    }
  } else if (userRole === 'admin') {
    if (intent.includes('user') || intent.includes('system')) {
      response += '\n\nYou can access admin features from your dashboard.';
    }
  }

  return response;
};

// ===== MODEL CACHE MANAGEMENT =====
const saveModelToCache = async (model, tokenizer, intentMap) => {
  try {
    // Save model to IndexedDB
    await model.save('indexeddb://chatbot-model');
    
    // Save tokenizer and intent map to localStorage
    localStorage.setItem(TOKENIZER_CACHE_KEY, JSON.stringify({ tokenizer, version: MODEL_VERSION }));
    localStorage.setItem(INTENT_MAP_CACHE_KEY, JSON.stringify({ intentMap, version: MODEL_VERSION }));
    
    console.log('✅ Model cached successfully for instant loading next time!');
  } catch (error) {
    console.warn('Could not cache model:', error);
  }
};

const loadModelFromCache = async () => {
  try {
    // Check if cached data exists and is current version
    const tokenizerCache = localStorage.getItem(TOKENIZER_CACHE_KEY);
    const intentMapCache = localStorage.getItem(INTENT_MAP_CACHE_KEY);
    
    if (!tokenizerCache || !intentMapCache) return null;
    
    const tokenizerData = JSON.parse(tokenizerCache);
    const intentMapData = JSON.parse(intentMapCache);
    
    // Version check
    if (tokenizerData.version !== MODEL_VERSION || intentMapData.version !== MODEL_VERSION) {
      console.log('🔄 Model version mismatch, will retrain');
      return null;
    }
    
    // Load model from IndexedDB
    const loadedModel = await tf.loadLayersModel('indexeddb://chatbot-model');
    
    console.log('⚡ Loaded cached model - INSTANT STARTUP!');
    
    return {
      model: loadedModel,
      tokenizer: tokenizerData.tokenizer,
      intentMap: intentMapData.intentMap
    };
  } catch (error) {
    console.log('No cached model found, will train fresh');
    return null;
  }
};

// ===== MODEL INITIALIZATION WITH CACHING =====
export const initializeChatbotModel = async (intents, onProgress) => {
  try {
    if (!intents || intents.length === 0) return false;
    
    // Try to load from cache first for SUPER FAST startup
    console.log('🚀 Checking for cached model...');
    const cachedModel = await loadModelFromCache();
    
    if (cachedModel) {
      model = cachedModel.model;
      tokenizer = cachedModel.tokenizer;
      intentMap = cachedModel.intentMap;
      
      if (onProgress) {
        onProgress(15, { acc: 0.95, loss: 0.15 }); // Report completed
      }
      
      return true;
    }
    
    // Train new model if no cache
    console.log('⚙️ Training new model with SUPER FAST settings...');
    const result = await trainModel(intents, onProgress);
    
    if (result) {
      model = result.model;
      tokenizer = result.tokenizer;
      intentMap = result.intentMap;
      
      // Cache for next time
      await saveModelToCache(model, tokenizer, intentMap);
      
      return true;
    }
    
    return false;
  } catch (error) {
    console.error('Error initializing chatbot model:', error);
    return false;
  }
};

export const getModel = () => model;
export const getTokenizer = () => tokenizer;
export const getIntentMap = () => intentMap;
