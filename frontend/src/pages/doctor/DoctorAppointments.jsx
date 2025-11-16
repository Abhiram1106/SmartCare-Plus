import React, { useState, useEffect } from 'react';
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
  Eye,
  MessageSquare,
  Plus,
  Trash2
} from 'lucide-react';
import api from '../../services/api';
import { useToast } from '../../hooks/useToast';
import ToastContainer from '../../components/ToastContainer';

const DoctorAppointments = () => {
  const { showSuccess, showError } = useToast();
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [showApprovalModal, setShowApprovalModal] = useState(false);
  const [showCompletionModal, setShowCompletionModal] = useState(false);
  const [showPrescriptionModal, setShowPrescriptionModal] = useState(false);
  const [approvalMessage, setApprovalMessage] = useState('');
  const [completionData, setCompletionData] = useState({
    diagnosis: '',
    notes: ''
  });
  const [prescriptionData, setPrescriptionData] = useState({
    diagnosis: '',
    medications: [{ name: '', dosage: '', frequency: 'Twice daily', duration: '', instructions: '' }],
    generalInstructions: '',
    followUp: { required: false, date: '', instructions: '' },
    testsRecommended: [],
    lifestyleRecommendations: { diet: '', exercise: '', restrictions: '', other: '' }
  });

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

  // Handle approve/reject appointment
  const handleApproveReject = async (status) => {
    try {
      await api.put(`/appointments/${selectedAppointment._id}/approve`, { 
        status, 
        message: approvalMessage 
      });
      showSuccess(`Appointment ${status} successfully`);
      setShowApprovalModal(false);
      setApprovalMessage('');
      fetchAppointments();
    } catch (error) {
      console.error('Error updating appointment:', error);
      showError(error.response?.data?.message || 'Failed to update appointment');
    }
  };

  // Handle mark as completed
  const handleComplete = async () => {
    try {
      const payload = {
        diagnosis: completionData.diagnosis,
        notes: completionData.notes
      };

      await api.put(`/appointments/${selectedAppointment._id}/complete`, payload);
      showSuccess('Appointment marked as completed successfully');
      setShowCompletionModal(false);
      setCompletionData({ diagnosis: '', notes: '' });
      fetchAppointments();
    } catch (error) {
      console.error('Error completing appointment:', error);
      showError(error.response?.data?.message || 'Failed to complete appointment');
    }
  };

  // Handle prescription creation
  const handleCreatePrescription = async () => {
    try {
      await api.post('/prescriptions', {
        appointmentId: selectedAppointment._id,
        ...prescriptionData
      });
      showSuccess('Prescription created successfully');
      setShowPrescriptionModal(false);
      // Reset prescription data
      setPrescriptionData({
        diagnosis: '',
        medications: [{ name: '', dosage: '', frequency: 'Twice daily', duration: '', instructions: '' }],
        generalInstructions: '',
        followUp: { required: false, date: '', instructions: '' },
        testsRecommended: [],
        lifestyleRecommendations: { diet: '', exercise: '', restrictions: '', other: '' }
      });
      fetchAppointments();
    } catch (error) {
      console.error('Error creating prescription:', error);
      showError(error.response?.data?.message || 'Failed to create prescription');
    }
  };

  const addMedication = () => {
    setPrescriptionData({
      ...prescriptionData,
      medications: [...prescriptionData.medications, 
        { name: '', dosage: '', frequency: 'Twice daily', duration: '', instructions: '' }]
    });
  };

  const updateMedication = (index, field, value) => {
    const updatedMedications = prescriptionData.medications.map((med, i) => 
      i === index ? { ...med, [field]: value } : med
    );
    setPrescriptionData({ ...prescriptionData, medications: updatedMedications });
  };

  const removeMedication = (index) => {
    if (prescriptionData.medications.length > 1) {
      const updatedMedications = prescriptionData.medications.filter((_, i) => i !== index);
      setPrescriptionData({ ...prescriptionData, medications: updatedMedications });
    }
  };

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

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long', 
      day: 'numeric'
    });
  };

  const filteredAppointments = appointments.filter(appointment => {
    if (filter === 'all') return true;
    return appointment.status === filter;
  });

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-cyan-50 py-8">
      <div className="max-w-7xl mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Manage Appointments
          </h1>
          <p className="text-gray-600 mt-2">Review requests, approve appointments, and provide care</p>
        </div>

        {/* Status Filter Tabs */}
        <div className="mb-6 bg-white rounded-xl shadow-lg p-2">
          <div className="flex flex-wrap gap-2">
            {[
              { key: 'all', label: 'All', count: appointments.length },
              { key: 'pending', label: 'Pending Approval', count: appointments.filter(a => a.status === 'pending').length },
              { key: 'approved', label: 'Approved', count: appointments.filter(a => a.status === 'approved').length },
              { key: 'paid', label: 'Paid', count: appointments.filter(a => a.status === 'paid').length },
              { key: 'completed', label: 'Completed', count: appointments.filter(a => a.status === 'completed').length },
              { key: 'rejected', label: 'Rejected', count: appointments.filter(a => a.status === 'rejected').length }
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
            <p className="text-gray-500">No appointments match your current filter.</p>
          </div>
        ) : (
          <div className="space-y-6">
            {filteredAppointments.map((appointment) => (
              <div key={appointment._id} className="bg-white rounded-2xl shadow-xl p-6 hover:shadow-2xl transition-all duration-300">
                
                {/* Appointment Header */}
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-bold text-lg">
                      {appointment.patient?.name?.charAt(0) || 'P'}
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold text-gray-800">
                        {appointment.patient?.name}
                      </h3>
                      <p className="text-gray-600 flex items-center">
                        <Mail className="w-4 h-4 mr-1" />
                        {appointment.patient?.email}
                      </p>
                    </div>
                  </div>
                  <span className={getStatusBadge(appointment)}>
                    {appointment.status.charAt(0).toUpperCase() + appointment.status.slice(1)}
                  </span>
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
                    <Phone className="w-5 h-5 text-purple-600" />
                    <div>
                      <p className="text-xs text-gray-500">Phone</p>
                      <p className="font-semibold">{appointment.patient?.phone || 'Not provided'}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <User className="w-5 h-5 text-orange-600" />
                    <div>
                      <p className="text-xs text-gray-500">Amount</p>
                      <p className="font-semibold">₹{appointment.amount}</p>
                    </div>
                  </div>
                </div>

                {/* Patient Symptoms */}
                {appointment.symptoms && (
                  <div className="mb-4 p-4 bg-blue-50 rounded-xl border-l-4 border-blue-500">
                    <h4 className="font-semibold text-blue-900 mb-2 flex items-center">
                      <FileText className="w-4 h-4 mr-2" />
                      Symptoms
                    </h4>
                    <p className="text-blue-800">{appointment.symptoms}</p>
                  </div>
                )}

                {/* Doctor Response Message */}
                {appointment.doctorResponse?.message && (
                  <div className="mb-4 p-4 bg-purple-50 rounded-xl border-l-4 border-purple-500">
                    <h4 className="font-semibold text-purple-900 mb-2 flex items-center">
                      <MessageSquare className="w-4 h-4 mr-2" />
                      Your Response
                    </h4>
                    <p className="text-purple-800">{appointment.doctorResponse.message}</p>
                    <p className="text-xs text-purple-600 mt-1">
                      Responded on {new Date(appointment.doctorResponse.respondedAt).toLocaleDateString()}
                    </p>
                  </div>
                )}

                {/* Action Buttons Based on Status */}
                <div className="flex flex-wrap gap-3">
                  {appointment.status === 'pending' && (
                    <>
                      <button
                        onClick={() => {
                          setSelectedAppointment(appointment);
                          setShowApprovalModal(true);
                        }}
                        className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-lg hover:from-green-600 hover:to-emerald-600 transition-all"
                      >
                        <CheckCircle className="w-4 h-4" />
                        <span>Approve / Reject</span>
                      </button>
                    </>
                  )}

                  {appointment.status === 'paid' && (
                    <>
                      <button
                        onClick={() => {
                          setSelectedAppointment(appointment);
                          setShowCompletionModal(true);
                        }}
                        className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-blue-500 to-indigo-500 text-white rounded-lg hover:from-blue-600 hover:to-indigo-600 transition-all"
                      >
                        <CheckCircle className="w-4 h-4" />
                        <span>Mark Completed</span>
                      </button>
                      <button
                        onClick={() => {
                          setSelectedAppointment(appointment);
                          setShowPrescriptionModal(true);
                        }}
                        className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg hover:from-purple-600 hover:to-pink-600 transition-all"
                      >
                        <Pill className="w-4 h-4" />
                        <span>Create Prescription</span>
                      </button>
                    </>
                  )}

                  {appointment.status === 'completed' && appointment.prescription && (
                    <button
                      onClick={() => {
                        // View prescription logic
                        window.open(`/api/prescriptions/${appointment.prescription}`, '_blank');
                      }}
                      className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-indigo-500 to-purple-500 text-white rounded-lg hover:from-indigo-600 hover:to-purple-600 transition-all"
                    >
                      <Eye className="w-4 h-4" />
                      <span>View Prescription</span>
                    </button>
                  )}

                  {appointment.status === 'approved' && (
                    <div className="text-sm text-blue-600 bg-blue-50 px-3 py-2 rounded-lg">
                      Waiting for patient payment...
                    </div>
                  )}

                  {appointment.status === 'rejected' && (
                    <div className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">
                      Appointment rejected
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Approval Modal */}
        {showApprovalModal && selectedAppointment && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl p-8 max-w-md w-full">
              <h2 className="text-2xl font-bold mb-4">Appointment Decision</h2>
              
              <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                <h3 className="font-semibold text-lg mb-2">{selectedAppointment.patient?.name}</h3>
                <p className="text-gray-600">{formatDate(selectedAppointment.appointmentDate)} at {selectedAppointment.timeSlot}</p>
              </div>

              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Message to Patient (Optional)
                </label>
                <textarea
                  value={approvalMessage}
                  onChange={(e) => setApprovalMessage(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows="3"
                  placeholder="Add a message for the patient..."
                />
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setShowApprovalModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleApproveReject('rejected')}
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                >
                  Reject
                </button>
                <button
                  onClick={() => handleApproveReject('approved')}
                  className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                >
                  Approve
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Completion Modal */}
        {showCompletionModal && selectedAppointment && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <h2 className="text-2xl font-bold mb-4">Complete Appointment</h2>
              
              <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                <h3 className="font-semibold text-lg mb-2">{selectedAppointment.patient?.name}</h3>
                <p className="text-gray-600">{formatDate(selectedAppointment.appointmentDate)} at {selectedAppointment.timeSlot}</p>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Diagnosis *
                </label>
                <textarea
                  value={completionData.diagnosis}
                  onChange={(e) => setCompletionData({...completionData, diagnosis: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows="3"
                  placeholder="Enter diagnosis..."
                  required
                />
              </div>

              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Notes (Optional)
                </label>
                <textarea
                  value={completionData.notes}
                  onChange={(e) => setCompletionData({...completionData, notes: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows="3"
                  placeholder="Additional notes..."
                />
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setShowCompletionModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleComplete}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Complete Appointment
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Prescription Modal */}
        {showPrescriptionModal && selectedAppointment && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl p-8 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              <h2 className="text-2xl font-bold mb-6">Create Digital Prescription</h2>
              
              <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                <h3 className="font-semibold text-lg">{selectedAppointment.patient?.name}</h3>
                <p className="text-gray-600">{formatDate(selectedAppointment.appointmentDate)}</p>
              </div>

              {/* Diagnosis */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Diagnosis *
                </label>
                <textarea
                  value={prescriptionData.diagnosis}
                  onChange={(e) => setPrescriptionData({...prescriptionData, diagnosis: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  rows="2"
                  placeholder="Enter diagnosis..."
                  required
                />
              </div>

              {/* Medications */}
              <div className="mb-6">
                <div className="flex justify-between items-center mb-4">
                  <label className="block text-sm font-medium text-gray-700">
                    Medications
                  </label>
                  <button
                    onClick={addMedication}
                    className="flex items-center space-x-2 px-3 py-1 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Add Medication</span>
                  </button>
                </div>

                {prescriptionData.medications.map((medication, index) => (
                  <div key={index} className="mb-4 p-4 border border-gray-200 rounded-lg">
                    <div className="flex justify-between items-center mb-3">
                      <h4 className="font-medium">Medication {index + 1}</h4>
                      {prescriptionData.medications.length > 1 && (
                        <button
                          onClick={() => removeMedication(index)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <input
                        type="text"
                        placeholder="Medicine Name"
                        value={medication.name}
                        onChange={(e) => updateMedication(index, 'name', e.target.value)}
                        className="px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                      />
                      <input
                        type="text"
                        placeholder="Dosage (e.g., 500mg)"
                        value={medication.dosage}
                        onChange={(e) => updateMedication(index, 'dosage', e.target.value)}
                        className="px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                      />
                      <select
                        value={medication.frequency}
                        onChange={(e) => updateMedication(index, 'frequency', e.target.value)}
                        className="px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="Once daily">Once daily</option>
                        <option value="Twice daily">Twice daily</option>
                        <option value="Thrice daily">Thrice daily</option>
                        <option value="Four times daily">Four times daily</option>
                        <option value="Every 4 hours">Every 4 hours</option>
                        <option value="Every 6 hours">Every 6 hours</option>
                        <option value="Every 8 hours">Every 8 hours</option>
                        <option value="As needed">As needed</option>
                      </select>
                      <input
                        type="text"
                        placeholder="Duration (e.g., 7 days)"
                        value={medication.duration}
                        onChange={(e) => updateMedication(index, 'duration', e.target.value)}
                        className="px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <textarea
                      placeholder="Special instructions for this medication..."
                      value={medication.instructions}
                      onChange={(e) => updateMedication(index, 'instructions', e.target.value)}
                      className="mt-3 w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                      rows="2"
                    />
                  </div>
                ))}
              </div>

              {/* General Instructions */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  General Instructions
                </label>
                <textarea
                  value={prescriptionData.generalInstructions}
                  onChange={(e) => setPrescriptionData({...prescriptionData, generalInstructions: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  rows="3"
                  placeholder="General care instructions..."
                />
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setShowPrescriptionModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreatePrescription}
                  className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
                >
                  Create Prescription
                </button>
              </div>
            </div>
          </div>
        )}
        
        <ToastContainer />
      </div>
    </div>
  );
};

export default DoctorAppointments;