// Socket.io Manager for Real-Time Features
// Handles all real-time communications across the application

const onlineUsers = new Map(); // userId -> { socketId, role, status, lastSeen }
const typingUsers = new Map(); // roomId -> Set of userIds

class SocketManager {
  constructor(io) {
    this.io = io;
    this.setupConnectionHandlers();
  }

  setupConnectionHandlers() {
    this.io.on('connection', (socket) => {
      console.log(`✅ Socket connected: ${socket.id}`);

      // User authentication and registration
      socket.on('user:register', (userData) => {
        this.handleUserRegister(socket, userData);
      });

      // User status updates
      socket.on('user:status', (status) => {
        this.handleUserStatus(socket, status);
      });

      // Appointment events
      socket.on('appointment:create', (data) => {
        this.handleAppointmentCreate(socket, data);
      });

      socket.on('appointment:update', (data) => {
        this.handleAppointmentUpdate(socket, data);
      });

      socket.on('appointment:cancel', (data) => {
        this.handleAppointmentCancel(socket, data);
      });

      socket.on('appointment:accept', (data) => {
        this.handleAppointmentAccept(socket, data);
      });

      socket.on('appointment:complete', (data) => {
        this.handleAppointmentComplete(socket, data);
      });

      // Chat events
      socket.on('chat:join', (roomId) => {
        this.handleChatJoin(socket, roomId);
      });

      socket.on('chat:leave', (roomId) => {
        this.handleChatLeave(socket, roomId);
      });

      socket.on('chat:message', (data) => {
        this.handleChatMessage(socket, data);
      });

      socket.on('chat:typing', (data) => {
        this.handleChatTyping(socket, data);
      });

      socket.on('chat:stopTyping', (data) => {
        this.handleChatStopTyping(socket, data);
      });

      socket.on('chat:read', (data) => {
        this.handleChatRead(socket, data);
      });

      // Payment events
      socket.on('payment:create', (data) => {
        this.handlePaymentCreate(socket, data);
      });

      socket.on('payment:complete', (data) => {
        this.handlePaymentComplete(socket, data);
      });

      // Admin dashboard events
      socket.on('admin:subscribe', () => {
        this.handleAdminSubscribe(socket);
      });

      // Disconnect handling
      socket.on('disconnect', () => {
        this.handleDisconnect(socket);
      });
    });
  }

  // User Registration & Status
  handleUserRegister(socket, userData) {
    const { userId, role, name } = userData;
    
    onlineUsers.set(userId, {
      socketId: socket.id,
      role,
      name,
      status: 'online',
      lastSeen: new Date()
    });

    socket.userId = userId;
    socket.userRole = role;
    socket.userName = name;

    // Join role-specific room
    socket.join(`role:${role}`);
    socket.join(`user:${userId}`);

    // Broadcast user online status
    this.io.emit('user:online', {
      userId,
      role,
      name,
      timestamp: new Date()
    });

    // Send current online users to the newly connected user
    const onlineUsersList = Array.from(onlineUsers.entries()).map(([id, data]) => ({
      userId: id,
      role: data.role,
      name: data.name,
      status: data.status
    }));

    socket.emit('users:online', onlineUsersList);

    console.log(`👤 User registered: ${name} (${role}) - ${userId}`);
  }

  handleUserStatus(socket, status) {
    const userId = socket.userId;
    if (userId && onlineUsers.has(userId)) {
      const userData = onlineUsers.get(userId);
      userData.status = status;
      userData.lastSeen = new Date();

      this.io.emit('user:statusChange', {
        userId,
        status,
        timestamp: new Date()
      });
    }
  }

  // Appointment Events
  handleAppointmentCreate(socket, data) {
    const { appointment, patientId, doctorId } = data;

    // Notify doctor
    this.io.to(`user:${doctorId}`).emit('appointment:newRequest', {
      appointment,
      message: `New appointment request from ${socket.userName}`,
      timestamp: new Date()
    });

    // Notify admin
    this.io.to('role:admin').emit('admin:newAppointment', {
      appointment,
      timestamp: new Date()
    });

    console.log(`📅 New appointment created by ${socket.userName}`);
  }

  handleAppointmentUpdate(socket, data) {
    const { appointmentId, patientId, doctorId, updates } = data;

    // Notify patient
    this.io.to(`user:${patientId}`).emit('appointment:updated', {
      appointmentId,
      updates,
      message: 'Your appointment has been updated',
      timestamp: new Date()
    });

    // Notify doctor
    this.io.to(`user:${doctorId}`).emit('appointment:updated', {
      appointmentId,
      updates,
      message: 'Appointment has been updated',
      timestamp: new Date()
    });

    // Notify admin
    this.io.to('role:admin').emit('admin:appointmentUpdate', {
      appointmentId,
      updates,
      timestamp: new Date()
    });
  }

