import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../hooks/useSocket';
import api from '../../services/api';
import { useToast } from '../../hooks/useToast';
import ToastContainer from '../../components/ToastContainer';

const ChatWithDoctor = React.memo(() => {
  const { user } = useAuth();
  const socket = useSocket();
  const { showError } = useToast();
  const [doctors, setDoctors] = useState([]);
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [typingUserName, setTypingUserName] = useState('');
  const [onlineDoctors, setOnlineDoctors] = useState(new Set());
  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);

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
      if (selectedDoctor && 
          ((data.senderId === selectedDoctor._id && data.receiverId === user.id) ||
           (data.senderId === user.id && data.receiverId === selectedDoctor._id))) {
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
      if (selectedDoctor && userId === selectedDoctor._id) {
        setIsTyping(true);
        setTypingUserName(userName);
      }
    });

    socket.on('chat:userStoppedTyping', ({ userId }) => {
      if (selectedDoctor && userId === selectedDoctor._id) {
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
      if (role === 'doctor') {
        setOnlineDoctors(prev => new Set([...prev, userId]));
      }
    });

    socket.on('user:offline', ({ userId }) => {
      setOnlineDoctors(prev => {
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
  }, [socket, selectedDoctor, user]);

  // Helper function to create consistent room ID
  const createRoomId = useCallback((userId1, userId2) => {
    // Always put the smaller ID first to ensure consistency
    const [id1, id2] = [userId1, userId2].sort();
    return `chat_${id1}_${id2}`;
  }, []);

  // Join chat room when doctor is selected
  useEffect(() => {
    if (socket && selectedDoctor && user) {
      const roomId = createRoomId(user.id, selectedDoctor._id);
      socket.emit('chat:join', { roomId, userId: user.id });
      
      return () => {
        socket.emit('chat:leave', { roomId, userId: user.id });
      };
    }
  }, [socket, selectedDoctor, user]);

  useEffect(() => {
    fetchDoctors();
  }, []);

  useEffect(() => {
    if (selectedDoctor) {
      fetchMessages(selectedDoctor._id);
    }
  }, [selectedDoctor]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const fetchDoctors = useCallback(async () => {
    try {
      // Fetch only doctors that the patient has appointments with
      const response = await api.get('/appointments');
      const uniqueDoctors = [];
      const doctorIds = new Set();
      
      response.data.forEach(apt => {
        if (apt.doctor && !doctorIds.has(apt.doctor._id)) {
          doctorIds.add(apt.doctor._id);
          uniqueDoctors.push(apt.doctor);
        }
      });
      
      setDoctors(uniqueDoctors);
    } catch (error) {
      console.error('Error fetching doctors:', error);
    }
  }, []);

  const fetchMessages = useCallback(async (doctorId) => {
    setLoading(true);
    try {
      const response = await api.get(`/chat/messages/${doctorId}`);
      setMessages(response.data || []);
      
      // Mark all messages as read
      await api.put(`/chat/mark-all-read/${doctorId}`);
    } catch (error) {
      console.error('Error fetching messages:', error);
      setMessages([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleInputChange = (e) => {
    setNewMessage(e.target.value);
    
    if (!socket || !selectedDoctor) return;

    // Clear previous timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Emit typing event
    const roomId = createRoomId(user.id, selectedDoctor._id);
    socket.emit('chat:typing', {
      roomId,
      userId: user.id,
      receiverId: selectedDoctor._id,
      userName: user.name
    });

    // Stop typing after 2 seconds
    typingTimeoutRef.current = setTimeout(() => {
      const roomId = createRoomId(user.id, selectedDoctor._id);
      socket.emit('chat:stopTyping', {
        roomId,
        userId: user.id,
        receiverId: selectedDoctor._id
      });
    }, 2000);
  };

  const handleSendMessage = useCallback(async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedDoctor) return;

    const messageData = {
      receiverId: selectedDoctor._id,
      message: newMessage,
      senderName: user.name,
      receiverName: selectedDoctor.name,
    };

    try {
      const response = await api.post('/chat/send', messageData);
      
      // Emit socket event for real-time delivery
      if (socket) {
        const roomId = createRoomId(user.id, selectedDoctor._id);
        socket.emit('chat:message', {
          roomId,
          message: response.data,
          receiverId: selectedDoctor._id
        });
        
        // Stop typing indicator
        socket.emit('chat:stopTyping', {
          roomId,
          userId: user.id,
          receiverId: selectedDoctor._id
        });
      }

      // Add message to local state (will also come through socket)
      setMessages(prev => [...prev, response.data]);
      setNewMessage('');
    } catch (error) {
      console.error('Error sending message:', error);
      showError('Failed to send message');
    }
  }, [newMessage, selectedDoctor, user.name, user.id, socket, createRoomId, showError]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-cyan-50 py-8">
      <div className="max-w-7xl mx-auto px-4">
        <div className="mb-6">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">
            Chat with Doctor
          </h1>
          <p className="text-gray-600 mt-2">Connect with your healthcare providers instantly</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-200px)]">
          {/* Doctors List */}
          <div className="bg-white rounded-2xl shadow-xl p-6 overflow-y-auto">
            <h2 className="text-xl font-bold text-gray-800 mb-4">Your Doctors</h2>
            {doctors.length === 0 ? (
              <div className="text-center py-12">
                <svg className="w-16 h-16 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a2 2 0 01-2-2v-6a2 2 0 012-2h8z" />
                </svg>
                <h3 className="text-lg font-semibold text-gray-700 mb-2">No Doctors Available</h3>
                <p className="text-gray-500 mb-4 text-sm">
                  You can only chat with doctors you have appointments with.
                </p>
                <Link
                  to="/patient/doctors"
                  className="inline-block px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Book Appointment
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                {doctors.map((doctor) => (
                <button
                  key={doctor._id}
                  onClick={() => setSelectedDoctor(doctor)}
                  className={`w-full p-4 rounded-xl text-left transition-all ${
                    selectedDoctor?._id === doctor._id
                      ? 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white shadow-lg'
                      : 'bg-gray-50 hover:bg-gray-100'
                  }`}
                >
                  <div className="flex items-center">
                    <div className="relative">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-400 to-cyan-400 flex items-center justify-center text-white font-bold text-lg">
                        {doctor.name.charAt(0)}
                      </div>
                      <span
                        className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white ${
                          onlineDoctors.has(doctor._id) ? 'bg-green-500' : 'bg-gray-400'
                        }`}
                        title={onlineDoctors.has(doctor._id) ? 'Online' : 'Offline'}
                      />
                    </div>
                    <div className="ml-3 flex-1">
                      <h3 className={`font-semibold ${
                        selectedDoctor?._id === doctor._id ? 'text-white' : 'text-gray-800'
                      }`}>
                        Dr. {doctor.name}
                      </h3>
                      <p className={`text-sm ${
                        selectedDoctor?._id === doctor._id ? 'text-blue-100' : 'text-gray-600'
                      }`}>
                        {doctor.specialization}
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
            {selectedDoctor ? (
              <>
                {/* Chat Header */}
                <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-t-2xl">
                  <div className="flex items-center">
                    <div className="relative">
                      <div className="w-12 h-12 rounded-full bg-white flex items-center justify-center text-blue-600 font-bold text-lg">
                        {selectedDoctor.name.charAt(0)}
                      </div>
                      <span
                        className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white ${
                          onlineDoctors.has(selectedDoctor._id) ? 'bg-green-500' : 'bg-gray-400'
                        }`}
                      />
                    </div>
                    <div className="ml-4">
                      <h3 className="text-lg font-bold text-white">
                        Dr. {selectedDoctor.name}
                      </h3>
                      <div className="flex items-center space-x-2">
                        <span className="text-blue-100 text-sm">{selectedDoctor.specialization}</span>
                        <span className="text-xs text-blue-200">
                          • {onlineDoctors.has(selectedDoctor._id) ? 'Online' : 'Offline'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Messages */}
                <div className="flex-1 p-6 overflow-y-auto bg-gray-50">
                  {loading ? (
                    <div className="flex items-center justify-center h-full">
                      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                    </div>
                  ) : messages.length === 0 ? (
                    <div className="flex items-center justify-center h-full text-gray-400">
                      <div className="text-center">
                        <svg className="w-16 h-16 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                        </svg>
                        <p className="text-lg">No messages yet</p>
                        <p className="text-sm mt-2">Start a conversation with Dr. {selectedDoctor.name}</p>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {messages.map((msg, index) => (
                        <div
                          key={index}
                          className={`flex ${msg.senderId === user.id ? 'justify-end' : 'justify-start'}`}
                        >
                          <div
                            className={`max-w-xs lg:max-w-md px-4 py-3 rounded-2xl ${
                              msg.senderId === user.id
                                ? 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-br-none'
                                : 'bg-white text-gray-800 shadow-md rounded-bl-none'
                            }`}
                          >
                            <p className="text-sm">{msg.message}</p>
                            <div className="flex items-center justify-between mt-1 space-x-2">
                              <p className={`text-xs ${
                                msg.senderId === user.id ? 'text-blue-100' : 'text-gray-400'
                              }`}>
                                {new Date(msg.timestamp || msg.createdAt).toLocaleTimeString([], { 
                                  hour: '2-digit', 
                                  minute: '2-digit' 
                                })}
                              </p>
                              {msg.senderId === user.id && (
                                <span className={`text-xs ${msg.read ? 'text-blue-200' : 'text-white/60'}`}>
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
                          <span className="text-sm text-gray-600">Dr. {typingUserName} is typing</span>
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
                      onKeyPress={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          handleSendMessage(e);
                        }
                      }}
                      placeholder="Type your message..."
                      className="flex-1 px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    <button
                      type="submit"
                      disabled={!newMessage.trim()}
                      className="px-6 py-3 bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-xl hover:from-blue-600 hover:to-cyan-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
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
                  <p className="text-lg">Select a doctor to start chatting</p>
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

export default ChatWithDoctor;
