import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../hooks/useSocket';
import api from '../../services/api';
import { useToast } from '../../hooks/useToast';
import ToastContainer from '../../components/ToastContainer';

const DoctorChat = React.memo(() => {
  const { user } = useAuth();
  const socket = useSocket();
  const { showError } = useToast();
  const [patients, setPatients] = useState([]);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [typingUserName, setTypingUserName] = useState('');
  const [onlinePatients, setOnlinePatients] = useState(new Set());
  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  // Early return if user is not available or not a doctor
  if (!user) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
      </div>
    );
  }

  if (user.role !== 'doctor') {
    return (
      <div className="max-w-2xl mx-auto px-4 py-8">
        <div className="bg-red-50 border border-red-400 text-red-700 px-4 py-3 rounded">
          Access denied. This page is only available to doctors.
        </div>
      </div>
    );
  }

  // Register user with socket on mount
  useEffect(() => {
    if (socket && user) {
      socket.emit('user:register', {
        userId: user.id,
        role: user.role,
        name: user.name
      });
    }
  }, [socket, user]);

  // Setup socket listeners
  useEffect(() => {
    if (!socket) return;

    // Real-time message listener
    socket.on('chat:newMessage', (data) => {
      if (selectedPatient && 
          ((data.senderId === selectedPatient._id && data.receiverId === user.id) ||
           (data.senderId === user.id && data.receiverId === selectedPatient._id))) {
        setMessages(prev => [...prev, {
          _id: data._id || Date.now(),
          message: data.message,
          senderId: data.senderId,
          receiverId: data.receiverId,
          senderName: data.senderName,
          timestamp: data.timestamp,
          read: data.read || false,
          delivered: data.delivered || true
        }]);
      }
    });

    // Typing indicator listeners
    socket.on('chat:userTyping', ({ userId, userName }) => {
      if (selectedPatient && userId === selectedPatient._id) {
        setIsTyping(true);
        setTypingUserName(userName);
      }
    });

    socket.on('chat:userStoppedTyping', ({ userId }) => {
      if (selectedPatient && userId === selectedPatient._id) {
        setIsTyping(false);
        setTypingUserName('');
      }
    });

    // Read receipt listener
    socket.on('chat:messageRead', ({ messageId }) => {
      setMessages(prev => prev.map(msg => 
        msg._id === messageId ? { ...msg, read: true } : msg
      ));
    });

    // Online status listeners
    socket.on('user:online', ({ userId, role }) => {
      if (role === 'patient') {
        setOnlinePatients(prev => new Set([...prev, userId]));
      }
    });

    socket.on('user:offline', ({ userId }) => {
      setOnlinePatients(prev => {
        const newSet = new Set(prev);
        newSet.delete(userId);
        return newSet;
      });
    });

    return () => {
      socket.off('chat:newMessage');
      socket.off('chat:userTyping');
      socket.off('chat:userStoppedTyping');
      socket.off('chat:messageRead');
      socket.off('user:online');
      socket.off('user:offline');
    };
  }, [socket, selectedPatient, user]);

  // Helper function to create consistent room ID
  const createRoomId = useCallback((userId1, userId2) => {
    // Always put the smaller ID first to ensure consistency
    const [id1, id2] = [userId1, userId2].sort();
    return `chat_${id1}_${id2}`;
  }, []);

  // Join chat room when patient is selected
  useEffect(() => {
    if (socket && selectedPatient && user) {
      const roomId = createRoomId(user.id, selectedPatient._id);
      socket.emit('chat:join', { roomId, userId: user.id });
      
      return () => {
        socket.emit('chat:leave', { roomId, userId: user.id });
      };
    }
  }, [socket, selectedPatient, user]);

  useEffect(() => {
    fetchPatients();
  }, []);

  useEffect(() => {
    if (selectedPatient) {
      fetchMessages(selectedPatient._id);
    }
  }, [selectedPatient]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Memoize enhanced patients with online status and unread counts
  const enhancedPatients = useMemo(() => {
    return patients.map(patient => ({
      ...patient,
      isOnline: onlinePatients.has(patient._id),
      // Add any other computed properties here
    }));
  }, [patients, onlinePatients]);

  // Memoize sorted messages for better performance
  const sortedMessages = useMemo(() => {
    return messages.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
  }, [messages]);

  const fetchPatients = useCallback(async () => {
    try {
      const response = await api.get('/appointments');
      const uniquePatients = [];
      const patientIds = new Set();
      
      response.data.forEach(apt => {
        if (apt.patient && !patientIds.has(apt.patient._id)) {
          patientIds.add(apt.patient._id);
          uniquePatients.push(apt.patient);
        }
      });
      
      setPatients(uniquePatients);
    } catch (error) {
      console.error('Error fetching patients:', error);
    }
  }, []);

  const fetchMessages = useCallback(async (patientId) => {
    setLoading(true);
    try {
      const response = await api.get(`/chat/messages/${patientId}`);
      setMessages(response.data || []);
      
      // Mark all messages as read
      await api.put(`/chat/mark-all-read/${patientId}`);
    } catch (error) {
      console.error('Error fetching messages:', error);
      setMessages([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleInputChange = useCallback((e) => {
    setNewMessage(e.target.value);
    
    if (!socket || !selectedPatient) return;

    // Clear previous timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Emit typing event
    const roomId = createRoomId(user.id, selectedPatient._id);
    socket.emit('chat:typing', {
      roomId,
      userId: user.id,
      receiverId: selectedPatient._id,
      userName: user.name
    });

    // Stop typing after 2 seconds
    typingTimeoutRef.current = setTimeout(() => {
      socket.emit('chat:stopTyping', {
        roomId,
        userId: user.id,
        receiverId: selectedPatient._id
      });
    }, 2000);
  }, [socket, selectedPatient, user.id, user.name, createRoomId]);

  const handleSendMessage = useCallback(async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedPatient) return;

    const messageData = {
      receiverId: selectedPatient._id,
      message: newMessage,
      senderName: user.name,
      receiverName: selectedPatient.name,
    };

    try {
      const response = await api.post('/chat/send', messageData);
      
      // Emit socket event for real-time delivery
      if (socket) {
        const roomId = createRoomId(user.id, selectedPatient._id);
        socket.emit('chat:message', {
          roomId,
          message: response.data,
          receiverId: selectedPatient._id
        });
        
        // Stop typing indicator
        socket.emit('chat:stopTyping', {
          roomId,
          userId: user.id,
          receiverId: selectedPatient._id
        });
      }

      // Add message to local state (will also come through socket)
      setMessages(prev => [...prev, response.data]);
      setNewMessage('');
    } catch (error) {
      console.error('Error sending message:', error);
      showError('Failed to send message');
    }
  }, [newMessage, selectedPatient, user.name, user.id, socket, createRoomId, showError]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-emerald-50 to-teal-50 py-8">
      <div className="max-w-7xl mx-auto px-4">
        <div className="mb-6">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
            Patient Messages
          </h1>
          <p className="text-gray-600 mt-2">Chat with your patients</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-200px)]">
          {/* Patients List */}
          <div className="bg-white rounded-2xl shadow-xl p-6 overflow-y-auto">
            <h2 className="text-xl font-bold text-gray-800 mb-4">Your Patients</h2>
            {patients.length === 0 ? (
              <div className="text-center py-12">
                <svg className="w-16 h-16 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a2 2 0 01-2-2v-6a2 2 0 012-2h8z" />
                </svg>
                <h3 className="text-lg font-semibold text-gray-700 mb-2">No Patients to Chat With</h3>
                <p className="text-gray-500 text-sm">
                  You can only chat with patients who have appointments with you.
                </p>
                <p className="text-gray-400 text-xs mt-2">
                  Patients will appear here once they book appointments.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {enhancedPatients.map((patient) => (
                  <button
                    key={patient._id}
                    onClick={() => setSelectedPatient(patient)}
                    className={`w-full p-4 rounded-xl text-left transition-all ${
                      selectedPatient?._id === patient._id
                        ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-lg'
                        : 'bg-gray-50 hover:bg-gray-100'
                    }`}
                  >
                    <div className="flex items-center">
                      <div className="relative">
                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-emerald-400 to-teal-400 flex items-center justify-center text-white font-bold text-lg">
                          {patient.name.charAt(0)}
                        </div>
                        <span
                          className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white ${
                            patient.isOnline ? 'bg-green-500' : 'bg-gray-400'
                          }`}
                          title={patient.isOnline ? 'Online' : 'Offline'}
                        />
                      </div>
                      <div className="ml-3 flex-1">
                        <h3 className={`font-semibold ${
                          selectedPatient?._id === patient._id ? 'text-white' : 'text-gray-800'
                        }`}>
                          {patient.name}
                        </h3>
                        <p className={`text-sm ${
                          selectedPatient?._id === patient._id ? 'text-emerald-100' : 'text-gray-600'
                        }`}>
                          {patient.email}
                        </p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Chat Area */}
          <div className="lg:col-span-2 bg-white rounded-2xl shadow-xl flex flex-col">
            {selectedPatient ? (
              <>
                {/* Chat Header */}
                <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-t-2xl">
                  <div className="flex items-center">
                    <div className="relative">
                      <div className="w-12 h-12 rounded-full bg-white flex items-center justify-center text-emerald-600 font-bold text-lg">
                        {selectedPatient.name.charAt(0)}
                      </div>
                      <span
                        className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white ${
                          onlinePatients.has(selectedPatient._id) ? 'bg-green-500' : 'bg-gray-400'
                        }`}
                      />
                    </div>
                    <div className="ml-4">
                      <h3 className="text-lg font-bold text-white">
                        {selectedPatient.name}
                      </h3>
                      <div className="flex items-center space-x-2">
                        <p className="text-emerald-100 text-sm">{selectedPatient.email}</p>
                        <span className="text-xs text-emerald-200">
                          • {onlinePatients.has(selectedPatient._id) ? 'Online' : 'Offline'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Messages */}
                <div className="flex-1 p-6 overflow-y-auto bg-gray-50">
                  {loading ? (
                    <div className="flex items-center justify-center h-full">
                      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
                    </div>
                  ) : sortedMessages.length === 0 ? (
                    <div className="flex items-center justify-center h-full text-gray-400">
                      <div className="text-center">
                        <svg className="w-16 h-16 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                        </svg>
                        <p className="text-lg">No messages yet</p>
                        <p className="text-sm mt-2">Start a conversation with {selectedPatient.name}</p>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {sortedMessages.map((msg, index) => (
                        <div
                          key={index}
                          className={`flex ${msg.senderId === user.id ? 'justify-end' : 'justify-start'}`}
                        >
                          <div
                            className={`max-w-xs lg:max-w-md px-4 py-3 rounded-2xl ${
                              msg.senderId === user.id
                                ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-br-none'
                                : 'bg-white text-gray-800 shadow-md rounded-bl-none'
                            }`}
                          >
                            <p className="text-sm">{msg.message}</p>
                            <div className="flex items-center justify-between mt-1 space-x-2">
                              <p className={`text-xs ${
                                msg.senderId === user.id ? 'text-emerald-100' : 'text-gray-400'
                              }`}>
                                {new Date(msg.timestamp || msg.createdAt).toLocaleTimeString([], { 
                                  hour: '2-digit', 
                                  minute: '2-digit' 
                                })}
                              </p>
                              {msg.senderId === user.id && (
                                <span className={`text-xs ${msg.read ? 'text-emerald-200' : 'text-white/60'}`}>
                                  {msg.read ? '✓✓' : '✓'}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                      <div ref={messagesEndRef} />
                    </div>
                  )}
                  
                  {isTyping && (
                    <div className="flex justify-start mt-2">
                      <div className="bg-white text-gray-800 px-4 py-3 rounded-2xl rounded-bl-none shadow-md">
                        <div className="flex items-center space-x-2">
                          <span className="text-sm text-gray-600">{typingUserName} is typing</span>
                          <span className="flex space-x-1">
                            <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                            <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                            <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                          </span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Input */}
                <form onSubmit={handleSendMessage} className="p-4 border-t border-gray-200 bg-white rounded-b-2xl">
                  <div className="flex items-center space-x-2">
                    <input
                      type="text"
                      value={newMessage}
                      onChange={handleInputChange}
                      placeholder="Type your message..."
                      className="flex-1 px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                    />
                    <button
                      type="submit"
                      disabled={!newMessage.trim()}
                      className="px-6 py-3 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-xl hover:from-emerald-600 hover:to-teal-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                      </svg>
                    </button>
                  </div>
                </form>
              </>
            ) : (
              <div className="flex items-center justify-center h-full text-gray-400">
                <div className="text-center">
                  <svg className="w-20 h-20 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z" />
                  </svg>
                  <p className="text-lg">Select a patient to start chatting</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      
      <ToastContainer />
    </div>
  );
});

export default DoctorChat;
