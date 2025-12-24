import React, { useState, useEffect, useRef } from "react";
import { io } from "socket.io-client";
import SimplePeer from "simple-peer";
import {
  Video,
  VideoOff,
  Mic,
  MicOff,
  Phone,
  Monitor,
  MessageSquare,
  Users,
  Maximize,
  Settings,
} from "lucide-react";

const VideoRoom = ({ consultationId, userRole, userId, userName }) => {
  // State management
  const [localStream, setLocalStream] = useState(null);
  const [peers, setPeers] = useState({});
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [chatMessages, setChatMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [participants, setParticipants] = useState([]);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState("connecting");
  const [isInitialized, setIsInitialized] = useState(false); // NEW: Track initialization

  // Refs
  const socketRef = useRef();
  const localVideoRef = useRef();
  const peersRef = useRef({});
  const containerRef = useRef();

  // Initialize socket connection only (no media yet)
  useEffect(() => {
    if (!consultationId) return;

    // Connect socket
    const socketUrl = import.meta.env.VITE_SOCKET_URL || "http://localhost:5000";
    socketRef.current = io(socketUrl, {
      transports: ["websocket", "polling"],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    socketRef.current.on("connect", () => {
      console.log("âœ… Socket connected:", socketRef.current.id);
      setConnectionStatus("connected");
    });

    socketRef.current.on("disconnect", () => {
      console.log("âŒ Socket disconnected");
      setConnectionStatus("disconnected");
    });

    socketRef.current.on("connect_error", (error) => {
      console.error("âŒ Socket connection error:", error);
      setConnectionStatus("error");
    });

    // Socket event listeners
    setupSocketListeners();

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, [consultationId]);

  // NEW: Initialize media only when user clicks to join
  const initializeMedia = async () => {
    if (isInitialized) return;

    try {
      setConnectionStatus("initializing");
      console.log("ðŸŽ¥ Requesting camera and microphone access...");

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: "user",
        },
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });

      console.log("âœ… Media stream obtained");
      setLocalStream(stream);

      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }

      // Join room after media is ready
      if (socketRef.current && socketRef.current.connected) {
        socketRef.current.emit("video:joinRoom", {
          roomId: consultationId,
          userId,
          userName,
          userRole,
        });
      }

      setIsInitialized(true);
      setConnectionStatus("ready");
    } catch (error) {
      console.error("âŒ Error accessing media devices:", error);
      setConnectionStatus("error");
      alert(
        "Could not access camera/microphone. Please check permissions and try again."
      );
    }
  };

  // Create peer connection
  const createPeer = (userToSignal, callerId, stream) => {
    const peer = new SimplePeer({
      initiator: true,
      trickle: false,
      stream,
      config: {
        iceServers: [
          { urls: "stun:stun.l.google.com:19302" },
          { urls: "stun:stun1.l.google.com:19302" },
        ],
      },
    });

    peer.on("signal", (signal) => {
      socketRef.current.emit("video:sendingSignal", {
        userToSignal,
        callerId,
        signal,
      });
    });

    return peer;
  };

  // Add peer connection
  const addPeer = (incomingSignal, callerId, stream) => {
    const peer = new SimplePeer({
      initiator: false,
      trickle: false,
      stream,
      config: {
        iceServers: [
          { urls: "stun:stun.l.google.com:19302" },
          { urls: "stun:stun1.l.google.com:19302" },
        ],
      },
    });

    peer.on("signal", (signal) => {
      socketRef.current.emit("video:returningSignal", { signal, callerId });
    });

    peer.signal(incomingSignal);

    return peer;
  };

  // Setup socket event listeners
  const setupSocketListeners = () => {
    if (!socketRef.current) return;

    // Room joined successfully
    socketRef.current.on("video:roomJoined", ({ roomId, participants: roomParticipants }) => {
      console.log("âœ… Joined room:", roomId);
      setParticipants(roomParticipants);
    });

    // New user joined
    socketRef.current.on("video:userJoined", ({ userId: newUserId, userName: newUserName }) => {
      console.log("ðŸ‘¤ User joined:", newUserName);
      
      if (!localStream) return;

      const peer = createPeer(newUserId, socketRef.current.id, localStream);
      
      peersRef.current[newUserId] = peer;
      setPeers((prev) => ({ ...prev, [newUserId]: peer }));
    });

    // Receive signal from existing user
    socketRef.current.on("video:receivingReturnedSignal", ({ signal, id }) => {
      console.log("ðŸ“¡ Received return signal from:", id);
      const peer = peersRef.current[id];
      if (peer) {
        peer.signal(signal);
      }
    });

    // User left
    socketRef.current.on("video:userLeft", ({ userId: leftUserId }) => {
      console.log("ðŸ‘‹ User left:", leftUserId);
      
      if (peersRef.current[leftUserId]) {
        peersRef.current[leftUserId].destroy();
        delete peersRef.current[leftUserId];
      }

      setPeers((prev) => {
        const newPeers = { ...prev };
        delete newPeers[leftUserId];
        return newPeers;
      });

      setParticipants((prev) => prev.filter((p) => p.userId !== leftUserId));
    });

    // Audio/Video toggles
    socketRef.current.on("video:audioToggled", ({ userId: toggleUserId, enabled }) => {
      console.log(`ðŸŽ¤ User ${toggleUserId} ${enabled ? "unmuted" : "muted"}`);
    });

    socketRef.current.on("video:videoToggled", ({ userId: toggleUserId, enabled }) => {
      console.log(`ðŸ“¹ User ${toggleUserId} ${enabled ? "enabled" : "disabled"} video`);
    });

    // Screen share
    socketRef.current.on("video:screenShareStarted", ({ userId: shareUserId }) => {
      console.log(`ðŸ–¥ï¸ User ${shareUserId} started screen sharing`);
    });

    socketRef.current.on("video:screenShareStopped", ({ userId: shareUserId }) => {
      console.log(`ðŸ–¥ï¸ User ${shareUserId} stopped screen sharing`);
    });

    // Chat
    socketRef.current.on("video:chatMessage", ({ userId: senderId, userName: senderName, message, timestamp }) => {
      setChatMessages((prev) => [
        ...prev,
        { senderId, senderName, message, timestamp },
      ]);
    });

    // Consultation ended
    socketRef.current.on("video:consultationEnded", ({ endedBy }) => {
      console.log("ðŸ Consultation ended by:", endedBy);
      alert("The consultation has ended.");
      handleEndCall();
    });
  };

  // Toggle audio
  const toggleAudio = () => {
    if (localStream) {
      const audioTrack = localStream.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setIsAudioEnabled(audioTrack.enabled);
        
        socketRef.current.emit("video:toggleAudio", {
          roomId: consultationId,
          enabled: audioTrack.enabled,
        });
      }
    }
  };

  // Toggle video
  const toggleVideo = () => {
    if (localStream) {
      const videoTrack = localStream.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setIsVideoEnabled(videoTrack.enabled);
        
        socketRef.current.emit("video:toggleVideo", {
          roomId: consultationId,
          enabled: videoTrack.enabled,
        });
      }
    }
  };

  // Toggle screen share
  const toggleScreenShare = async () => {
    if (!isScreenSharing) {
      try {
        const screenStream = await navigator.mediaDevices.getDisplayMedia({
          video: { cursor: "always" },
          audio: false,
        });

        const screenTrack = screenStream.getVideoTracks()[0];

        // Replace video track in all peer connections
        Object.values(peersRef.current).forEach((peer) => {
          const sender = peer._pc
            .getSenders()
            .find((s) => s.track && s.track.kind === "video");
          if (sender) {
            sender.replaceTrack(screenTrack);
          }
        });

        // Replace in local stream
        const videoTrack = localStream.getVideoTracks()[0];
        videoTrack.stop();
        localStream.removeTrack(videoTrack);
        localStream.addTrack(screenTrack);

        if (localVideoRef.current) {
          localVideoRef.current.srcObject = localStream;
        }

        screenTrack.onended = () => {
          stopScreenShare();
        };

        setIsScreenSharing(true);
        
        socketRef.current.emit("video:startScreenShare", {
          roomId: consultationId,
        });
      } catch (error) {
        console.error("Error sharing screen:", error);
      }
    } else {
      stopScreenShare();
    }
  };

  // Stop screen share
  const stopScreenShare = async () => {
    try {
      const videoStream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
      });

      const videoTrack = videoStream.getVideoTracks()[0];

      // Replace screen track with camera track
      Object.values(peersRef.current).forEach((peer) => {
        const sender = peer._pc
          .getSenders()
          .find((s) => s.track && s.track.kind === "video");
        if (sender) {
          sender.replaceTrack(videoTrack);
        }
      });

      // Replace in local stream
      const screenTrack = localStream.getVideoTracks()[0];
      screenTrack.stop();
      localStream.removeTrack(screenTrack);
      localStream.addTrack(videoTrack);

      if (localVideoRef.current) {
        localVideoRef.current.srcObject = localStream;
      }

      setIsScreenSharing(false);
      
      socketRef.current.emit("video:stopScreenShare", {
        roomId: consultationId,
      });
    } catch (error) {
      console.error("Error stopping screen share:", error);
    }
  };

  // Send chat message
  const sendMessage = () => {
    if (newMessage.trim() && socketRef.current) {
      socketRef.current.emit("video:chatMessage", {
        roomId: consultationId,
        message: newMessage,
      });
      setNewMessage("");
    }
  };

  // Toggle fullscreen
  const toggleFullscreen = () => {
    if (!isFullscreen) {
      containerRef.current?.requestFullscreen();
    } else {
      document.exitFullscreen();
    }
    setIsFullscreen(!isFullscreen);
  };

  // End call
  const handleEndCall = () => {
    if (window.confirm("Are you sure you want to end the consultation?")) {
      // Stop all tracks
      if (localStream) {
        localStream.getTracks().forEach((track) => track.stop());
      }

      // Close all peer connections
      Object.values(peersRef.current).forEach((peer) => peer.destroy());

      // Emit end consultation event
      if (socketRef.current) {
        socketRef.current.emit("video:endConsultation", {
          roomId: consultationId,
        });
        socketRef.current.disconnect();
      }

      // Redirect or close
      window.location.href = "/telemedicine";
    }
  };

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 z-50"
    >
      {/* Header */}
      <div className="absolute top-0 left-0 right-0 bg-black/30 backdrop-blur-md p-4 flex justify-between items-center z-10">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div
              className={`w-3 h-3 rounded-full ${
                connectionStatus === "connected"
                  ? "bg-green-500"
                  : connectionStatus === "connecting"
                  ? "bg-yellow-500 animate-pulse"
                  : "bg-red-500"
              }`}
            />
            <span className="text-white text-sm font-medium">
              {connectionStatus === "connected"
                ? "Connected"
                : connectionStatus === "connecting"
                ? "Connecting..."
                : connectionStatus === "initializing"
                ? "Initializing media..."
                : "Disconnected"}
            </span>
          </div>
          <div className="text-white text-sm">
            Room: <span className="font-mono">{consultationId}</span>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <button
            onClick={() => setParticipants((prev) => [...prev])}
            className="text-white hover:text-blue-400 transition"
          >
            <Users size={20} />
          </button>
          <button
            onClick={toggleFullscreen}
            className="text-white hover:text-blue-400 transition"
          >
            <Maximize size={20} />
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="h-full pt-16 pb-24 px-4">
        {!isInitialized ? (
          // Show join button before initializing
          <div className="h-full flex items-center justify-center">
            <div className="text-center">
              <Video className="w-24 h-24 mx-auto mb-6 text-blue-400" />
              <h2 className="text-3xl font-bold text-white mb-4">
                Ready to Join?
              </h2>
              <p className="text-gray-300 mb-8 max-w-md">
                Click the button below to join the video consultation. We'll ask for camera and microphone access.
              </p>
              <button
                onClick={initializeMedia}
                disabled={connectionStatus !== "connected"}
                className="px-8 py-4 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-full font-semibold text-lg hover:from-blue-600 hover:to-purple-700 transition disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
              >
                {connectionStatus === "connected" ? "Join Consultation" : "Connecting..."}
              </button>
            </div>
          </div>
        ) : (
          // Video grid (after initialization)
          <div className="grid grid-cols-2 gap-4 h-full">
            {/* Local video (picture-in-picture style) */}
            <div className="relative bg-black/50 rounded-lg overflow-hidden backdrop-blur-sm border border-white/10">
              <video
                ref={localVideoRef}
                autoPlay
                muted
                playsInline
                className="w-full h-full object-cover"
              />
              <div className="absolute bottom-4 left-4 bg-black/70 px-3 py-1 rounded-full">
                <span className="text-white text-sm font-medium">You ({userRole})</span>
              </div>
              {!isVideoEnabled && (
                <div className="absolute inset-0 flex items-center justify-center bg-gray-800">
                  <VideoOff className="w-16 h-16 text-gray-400" />
                </div>
              )}
            </div>

            {/* Remote videos */}
            {Object.entries(peers).map(([peerId, peer]) => (
              <div
                key={peerId}
                className="relative bg-black/50 rounded-lg overflow-hidden backdrop-blur-sm border border-white/10"
              >
                <PeerVideo peer={peer} />
                <div className="absolute bottom-4 left-4 bg-black/70 px-3 py-1 rounded-full">
                  <span className="text-white text-sm font-medium">
                    {participants.find((p) => p.userId === peerId)?.userName || "Participant"}
                  </span>
                </div>
              </div>
            ))}

            {/* Empty slots */}
            {Object.keys(peers).length === 0 && (
              <div className="flex items-center justify-center bg-black/30 rounded-lg border border-dashed border-white/20">
                <div className="text-center">
                  <Users className="w-12 h-12 mx-auto mb-2 text-gray-400" />
                  <p className="text-gray-400">Waiting for others to join...</p>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Control bar (only show after initialization) */}
      {isInitialized && (
        <div className="absolute bottom-0 left-0 right-0 bg-black/50 backdrop-blur-md p-6">
          <div className="flex justify-center items-center gap-4">
            {/* Audio toggle */}
            <button
              onClick={toggleAudio}
              className={`p-4 rounded-full transition ${
                isAudioEnabled
                  ? "bg-gray-700 hover:bg-gray-600"
                  : "bg-red-600 hover:bg-red-700"
              }`}
            >
              {isAudioEnabled ? (
                <Mic className="w-6 h-6 text-white" />
              ) : (
                <MicOff className="w-6 h-6 text-white" />
              )}
            </button>

            {/* Video toggle */}
            <button
              onClick={toggleVideo}
              className={`p-4 rounded-full transition ${
                isVideoEnabled
                  ? "bg-gray-700 hover:bg-gray-600"
                  : "bg-red-600 hover:bg-red-700"
              }`}
            >
              {isVideoEnabled ? (
                <Video className="w-6 h-6 text-white" />
              ) : (
                <VideoOff className="w-6 h-6 text-white" />
              )}
            </button>

            {/* Screen share */}
            <button
              onClick={toggleScreenShare}
              className={`p-4 rounded-full transition ${
                isScreenSharing
                  ? "bg-blue-600 hover:bg-blue-700"
                  : "bg-gray-700 hover:bg-gray-600"
              }`}
            >
              <Monitor className="w-6 h-6 text-white" />
            </button>

            {/* Chat toggle */}
            <button
              onClick={() => setIsChatOpen(!isChatOpen)}
              className="p-4 rounded-full bg-gray-700 hover:bg-gray-600 transition relative"
            >
              <MessageSquare className="w-6 h-6 text-white" />
              {chatMessages.length > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                  {chatMessages.length}
                </span>
              )}
            </button>

            {/* End call */}
            <button
              onClick={handleEndCall}
              className="p-4 rounded-full bg-red-600 hover:bg-red-700 transition ml-4"
            >
              <Phone className="w-6 h-6 text-white transform rotate-135" />
            </button>
          </div>
        </div>
      )}

      {/* Chat sidebar */}
      {isChatOpen && isInitialized && (
        <div className="absolute right-0 top-0 bottom-0 w-80 bg-black/90 backdrop-blur-md p-4 z-20">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-white font-semibold">Chat</h3>
            <button
              onClick={() => setIsChatOpen(false)}
              className="text-white hover:text-gray-300"
            >
              âœ•
            </button>
          </div>

          <div className="flex flex-col h-[calc(100%-8rem)]">
            <div className="flex-1 overflow-y-auto mb-4 space-y-2">
              {chatMessages.map((msg, index) => (
                <div
                  key={index}
                  className={`p-2 rounded ${
                    msg.senderId === userId
                      ? "bg-blue-600 ml-8"
                      : "bg-gray-700 mr-8"
                  }`}
                >
                  <div className="text-xs text-gray-300">{msg.senderName}</div>
                  <div className="text-white">{msg.message}</div>
                  <div className="text-xs text-gray-400">
                    {new Date(msg.timestamp).toLocaleTimeString()}
                  </div>
                </div>
              ))}
            </div>

            <div className="flex gap-2">
              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && sendMessage()}
                placeholder="Type a message..."
                className="flex-1 px-3 py-2 bg-gray-800 text-white rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                onClick={sendMessage}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
              >
                Send
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// PeerVideo component for rendering peer streams
const PeerVideo = ({ peer }) => {
  const ref = useRef();

  useEffect(() => {
    if (peer) {
      peer.on("stream", (stream) => {
        if (ref.current) {
          ref.current.srcObject = stream;
        }
      });
    }
  }, [peer]);

  return (
    <video
      ref={ref}
      autoPlay
      playsInline
      className="w-full h-full object-cover"
    />
  );
};

export default VideoRoom;
