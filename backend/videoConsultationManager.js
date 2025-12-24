// Video Consultation Manager - WebRTC Signaling Server
// Handles peer-to-peer video/audio connections for telemedicine consultations

class VideoConsultationManager {
  constructor(io) {
    this.io = io;
    this.rooms = new Map(); // roomId -> { doctor, patient, startTime, status }
    this.peers = new Map(); // socketId -> { userId, roomId, role, stream }
    this.setupVideoHandlers();
  }

  setupVideoHandlers() {
    this.io.on('connection', (socket) => {
      
      // Join video consultation room
      socket.on('video:joinRoom', (data) => {
        this.handleJoinRoom(socket, data);
      });

      // Leave video consultation room
      socket.on('video:leaveRoom', (data) => {
        this.handleLeaveRoom(socket, data);
      });

      // WebRTC Signaling - Offer
      socket.on('video:offer', (data) => {
        this.handleOffer(socket, data);
      });

      // WebRTC Signaling - Answer
      socket.on('video:answer', (data) => {
        this.handleAnswer(socket, data);
      });

      // WebRTC Signaling - ICE Candidate
      socket.on('video:iceCandidate', (data) => {
        this.handleIceCandidate(socket, data);
      });

      // Toggle audio/video
      socket.on('video:toggleAudio', (data) => {
        this.handleToggleAudio(socket, data);
      });

      socket.on('video:toggleVideo', (data) => {
        this.handleToggleVideo(socket, data);
      });

      // Screen sharing
      socket.on('video:startScreenShare', (data) => {
        this.handleStartScreenShare(socket, data);
      });

      socket.on('video:stopScreenShare', (data) => {
        this.handleStopScreenShare(socket, data);
      });

      // Chat during video call
      socket.on('video:chatMessage', (data) => {
        this.handleChatMessage(socket, data);
      });

      // End consultation
      socket.on('video:endConsultation', (data) => {
        this.handleEndConsultation(socket, data);
      });

      // Disconnect handling
      socket.on('disconnect', () => {
        this.handleVideoDisconnect(socket);
      });
    });
  }

  // Join Room Handler
  handleJoinRoom(socket, data) {
    const { roomId, userId, role, userName, consultationId } = data;

    // Create or get room
    if (!this.rooms.has(roomId)) {
      this.rooms.set(roomId, {
        roomId,
        consultationId,
        participants: new Map(),
        startTime: new Date(),
        status: 'waiting',
        messages: []
      });
    }

    const room = this.rooms.get(roomId);
    
    // Add participant to room
    room.participants.set(userId, {
      socketId: socket.id,
      userId,
      role,
      userName,
      audioEnabled: true,
      videoEnabled: true,
      isScreenSharing: false,
      joinedAt: new Date()
    });

    // Store peer info
    this.peers.set(socket.id, {
      userId,
      roomId,
      role,
      userName
    });

    // Join socket.io room
    socket.join(roomId);

    console.log(`🎥 ${userName} (${role}) joined video room: ${roomId}`);

    // Notify user they joined successfully
    socket.emit('video:joined', {
      roomId,
      participants: Array.from(room.participants.values()).map(p => ({
        userId: p.userId,
        role: p.role,
        userName: p.userName,
        audioEnabled: p.audioEnabled,
        videoEnabled: p.videoEnabled,
        isScreenSharing: p.isScreenSharing
      }))
    });

    // Notify others in the room
    socket.to(roomId).emit('video:userJoined', {
      userId,
      role,
      userName,
      socketId: socket.id,
      timestamp: new Date()
    });

    // If both doctor and patient are present, start the consultation
    const doctor = Array.from(room.participants.values()).find(p => p.role === 'doctor');
    const patient = Array.from(room.participants.values()).find(p => p.role === 'patient');

    if (doctor && patient && room.status === 'waiting') {
      room.status = 'active';
      this.io.to(roomId).emit('video:consultationStarted', {
        roomId,
        doctor: { userId: doctor.userId, userName: doctor.userName },
        patient: { userId: patient.userId, userName: patient.userName },
        startTime: room.startTime
      });
      console.log(`✅ Video consultation started in room: ${roomId}`);
    }
  }

