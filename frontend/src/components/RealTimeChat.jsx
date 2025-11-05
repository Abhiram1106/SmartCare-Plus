import React, { useState, useEffect, useRef } from 'react';
import { Send, X, MessageCircle, Check, CheckCheck } from 'lucide-react';
import { useChatSocket } from '../hooks/useSocket';
import TypingIndicator from './TypingIndicator';
import OnlineStatusIndicator from './OnlineStatusIndicator';

const RealTimeChat = ({ user, recipientId, recipientName, recipientRole, appointmentId = null }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [typingUsers, setTypingUsers] = useState(new Set());
  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const inputRef = useRef(null);

  const roomId = appointmentId || `chat_${[user.id, recipientId].sort().join('_')}`;
  const { joinRoom, leaveRoom, sendMessage, startTyping, stopTyping, markAsRead, on, off } = useChatSocket(user);

  // Auto-scroll to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Load messages from localStorage
  useEffect(() => {
    const savedMessages = localStorage.getItem(`chat_${roomId}`);
    if (savedMessages) {
      setMessages(JSON.parse(savedMessages));
    }
  }, [roomId]);

  // Save messages to localStorage
  useEffect(() => {
    if (messages.length > 0) {
      localStorage.setItem(`chat_${roomId}`, JSON.stringify(messages));
    }
  }, [messages, roomId]);

  // Join/leave chat room
  useEffect(() => {
    if (isOpen) {
      joinRoom(roomId);
      
      // Listen for incoming messages
      const handleMessage = (data) => {
        const newMessage = {
          id: data.messageId || Date.now(),
          senderId: data.senderId,
          senderName: data.senderName,
          message: data.message,
          timestamp: data.timestamp,
          read: data.senderId === user.id // Mark own messages as read
        };
        
        setMessages(prev => [...prev, newMessage]);
        
        // Mark as read if message is from other user
        if (data.senderId !== user.id && data.messageId) {
          markAsRead(data.messageId, data.senderId);
        }
      };

      // Listen for typing indicators
      const handleTyping = (data) => {
        if (data.userId !== user.id) {
          setTypingUsers(prev => new Set([...prev, data.userId]));
          
          // Clear typing after 3 seconds
          setTimeout(() => {
            setTypingUsers(prev => {
              const newSet = new Set(prev);
              newSet.delete(data.userId);
              return newSet;
            });
          }, 3000);
        }
      };

      const handleStopTyping = (data) => {
        if (data.userId !== user.id) {
          setTypingUsers(prev => {
            const newSet = new Set(prev);
            newSet.delete(data.userId);
            return newSet;
          });
        }
      };

      // Listen for read receipts
      const handleRead = (data) => {
        if (data.senderId === user.id) {
          setMessages(prev =>
            prev.map(msg =>
              msg.id === data.messageId ? { ...msg, read: true } : msg
            )
          );
        }
      };

      on('chat:message', handleMessage);
      on('chat:typing', handleTyping);
      on('chat:stopTyping', handleStopTyping);
      on('chat:read', handleRead);

      return () => {
        off('chat:message', handleMessage);
        off('chat:typing', handleTyping);
        off('chat:stopTyping', handleStopTyping);
        off('chat:read', handleRead);
        leaveRoom(roomId);
      };
    }
  }, [isOpen, roomId, user.id, joinRoom, leaveRoom, markAsRead, on, off]);

  // Handle typing
  const handleInputChange = (e) => {
    setInputMessage(e.target.value);

    // Emit typing indicator
    if (!isTyping) {
      setIsTyping(true);
      startTyping(roomId, recipientId);
    }

    // Clear previous timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Stop typing after 2 seconds of no input
    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false);
      stopTyping(roomId, recipientId);
    }, 2000);
  };

  // Send message
  const handleSendMessage = (e) => {
    e.preventDefault();
    
    if (!inputMessage.trim()) return;

    const newMessage = {
      id: Date.now(),
      senderId: user.id,
      senderName: user.name,
      message: inputMessage.trim(),
      timestamp: new Date().toISOString(),
      read: false
    };

    // Add to local state
    setMessages(prev => [...prev, newMessage]);

    // Emit to server
    sendMessage(roomId, inputMessage.trim(), recipientId);

    // Clear input
    setInputMessage('');
    setIsTyping(false);
    stopTyping(roomId, recipientId);

    // Clear typing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Focus back to input
    inputRef.current?.focus();
  };

  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  };

  const formatDate = (timestamp) => {
    const date = new Date(timestamp);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }
  };

  // Group messages by date
  const groupedMessages = messages.reduce((groups, message) => {
    const date = formatDate(message.timestamp);
    if (!groups[date]) {
      groups[date] = [];
    }
    groups[date].push(message);
    return groups;
  }, {});

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {/* Chat Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="flex items-center gap-2 px-4 py-3 bg-gradient-to-r from-teal-500 to-cyan-600 text-white rounded-full shadow-2xl hover:shadow-teal-500/50 hover:scale-110 transition-all duration-300 group"
        >
          <MessageCircle className="w-6 h-6 group-hover:animate-bounce" />
          <span className="font-semibold">Chat with {recipientName}</span>
        </button>
      )}

      {/* Chat Window */}
      {isOpen && (
        <div className="w-96 h-[600px] bg-white rounded-2xl shadow-2xl flex flex-col overflow-hidden border border-gray-200">
          {/* Header */}
          <div className="flex items-center justify-between p-4 bg-gradient-to-r from-teal-500 to-cyan-600 text-white">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center font-bold">
                {recipientName.charAt(0).toUpperCase()}
              </div>
              <div>
                <h3 className="font-bold">{recipientName}</h3>
                <div className="flex items-center gap-2">
                  <OnlineStatusIndicator userId={recipientId} size="sm" />
                  <span className="text-xs capitalize">{recipientRole}</span>
                </div>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="p-2 hover:bg-white/20 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
            {Object.entries(groupedMessages).map(([date, msgs]) => (
              <div key={date}>
                {/* Date divider */}
                <div className="flex items-center justify-center my-4">
                  <span className="px-3 py-1 bg-gray-200 rounded-full text-xs text-gray-600 font-medium">
                    {date}
                  </span>
                </div>

                {/* Messages for this date */}
                {msgs.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex ${msg.senderId === user.id ? 'justify-end' : 'justify-start'} mb-3`}
                  >
                    <div
                      className={`max-w-[75%] rounded-2xl px-4 py-2 ${
                        msg.senderId === user.id
                          ? 'bg-gradient-to-r from-teal-500 to-cyan-600 text-white rounded-br-none'
                          : 'bg-white border border-gray-200 text-gray-800 rounded-bl-none'
                      }`}
                    >
                      {msg.senderId !== user.id && (
                        <p className="text-xs font-semibold mb-1 text-teal-600">{msg.senderName}</p>
                      )}
                      <p className="text-sm break-words">{msg.message}</p>
                      <div className="flex items-center justify-end gap-1 mt-1">
                        <span
                          className={`text-xs ${
                            msg.senderId === user.id ? 'text-white/70' : 'text-gray-500'
                          }`}
                        >
                          {formatTime(msg.timestamp)}
                        </span>
                        {msg.senderId === user.id && (
                          msg.read ? (
                            <CheckCheck className="w-3 h-3 text-blue-300" />
                          ) : (
                            <Check className="w-3 h-3 text-white/70" />
                          )
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ))}

            {/* Typing indicator */}
            {typingUsers.size > 0 && (
              <TypingIndicator userName={recipientName} show={true} />
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <form onSubmit={handleSendMessage} className="p-4 bg-white border-t border-gray-200">
            <div className="flex items-center gap-2">
              <input
                ref={inputRef}
                type="text"
                value={inputMessage}
                onChange={handleInputChange}
                placeholder="Type a message..."
                className="flex-1 px-4 py-2 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
              />
              <button
                type="submit"
                disabled={!inputMessage.trim()}
                className="p-3 bg-gradient-to-r from-teal-500 to-cyan-600 text-white rounded-full hover:shadow-lg hover:scale-110 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
              >
                <Send className="w-5 h-5" />
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default RealTimeChat;
