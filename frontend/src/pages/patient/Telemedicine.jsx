import React, { useState, useEffect, useRef } from 'react';
import { 
  Video, 
  VideoOff, 
  Mic, 
  MicOff, 
  Phone, 
  MessageSquare,
  Monitor,
  MonitorOff,
  Calendar,
  Clock,
  User,
  FileText,
  Send,
  AlertCircle
} from 'lucide-react';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../hooks/useToast';
import ToastContainer from '../../components/ToastContainer';

const Telemedicine = () => {
  const { user } = useAuth();
  const { showSuccess, showError } = useToast();
  const [consultations, setConsultations] = useState([]);
  const [activeRoom, setActiveRoom] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // Video call state
  const [isCallActive, setIsCallActive] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  
  // Chat state
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [showChat, setShowChat] = useState(true);
  
  // Refs for video elements
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const localStreamRef = useRef(null);

  useEffect(() => {
    fetchConsultations();
  }, []);

  const fetchConsultations = async () => {
    try {
      setLoading(true);
      const response = await api.get('/telemedicine/my-consultations');
      setConsultations(response.data.data);
    } catch (error) {
      console.error('Error fetching consultations:', error);
    } finally {
      setLoading(false);
    }
  };

  const createConsultation = async (appointmentId) => {
    try {
      const response = await api.post('/telemedicine/create', { appointmentId });
      showSuccess('Video consultation room created successfully!');
      fetchConsultations();
      return response.data.data;
    } catch (error) {
      console.error('Error creating consultation:', error);
      showError(error.response?.data?.message || 'Failed to create consultation room');
    }
  };

  const joinRoom = async (roomId) => {
    try {
      const response = await api.post(`/telemedicine/room/${roomId}/join`);
      setActiveRoom(response.data.data);
      setMessages(response.data.data.chatMessages || []);
      await startVideoCall();
    } catch (error) {
      console.error('Error joining room:', error);
      showError('Failed to join consultation room');
    }
  };

  const startVideoCall = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: true, 
        audio: true 
      });
      
      localStreamRef.current = stream;
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }
      
      setIsCallActive(true);
    } catch (error) {
      console.error('Error accessing media devices:', error);
      showError('Unable to access camera/microphone. Please check permissions.');
    }
  };

  const endCall = () => {
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => track.stop());
    }
    setIsCallActive(false);
    setActiveRoom(null);
  };

  const toggleMute = () => {
    if (localStreamRef.current) {
      const audioTrack = localStreamRef.current.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setIsMuted(!audioTrack.enabled);
      }
    }
  };

  const toggleVideo = () => {
    if (localStreamRef.current) {
      const videoTrack = localStreamRef.current.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setIsVideoOff(!videoTrack.enabled);
      }
    }
  };

  const toggleScreenShare = async () => {
    try {
      if (!isScreenSharing) {
        const screenStream = await navigator.mediaDevices.getDisplayMedia({ 
          video: true 
        });
        
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = screenStream;
        }
        
        setIsScreenSharing(true);
        
        screenStream.getVideoTracks()[0].onended = () => {
          setIsScreenSharing(false);
          if (localVideoRef.current && localStreamRef.current) {
            localVideoRef.current.srcObject = localStreamRef.current;
          }
        };
      } else {
        if (localVideoRef.current && localStreamRef.current) {
          localVideoRef.current.srcObject = localStreamRef.current;
        }
        setIsScreenSharing(false);
      }
    } catch (error) {
      console.error('Error sharing screen:', error);
      showError('Unable to share screen');
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !activeRoom) return;
    
    try {
      const response = await api.post(`/telemedicine/room/${activeRoom.roomId}/message`, {
        message: newMessage
      });
      
      setMessages([...messages, response.data.data]);
      setNewMessage('');
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusColor = (status) => {
    const colors = {
      'scheduled': 'bg-blue-100 text-blue-800',
      'active': 'bg-green-100 text-green-800',
      'completed': 'bg-gray-100 text-gray-800',
      'cancelled': 'bg-red-100 text-red-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-cyan-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading consultations...</p>
        </div>
      </div>
    );
  }

  // Active Call View
  if (isCallActive && activeRoom) {
    return (
      <div className="min-h-screen bg-gray-900">
        <div className="h-screen flex">
          {/* Video Area */}
          <div className={`${showChat ? 'w-3/4' : 'w-full'} relative`}>
            {/* Remote Video (Doctor) */}
            <video
              ref={remoteVideoRef}
              autoPlay
              playsInline
              className="w-full h-full object-cover bg-gray-800"
            />
            
            {/* Local Video (Patient) - Picture in Picture */}
            <div className="absolute top-4 right-4 w-64 h-48 bg-gray-800 rounded-lg overflow-hidden shadow-2xl border-2 border-white">
              <video
                ref={localVideoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover"
              />
              {isVideoOff && (
                <div className="absolute inset-0 flex items-center justify-center bg-gray-700">
                  <VideoOff className="w-12 h-12 text-gray-400" />
                </div>
              )}
            </div>

            {/* Doctor Info Overlay */}
            <div className="absolute top-4 left-4 bg-black bg-opacity-50 rounded-lg p-4 text-white">
              <div className="flex items-center space-x-3">
                <User className="w-8 h-8" />
                <div>
                  <h3 className="font-semibold">Dr. {activeRoom.doctorId?.name}</h3>
                  <p className="text-sm text-gray-300">{activeRoom.doctorId?.specialization}</p>
                </div>
              </div>
            </div>

            {/* Call Controls */}
            <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2">
              <div className="bg-black bg-opacity-70 rounded-full px-8 py-4 flex items-center space-x-6">
                <button
                  onClick={toggleMute}
                  className={`p-4 rounded-full transition-all ${
                    isMuted ? 'bg-red-600 hover:bg-red-700' : 'bg-gray-700 hover:bg-gray-600'
                  }`}
                  title={isMuted ? 'Unmute' : 'Mute'}
                >
                  {isMuted ? <MicOff className="w-6 h-6 text-white" /> : <Mic className="w-6 h-6 text-white" />}
                </button>

                <button
                  onClick={toggleVideo}
                  className={`p-4 rounded-full transition-all ${
                    isVideoOff ? 'bg-red-600 hover:bg-red-700' : 'bg-gray-700 hover:bg-gray-600'
                  }`}
                  title={isVideoOff ? 'Turn on video' : 'Turn off video'}
                >
                  {isVideoOff ? <VideoOff className="w-6 h-6 text-white" /> : <Video className="w-6 h-6 text-white" />}
                </button>

                <button
                  onClick={endCall}
                  className="p-4 bg-red-600 hover:bg-red-700 rounded-full transition-all"
                  title="End call"
                >
                  <Phone className="w-6 h-6 text-white transform rotate-135" />
                </button>

                <button
                  onClick={toggleScreenShare}
                  className={`p-4 rounded-full transition-all ${
                    isScreenSharing ? 'bg-blue-600 hover:bg-blue-700' : 'bg-gray-700 hover:bg-gray-600'
                  }`}
                  title={isScreenSharing ? 'Stop sharing' : 'Share screen'}
                >
                  {isScreenSharing ? <MonitorOff className="w-6 h-6 text-white" /> : <Monitor className="w-6 h-6 text-white" />}
                </button>

                <button
                  onClick={() => setShowChat(!showChat)}
                  className="p-4 bg-gray-700 hover:bg-gray-600 rounded-full transition-all"
                  title="Toggle chat"
                >
                  <MessageSquare className="w-6 h-6 text-white" />
                </button>
              </div>
            </div>
          </div>

          {/* Chat Sidebar */}
          {showChat && (
            <div className="w-1/4 bg-white flex flex-col">
              <div className="p-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white">
                <h3 className="font-semibold text-lg">Consultation Chat</h3>
              </div>
              
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {messages.map((msg, index) => (
                  <div
                    key={index}
                    className={`flex ${msg.senderId === user.id ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-xs px-4 py-2 rounded-lg ${
                        msg.senderId === user.id
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-200 text-gray-800'
                      }`}
                    >
                      <p className="text-sm">{msg.message}</p>
                      <p className="text-xs mt-1 opacity-70">
                        {new Date(msg.timestamp).toLocaleTimeString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="p-4 border-t">
                <div className="flex space-x-2">
                  <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                    placeholder="Type a message..."
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <button
                    onClick={sendMessage}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all"
                  >
                    <Send className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Consultations List View
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-cyan-50 py-8">
      <div className="max-w-7xl mx-auto px-4">
        
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Video Consultations
          </h1>
          <p className="text-gray-600 mt-2">Connect with your doctors through secure video calls</p>
        </div>

        {/* Info Banner */}
        <div className="bg-blue-50 border-l-4 border-blue-500 p-4 mb-6 rounded-lg">
          <div className="flex items-start">
            <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5 mr-3" />
            <div>
              <h3 className="font-semibold text-blue-900">Before joining a consultation:</h3>
              <ul className="text-sm text-blue-800 mt-1 space-y-1">
                <li>• Ensure your camera and microphone are working</li>
                <li>• Find a quiet, well-lit location</li>
                <li>• Have your medical history and current medications ready</li>
                <li>• Test your internet connection</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Consultations Grid */}
        {consultations.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-xl p-12 text-center">
            <Video className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-700 mb-2">No Consultations Yet</h3>
            <p className="text-gray-600">Your video consultations will appear here once scheduled.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {consultations.map((consultation) => (
              <div
                key={consultation._id}
                className="bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all p-6"
              >
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                      <User className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-800">
                        Dr. {consultation.doctorId?.name}
                      </h3>
                      <p className="text-sm text-gray-600">
                        {consultation.doctorId?.specialization}
                      </p>
                    </div>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(consultation.status)}`}>
                    {consultation.status}
                  </span>
                </div>

                <div className="space-y-2 mb-4">
                  <div className="flex items-center text-sm text-gray-600">
                    <Calendar className="w-4 h-4 mr-2" />
                    <span>{formatDate(consultation.scheduledTime)}</span>
                  </div>
                  <div className="flex items-center text-sm text-gray-600">
                    <Clock className="w-4 h-4 mr-2" />
                    <span>Duration: {consultation.duration} minutes</span>
                  </div>
                  {consultation.consultationNotes && (
                    <div className="flex items-start text-sm text-gray-600">
                      <FileText className="w-4 h-4 mr-2 mt-0.5" />
                      <span className="line-clamp-2">{consultation.consultationNotes}</span>
                    </div>
                  )}
                </div>

                {consultation.status === 'scheduled' && (
                  <button
                    onClick={() => joinRoom(consultation.roomId)}
                    className="w-full bg-gradient-to-r from-green-500 to-emerald-500 text-white py-3 rounded-lg hover:from-green-600 hover:to-emerald-600 transition-all font-semibold flex items-center justify-center space-x-2"
                  >
                    <Video className="w-5 h-5" />
                    <span>Join Consultation</span>
                  </button>
                )}

                {consultation.status === 'active' && (
                  <button
                    onClick={() => joinRoom(consultation.roomId)}
                    className="w-full bg-gradient-to-r from-blue-500 to-indigo-500 text-white py-3 rounded-lg hover:from-blue-600 hover:to-indigo-600 transition-all font-semibold flex items-center justify-center space-x-2 animate-pulse"
                  >
                    <Video className="w-5 h-5" />
                    <span>Rejoin Call</span>
                  </button>
                )}

                {consultation.status === 'completed' && (
                  <div className="text-center py-3 bg-gray-100 rounded-lg text-gray-600 text-sm">
                    Consultation Completed
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
        
        <ToastContainer />
      </div>
    </div>
  );
};

export default Telemedicine;
