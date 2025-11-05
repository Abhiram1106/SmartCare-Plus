import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import ChangePasswordForm from '../../components/ChangePasswordForm';

const PatientProfile = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [stats, setStats] = useState({
    totalAppointments: 0,
    upcomingAppointments: 0,
    completedAppointments: 0,
    totalPayments: 0,
    totalSpent: 0
  });
  const [medicalHistory, setMedicalHistory] = useState({
    bloodGroup: '',
    allergies: [],
    chronicConditions: [],
    currentMedications: []
  });
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    gender: '',
    age: '',
    address: '',
    emergencyContact: '',
    emergencyContactName: ''
  });
  const [showPasskeyModal, setShowPasskeyModal] = useState(false);
  const [passkeyStep, setPasskeyStep] = useState(1); // 1: verify password, 2: show/change passkey
  const [passwordInput, setPasswordInput] = useState('');
  const [newPasskey, setNewPasskey] = useState('');
  const [currentPasskey, setCurrentPasskey] = useState('');
  const [passkeyError, setPasskeyError] = useState('');
  const [passkeySuccess, setPasskeySuccess] = useState('');

  useEffect(() => {
    fetchProfile();
    fetchStats();
  }, []);

  const fetchProfile = async () => {
    try {
      const response = await api.get(`/admin/users/${user.id}`);
      const userData = response.data.user;
      setProfile(userData);
      setFormData({
        name: userData.name || '',
        email: userData.email || '',
        phone: userData.phone || '',
        gender: userData.gender || '',
        age: userData.age || '',
        address: userData.address || '',
        emergencyContact: userData.emergencyContact || '',
        emergencyContactName: userData.emergencyContactName || ''
      });
    } catch (error) {
      console.error('Error fetching profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const [appointmentsRes, paymentsRes] = await Promise.all([
        api.get('/appointments'),
        api.get('/payments')
      ]);

      const appointments = appointmentsRes.data || [];
      const payments = paymentsRes.data || [];

      const now = new Date();
      const upcoming = appointments.filter(
        (apt) => new Date(apt.appointmentDate) > now && apt.status !== 'cancelled'
      );
      const completed = appointments.filter((apt) => apt.status === 'completed');
      const completedPayments = payments.filter(p => p.status === 'completed');
      const totalSpent = completedPayments.reduce((sum, p) => sum + (p.amount || 0), 0);

      setStats({
        totalAppointments: appointments.length,
        upcomingAppointments: upcoming.length,
        completedAppointments: completed.length,
        totalPayments: completedPayments.length,
        totalSpent: totalSpent
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.put(`/admin/users/${user.id}`, formData);
      alert('Profile updated successfully!');
      setIsEditing(false);
      fetchProfile();
    } catch (error) {
      console.error('Error updating profile:', error);
      alert('Failed to update profile');
    }
  };

  const handleOpenPasskeyModal = () => {
    setShowPasskeyModal(true);
    setPasskeyStep(1);
    setPasswordInput('');
    setNewPasskey('');
    setCurrentPasskey('');
    setPasskeyError('');
    setPasskeySuccess('');
  };

  const handleClosePasskeyModal = () => {
    setShowPasskeyModal(false);
    setPasskeyStep(1);
    setPasswordInput('');
    setNewPasskey('');
    setCurrentPasskey('');
    setPasskeyError('');
    setPasskeySuccess('');
  };

  const handleVerifyPassword = async () => {
    try {
      setPasskeyError('');
      const response = await api.post('/auth/verify-password', { password: passwordInput });
      if (response.data.verified) {
        // Fetch current passkey
        const passkeyResponse = await api.post('/auth/payment-passkey', { password: passwordInput });
        setCurrentPasskey(passkeyResponse.data.passkey);
        setPasskeyStep(2);
      }
    } catch (error) {
      setPasskeyError(error.response?.data?.message || 'Invalid password');
    }
  };

  const handleUpdatePasskey = async () => {
    try {
      setPasskeyError('');
      setPasskeySuccess('');

      // Validate passkey format
      if (!/^\d{4}$/.test(newPasskey)) {
        setPasskeyError('Passkey must be exactly 4 digits');
        return;
      }

      const response = await api.post('/auth/update-payment-passkey', {
        password: passwordInput,
        newPasskey: newPasskey
      });

      setPasskeySuccess('Payment passkey updated successfully!');
      setCurrentPasskey(newPasskey);
      setNewPasskey('');
      
      setTimeout(() => {
        handleClosePasskeyModal();
      }, 2000);
    } catch (error) {
      setPasskeyError(error.response?.data?.message || 'Failed to update passkey');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800">My Profile</h1>
          <p className="text-gray-600 mt-2">Manage your personal information and health records</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Profile Card */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-800">Personal Information</h2>
                {!isEditing && (
                  <button
                    onClick={() => setIsEditing(true)}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Edit Profile
                  </button>
                )}
              </div>

              {/* Profile Avatar */}
              <div className="flex items-center mb-8">
                <div className="w-24 h-24 bg-gradient-to-br from-purple-500 to-pink-600 rounded-full flex items-center justify-center text-white">
                  <svg className="w-14 h-14" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-6">
                  <h3 className="text-2xl font-bold text-gray-800">{profile?.name}</h3>
                  <p className="text-gray-600">{profile?.email}</p>
                  <span className="inline-block mt-2 px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-sm font-semibold">
                    Patient
                  </span>
                </div>
              </div>

              {isEditing ? (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Full Name</label>
                      <input
                        type="text"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                      <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Phone</label>
                      <input
                        type="tel"
                        name="phone"
                        value={formData.phone}
                        onChange={handleChange}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Gender</label>
                      <select
                        name="gender"
                        value={formData.gender}
                        onChange={handleChange}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      >
                        <option value="">Select Gender</option>
                        <option value="male">Male</option>
                        <option value="female">Female</option>
                        <option value="other">Other</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Age</label>
                      <input
                        type="number"
                        name="age"
                        value={formData.age}
                        onChange={handleChange}
                        min="1"
                        max="120"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Emergency Contact Name</label>
                      <input
                        type="text"
                        name="emergencyContactName"
                        value={formData.emergencyContactName}
                        onChange={handleChange}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        placeholder="e.g., Spouse, Parent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Emergency Contact Number</label>
                      <input
                        type="tel"
                        name="emergencyContact"
                        value={formData.emergencyContact}
                        onChange={handleChange}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      />
                    </div>
                    <div className="col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-2">Address</label>
                      <textarea
                        name="address"
                        value={formData.address}
                        onChange={handleChange}
                        rows="3"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      ></textarea>
                    </div>
                  </div>

                  <div className="flex gap-3 pt-4">
                    <button
                      type="submit"
                      className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                    >
                      Save Changes
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setIsEditing(false);
                        fetchProfile();
                      }}
                      className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              ) : (
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <p className="text-sm text-gray-600">Phone Number</p>
                    <p className="font-semibold text-gray-800 mt-1">{profile?.phone || 'Not provided'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Gender</p>
                    <p className="font-semibold text-gray-800 mt-1 capitalize">{profile?.gender || 'Not specified'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Age</p>
                    <p className="font-semibold text-gray-800 mt-1">{profile?.age || 'Not specified'} years</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Blood Group</p>
                    <p className="font-semibold text-gray-800 mt-1">{medicalHistory.bloodGroup || 'Not specified'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Emergency Contact</p>
                    <p className="font-semibold text-gray-800 mt-1">{profile?.emergencyContactName || 'Not provided'}</p>
                    <p className="text-sm text-gray-600 mt-1">{profile?.emergencyContact || ''}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Member Since</p>
                    <p className="font-semibold text-gray-800 mt-1">
                      {profile?.createdAt ? new Date(profile.createdAt).toLocaleDateString('en-US', { 
                        year: 'numeric', 
                        month: 'long', 
                        day: 'numeric' 
                      }) : 'N/A'}
                    </p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-sm text-gray-600">Address</p>
                    <p className="font-semibold text-gray-800 mt-1">{profile?.address || 'Not provided'}</p>
                  </div>
                </div>
              )}
            </div>

            {/* Payment Security Section */}
            <div className="bg-white rounded-lg shadow-md p-6 mt-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-gray-800 flex items-center">
                    <svg className="w-7 h-7 text-purple-600 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                    Payment Security
                  </h2>
                  <p className="text-gray-600 mt-2 ml-10">Manage your payment passkey for secure transactions</p>
                </div>
              </div>

              <div className="bg-gradient-to-br from-purple-50 to-pink-50 p-6 rounded-lg border border-purple-200">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center mb-3">
                      <svg className="w-6 h-6 text-purple-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                      </svg>
                      <h3 className="text-lg font-bold text-gray-800">Your Payment Passkey</h3>
                    </div>
                    <p className="text-gray-700 mb-4">
                      Your payment passkey is a 4-digit PIN used to authorize payment transactions. Keep it secure and don't share it with anyone.
                    </p>
                    <div className="bg-white p-4 rounded-lg border border-purple-300 mb-4">
                      <p className="text-sm text-gray-600 mb-2">Current Passkey:</p>
                      <p className="text-3xl font-bold text-purple-600 tracking-wider">••••</p>
                      <p className="text-xs text-gray-500 mt-2">Click "View & Change Passkey" to see or update your passkey</p>
                    </div>
                  </div>
                </div>

                <button
                  onClick={handleOpenPasskeyModal}
                  className="w-full px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold rounded-lg hover:from-purple-700 hover:to-pink-700 transition-all shadow-md hover:shadow-lg flex items-center justify-center"
                >
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                  View & Change Passkey
                </button>
              </div>
            </div>

            {/* Change Password Section */}
            <div className="bg-white rounded-lg shadow-md p-6 mt-6">
              <div className="flex items-center mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-gray-800 flex items-center">
                    <svg className="w-7 h-7 text-blue-600 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                    </svg>
                    Change Password
                  </h2>
                  <p className="text-gray-600 mt-2 ml-10">Update your account password for security</p>
                </div>
              </div>

              <ChangePasswordForm />
            </div>

            {/* Health Summary */}
            <div className="bg-white rounded-lg shadow-md p-6 mt-6">
              <h2 className="text-2xl font-bold text-gray-800 mb-6">Health Summary</h2>
              <div className="grid grid-cols-2 gap-6">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <div className="flex items-center mb-2">
                    <svg className="w-5 h-5 text-blue-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                    </svg>
                    <span className="text-sm text-gray-600">Total Consultations</span>
                  </div>
                  <p className="text-3xl font-bold text-blue-600">{stats.completedAppointments}</p>
                </div>
                <div className="bg-green-50 p-4 rounded-lg">
                  <div className="flex items-center mb-2">
                    <svg className="w-5 h-5 text-green-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span className="text-sm text-gray-600">Upcoming Visits</span>
                  </div>
                  <p className="text-3xl font-bold text-green-600">{stats.upcomingAppointments}</p>
                </div>
                <div className="bg-purple-50 p-4 rounded-lg">
                  <div className="flex items-center mb-2">
                    <svg className="w-5 h-5 text-purple-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                    </svg>
                    <span className="text-sm text-gray-600">Total Payments</span>
                  </div>
                  <p className="text-3xl font-bold text-purple-600">{stats.totalPayments}</p>
                </div>
                <div className="bg-orange-50 p-4 rounded-lg">
                  <div className="flex items-center mb-2">
                    <svg className="w-5 h-5 text-orange-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span className="text-sm text-gray-600">Total Spent</span>
                  </div>
                  <p className="text-3xl font-bold text-orange-600">₹{stats.totalSpent}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Statistics Sidebar */}
          <div className="space-y-6">
            {/* Quick Stats */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-xl font-bold text-gray-800 mb-4">Appointment Stats</h3>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Total</span>
                  <span className="text-2xl font-bold text-blue-600">{stats.totalAppointments}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Upcoming</span>
                  <span className="text-2xl font-bold text-green-600">{stats.upcomingAppointments}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Completed</span>
                  <span className="text-2xl font-bold text-purple-600">{stats.completedAppointments}</span>
                </div>
              </div>
            </div>

            {/* Health Reminders */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-xl font-bold text-gray-800 mb-4">Health Reminders</h3>
              <div className="space-y-3">
                <div className="flex items-start p-3 bg-blue-50 rounded-lg">
                  <svg className="w-5 h-5 text-blue-600 mt-0.5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <div>
                    <p className="text-sm font-semibold text-gray-800">Annual Checkup</p>
                    <p className="text-xs text-gray-600">Schedule your yearly health screening</p>
                  </div>
                </div>
                <div className="flex items-start p-3 bg-green-50 rounded-lg">
                  <svg className="w-5 h-5 text-green-600 mt-0.5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <div>
                    <p className="text-sm font-semibold text-gray-800">Medication Refill</p>
                    <p className="text-xs text-gray-600">Renew your prescriptions on time</p>
                  </div>
                </div>
                <div className="flex items-start p-3 bg-purple-50 rounded-lg">
                  <svg className="w-5 h-5 text-purple-600 mt-0.5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <div>
                    <p className="text-sm font-semibold text-gray-800">Follow-up Visit</p>
                    <p className="text-xs text-gray-600">Check your appointment schedule</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-gradient-to-br from-purple-500 to-pink-600 rounded-lg shadow-md p-6 text-white">
              <h3 className="text-xl font-bold mb-4">Quick Actions</h3>
              <div className="space-y-3">
                <button 
                  onClick={() => navigate('/patient/doctors')}
                  className="w-full py-2 bg-white bg-opacity-20 hover:bg-opacity-30 rounded-lg transition-all font-medium"
                >
                  Book Appointment
                </button>
                <button 
                  onClick={() => navigate('/patient/appointments')}
                  className="w-full py-2 bg-white bg-opacity-20 hover:bg-opacity-30 rounded-lg transition-all font-medium"
                >
                  View Medical Records
                </button>
                <button 
                  onClick={() => navigate('/patient/payments')}
                  className="w-full py-2 bg-white bg-opacity-20 hover:bg-opacity-30 rounded-lg transition-all font-medium"
                >
                  Payment History
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Payment Passkey Modal */}
        {showPasskeyModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-2xl max-w-md w-full p-6 relative">
              {/* Close Button */}
              <button
                onClick={handleClosePasskeyModal}
                className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>

              {passkeyStep === 1 ? (
                // Step 1: Password Verification
                <div>
                  <div className="flex items-center mb-4">
                    <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mr-4">
                      <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                      </svg>
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold text-gray-800">Verify Your Password</h2>
                      <p className="text-gray-600 text-sm">Enter your account password to continue</p>
                    </div>
                  </div>

                  {passkeyError && (
                    <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start">
                      <svg className="w-5 h-5 text-red-600 mr-2 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <p className="text-red-700 text-sm">{passkeyError}</p>
                    </div>
                  )}

                  <div className="mb-6">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Account Password</label>
                    <input
                      type="password"
                      value={passwordInput}
                      onChange={(e) => setPasswordInput(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && handleVerifyPassword()}
                      placeholder="Enter your password"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    />
                  </div>

                  <div className="flex gap-3">
                    <button
                      onClick={handleVerifyPassword}
                      disabled={!passwordInput}
                      className="flex-1 px-6 py-3 bg-purple-600 text-white font-semibold rounded-lg hover:bg-purple-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
                    >
                      Verify Password
                    </button>
                    <button
                      onClick={handleClosePasskeyModal}
                      className="px-6 py-3 bg-gray-200 text-gray-700 font-semibold rounded-lg hover:bg-gray-300 transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                // Step 2: View/Change Passkey
                <div>
                  <div className="flex items-center mb-4">
                    <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mr-4">
                      <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                      </svg>
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold text-gray-800">Your Payment Passkey</h2>
                      <p className="text-gray-600 text-sm">View or update your 4-digit payment PIN</p>
                    </div>
                  </div>

                  {passkeySuccess && (
                    <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg flex items-start">
                      <svg className="w-5 h-5 text-green-600 mr-2 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <p className="text-green-700 text-sm">{passkeySuccess}</p>
                    </div>
                  )}

                  {passkeyError && (
                    <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start">
                      <svg className="w-5 h-5 text-red-600 mr-2 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <p className="text-red-700 text-sm">{passkeyError}</p>
                    </div>
                  )}

                  {/* Current Passkey Display */}
                  <div className="mb-6 p-4 bg-gradient-to-br from-purple-50 to-pink-50 rounded-lg border border-purple-200">
                    <p className="text-sm text-gray-600 mb-2">Current Passkey:</p>
                    <p className="text-4xl font-bold text-purple-600 tracking-widest text-center py-2">
                      {currentPasskey}
                    </p>
                    <p className="text-xs text-center text-gray-500 mt-2">
                      Use this 4-digit PIN when making payments
                    </p>
                  </div>

                  {/* Change Passkey Form */}
                  <div className="mb-6">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Enter New Passkey (4 digits)
                    </label>
                    <input
                      type="text"
                      value={newPasskey}
                      onChange={(e) => {
                        const value = e.target.value.replace(/\D/g, '').slice(0, 4);
                        setNewPasskey(value);
                      }}
                      onKeyPress={(e) => e.key === 'Enter' && newPasskey.length === 4 && handleUpdatePasskey()}
                      placeholder="Enter 4 digits"
                      maxLength={4}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-center text-2xl tracking-widest font-bold"
                    />
                    <p className="text-xs text-gray-500 mt-2 text-center">
                      Must be exactly 4 digits (0-9 only)
                    </p>
                  </div>

                  <div className="flex gap-3">
                    <button
                      onClick={handleUpdatePasskey}
                      disabled={newPasskey.length !== 4}
                      className="flex-1 px-6 py-3 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
                    >
                      Update Passkey
                    </button>
                    <button
                      onClick={handleClosePasskeyModal}
                      className="px-6 py-3 bg-gray-200 text-gray-700 font-semibold rounded-lg hover:bg-gray-300 transition-colors"
                    >
                      Close
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PatientProfile;
