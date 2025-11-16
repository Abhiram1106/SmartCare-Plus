import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { useToast } from '../../hooks/useToast';
import ToastContainer from '../../components/ToastContainer';

const PatientHistory = () => {
  const { showError } = useToast();
  const [patients, setPatients] = useState([]);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [patientAppointments, setPatientAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchPatients();
  }, []);

  const fetchPatients = async () => {
    try {
      setLoading(true);
      const response = await api.get('/appointments');
      const appointments = response.data || [];
      
      const uniquePatients = [];
      const patientIds = new Set();
      
      appointments.forEach(apt => {
        if (apt.patient && !patientIds.has(apt.patient._id)) {
          patientIds.add(apt.patient._id);
          uniquePatients.push({
            ...apt.patient,
            totalAppointments: appointments.filter(a => a.patient?._id === apt.patient._id).length,
            lastVisit: appointments
              .filter(a => a.patient?._id === apt.patient._id)
              .sort((a, b) => new Date(b.date) - new Date(a.date))[0]?.date
          });
        }
      });
      
      setPatients(uniquePatients);
    } catch (error) {
      console.error('Error fetching patients:', error);
      showError('Failed to fetch patients');
    } finally {
      setLoading(false);
    }
  };

  const fetchPatientAppointments = async (patientId) => {
    try {
      const response = await api.get('/appointments');
      const appointments = (response.data || []).filter(apt => apt.patient?._id === patientId);
      setPatientAppointments(appointments.sort((a, b) => new Date(b.date) - new Date(a.date)));
    } catch (error) {
      console.error('Error fetching patient appointments:', error);
      showError('Failed to fetch patient history');
    }
  };

  const handleSelectPatient = (patient) => {
    setSelectedPatient(patient);
    fetchPatientAppointments(patient._id);
  };

  const filteredPatients = patients.filter(patient =>
    patient.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    patient.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    patient.phone?.includes(searchTerm)
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading patient history...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800">Patient History</h1>
          <p className="text-gray-600 mt-2">View patient medical records and appointment history</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-md p-4 sticky top-8">
              <div className="mb-4">
                <input
                  type="text"
                  placeholder="Search patients..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div className="space-y-2 max-h-[600px] overflow-y-auto">
                {filteredPatients.length === 0 ? (
                  <p className="text-center text-gray-500 py-4">No patients found</p>
                ) : (
                  filteredPatients.map((patient) => (
                    <div
                      key={patient._id}
                      onClick={() => handleSelectPatient(patient)}
                      className={`p-4 rounded-lg cursor-pointer transition-colors ${
                        selectedPatient?._id === patient._id
                          ? 'bg-blue-100 border-2 border-blue-500'
                          : 'bg-gray-50 hover:bg-gray-100'
                      }`}
                    >
                      <h3 className="font-semibold text-gray-800">{patient.name}</h3>
                      <p className="text-sm text-gray-600">{patient.email}</p>
                      <p className="text-sm text-gray-600">{patient.phone}</p>
                      <div className="flex justify-between items-center mt-2 text-xs text-gray-500">
                        <span>{patient.totalAppointments} visits</span>
                        {patient.lastVisit && (
                          <span>Last: {new Date(patient.lastVisit).toLocaleDateString()}</span>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          <div className="lg:col-span-2">
            {!selectedPatient ? (
              <div className="bg-white rounded-lg shadow-md p-12 text-center">
                <svg className="mx-auto h-16 w-16 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                <h3 className="text-xl font-semibold text-gray-700 mb-2">Select a patient</h3>
                <p className="text-gray-500">Choose a patient from the list to view their medical history</p>
              </div>
            ) : (
              <div>
                <div className="bg-white rounded-lg shadow-md p-6 mb-6">
                  <h2 className="text-2xl font-bold text-gray-800 mb-4">Patient Information</h2>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-600">Name</p>
                      <p className="font-semibold text-gray-800">{selectedPatient.name}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Email</p>
                      <p className="font-semibold text-gray-800">{selectedPatient.email}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Phone</p>
                      <p className="font-semibold text-gray-800">{selectedPatient.phone}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Total Visits</p>
                      <p className="font-semibold text-gray-800">{selectedPatient.totalAppointments}</p>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-lg shadow-md p-6">
                  <h3 className="text-xl font-bold text-gray-800 mb-4">Appointment History</h3>
                  
                  {patientAppointments.length === 0 ? (
                    <p className="text-center text-gray-500 py-8">No appointment history found</p>
                  ) : (
                    <div className="space-y-4">
                      {patientAppointments.map((appointment) => (
                        <div key={appointment._id} className="border border-gray-200 rounded-lg p-4">
                          <div className="flex justify-between items-start mb-3">
                            <div>
                              <p className="font-semibold text-gray-800">
                                {new Date(appointment.date).toLocaleDateString()} at {appointment.timeSlot}
                              </p>
                              <p className={`inline-block px-3 py-1 rounded-full text-xs font-medium mt-2 ${
                                appointment.status === 'completed'
                                  ? 'bg-green-100 text-green-800'
                                  : appointment.status === 'cancelled'
                                  ? 'bg-red-100 text-red-800'
                                  : 'bg-blue-100 text-blue-800'
                              }`}>
                                {appointment.status.charAt(0).toUpperCase() + appointment.status.slice(1)}
                              </p>
                            </div>
                          </div>

                          {appointment.symptoms && (
                            <div className="mb-3 p-3 bg-blue-50 rounded-lg">
                              <p className="text-sm font-medium text-blue-900 mb-1">Symptoms</p>
                              <p className="text-sm text-blue-700">{appointment.symptoms}</p>
                            </div>
                          )}

                          {appointment.patientHistory && (
                            <div className="mb-3 p-3 bg-purple-50 rounded-lg">
                              <p className="text-sm font-medium text-purple-900 mb-1">Medical History</p>
                              <p className="text-sm text-purple-700">{appointment.patientHistory}</p>
                            </div>
                          )}

                          {appointment.diagnosis && (
                            <div className="mb-3 p-3 bg-green-50 rounded-lg">
                              <p className="text-sm font-medium text-green-900 mb-1">Diagnosis</p>
                              <p className="text-sm text-green-700">{appointment.diagnosis}</p>
                            </div>
                          )}

                          {appointment.prescription && (
                            <div className="p-3 bg-yellow-50 rounded-lg">
                              <p className="text-sm font-medium text-yellow-900 mb-1">Prescription</p>
                              <p className="text-sm text-yellow-700">{appointment.prescription}</p>
                            </div>
                          )}

                          {appointment.rating && (
                            <div className="mt-3 pt-3 border-t border-gray-200">
                              <div className="flex items-center gap-2">
                                <span className="text-sm font-medium text-gray-700">Patient Rating:</span>
                                <div className="flex items-center">
                                  {[...Array(5)].map((_, i) => (
                                    <svg
                                      key={i}
                                      className={`w-4 h-4 ${i < appointment.rating ? 'text-yellow-400' : 'text-gray-300'}`}
                                      fill="currentColor"
                                      viewBox="0 0 20 20"
                                    >
                                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                    </svg>
                                  ))}
                                </div>
                              </div>
                              {appointment.feedback && (
                                <p className="text-sm text-gray-600 mt-2">{appointment.feedback}</p>
                              )}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      <ToastContainer />
    </div>
  );
};

export default PatientHistory;
