import { useEffect, useRef, useCallback } from 'react';
import { io } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

let socket = null;

export const useSocket = (user) => {
  const socketRef = useRef(null);
  const reconnectTimeoutRef = useRef(null);

  // Initialize socket connection
  useEffect(() => {
    if (!user) return;

    // Create socket connection if it doesn't exist
    if (!socket) {
      socket = io(SOCKET_URL, {
        transports: ['websocket', 'polling'],
        reconnection: true,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
        reconnectionAttempts: 5
      });

      // Connection event handlers
      socket.on('connect', () => {
        console.log('✅ Socket connected:', socket.id);
        
        // Register user after connection
        socket.emit('user:register', {
          userId: user.id,
          role: user.role,
          name: user.name
        });
      });

      socket.on('connect_error', (error) => {
        console.error('❌ Socket connection error:', error);
      });

      socket.on('disconnect', (reason) => {
        console.log('🔌 Socket disconnected:', reason);
        
        // Attempt to reconnect after disconnect
        if (reason === 'io server disconnect') {
          // Server initiated disconnect, try to reconnect
          reconnectTimeoutRef.current = setTimeout(() => {
            socket.connect();
          }, 2000);
        }
      });

      socket.on('reconnect', (attemptNumber) => {
        console.log('🔄 Socket reconnected after', attemptNumber, 'attempts');
      });

      socket.on('reconnect_failed', () => {
        console.error('❌ Socket reconnection failed');
      });
    }

    socketRef.current = socket;

    // Cleanup on unmount
    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
    };
  }, [user]);

  // Emit event
  const emit = useCallback((event, data) => {
    if (socket && socket.connected) {
      socket.emit(event, data);
    } else {
      console.warn('Socket not connected, cannot emit:', event);
    }
  }, []);

  // Subscribe to event
  const on = useCallback((event, callback) => {
    if (socket) {
      socket.on(event, callback);
    }
  }, []);

  // Unsubscribe from event
  const off = useCallback((event, callback) => {
    if (socket) {
      socket.off(event, callback);
    }
  }, []);

  // Update user status
  const updateStatus = useCallback((status) => {
    emit('user:status', status);
  }, [emit]);

  return {
    socket: socketRef.current,
    emit,
    on,
    off,
    updateStatus,
    isConnected: socket?.connected || false
  };
};

// Appointment events
export const useAppointmentSocket = (user) => {
  const { emit, on, off } = useSocket(user);

  const createAppointment = useCallback((appointment, patientId, doctorId) => {
    emit('appointment:create', { appointment, patientId, doctorId });
  }, [emit]);

  const updateAppointment = useCallback((appointmentId, patientId, doctorId, updates) => {
    emit('appointment:update', { appointmentId, patientId, doctorId, updates });
  }, [emit]);

  const cancelAppointment = useCallback((appointmentId, patientId, doctorId, reason) => {
    emit('appointment:cancel', { appointmentId, patientId, doctorId, reason });
  }, [emit]);

  const acceptAppointment = useCallback((appointmentId, patientId, doctorId) => {
    emit('appointment:accept', { appointmentId, patientId, doctorId });
  }, [emit]);

  const completeAppointment = useCallback((appointmentId, patientId, doctorId) => {
    emit('appointment:complete', { appointmentId, patientId, doctorId });
  }, [emit]);

  return {
    createAppointment,
    updateAppointment,
    cancelAppointment,
    acceptAppointment,
    completeAppointment,
    on,
    off
  };
};

// Chat events
export const useChatSocket = (user) => {
  const { emit, on, off } = useSocket(user);

  const joinRoom = useCallback((roomId) => {
    emit('chat:join', roomId);
  }, [emit]);

  const leaveRoom = useCallback((roomId) => {
    emit('chat:leave', roomId);
  }, [emit]);

  const sendMessage = useCallback((roomId, message, receiverId = null) => {
    emit('chat:message', { roomId, message, receiverId });
  }, [emit]);

  const startTyping = useCallback((roomId, receiverId = null) => {
    emit('chat:typing', { roomId, receiverId });
  }, [emit]);

  const stopTyping = useCallback((roomId, receiverId = null) => {
    emit('chat:stopTyping', { roomId, receiverId });
  }, [emit]);

  const markAsRead = useCallback((messageId, senderId) => {
    emit('chat:read', { messageId, senderId });
  }, [emit]);

  return {
    joinRoom,
    leaveRoom,
    sendMessage,
    startTyping,
    stopTyping,
    markAsRead,
    on,
    off
  };
};

// Payment events
export const usePaymentSocket = (user) => {
  const { emit, on, off } = useSocket(user);

  const createPayment = useCallback((payment, patientId, doctorId) => {
    emit('payment:create', { payment, patientId, doctorId });
  }, [emit]);

  const completePayment = useCallback((paymentId, patientId, doctorId, amount) => {
    emit('payment:complete', { paymentId, patientId, doctorId, amount });
  }, [emit]);

  return {
    createPayment,
    completePayment,
    on,
    off
  };
};

// Admin dashboard events
export const useAdminSocket = (user) => {
  const { emit, on, off } = useSocket(user);

  const subscribeToDashboard = useCallback(() => {
    emit('admin:subscribe');
  }, [emit]);

  return {
    subscribeToDashboard,
    on,
    off
  };
};

export default useSocket;