  handleAppointmentCancel(socket, data) {
    const { appointmentId, patientId, doctorId, reason } = data;

    // Notify the other party
    const targetUserId = socket.userRole === 'patient' ? doctorId : patientId;
    const cancelledBy = socket.userRole;

    this.io.to(`user:${targetUserId}`).emit('appointment:cancelled', {
      appointmentId,
      cancelledBy,
      reason,
      message: `Appointment cancelled by ${socket.userName}`,
      timestamp: new Date()
    });

    // Notify admin
    this.io.to('role:admin').emit('admin:appointmentCancelled', {
      appointmentId,
      cancelledBy,
      reason,
      timestamp: new Date()
    });

    console.log(`❌ Appointment ${appointmentId} cancelled by ${socket.userName}`);
  }

  handleAppointmentAccept(socket, data) {
    const { appointmentId, patientId, doctorId } = data;

    // Notify patient
    this.io.to(`user:${patientId}`).emit('appointment:accepted', {
      appointmentId,
      doctorName: socket.userName,
      message: `Your appointment has been accepted by Dr. ${socket.userName}`,
      timestamp: new Date()
    });

    // Notify admin
    this.io.to('role:admin').emit('admin:appointmentAccepted', {
      appointmentId,
      timestamp: new Date()
    });

    console.log(`✅ Appointment ${appointmentId} accepted by Dr. ${socket.userName}`);
  }

  handleAppointmentComplete(socket, data) {
    const { appointmentId, patientId, doctorId } = data;

    // Notify patient
    this.io.to(`user:${patientId}`).emit('appointment:completed', {
      appointmentId,
      message: 'Your appointment has been completed',
      timestamp: new Date()
    });

    // Notify doctor
    this.io.to(`user:${doctorId}`).emit('appointment:completed', {
      appointmentId,
      message: 'Appointment marked as completed',
      timestamp: new Date()
    });

    // Notify admin
    this.io.to('role:admin').emit('admin:appointmentCompleted', {
      appointmentId,
      timestamp: new Date()
    });
  }

  // Chat Events
  handleChatJoin(socket, roomId) {
    socket.join(roomId);
    console.log(`💬 ${socket.userName} joined chat room: ${roomId}`);

    // Notify others in the room
    socket.to(roomId).emit('chat:userJoined', {
      userId: socket.userId,
      userName: socket.userName,
      roomId,
      timestamp: new Date()
    });
  }

  handleChatLeave(socket, roomId) {
    socket.leave(roomId);
    console.log(`👋 ${socket.userName} left chat room: ${roomId}`);

    // Notify others in the room
    socket.to(roomId).emit('chat:userLeft', {
      userId: socket.userId,
      userName: socket.userName,
      roomId,
      timestamp: new Date()
    });
  }

  handleChatMessage(socket, data) {
    const { roomId, message, receiverId } = data;

    const messageData = {
      messageId: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      senderId: socket.userId,
      senderName: socket.userName,
      senderRole: socket.userRole,
      message,
      roomId,
      timestamp: new Date(),
      read: false
    };

    // Send to room (for group chat) or specific user (for direct message)
    if (roomId) {
      this.io.to(roomId).emit('chat:newMessage', messageData);
    } else if (receiverId) {
      this.io.to(`user:${receiverId}`).emit('chat:newMessage', messageData);
      socket.emit('chat:newMessage', messageData); // Echo back to sender
    }

    console.log(`💬 Message from ${socket.userName} in room ${roomId || 'direct'}`);
  }

  handleChatTyping(socket, data) {
    const { roomId, receiverId } = data;

    if (!typingUsers.has(roomId)) {
      typingUsers.set(roomId, new Set());
    }
    typingUsers.get(roomId).add(socket.userId);

    const typingData = {
      userId: socket.userId,
      userName: socket.userName,
      roomId,
      timestamp: new Date()
    };

    if (roomId) {
      socket.to(roomId).emit('chat:userTyping', typingData);
    } else if (receiverId) {
      this.io.to(`user:${receiverId}`).emit('chat:userTyping', typingData);
    }
  }

  handleChatStopTyping(socket, data) {
    const { roomId, receiverId } = data;

    if (typingUsers.has(roomId)) {
      typingUsers.get(roomId).delete(socket.userId);
    }

    const stoppedTypingData = {
      userId: socket.userId,
      userName: socket.userName,
      roomId,
      timestamp: new Date()
    };

    if (roomId) {
      socket.to(roomId).emit('chat:userStoppedTyping', stoppedTypingData);
    } else if (receiverId) {
      this.io.to(`user:${receiverId}`).emit('chat:userStoppedTyping', stoppedTypingData);
    }
  }