  // Leave Room Handler
  handleLeaveRoom(socket, data) {
    const { roomId, userId } = data;
    const peer = this.peers.get(socket.id);

    if (peer && this.rooms.has(roomId)) {
      const room = this.rooms.get(roomId);
      room.participants.delete(userId);

      socket.leave(roomId);
      this.peers.delete(socket.id);

      // Notify others
      socket.to(roomId).emit('video:userLeft', {
        userId,
        userName: peer.userName,
        timestamp: new Date()
      });

      console.log(`👋 ${peer.userName} left video room: ${roomId}`);

      // If room is empty, clean it up
      if (room.participants.size === 0) {
        this.rooms.delete(roomId);
        console.log(`🗑️ Video room ${roomId} cleaned up (empty)`);
      }
    }
  }

  // WebRTC Signaling - Offer
  handleOffer(socket, data) {
    const { roomId, offer, targetUserId } = data;
    const peer = this.peers.get(socket.id);

    if (!peer) return;

    console.log(`📡 Sending offer from ${peer.userName} to user ${targetUserId}`);

    // Find target user's socket
    const room = this.rooms.get(roomId);
    if (room) {
      const targetParticipant = Array.from(room.participants.values())
        .find(p => p.userId === targetUserId);

      if (targetParticipant) {
        this.io.to(targetParticipant.socketId).emit('video:offer', {
          offer,
          fromUserId: peer.userId,
          fromUserName: peer.userName,
          fromSocketId: socket.id
        });
      }
    }
  }

  // WebRTC Signaling - Answer
  handleAnswer(socket, data) {
    const { roomId, answer, targetSocketId } = data;
    const peer = this.peers.get(socket.id);

    if (!peer) return;

    console.log(`📡 Sending answer from ${peer.userName}`);

    // Send answer to the specific socket
    this.io.to(targetSocketId).emit('video:answer', {
      answer,
      fromUserId: peer.userId,
      fromUserName: peer.userName
    });
  }

  // WebRTC Signaling - ICE Candidate
  handleIceCandidate(socket, data) {
    const { roomId, candidate, targetSocketId } = data;
    const peer = this.peers.get(socket.id);

    if (!peer) return;

    // Send ICE candidate to the specific socket
    if (targetSocketId) {
      this.io.to(targetSocketId).emit('video:iceCandidate', {
        candidate,
        fromUserId: peer.userId
      });
    } else {
      // Broadcast to all in room except sender
      socket.to(roomId).emit('video:iceCandidate', {
        candidate,
        fromUserId: peer.userId
      });
    }
  }

  // Toggle Audio
  handleToggleAudio(socket, data) {
    const { roomId, userId, audioEnabled } = data;
    const room = this.rooms.get(roomId);

    if (room && room.participants.has(userId)) {
      const participant = room.participants.get(userId);
      participant.audioEnabled = audioEnabled;

      // Notify others
      socket.to(roomId).emit('video:audioToggled', {
        userId,
        audioEnabled,
        timestamp: new Date()
      });
    }
  }

  // Toggle Video
  handleToggleVideo(socket, data) {
    const { roomId, userId, videoEnabled } = data;
    const room = this.rooms.get(roomId);

    if (room && room.participants.has(userId)) {
      const participant = room.participants.get(userId);
      participant.videoEnabled = videoEnabled;

      // Notify others
      socket.to(roomId).emit('video:videoToggled', {
        userId,
        videoEnabled,
        timestamp: new Date()
      });
    }
  }

  // Start Screen Share
  handleStartScreenShare(socket, data) {
    const { roomId, userId } = data;
    const room = this.rooms.get(roomId);
    const peer = this.peers.get(socket.id);

    if (room && room.participants.has(userId)) {
      const participant = room.participants.get(userId);
      participant.isScreenSharing = true;

      // Notify others
      socket.to(roomId).emit('video:screenShareStarted', {
        userId,
        userName: peer.userName,
        timestamp: new Date()
      });

      console.log(`🖥️ ${peer.userName} started screen sharing in room ${roomId}`);
    }
  }

  // Stop Screen Share
  handleStopScreenShare(socket, data) {
    const { roomId, userId } = data;
    const room = this.rooms.get(roomId);
    const peer = this.peers.get(socket.id);

    if (room && room.participants.has(userId)) {
      const participant = room.participants.get(userId);
      participant.isScreenSharing = false;

      // Notify others
      socket.to(roomId).emit('video:screenShareStopped', {
        userId,
        userName: peer.userName,
        timestamp: new Date()
      });

      console.log(`🖥️ ${peer.userName} stopped screen sharing in room ${roomId}`);
    }
  }

