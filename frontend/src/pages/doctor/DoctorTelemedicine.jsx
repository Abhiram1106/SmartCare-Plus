import React, { useState, useEffect } from 'react';
import { 
  Video, 
  Calendar,
  Clock,
  User,
  FileText,
  AlertCircle,
  CheckCircle,
  XCircle
} from 'lucide-react';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../hooks/useToast';
import ToastContainer from '../../components/ToastContainer';
import VideoRoom from '../../components/telemedicine/VideoRoom';

const DoctorTelemedicine = () => {
  const { user } = useAuth();
  const { showSuccess, showError } = useToast();
  const [consultations, setConsultations] = useState([]);
  const [activeRoom, setActiveRoom] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isCallActive, setIsCallActive] = useState(false);

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

  const joinRoom = async (consultation) => {
    try {
      const response = await api.post(`/telemedicine/room/${consultation.roomId}/join`);
      setActiveRoom({
        ...response.data.data,
        consultationId: consultation._id,
        roomId: consultation.roomId
      });
      setIsCallActive(true);
    } catch (error) {
      console.error('Error joining room:', error);
      showError('Failed to join consultation room');
    }
  };

  const updateConsultationStatus = async (consultationId, status, notes = '') => {
    try {
      await api.put(`/telemedicine/${consultationId}`, { 
        status,
        consultationNotes: notes 
      });
      showSuccess(`Consultation ${status} successfully`);
      fetchConsultations();
    } catch (error) {
      console.error('Error updating consultation:', error);
      showError('Failed to update consultation status');
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

  const getStatusIcon = (status) => {
    const icons = {
      'scheduled': <Clock className="w-4 h-4" />,
      'active': <Video className="w-4 h-4" />,
      'completed': <CheckCircle className="w-4 h-4" />,
      'cancelled': <XCircle className="w-4 h-4" />
    };
    return icons[status] || <Clock className="w-4 h-4" />;
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
      <VideoRoom
        consultationId={activeRoom.consultationId}
        roomId={activeRoom.roomId}
        userId={user.id}
        userName={user.name}
        userRole="doctor"
        onLeave={() => {
          setIsCallActive(false);
          setActiveRoom(null);
          fetchConsultations();
        }}
      />
    );
  }

  // Consultations List View
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-cyan-50 py-8">
      <div className="max-w-7xl mx-auto px-4">
        
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            My Video Consultations
          </h1>
          <p className="text-gray-600 mt-2">Manage and conduct secure video consultations with your patients</p>
        </div>

        {/* Info Banner */}
        <div className="bg-blue-50 border-l-4 border-blue-500 p-4 mb-6 rounded-lg">
          <div className="flex items-start">
            <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5 mr-3" />
            <div>
              <h3 className="font-semibold text-blue-900">Doctor Guidelines:</h3>
              <ul className="text-sm text-blue-800 mt-1 space-y-1">
                <li>• Join consultations on time to ensure patient satisfaction</li>
                <li>• Keep your camera and microphone enabled throughout the consultation</li>
                <li>• Document consultation notes immediately after each session</li>
                <li>• Ensure patient privacy and HIPAA compliance</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-xl shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">Scheduled</p>
                <p className="text-2xl font-bold text-blue-600">
                  {consultations.filter(c => c.status === 'scheduled').length}
                </p>
              </div>
              <Clock className="w-8 h-8 text-blue-600" />
            </div>
          </div>
          
          <div className="bg-white rounded-xl shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">Active</p>
                <p className="text-2xl font-bold text-green-600">
                  {consultations.filter(c => c.status === 'active').length}
                </p>
              </div>
              <Video className="w-8 h-8 text-green-600" />
            </div>
          </div>
          
          <div className="bg-white rounded-xl shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">Completed</p>
                <p className="text-2xl font-bold text-gray-600">
                  {consultations.filter(c => c.status === 'completed').length}
                </p>
              </div>
              <CheckCircle className="w-8 h-8 text-gray-600" />
            </div>
          </div>
          
          <div className="bg-white rounded-xl shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">Total</p>
                <p className="text-2xl font-bold text-purple-600">
                  {consultations.length}
                </p>
              </div>
              <FileText className="w-8 h-8 text-purple-600" />
            </div>
          </div>
        </div>

        {/* Consultations Grid */}
        {consultations.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-xl p-12 text-center">
            <Video className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-700 mb-2">No Consultations Scheduled</h3>
            <p className="text-gray-600">Your upcoming video consultations will appear here.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {consultations.map((consultation) => (
              <div
                key={consultation._id}
                className="bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all p-6"
              >
                {/* Header */}
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                      <User className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-800">
                        {consultation.patientId?.name}
                      </h3>
                      <p className="text-sm text-gray-600">
                        Patient ID: {consultation.patientId?._id?.slice(-6)}
                      </p>
                    </div>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1 ${getStatusColor(consultation.status)}`}>
                    {getStatusIcon(consultation.status)}
                    {consultation.status}
                  </span>
                </div>

                {/* Details */}
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

                {/* Actions */}
                <div className="space-y-2">
                  {consultation.status === 'scheduled' && (
                    <>
                      <button
                        onClick={() => joinRoom(consultation)}
                        className="w-full bg-gradient-to-r from-green-500 to-emerald-500 text-white py-3 rounded-lg hover:from-green-600 hover:to-emerald-600 transition-all font-semibold flex items-center justify-center space-x-2"
                      >
                        <Video className="w-5 h-5" />
                        <span>Start Consultation</span>
                      </button>
                      <button
                        onClick={() => {
                          const notes = prompt('Enter cancellation reason:');
                          if (notes) {
                            updateConsultationStatus(consultation._id, 'cancelled', notes);
                          }
                        }}
                        className="w-full bg-red-50 text-red-600 py-2 rounded-lg hover:bg-red-100 transition-all font-medium text-sm"
                      >
                        Cancel Consultation
                      </button>
                    </>
                  )}

                  {consultation.status === 'active' && (
                    <button
                      onClick={() => joinRoom(consultation)}
                      className="w-full bg-gradient-to-r from-blue-500 to-indigo-500 text-white py-3 rounded-lg hover:from-blue-600 hover:to-indigo-600 transition-all font-semibold flex items-center justify-center space-x-2 animate-pulse"
                    >
                      <Video className="w-5 h-5" />
                      <span>Rejoin Call</span>
                    </button>
                  )}

                  {consultation.status === 'completed' && (
                    <div className="space-y-2">
                      <div className="text-center py-3 bg-green-50 rounded-lg text-green-700 text-sm font-medium">
                        ✓ Consultation Completed
                      </div>
                      <button
                        onClick={() => {
                          const notes = prompt('Update consultation notes:', consultation.consultationNotes);
                          if (notes !== null) {
                            updateConsultationStatus(consultation._id, 'completed', notes);
                          }
                        }}
                        className="w-full bg-gray-50 text-gray-600 py-2 rounded-lg hover:bg-gray-100 transition-all font-medium text-sm"
                      >
                        Update Notes
                      </button>
                    </div>
                  )}

                  {consultation.status === 'cancelled' && (
                    <div className="text-center py-3 bg-red-50 rounded-lg text-red-700 text-sm font-medium">
                      ✗ Consultation Cancelled
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
        
        <ToastContainer />
      </div>
    </div>
  );
};

export default DoctorTelemedicine;