  handleChatRead(socket, data) {
    const { messageId, senderId } = data;

    // Notify sender that message was read
    this.io.to(`user:${senderId}`).emit('chat:messageRead', {
      messageId,
      readBy: socket.userId,
      readByName: socket.userName,
      timestamp: new Date()
    });
  }

  // Payment Events
  handlePaymentCreate(socket, data) {
    const { payment, patientId, doctorId } = data;

    // Notify doctor
    this.io.to(`user:${doctorId}`).emit('payment:new', {
      payment,
      message: 'New payment initiated',
      timestamp: new Date()
    });

    // Notify admin
    this.io.to('role:admin').emit('admin:newPayment', {
      payment,
      timestamp: new Date()
    });
  }

  handlePaymentComplete(socket, data) {
    const { paymentId, patientId, doctorId, amount } = data;

    // Notify patient
    this.io.to(`user:${patientId}`).emit('payment:completed', {
      paymentId,
      amount,
      message: 'Payment completed successfully',
      timestamp: new Date()
    });

    // Notify doctor
    this.io.to(`user:${doctorId}`).emit('payment:completed', {
      paymentId,
      amount,
      message: 'Payment received',
      timestamp: new Date()
    });

    // Notify admin
    this.io.to('role:admin').emit('admin:paymentCompleted', {
      paymentId,
      amount,
      timestamp: new Date()
    });

    console.log(`💰 Payment ${paymentId} completed`);
  }

  // Admin Dashboard Subscription
  handleAdminSubscribe(socket) {
    socket.join('admin:dashboard');
    console.log(`📊 Admin subscribed to dashboard updates: ${socket.userName}`);

    // Send initial dashboard data
    const dashboardData = {
      onlineUsers: onlineUsers.size,
      onlinePatients: Array.from(onlineUsers.values()).filter(u => u.role === 'patient').length,
      onlineDoctors: Array.from(onlineUsers.values()).filter(u => u.role === 'doctor').length,
      timestamp: new Date()
    };

    socket.emit('admin:dashboardData', dashboardData);
  }

  // Disconnect Handling
  handleDisconnect(socket) {
    const userId = socket.userId;
    
    if (userId && onlineUsers.has(userId)) {
      const userData = onlineUsers.get(userId);
      userData.status = 'offline';
      userData.lastSeen = new Date();

      // Broadcast user offline status
      this.io.emit('user:offline', {
        userId,
        role: userData.role,
        name: userData.name,
        lastSeen: userData.lastSeen,
        timestamp: new Date()
      });

      // Remove from online users after 30 seconds (grace period for reconnection)
      setTimeout(() => {
        if (userData.status === 'offline') {
          onlineUsers.delete(userId);
        }
      }, 30000);
    }

    console.log(`❌ Socket disconnected: ${socket.id}`);
  }

  // Utility Methods
  getOnlineUsers() {
    return Array.from(onlineUsers.entries()).map(([id, data]) => ({
      userId: id,
      role: data.role,
      name: data.name,
      status: data.status,
      lastSeen: data.lastSeen
    }));
  }

  getOnlineDoctors() {
    return this.getOnlineUsers().filter(user => user.role === 'doctor');
  }

  getOnlinePatients() {
    return this.getOnlineUsers().filter(user => user.role === 'patient');
  }

  isUserOnline(userId) {
    return onlineUsers.has(userId) && onlineUsers.get(userId).status === 'online';
  }

  // Broadcast methods for external use
  broadcastAppointmentUpdate(appointmentData) {
    const { appointmentId, patientId, doctorId, status } = appointmentData;
    
    this.io.to(`user:${patientId}`).emit('appointment:statusChanged', {
      appointmentId,
      status,
      timestamp: new Date()
    });

    this.io.to(`user:${doctorId}`).emit('appointment:statusChanged', {
      appointmentId,
      status,
      timestamp: new Date()
    });
  }

  broadcastSystemNotification(notification) {
    this.io.emit('system:notification', {
      ...notification,
      timestamp: new Date()
    });
  }

  sendNotificationToUser(userId, notification) {
    this.io.to(`user:${userId}`).emit('notification:new', {
      ...notification,
      timestamp: new Date()
    });
  }

  sendNotificationToRole(role, notification) {
    this.io.to(`role:${role}`).emit('notification:new', {
      ...notification,
      timestamp: new Date()
    });
  }
}

module.exports = SocketManager;
