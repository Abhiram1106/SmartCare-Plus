import * as tf from '@tensorflow/tfjs';

let model = null;
let tokenizer = null;
let maxLen = 20;

export const tokenizeText = (text, vocabulary) => {
  const words = text.toLowerCase().split(/\s+/);
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
      pattern.toLowerCase().split(/\s+/).forEach(word => words.add(word));
    });
  });
  return Array.from(words);
};

export const createModel = (vocabSize, numIntents) => {
  const model = tf.sequential();
  
  model.add(tf.layers.embedding({
    inputDim: vocabSize + 1,
    outputDim: 16,
    inputLength: maxLen
  }));
  
  model.add(tf.layers.globalAveragePooling1d());
  model.add(tf.layers.dense({ units: 16, activation: 'relu' }));
  model.add(tf.layers.dropout({ rate: 0.5 }));
  model.add(tf.layers.dense({ units: numIntents, activation: 'softmax' }));
  
  model.compile({
    optimizer: 'adam',
    loss: 'categoricalCrossentropy',
    metrics: ['accuracy']
  });
  
  return model;
};

export const trainModel = async (intents) => {
  try {
    if (intents.length === 0) return null;

    const vocabulary = buildVocabulary(intents);
    tokenizer = { vocabulary };
    
    const xs = [];
    const ys = [];
    const intentMap = {};
    
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
    
    await model.fit(xsTensor, ysTensor, {
      epochs: 50,
      batchSize: 8,
      verbose: 0,
      validationSplit: 0.2
    });
    
    xsTensor.dispose();
    ysTensor.dispose();
    
    return { model, tokenizer, intentMap };
  } catch (error) {
    console.error('Error training model:', error);
    return null;
  }
};

export const predictIntent = async (text, intents) => {
  try {
    if (!intents || intents.length === 0) {
      return { intent: null, confidence: 0 };
    }

    const lowerText = text.toLowerCase();
    let bestMatch = null;
    let highestScore = 0;
    
    intents.forEach(intent => {
      intent.patterns.forEach(pattern => {
        const patternWords = pattern.toLowerCase().split(/\s+/);
        const textWords = lowerText.split(/\s+/);
        
        let matchCount = 0;
        patternWords.forEach(word => {
          if (textWords.includes(word)) {
            matchCount++;
          }
        });
        
        const score = matchCount / patternWords.length;
        if (score > highestScore) {
          highestScore = score;
          bestMatch = intent.tag;
        }
      });
    });
    
    if (model && tokenizer) {
      const tokens = tokenizeText(text, tokenizer.vocabulary);
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
      
      if (maxProb > highestScore) {
        return {
          intent: intents[maxIdx].tag,
          confidence: maxProb
        };
      }
    }
    
    return {
      intent: bestMatch,
      confidence: highestScore
    };
  } catch (error) {
    console.error('Error predicting intent:', error);
    return { intent: null, confidence: 0 };
  }
};

export const initializeChatbotModel = async (intents) => {
  try {
    if (intents && intents.length > 0) {
      const result = await trainModel(intents);
      if (result) {
        model = result.model;
        tokenizer = result.tokenizer;
        return true;
      }
    }
    return false;
  } catch (error) {
    console.error('Error initializing chatbot model:', error);
    return false;
  }
};

export async function loadModel(){
  return model;
}
