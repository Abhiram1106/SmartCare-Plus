import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import {
  predictIntent,
  ConversationContext,
  initializeChatbotModel,
  generateRoleAwareResponse,
  suggestDepartmentFromSymptom,
  CONFIDENCE_THRESHOLD,
  getFallbackResponse
} from '../tfjs/enhancedChatbotModel';

const EnhancedChatbot = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [intents, setIntents] = useState([]);
  const [isModelTrained, setIsModelTrained] = useState(false);
  const [trainingProgress, setTrainingProgress] = useState(0);
  const [conversationContext] = useState(new ConversationContext(5));
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const messagesEndRef = useRef(null);
  const recognitionRef = useRef(null);
  const sessionId = useRef(`session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`);

  useEffect(() => {
    initializeChatbot();
    initializeSpeechRecognition();
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const initializeChatbot = async () => {
    try {
      await fetchIntents();
      addBotMessage(
        `Hello${user ? ' ' + user.name : ''}! 👋 Welcome to SmartCare Plus AI Assistant.\n\nI'm here to help you with:\n• 📅 Booking appointments\n• 👨‍⚕️ Finding doctors\n• 🩺 Symptom checking\n• 💳 Payment information\n• 🚨 Emergency assistance\n\nHow can I assist you today?`
      );
    } catch (error) {
      console.error('Error initializing chatbot:', error);
    }
  };

  const fetchIntents = async () => {
    try {
      const response = await api.get('/intents/active');
      const fetchedIntents = response.data;
      setIntents(fetchedIntents);
      
      // Train model with progress updates
      setLoading(true);
      addBotMessage('🧠 Training AI model... Please wait.');
      
      const success = await initializeChatbotModel(fetchedIntents, (epoch, logs) => {
        setTrainingProgress(epoch);
      });
      
      if (success) {
        setIsModelTrained(true);
        addBotMessage('✅ AI model trained successfully! I\'m ready to assist you.');
      }
    } catch (error) {
      console.error('Error fetching intents:', error);
      addBotMessage('⚠️ Error loading AI model. Using basic pattern matching.');
    } finally {
      setLoading(false);
    }
  };

  const initializeSpeechRecognition = () => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = false;
      recognitionRef.current.lang = 'en-US';

      recognitionRef.current.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        setInputMessage(transcript);
        setIsListening(false);
      };

      recognitionRef.current.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        setIsListening(false);
        addBotMessage('Sorry, I couldn\'t hear that clearly. Please try again.');
      };

      recognitionRef.current.onend = () => {
        setIsListening(false);
      };
    }
  };

  const toggleVoiceInput = () => {
    if (!recognitionRef.current) {
      addBotMessage('Voice input is not supported in your browser.');
      return;
    }

    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      recognitionRef.current.start();
      setIsListening(true);
    }
  };

  const speakText = (text) => {
    if ('speechSynthesis' in window) {
      // Stop any ongoing speech
      window.speechSynthesis.cancel();
      
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 1.0;
      utterance.pitch = 1.0;
      utterance.volume = 1.0;
      
      utterance.onstart = () => setIsSpeaking(true);
      utterance.onend = () => setIsSpeaking(false);
      utterance.onerror = () => setIsSpeaking(false);
      
      window.speechSynthesis.speak(utterance);
    }
  };

  const stopSpeaking = () => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const addBotMessage = (text, metadata = {}) => {
    setMessages(prev => [...prev, {
      id: Date.now(),
      text,
      sender: 'bot',
      timestamp: new Date(),
      ...metadata
    }]);
  };

  const addUserMessage = (text) => {
    setMessages(prev => [...prev, {
      id: Date.now(),
      text,
      sender: 'user',
      timestamp: new Date()
    }]);
  };

  const handleDynamicDataQuery = async (intent, entities) => {
    try {
      let dynamicResponse = null;

      // Check for doctor availability
      if (intent.includes('doctor') || intent.includes('find')) {
        const doctors = await api.get('/doctors/approved');
        const doctorList = doctors.data;

        if (entities.department) {
          const filtered = doctorList.filter(d => 
            d.specialization?.toLowerCase() === entities.department.toLowerCase()
          );
          
          if (filtered.length > 0) {
            dynamicResponse = `I found ${filtered.length} ${entities.department} specialist(s):\n\n`;
            filtered.slice(0, 3).forEach(doc => {
              dynamicResponse += `• Dr. ${doc.name} - ${doc.specialization}\n  Experience: ${doc.experience} years | Fee: ₹${doc.consultationFee}\n`;
            });
            dynamicResponse += '\n Would you like to book an appointment?';
          } else {
            dynamicResponse = `Sorry, no ${entities.department} specialists are currently available.`;
          }
        } else {
          dynamicResponse = `We have ${doctorList.length} doctors available across various specializations. Would you like to see a specific specialty?`;
        }
      }

      // Check appointment status
      if (intent.includes('appointment') && user) {
        const appointments = await api.get('/appointments');
        const myAppointments = appointments.data.filter(apt => 
          apt.patient._id === user.id
        );
        
        const upcoming = myAppointments.filter(apt => 
          new Date(apt.appointmentDate) > new Date() && apt.status !== 'cancelled'
        );

        if (upcoming.length > 0) {
          dynamicResponse = `You have ${upcoming.length} upcoming appointment(s):\n\n`;
          upcoming.slice(0, 3).forEach(apt => {
            dynamicResponse += `• With Dr. ${apt.doctor.name}\n  Date: ${new Date(apt.appointmentDate).toLocaleDateString()}\n  Time: ${apt.timeSlot}\n`;
          });
        }
      }

      // Check payment status
      if (intent.includes('payment') && user) {
        const payments = await api.get('/payments');
        const myPayments = payments.data;
        
        const pending = myPayments.filter(p => p.status === 'pending');
        const completed = myPayments.filter(p => p.status === 'completed');

        dynamicResponse = `Payment Summary:\n• Completed: ${completed.length} (₹${completed.reduce((sum, p) => sum + p.amount, 0)})\n• Pending: ${pending.length}`;
      }

      return dynamicResponse;
    } catch (error) {
      console.error('Error fetching dynamic data:', error);
      return null;
    }
  };

  const handleSendMessage = async () => {
    if (!inputMessage.trim()) return;

    const userMsg = inputMessage.trim();
    setInputMessage('');
    addUserMessage(userMsg);
    setLoading(true);

    try {
      // Predict intent with context and entities
      const prediction = await predictIntent(
        userMsg,
        intents,
        conversationContext
      );

      const { intent: detectedIntent, confidence, entities, needsReview } = prediction;

      let botResponse;
      let responseMetadata = { confidence, entities };

      // Check confidence threshold
      if (confidence < CONFIDENCE_THRESHOLD) {
        const fallback = getFallbackResponse(confidence, userMsg, conversationContext);
        if (fallback.response) {
          botResponse = fallback.response;
          responseMetadata.needsReview = true;
        }
      }

      // Get base response from intent
      if (!botResponse && detectedIntent) {
        const intent = intents.find(i => i.tag === detectedIntent);
        if (intent) {
          botResponse = intent.responses[
            Math.floor(Math.random() * intent.responses.length)
          ];

          // Try to get dynamic data
          const dynamicData = await handleDynamicDataQuery(detectedIntent, entities);
          if (dynamicData) {
            botResponse = dynamicData;
          }

          // Generate role-aware response
          botResponse = generateRoleAwareResponse(
            detectedIntent,
            botResponse,
            user?.role,
            entities,
            conversationContext
          );
        }
      }

      // Final fallback
      if (!botResponse) {
        botResponse = "I apologize, but I'm having trouble understanding your request. Could you please rephrase or try asking about:\n• Booking appointments\n• Finding doctors\n• Checking symptoms\n• Payment information\n• Emergency services";
        responseMetadata.needsReview = true;
      }

      // Add to conversation context
      conversationContext.addMessage(userMsg, botResponse, detectedIntent, entities);

      // Display response
      addBotMessage(botResponse, responseMetadata);

      // Log conversation
      if (user) {
        await api.post('/chatlogs', {
          userMessage: userMsg,
          botResponse,
          intent: detectedIntent,
          confidence,
          needsReview: needsReview || confidence < CONFIDENCE_THRESHOLD,
          sessionId: sessionId.current,
          entities: JSON.stringify(entities)
        });
      }
    } catch (error) {
      console.error('Error processing message:', error);
      addBotMessage("I'm experiencing technical difficulties. Please try again in a moment.");
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const provideFeedback = async (messageId, isPositive) => {
    try {
      const message = messages.find(m => m.id === messageId);
      if (message && user) {
        await api.post('/chatlogs/feedback', {
          messageId,
          sessionId: sessionId.current,
          feedback: isPositive ? 'positive' : 'negative',
          message: message.text
        });

        addBotMessage(
          isPositive 
            ? '👍 Thank you for your feedback! It helps me improve.' 
            : '👎 I\'m sorry I couldn\'t help better. I\'ll learn from this.'
        );
      }
    } catch (error) {
      console.error('Error submitting feedback:', error);
    }
  };

  const quickActions = [
    { 
      label: '📅 Book Appointment', 
      message: 'I want to book an appointment',
      icon: '📅'
    },
    { 
      label: '👨‍⚕️ Find Doctor', 
      message: 'Show me available doctors',
      icon: '👨‍⚕️'
    },
    { 
      label: '🩺 Check Symptoms', 
      message: 'I have some symptoms',
      icon: '🩺'
    },
    { 
      label: '💳 Payment Info', 
      message: 'Tell me about payment options',
      icon: '💳'
    },
    { 
      label: '🚨 Emergency', 
      message: 'This is an emergency',
      icon: '🚨'
    },
    {
      label: '📊 My Appointments',
      message: 'Show my appointments',
      icon: '📊'
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 py-8">
      <div className="max-w-5xl mx-auto px-4">
        <div className="bg-white rounded-2xl shadow-2xl overflow-hidden" style={{ height: 'calc(100vh - 100px)' }}>
          {/* Header */}
          <div className="bg-gradient-to-r from-teal-600 via-cyan-600 to-blue-600 p-6 text-white">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="relative">
                  <div className="w-14 h-14 bg-white rounded-full flex items-center justify-center">
                    <svg className="w-9 h-9 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-400 rounded-full border-2 border-white animate-pulse"></div>
                </div>
                <div>
                  <h1 className="text-2xl font-bold">SmartCare Plus AI</h1>
                  <p className="text-blue-100 text-sm">
                    {isModelTrained ? '✅ AI Ready' : '🧠 Training AI...'}
                    {user && ` • ${user.role.charAt(0).toUpperCase() + user.role.slice(1)} Mode`}
                  </p>
                </div>
              </div>
              
              {/* Voice controls */}
              <div className="flex gap-2">
                <button
                  onClick={toggleVoiceInput}
                  className={`p-3 rounded-full ${isListening ? 'bg-red-500 animate-pulse' : 'bg-white bg-opacity-20'} hover:bg-opacity-30 transition-all`}
                  title="Voice Input"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                  </svg>
                </button>
                {isSpeaking && (
                  <button
                    onClick={stopSpeaking}
                    className="p-3 rounded-full bg-red-500 hover:bg-red-600 transition-all"
                    title="Stop Speaking"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 10a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z" />
                    </svg>
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Chat Area */}
          <div className="flex flex-col" style={{ height: 'calc(100% - 110px)' }}>
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {messages.map((message, index) => (
                <div
                  key={message.id}
                  className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[75%] rounded-2xl p-4 shadow-md ${
                      message.sender === 'user'
                        ? 'bg-gradient-to-r from-teal-500 to-cyan-600 text-white'
                        : 'bg-gray-50 text-gray-800 border border-gray-200'
                    }`}
                  >
                    <p className="text-sm whitespace-pre-line">{message.text}</p>
                    
                    {/* Metadata for bot messages */}
                    {message.sender === 'bot' && message.confidence !== undefined && (
                      <div className="mt-2 pt-2 border-t border-gray-200 flex items-center justify-between">
                        <span className={`text-xs ${
                          message.confidence >= CONFIDENCE_THRESHOLD ? 'text-green-600' : 'text-orange-600'
                        }`}>
                          Confidence: {(message.confidence * 100).toFixed(0)}%
                        </span>
                        
                        {/* Feedback buttons */}
                        <div className="flex gap-2">
                          <button
                            onClick={() => provideFeedback(message.id, true)}
                            className="text-green-600 hover:text-green-700 transition-colors"
                            title="Helpful"
                          >
                            👍
                          </button>
                          <button
                            onClick={() => provideFeedback(message.id, false)}
                            className="text-red-600 hover:text-red-700 transition-colors"
                            title="Not helpful"
                          >
                            👎
                          </button>
                          <button
                            onClick={() => speakText(message.text)}
                            className="text-blue-600 hover:text-blue-700 transition-colors"
                            title="Speak"
                          >
                            🔊
                          </button>
                        </div>
                      </div>
                    )}
                    
                    <p className={`text-xs mt-2 ${
                      message.sender === 'user' ? 'text-cyan-100' : 'text-gray-500'
                    }`}>
                      {message.timestamp.toLocaleTimeString()}
                    </p>
                  </div>
                </div>
              ))}
              
              {loading && (
                <div className="flex justify-start">
                  <div className="bg-gray-50 border border-gray-200 rounded-2xl p-4 shadow-md">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-teal-500 rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-cyan-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                      <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Quick Actions */}
            <div className="px-4 pb-3 border-t border-gray-100">
              <div className="flex flex-wrap gap-2 py-3">
                {quickActions.map((action, index) => (
                  <button
                    key={index}
                    onClick={() => setInputMessage(action.message)}
                    className="px-4 py-2 bg-gradient-to-r from-teal-50 to-cyan-50 text-teal-700 rounded-xl hover:from-teal-100 hover:to-cyan-100 transition-all text-sm font-medium shadow-sm hover:shadow-md transform hover:-translate-y-0.5"
                  >
                    {action.label}
                  </button>
                ))}
              </div>

              {/* Input Area */}
              <div className="flex gap-3">
                <input
                  type="text"
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder={isListening ? '🎤 Listening...' : 'Type your message...'}
                  className="flex-1 px-5 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all"
                  disabled={loading || isListening}
                />
                <button
                  onClick={handleSendMessage}
                  disabled={loading || !inputMessage.trim() || isListening}
                  className="px-6 py-3 bg-gradient-to-r from-teal-500 to-cyan-600 text-white rounded-xl hover:from-teal-600 hover:to-cyan-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Tips */}
        <div className="mt-4 text-center space-y-2">
          <p className="text-sm text-gray-600">
            💡 <strong>Pro Tip:</strong> Use voice input for hands-free interaction | Get real-time doctor availability
          </p>
          {conversationContext.getHistory().length > 0 && (
            <p className="text-xs text-gray-500">
              📝 Conversation context: {conversationContext.getHistory().length} messages remembered
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default EnhancedChatbot;
