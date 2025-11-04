import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { predictIntent } from '../tfjs/chatbotModel';

const Chatbot = () => {
  const { user } = useAuth();
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [intents, setIntents] = useState([]);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    fetchIntents();
    addBotMessage("Hello! Welcome to SmartCare Plus. I'm your virtual assistant. How can I help you today?");
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const fetchIntents = async () => {
    try {
      const response = await api.get('/intents/active');
      setIntents(response.data);
    } catch (error) {
      console.error('Error fetching intents:', error);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const addBotMessage = (text) => {
    setMessages(prev => [...prev, {
      id: Date.now(),
      text,
      sender: 'bot',
      timestamp: new Date()
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

  const findBestIntent = (userMessage) => {
    const lowerMessage = userMessage.toLowerCase();
    
    for (const intent of intents) {
      for (const pattern of intent.patterns) {
        if (lowerMessage.includes(pattern.toLowerCase())) {
          return intent;
        }
      }
    }
    return null;
  };

  const handleSendMessage = async () => {
    if (!inputMessage.trim()) return;

    const userMsg = inputMessage.trim();
    setInputMessage('');
    addUserMessage(userMsg);
    setLoading(true);

    try {
      const matchedIntent = findBestIntent(userMsg);
      
      let botResponse;
      let detectedIntent = null;
      let confidence = 0;

      if (matchedIntent) {
        botResponse = matchedIntent.responses[
          Math.floor(Math.random() * matchedIntent.responses.length)
        ];
        detectedIntent = matchedIntent.tag;
        confidence = 0.85;
      } else {
        const prediction = await predictIntent(userMsg, intents);
        if (prediction && prediction.confidence > 0.5) {
          const intent = intents.find(i => i.tag === prediction.intent);
          if (intent) {
            botResponse = intent.responses[
              Math.floor(Math.random() * intent.responses.length)
            ];
            detectedIntent = prediction.intent;
            confidence = prediction.confidence;
          }
        }
      }

      if (!botResponse) {
        botResponse = "I'm sorry, I didn't quite understand that. Could you please rephrase or try asking about appointments, finding doctors, or our services?";
        confidence = 0;
      }

      addBotMessage(botResponse);

      if (user) {
        await api.post('/chatlogs', {
          userMessage: userMsg,
          botResponse,
          detectedIntent,
          confidence,
          needsReview: confidence < 0.5
        });
      }
    } catch (error) {
      console.error('Error processing message:', error);
      addBotMessage("I'm having trouble processing your request. Please try again.");
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

  const quickActions = [
    { label: 'Book Appointment', message: 'I want to book an appointment' },
    { label: 'Find Doctor', message: 'Help me find a doctor' },
    { label: 'Symptoms Check', message: 'I have some symptoms to discuss' },
    { label: 'Emergency', message: 'This is an emergency' }
  ];

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow-md overflow-hidden" style={{ height: 'calc(100vh - 150px)' }}>
          <div className="bg-gradient-to-r from-blue-600 to-blue-700 p-6 text-white">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center">
                <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <div>
                <h1 className="text-2xl font-bold">SmartCare Plus Assistant</h1>
                <p className="text-blue-100 text-sm">AI-powered healthcare support</p>
              </div>
            </div>
          </div>

          <div className="flex flex-col" style={{ height: 'calc(100% - 100px)' }}>
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[70%] rounded-lg p-4 ${
                      message.sender === 'user'
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-800'
                    }`}
                  >
                    <p className="text-sm">{message.text}</p>
                    <p className={`text-xs mt-2 ${
                      message.sender === 'user' ? 'text-blue-100' : 'text-gray-500'
                    }`}>
                      {message.timestamp.toLocaleTimeString()}
                    </p>
                  </div>
                </div>
              ))}
              {loading && (
                <div className="flex justify-start">
                  <div className="bg-gray-100 rounded-lg p-4">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            <div className="p-4 border-t border-gray-200">
              <div className="mb-3 flex flex-wrap gap-2">
                {quickActions.map((action, index) => (
                  <button
                    key={index}
                    onClick={() => {
                      setInputMessage(action.message);
                    }}
                    className="px-4 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors text-sm"
                  >
                    {action.label}
                  </button>
                ))}
              </div>

              <div className="flex gap-3">
                <input
                  type="text"
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Type your message..."
                  className="flex-1 px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  disabled={loading}
                />
                <button
                  onClick={handleSendMessage}
                  disabled={loading || !inputMessage.trim()}
                  className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-4 text-center text-sm text-gray-500">
          <p>💡 Tip: Ask me about booking appointments, finding doctors, or medical information</p>
        </div>
      </div>
    </div>
  );
};

export default Chatbot;
