import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Calendar, 
  Clock, 
  User, 
  Phone, 
  Mail, 
  CheckCircle, 
  XCircle, 
  FileText, 
  Pill,
  Download,
  Star,
  MessageSquare,
  CreditCard,
  AlertCircle,
  Hourglass
} from 'lucide-react';
import api from '../../services/api';
import { useToast } from '../../hooks/useToast';
import ToastContainer from '../../components/ToastContainer';
import ConfirmDialog from '../../components/ConfirmDialog';

const MyAppointments = () => {
  const navigate = useNavigate();
  const { showSuccess, showError } = useToast();
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [showPrescriptionModal, setShowPrescriptionModal] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [selectedPrescription, setSelectedPrescription] = useState(null);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [confirmAction, setConfirmAction] = useState(null);
  const [rating, setRating] = useState(5);
  const [feedback, setFeedback] = useState('');

  useEffect(() => {
    fetchAppointments();
  }, []);

  const fetchAppointments = async () => {
    try {
      setLoading(true);
      const response = await api.get('/appointments');
      setAppointments(response.data || []);
    } catch (error) {
      console.error('Error fetching appointments:', error);
      showError('Failed to fetch appointments');
    } finally {
      setLoading(false);
    }
  };

  const handlePayNow = (appointmentId) => {
    navigate(`/patient/payment-gateway?appointmentId=${appointmentId}`);
  };

  const handleCancelAppointment = async (id) => {
    setConfirmAction({
      title: 'Cancel Appointment',
      message: 'Are you sure you want to cancel this appointment? This action cannot be undone.',
      onConfirm: async () => {
        try {
          await api.put(`/appointments/${id}`, { status: 'cancelled' });
          showSuccess('Appointment cancelled successfully');
          fetchAppointments();
        } catch (error) {
          console.error('Error cancelling appointment:', error);
          showError(error.response?.data?.message || 'Failed to cancel appointment');
        }
        setShowConfirmDialog(false);
      }
    });
    setShowConfirmDialog(true);
  };

  const handleRateAppointment = async () => {
    try {
      await api.put(`/appointments/${selectedAppointment._id}`, {
        rating,
        feedback
      });
      showSuccess('Rating submitted successfully');
      setShowRatingModal(false);
      setSelectedAppointment(null);
      setRating(5);
      setFeedback('');
      fetchAppointments();
    } catch (error) {
      console.error('Error submitting rating:', error);
      showError('Failed to submit rating');
    }
  };

  const viewPrescription = async (appointmentId) => {
    try {
      const response = await api.get(`/appointments/${appointmentId}/prescription`);
      setSelectedPrescription(response.data);
      setShowPrescriptionModal(true);
    } catch (error) {
      console.error('Error fetching prescription:', error);
      showError('Failed to load prescription');
    }
  };

  const downloadReceipt = async (appointmentId) => {
    try {
      // Request PDF format with responseType blob
      const response = await api.get(`/payments/receipt/${appointmentId}?format=pdf`, {
        responseType: 'blob'
      });
      
      // Create blob URL and trigger download
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `receipt-${appointmentId}.pdf`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading receipt:', error);
      showError('Failed to download receipt');
    }
  };

  const openRatingModal = (appointment) => {
    setSelectedAppointment(appointment);
    setRating(appointment.rating || 5);
    setFeedback(appointment.feedback || '');
    setShowRatingModal(true);
  };

  const filteredAppointments = appointments.filter(apt => {
    if (filter === 'all') return true;
    return apt.status === filter;
  });

  const getStatusBadge = (appointment) => {
    const status = appointment.status;
    const badges = {
      pending: 'bg-yellow-100 text-yellow-800',
      approved: 'bg-blue-100 text-blue-800', 
      rejected: 'bg-red-100 text-red-800',
      paid: 'bg-green-100 text-green-800',
      completed: 'bg-purple-100 text-purple-800',
      cancelled: 'bg-gray-100 text-gray-800'
    };
    return `px-3 py-1 rounded-full text-xs font-semibold ${badges[status] || 'bg-gray-100 text-gray-800'}`;
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'pending':
        return <Hourglass className="w-4 h-4" />;
      case 'approved':
        return <CheckCircle className="w-4 h-4" />;
      case 'rejected':
        return <XCircle className="w-4 h-4" />;
      case 'paid':
        return <CreditCard className="w-4 h-4" />;
      case 'completed':
        return <CheckCircle className="w-4 h-4" />;
      case 'cancelled':
        return <XCircle className="w-4 h-4" />;
      default:
        return <AlertCircle className="w-4 h-4" />;
    }
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-cyan-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading your appointments...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-cyan-50 py-8">
      <div className="max-w-7xl mx-auto px-4">
        
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              My Appointments
            </h1>
            <p className="text-gray-600 mt-2">Track your healthcare journey</p>
          </div>
          <Link
            to="/patient/book-appointment"
            className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:shadow-lg transition-all duration-300 font-semibold"
          >
            + Book New Appointment
          </Link>
        </div>

        {/* Status Filter Tabs */}
        <div className="mb-6 bg-white rounded-xl shadow-lg p-2">
          <div className="flex flex-wrap gap-2">
            {[
              { key: 'all', label: 'All', count: appointments.length },
              { key: 'pending', label: 'Pending', count: appointments.filter(a => a.status === 'pending').length },
              { key: 'approved', label: 'Approved', count: appointments.filter(a => a.status === 'approved').length },
              { key: 'paid', label: 'Paid', count: appointments.filter(a => a.status === 'paid').length },
              { key: 'completed', label: 'Completed', count: appointments.filter(a => a.status === 'completed').length },
              { key: 'rejected', label: 'Rejected', count: appointments.filter(a => a.status === 'rejected').length },
              { key: 'cancelled', label: 'Cancelled', count: appointments.filter(a => a.status === 'cancelled').length }
            ].map(tab => (
              <button
                key={tab.key}
                onClick={() => setFilter(tab.key)}
                className={`px-4 py-2 rounded-lg transition-all duration-300 ${
                  filter === tab.key
                    ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                {tab.label} ({tab.count})
              </button>
            ))}
          </div>
        </div>

        {/* Appointments List */}
        {filteredAppointments.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-xl p-12 text-center">
            <Calendar className="mx-auto h-20 w-20 text-gray-300 mb-4" />
            <h3 className="text-2xl font-semibold text-gray-700 mb-2">No appointments found</h3>
            <p className="text-gray-500 mb-6">
              {filter === 'all' 
                ? "You haven't booked any appointments yet."
                : `You have no ${filter} appointments.`}
            </p>
            <Link
              to="/patient/book-appointment"
              className="inline-block px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:shadow-lg transition-all duration-300"
            >
              Book Your First Appointment
            </Link>
          </div>
        ) : (
          <div className="space-y-6">
            {filteredAppointments.map((appointment) => (
              <div key={appointment._id} className="bg-white rounded-2xl shadow-xl p-6 hover:shadow-2xl transition-all duration-300">
                
                {/* Appointment Header */}
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-bold text-lg">
                      {appointment.doctor?.name?.charAt(0) || 'D'}
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold text-gray-800">
                        Dr. {appointment.doctor?.name}
                      </h3>
                      <p className="text-gray-600">{appointment.doctor?.specialization}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    {getStatusIcon(appointment.status)}
                    <span className={getStatusBadge(appointment)}>
                      {appointment.status.charAt(0).toUpperCase() + appointment.status.slice(1)}
                    </span>
                  </div>
                </div>

                {/* Appointment Details */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4 p-4 bg-gray-50 rounded-xl">
                  <div className="flex items-center space-x-2">
                    <Calendar className="w-5 h-5 text-blue-600" />
                    <div>
                      <p className="text-xs text-gray-500">Date</p>
                      <p className="font-semibold">{formatDate(appointment.appointmentDate)}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Clock className="w-5 h-5 text-green-600" />
                    <div>
                      <p className="text-xs text-gray-500">Time</p>
                      <p className="font-semibold">{appointment.timeSlot}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <CreditCard className="w-5 h-5 text-purple-600" />
                    <div>
                      <p className="text-xs text-gray-500">Amount</p>
                      <p className="font-semibold">₹{appointment.amount}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <User className="w-5 h-5 text-orange-600" />
                    <div>
                      <p className="text-xs text-gray-500">Payment Status</p>
                      <p className="font-semibold">
                        {appointment.paymentStatus || 'Unpaid'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Your Symptoms */}
                {appointment.symptoms && (
                  <div className="mb-4 p-4 bg-blue-50 rounded-xl border-l-4 border-blue-500">
                    <h4 className="font-semibold text-blue-900 mb-2 flex items-center">
                      <FileText className="w-4 h-4 mr-2" />
                      Your Symptoms
                    </h4>
                    <p className="text-blue-800">{appointment.symptoms}</p>
                  </div>
                )}

                {/* Doctor Response */}
                {appointment.doctorResponse?.message && (
                  <div className="mb-4 p-4 bg-green-50 rounded-xl border-l-4 border-green-500">
                    <h4 className="font-semibold text-green-900 mb-2 flex items-center">
                      <MessageSquare className="w-4 h-4 mr-2" />
                      Doctor's Response
                    </h4>
                    <p className="text-green-800">{appointment.doctorResponse.message}</p>
                    <p className="text-xs text-green-600 mt-1">
                      Responded on {new Date(appointment.doctorResponse.respondedAt).toLocaleDateString()}
                    </p>
                  </div>
                )}

                {/* Diagnosis & Notes (for completed appointments) */}
                {appointment.status === 'completed' && (
                  <>
                    {appointment.diagnosis && (
                      <div className="mb-4 p-4 bg-purple-50 rounded-xl border-l-4 border-purple-500">
                        <h4 className="font-semibold text-purple-900 mb-2 flex items-center">
                          <FileText className="w-4 h-4 mr-2" />
                          Diagnosis
                        </h4>
                        <p className="text-purple-800">{appointment.diagnosis}</p>
                      </div>
                    )}
                    
                    {appointment.notes && (
                      <div className="mb-4 p-4 bg-indigo-50 rounded-xl border-l-4 border-indigo-500">
                        <h4 className="font-semibold text-indigo-900 mb-2 flex items-center">
                          <FileText className="w-4 h-4 mr-2" />
                          Doctor's Notes
                        </h4>
                        <p className="text-indigo-800">{appointment.notes}</p>
                      </div>
                    )}
                  </>
                )}

                {/* Status-specific Messages */}
                {appointment.status === 'pending' && (
                  <div className="mb-4 p-4 bg-yellow-50 rounded-xl border border-yellow-200">
                    <p className="text-yellow-800 text-sm flex items-center">
                      <Hourglass className="w-4 h-4 mr-2" />
                      Waiting for doctor's approval. You'll be notified once the doctor reviews your request.
                    </p>
                  </div>
                )}

                {appointment.status === 'approved' && (
                  <div className="mb-4 p-4 bg-blue-50 rounded-xl border border-blue-200">
                    <p className="text-blue-800 text-sm flex items-center">
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Appointment approved! Please proceed with payment to confirm your slot.
                    </p>
                  </div>
                )}

                {appointment.status === 'rejected' && (
                  <div className="mb-4 p-4 bg-red-50 rounded-xl border border-red-200">
                    <p className="text-red-800 text-sm flex items-center">
                      <XCircle className="w-4 h-4 mr-2" />
                      Sorry, this appointment request was not approved by the doctor.
                    </p>
                  </div>
                )}

                {appointment.status === 'paid' && (
                  <div className="mb-4 p-4 bg-green-50 rounded-xl border border-green-200">
                    <p className="text-green-800 text-sm flex items-center">
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Payment confirmed! Your appointment is scheduled. The doctor will see you soon.
                    </p>
                  </div>
                )}

                {/* Rating Display */}
                {appointment.rating && (
                  <div className="mb-4 flex items-center space-x-2">
                    <span className="text-sm font-medium text-gray-700">Your Rating:</span>
                    <div className="flex items-center">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className={`w-4 h-4 ${i < appointment.rating ? 'text-yellow-400 fill-current' : 'text-gray-300'}`}
                        />
                      ))}
                    </div>
                    {appointment.feedback && (
                      <span className="text-sm text-gray-600 ml-2">- {appointment.feedback}</span>
                    )}
                  </div>
                )}

                {/* Action Buttons Based on Status */}
                <div className="flex flex-wrap gap-3">
                  {appointment.status === 'pending' && (
                    <div className="flex items-center space-x-2 px-4 py-2 bg-yellow-50 text-yellow-700 rounded-lg border border-yellow-200">
                      <Hourglass className="w-4 h-4" />
                      <span>Awaiting Approval</span>
                    </div>
                  )}

                  {appointment.status === 'approved' && (
                    <button
                      onClick={() => handlePayNow(appointment._id)}
                      className="flex items-center space-x-2 px-6 py-2 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-lg hover:from-green-600 hover:to-emerald-600 transition-all shadow-md hover:shadow-lg font-semibold"
                    >
                      <CreditCard className="w-4 h-4" />
                      <span>Pay Now - ₹{appointment.amount}</span>
                    </button>
                  )}

                  {appointment.status === 'completed' && appointment.prescription && (
                    <button
                      onClick={() => viewPrescription(appointment._id)}
                      className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg hover:from-purple-600 hover:to-pink-600 transition-all"
                    >
                      <Pill className="w-4 h-4" />
                      <span>View Prescription</span>
                    </button>
                  )}

                  {appointment.paymentStatus === 'paid' && (
                    <button
                      onClick={() => downloadReceipt(appointment._id)}
                      className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-indigo-500 to-purple-500 text-white rounded-lg hover:from-indigo-600 hover:to-purple-600 transition-all"
                    >
                      <Download className="w-4 h-4" />
                      <span>Download Receipt</span>
                    </button>
                  )}

                  {appointment.status === 'completed' && !appointment.rating && (
                    <button
                      onClick={() => openRatingModal(appointment)}
                      className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-yellow-500 to-orange-500 text-white rounded-lg hover:from-yellow-600 hover:to-orange-600 transition-all"
                    >
                      <Star className="w-4 h-4" />
                      <span>Rate Doctor</span>
                    </button>
                  )}

                  {(appointment.status === 'pending' || appointment.status === 'approved') && (
                    <button
                      onClick={() => handleCancelAppointment(appointment._id)}
                      className="flex items-center space-x-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-all"
                    >
                      <XCircle className="w-4 h-4" />
                      <span>Cancel</span>
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Rating Modal */}
        {showRatingModal && selectedAppointment && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl p-8 max-w-md w-full">
              <h2 className="text-2xl font-bold mb-4">Rate Your Experience</h2>
              
              <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                <h3 className="font-semibold text-lg">Dr. {selectedAppointment.doctor?.name}</h3>
                <p className="text-gray-600">{formatDate(selectedAppointment.appointmentDate)}</p>
              </div>
              
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Rating
                </label>
                <div className="flex items-center gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      onClick={() => setRating(star)}
                      className="focus:outline-none"
                    >
                      <Star
                        className={`w-8 h-8 ${star <= rating ? 'text-yellow-400 fill-current' : 'text-gray-300'} hover:text-yellow-400 transition-colors`}
                      />
                    </button>
                  ))}
                </div>
              </div>

              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Feedback (Optional)
                </label>
                <textarea
                  value={feedback}
                  onChange={(e) => setFeedback(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows="4"
                  placeholder="Share your experience..."
                />
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowRatingModal(false);
                    setSelectedAppointment(null);
                    setRating(5);
                    setFeedback('');
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleRateAppointment}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Submit Rating
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Prescription Modal */}
        {showPrescriptionModal && selectedPrescription && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl p-8 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              <h2 className="text-2xl font-bold mb-6">Digital Prescription</h2>
              
              {/* Prescription Header */}
              <div className="mb-6 p-4 bg-blue-50 rounded-lg border-l-4 border-blue-500">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">Prescription No.</p>
                    <p className="font-semibold">{selectedPrescription.prescriptionNumber}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Date</p>
                    <p className="font-semibold">{formatDate(selectedPrescription.dateIssued)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Doctor</p>
                    <p className="font-semibold">Dr. {selectedPrescription.doctor?.name}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Patient</p>
                    <p className="font-semibold">{selectedPrescription.patient?.name}</p>
                  </div>
                </div>
              </div>

              {/* Diagnosis */}
              <div className="mb-6">
                <h3 className="text-lg font-semibold mb-2">Diagnosis</h3>
                <p className="text-gray-700 p-3 bg-gray-50 rounded-lg">{selectedPrescription.diagnosis}</p>
              </div>

              {/* Medications */}
              <div className="mb-6">
                <h3 className="text-lg font-semibold mb-3">Medications</h3>
                <div className="space-y-3">
                  {selectedPrescription.medications.map((medication, index) => (
                    <div key={index} className="p-4 border border-gray-200 rounded-lg">
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-2">
                        <div>
                          <p className="text-xs text-gray-500">Medicine</p>
                          <p className="font-semibold">{medication.name}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">Dosage</p>
                          <p className="font-semibold">{medication.dosage}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">Frequency</p>
                          <p className="font-semibold">{medication.frequency}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">Duration</p>
                          <p className="font-semibold">{medication.duration}</p>
                        </div>
                      </div>
                      {medication.instructions && (
                        <div>
                          <p className="text-xs text-gray-500">Instructions</p>
                          <p className="text-sm text-gray-700">{medication.instructions}</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* General Instructions */}
              {selectedPrescription.generalInstructions && (
                <div className="mb-6">
                  <h3 className="text-lg font-semibold mb-2">General Instructions</h3>
                  <p className="text-gray-700 p-3 bg-gray-50 rounded-lg">{selectedPrescription.generalInstructions}</p>
                </div>
              )}

              <div className="flex gap-3">
                <button
                  onClick={() => setShowPrescriptionModal(false)}
                  className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Close
                </button>
                <button
                  onClick={() => window.print()}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Print Prescription
                </button>
              </div>
            </div>
          </div>
        )}

        {showConfirmDialog && confirmAction && (
          <ConfirmDialog
            isOpen={showConfirmDialog}
            title={confirmAction.title}
            message={confirmAction.message}
            onConfirm={confirmAction.onConfirm}
            onCancel={() => setShowConfirmDialog(false)}
          />
        )}
        
        <ToastContainer />
      </div>
    </div>
  );
};

export default MyAppointments;