  // Chat Message during video call
  handleChatMessage(socket, data) {
    const { roomId, message } = data;
    const peer = this.peers.get(socket.id);
    const room = this.rooms.get(roomId);

    if (!peer || !room) return;

    const messageData = {
      messageId: `vmsg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      userId: peer.userId,
      userName: peer.userName,
      role: peer.role,
      message,
      timestamp: new Date()
    };

    // Store message in room
    room.messages.push(messageData);

    // Broadcast to all in room
    this.io.to(roomId).emit('video:chatMessage', messageData);
  }

  // End Consultation
  handleEndConsultation(socket, data) {
    const { roomId, userId, reason } = data;
    const peer = this.peers.get(socket.id);
    const room = this.rooms.get(roomId);

    if (!peer || !room) return;

    room.status = 'ended';
    room.endTime = new Date();
    room.endedBy = userId;
    room.endReason = reason;

    console.log(`🏁 Video consultation ended in room ${roomId} by ${peer.userName}`);

    // Notify all participants
    this.io.to(roomId).emit('video:consultationEnded', {
      roomId,
      endedBy: userId,
      endedByName: peer.userName,
      reason,
      duration: Math.floor((room.endTime - room.startTime) / 1000), // seconds
      timestamp: room.endTime
    });

    // Clean up room after 5 seconds
    setTimeout(() => {
      if (this.rooms.has(roomId)) {
        // Clear all participants
        const participants = Array.from(room.participants.keys());
        participants.forEach(participantId => {
          const participant = room.participants.get(participantId);
          if (participant && participant.socketId) {
            this.io.to(participant.socketId).emit('video:roomClosed', {
              roomId,
              message: 'Consultation room has been closed'
            });
            this.peers.delete(participant.socketId);
          }
        });

        this.rooms.delete(roomId);
        console.log(`🗑️ Video room ${roomId} cleaned up (ended)`);
      }
    }, 5000);
  }

  // Disconnect Handler
  handleVideoDisconnect(socket) {
    const peer = this.peers.get(socket.id);

    if (peer) {
      const { roomId, userId, userName } = peer;
      const room = this.rooms.get(roomId);

      if (room) {
        room.participants.delete(userId);

        // Notify others
        socket.to(roomId).emit('video:userDisconnected', {
          userId,
          userName,
          timestamp: new Date()
        });

        console.log(`❌ ${userName} disconnected from video room: ${roomId}`);

        // If room becomes empty, clean it up
        if (room.participants.size === 0) {
          this.rooms.delete(roomId);
          console.log(`🗑️ Video room ${roomId} cleaned up (disconnected)`);
        }
      }

      this.peers.delete(socket.id);
    }
  }

  // Utility Methods
  getRoomInfo(roomId) {
    const room = this.rooms.get(roomId);
    if (!room) return null;

    return {
      roomId: room.roomId,
      consultationId: room.consultationId,
      status: room.status,
      startTime: room.startTime,
      endTime: room.endTime,
      participants: Array.from(room.participants.values()).map(p => ({
        userId: p.userId,
        role: p.role,
        userName: p.userName,
        audioEnabled: p.audioEnabled,
        videoEnabled: p.videoEnabled,
        isScreenSharing: p.isScreenSharing,
        joinedAt: p.joinedAt
      })),
      messageCount: room.messages.length
    };
  }

  getActiveRooms() {
    return Array.from(this.rooms.keys());
  }

  isRoomActive(roomId) {
    const room = this.rooms.get(roomId);
    return room && room.status === 'active';
  }

  getParticipantCount(roomId) {
    const room = this.rooms.get(roomId);
    return room ? room.participants.size : 0;
  }

  // Force end consultation (admin action)
  forceEndConsultation(roomId, reason = 'Ended by administrator') {
    const room = this.rooms.get(roomId);
    if (!room) return false;

    room.status = 'ended';
    room.endTime = new Date();
    room.endReason = reason;

    this.io.to(roomId).emit('video:consultationEnded', {
      roomId,
      endedBy: 'admin',
      endedByName: 'Administrator',
      reason,
      duration: Math.floor((room.endTime - room.startTime) / 1000),
      timestamp: room.endTime
    });

    // Clean up
    setTimeout(() => {
      this.rooms.delete(roomId);
    }, 5000);

    return true;
  }
}

module.exports = VideoConsultationManager;
