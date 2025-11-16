import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import { useToast } from '../../hooks/useToast';
import ToastContainer from '../../components/ToastContainer';

const BookAppointment = () => {
  const { doctorId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { showSuccess } = useToast();
  const [doctor, setDoctor] = useState(null);
  const [availableSlots, setAvailableSlots] = useState([]);
  const [formData, setFormData] = useState({
    appointmentDate: '',
    timeSlot: '',
    symptoms: '',
    allergies: '',
    currentMedications: '',
    previousConditions: ''
  });
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!doctorId) {
      setError('Doctor ID is required. Please select a doctor first.');
      setLoading(false);
      return;
    }
    fetchDoctor();
  }, [doctorId]);

  useEffect(() => {
    if (formData.appointmentDate) {
      fetchAvailableSlots();
    }
  }, [formData.appointmentDate]);

  const fetchDoctor = async () => {
    try {
      const response = await api.get(`/doctors/${doctorId}`);
      setDoctor(response.data);
    } catch (error) {
      console.error('Error fetching doctor:', error);
      setError('Doctor not found');
    } finally {
      setLoading(false);
    }
  };

  const fetchAvailableSlots = async () => {
    try {
      const response = await api.get(
        `/appointments/doctor/${doctorId}/availability?date=${formData.appointmentDate}`
      );
      setAvailableSlots(response.data.availableSlots);
    } catch (error) {
      console.error('Error fetching slots:', error);
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    try {
      const appointmentData = {
        doctorId,
        appointmentDate: formData.appointmentDate,
        timeSlot: formData.timeSlot,
        symptoms: formData.symptoms,
        patientHistory: {
          allergies: formData.allergies,
          currentMedications: formData.currentMedications,
          previousConditions: formData.previousConditions
        }
      };

      const response = await api.post('/appointments', appointmentData);
      
      showSuccess('Appointment booked successfully! Please proceed to payment.');
      navigate(`/patient/payment-gateway?appointmentId=${response.data._id}`);
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to book appointment');
    } finally {
      setSubmitting(false);
    }
  };

  // Early return if user is not authenticated
  if (!user) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (user.role !== 'patient') {
    return (
      <div className="max-w-2xl mx-auto px-4 py-8">
        <div className="bg-red-50 border border-red-400 text-red-700 px-4 py-3 rounded">
          Access denied. This page is only available to patients.
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading doctor information...</p>
        </div>
      </div>
    );
  }

  if (error && !doctor) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-8">
        <div className="bg-red-50 border border-red-400 text-red-700 px-6 py-4 rounded-lg">
          <div className="flex items-center mb-3">
            <svg className="w-6 h-6 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h3 className="text-lg font-semibold">Unable to Load Appointment Page</h3>
          </div>
          <p className="text-red-600 mb-4">{error}</p>
          <div className="flex gap-3">
            <button 
              onClick={() => navigate('/patient/doctors')}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
            >
              Browse Doctors
            </button>
            <button 
              onClick={() => window.history.back()}
              className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
            >
              Go Back
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Book Appointment</h1>
        <p className="text-gray-600 mt-2">Schedule your consultation with Dr. {doctor?.name}</p>
      </div>

      {/* Doctor Info Card */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center flex-1">
            <div className="w-20 h-20 bg-indigo-100 rounded-full flex items-center justify-center text-3xl">
              👨‍⚕️
            </div>
            <div className="ml-6 flex-1">
              <div className="flex items-center gap-3">
                <h2 className="text-2xl font-bold text-gray-900">Dr. {doctor?.name}</h2>
                {doctor?.verifiedBadge && (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    Verified
                  </span>
                )}
              </div>
              <p className="text-indigo-600 font-medium">{doctor?.specialization}</p>
              <div className="flex items-center mt-2 text-sm text-gray-600">
                <span className="mr-4">Experience: {doctor?.experience} years</span>
                <span>Education: {doctor?.education}</span>
              </div>
              {doctor?.successRate && (
                <div className="flex items-center mt-2 text-sm">
                  <span className="text-green-600 font-medium">✓ {doctor?.successRate}% Success Rate</span>
                  <span className="mx-2 text-gray-400">•</span>
                  <span className="text-gray-600">{doctor?.totalPatients || 0}+ Patients</span>
                </div>
              )}
            </div>
          </div>
          
          {/* Consultation Fee Badge */}
          <div className="ml-6 flex-shrink-0">
            <div className="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-lg p-4 text-center min-w-[140px] shadow-lg">
              <p className="text-white text-sm font-medium opacity-90">Consultation Fee</p>
              <p className="text-white text-3xl font-bold mt-1">₹{doctor?.consultationFee || 500}</p>
            </div>
          </div>
        </div>
        
        {/* Additional Info Row */}
        {doctor?.languages && doctor.languages.length > 0 && (
          <div className="mt-4 pt-4 border-t border-gray-200">
            <div className="flex items-center text-sm text-gray-600">
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" />
              </svg>
              <span className="font-medium mr-2">Languages:</span>
              <span>{doctor?.languages?.join(', ') || 'English'}</span>
            </div>
          </div>
        )}
      </div>

      {/* Booking Form */}
      <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-md p-6 space-y-6">
        {error && (
          <div className="bg-red-50 border border-red-400 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Appointment Date *
            </label>
            <input
              type="date"
              name="appointmentDate"
              required
              min={new Date().toISOString().split('T')[0]}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
              value={formData.appointmentDate}
              onChange={handleChange}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Time Slot *
            </label>
            <select
              name="timeSlot"
              required
              disabled={!formData.appointmentDate}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 disabled:bg-gray-100"
              value={formData.timeSlot}
              onChange={handleChange}
            >
              <option value="">Select a time slot</option>
              {availableSlots.map((slot) => (
                <option key={slot} value={slot}>
                  {slot}
                </option>
              ))}
            </select>
            {formData.appointmentDate && availableSlots.length === 0 && (
              <p className="text-sm text-red-600 mt-1">No slots available for this date</p>
            )}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Symptoms / Reason for Visit *
          </label>
          <textarea
            name="symptoms"
            required
            rows="4"
            placeholder="Describe your symptoms or reason for consultation..."
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
            value={formData.symptoms}
            onChange={handleChange}
          />
        </div>

        <div className="border-t pt-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Medical History (Optional)</h3>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Allergies</label>
              <input
                type="text"
                name="allergies"
                placeholder="Any known allergies..."
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
                value={formData.allergies}
                onChange={handleChange}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Current Medications
              </label>
              <input
                type="text"
                name="currentMedications"
                placeholder="List any medications you're currently taking..."
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
                value={formData.currentMedications}
                onChange={handleChange}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Previous Medical Conditions
              </label>
              <input
                type="text"
                name="previousConditions"
                placeholder="Any previous medical conditions..."
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
                value={formData.previousConditions}
                onChange={handleChange}
              />
            </div>
          </div>
        </div>

        <div className="flex gap-4">
          <button
            type="button"
            onClick={() => navigate('/patient/doctors')}
            className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-800 py-3 px-6 rounded-lg font-medium transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={submitting || !formData.appointmentDate || !formData.timeSlot}
            className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white py-3 px-6 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitting ? 'Booking...' : 'Book Appointment'}
          </button>
        </div>
      </form>
      
      <ToastContainer />
    </div>
  );
};

export default BookAppointment;
