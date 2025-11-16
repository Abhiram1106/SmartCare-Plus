import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import { useToast } from '../../hooks/useToast';
import ToastContainer from '../../components/ToastContainer';

const AdminDashboard = () => {
  const { showSuccess, showError } = useToast();
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalDoctors: 0,
    totalPatients: 0,
    pendingDoctors: 0,
    totalAppointments: 0,
    totalPayments: 0,
    totalRevenue: 0
  });
  const [pendingDoctors, setPendingDoctors] = useState([]);
  const [recentActivity, setRecentActivity] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const [statsResponse, usersResponse, appointmentsResponse] = await Promise.all([
        api.get('/admin/stats'),
        api.get('/admin/users?role=doctor&approved=false'),
        api.get('/admin/appointments')
      ]);

      const statsData = statsResponse.data || {};
      setStats({
        totalUsers: (statsData.totalPatients || 0) + (statsData.totalDoctors || 0) + 1, // +1 for admin
        totalDoctors: statsData.totalDoctors || 0,
        totalPatients: statsData.totalPatients || 0,
        pendingDoctors: statsData.pendingDoctors || 0,
        totalAppointments: statsData.totalAppointments || 0,
        totalPayments: statsData.totalPayments || 0,
        totalRevenue: statsData.totalRevenue || 0
      });
      
      setPendingDoctors((usersResponse.data || []).slice(0, 5));
      
      const appointments = ((appointmentsResponse.data || []).slice(0, 5)).map(apt => ({
        type: 'appointment',
        message: `${apt.patient?.name} booked with Dr. ${apt.doctor?.name}`,
        time: apt.createdAt || apt.appointmentDate
      }));
      
      setRecentActivity(appointments);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApproveDoctor = async (id) => {
    try {
      await api.put(`/admin/users/${id}/approve`);
      showSuccess('Doctor approved successfully');
      fetchDashboardData();
    } catch (error) {
      console.error('Error approving doctor:', error);
      showError('Failed to approve doctor');
    }
  };

  const handleRejectDoctor = async (id) => {
    try {
      await api.put(`/admin/users/${id}/reject`);
      showSuccess('Doctor rejected successfully');
      fetchDashboardData();
    } catch (error) {
      console.error('Error rejecting doctor:', error);
      showError('Failed to reject doctor');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800">Admin Dashboard</h1>
          <p className="text-gray-600 mt-2">System overview and management</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg shadow-md p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-100 text-sm">Total Users</p>
                <p className="text-4xl font-bold mt-2">{stats.totalUsers}</p>
              </div>
              <svg className="w-12 h-12 text-blue-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            </div>
          </div>

          <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-lg shadow-md p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-100 text-sm">Total Doctors</p>
                <p className="text-4xl font-bold mt-2">{stats.totalDoctors}</p>
              </div>
              <svg className="w-12 h-12 text-green-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
          </div>

          <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg shadow-md p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-100 text-sm">Total Appointments</p>
                <p className="text-4xl font-bold mt-2">{stats.totalAppointments}</p>
              </div>
              <svg className="w-12 h-12 text-purple-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
          </div>

          <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-lg shadow-md p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-orange-100 text-sm">Total Revenue</p>
                <p className="text-4xl font-bold mt-2">₹{stats.totalRevenue || 0}</p>
              </div>
              <svg className="w-12 h-12 text-orange-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
        </div>

        {/* Core Management Tools */}
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-800 mb-4 flex items-center">
            <svg className="w-6 h-6 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            System Management
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Link
              to="/admin/users"
              className="group bg-white rounded-xl shadow-md hover:shadow-xl transition-all duration-300 p-6 border-2 border-transparent hover:border-blue-500"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center group-hover:bg-blue-500 transition-colors">
                  <svg className="w-6 h-6 text-blue-600 group-hover:text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                </div>
                <span className="px-2 py-1 bg-blue-100 text-blue-600 text-xs font-bold rounded-full">{stats.totalUsers}</span>
              </div>
              <h3 className="text-lg font-bold text-gray-800 mb-1 group-hover:text-blue-600">Manage Users</h3>
              <p className="text-sm text-gray-600">All system users</p>
            </Link>

            <Link
              to="/admin/appointments"
              className="group bg-white rounded-xl shadow-md hover:shadow-xl transition-all duration-300 p-6 border-2 border-transparent hover:border-purple-500"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center group-hover:bg-purple-500 transition-colors">
                  <svg className="w-6 h-6 text-purple-600 group-hover:text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <span className="px-2 py-1 bg-purple-100 text-purple-600 text-xs font-bold rounded-full">{stats.totalAppointments}</span>
              </div>
              <h3 className="text-lg font-bold text-gray-800 mb-1 group-hover:text-purple-600">Appointments</h3>
              <p className="text-sm text-gray-600">Schedule overview</p>
            </Link>

            <Link
              to="/admin/intents"
              className="group bg-white rounded-xl shadow-md hover:shadow-xl transition-all duration-300 p-6 border-2 border-transparent hover:border-green-500"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center group-hover:bg-green-500 transition-colors">
                  <svg className="w-6 h-6 text-green-600 group-hover:text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                  </svg>
                </div>
              </div>
              <h3 className="text-lg font-bold text-gray-800 mb-1 group-hover:text-green-600">Manage Intents</h3>
              <p className="text-sm text-gray-600">Chatbot training data</p>
            </Link>

            <Link
              to="/admin/analytics"
              className="group bg-white rounded-xl shadow-md hover:shadow-xl transition-all duration-300 p-6 border-2 border-transparent hover:border-indigo-500"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center group-hover:bg-indigo-500 transition-colors">
                  <svg className="w-6 h-6 text-indigo-600 group-hover:text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
              </div>
              <h3 className="text-lg font-bold text-gray-800 mb-1 group-hover:text-indigo-600">Analytics</h3>
              <p className="text-sm text-gray-600">Advanced insights</p>
            </Link>
          </div>
        </div>

        {/* Advanced Features */}
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-800 mb-4 flex items-center">
            <svg className="w-6 h-6 mr-2 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            Advanced Features
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Link
              to="/admin/predictive-analytics"
              className="bg-gradient-to-br from-teal-50 to-cyan-50 rounded-xl shadow-md hover:shadow-2xl transition-all duration-300 p-8 border-2 border-teal-100 hover:border-teal-300 group"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center shadow-md group-hover:scale-110 transition-transform">
                  <span className="text-4xl">📊</span>
                </div>
                <span className="px-3 py-1 bg-teal-500 text-white text-xs font-bold rounded-full shadow">ML</span>
              </div>
              <h3 className="text-xl font-bold text-gray-800 mb-2">Predictive Analytics</h3>
              <p className="text-gray-600 text-sm mb-4">Machine learning powered insights and predictions</p>
              <div className="flex items-center text-teal-600 font-semibold group-hover:translate-x-2 transition-transform">
                <span>View Analytics</span>
                <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </div>
            </Link>

            <Link
              to="/admin/security-audit"
              className="bg-gradient-to-br from-orange-50 to-red-50 rounded-xl shadow-md hover:shadow-2xl transition-all duration-300 p-8 border-2 border-orange-100 hover:border-orange-300 group"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center shadow-md group-hover:scale-110 transition-transform">
                  <span className="text-4xl">🔐</span>
                </div>
                <span className="px-3 py-1 bg-orange-500 text-white text-xs font-bold rounded-full shadow">RBAC</span>
              </div>
              <h3 className="text-xl font-bold text-gray-800 mb-2">Security Audit</h3>
              <p className="text-gray-600 text-sm mb-4">Role-based access control and audit logs</p>
              <div className="flex items-center text-orange-600 font-semibold group-hover:translate-x-2 transition-transform">
                <span>View Logs</span>
                <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </div>
            </Link>

            <button
              className="bg-gradient-to-br from-pink-50 to-purple-50 rounded-xl shadow-md hover:shadow-2xl transition-all duration-300 p-8 border-2 border-pink-100 hover:border-pink-300 group text-left"
              onClick={async () => {
                try {
                  const response = await api.get('/payments');
                  const payments = response.data || [];
                  const paymentHistory = payments.map(p => ({
                    id: p._id,
                    patient: p.patient?.name || 'N/A',
                    doctor: p.doctor?.name || 'N/A',
                    amount: p.amount || 0,
                    status: p.status,
                    date: new Date(p.createdAt).toLocaleDateString(),
                    method: p.paymentMethod || 'Card'
                  }));
                  
                  // Create modal to show payment history
                  const modal = document.createElement('div');
                  modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4';
                  modal.innerHTML = `
                    <div class="bg-white rounded-lg shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-y-auto">
                      <div class="sticky top-0 bg-white border-b border-gray-200 p-6 flex justify-between items-center">
                        <div>
                          <h2 class="text-2xl font-bold text-gray-800">Payment History & Revenue</h2>
                          <p class="text-gray-600 mt-1">Total Revenue: ₹${stats.totalRevenue || 0} | Total Payments: ${stats.totalPayments || 0}</p>
                        </div>
                        <button onclick="this.closest('.fixed').remove()" class="text-gray-400 hover:text-gray-600">
                          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                          </svg>
                        </button>
                      </div>
                      <div class="p-6">
                        <div class="overflow-x-auto">
                          <table class="min-w-full divide-y divide-gray-200">
                            <thead class="bg-gray-50">
                              <tr>
                                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Patient</th>
                                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Doctor</th>
                                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Method</th>
                                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                              </tr>
                            </thead>
                            <tbody class="bg-white divide-y divide-gray-200">
                              ${paymentHistory.map(payment => `
                                <tr>
                                  <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${payment.date}</td>
                                  <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${payment.patient}</td>
                                  <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${payment.doctor}</td>
                                  <td class="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">₹${payment.amount}</td>
                                  <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-600">${payment.method}</td>
                                  <td class="px-6 py-4 whitespace-nowrap">
                                    <span class="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                      payment.status === 'completed' ? 'bg-green-100 text-green-800' : 
                                      payment.status === 'pending' ? 'bg-yellow-100 text-yellow-800' : 
                                      'bg-red-100 text-red-800'
                                    }">
                                      ${payment.status}
                                    </span>
                                  </td>
                                </tr>
                              `).join('')}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </div>
                  `;
                  document.body.appendChild(modal);
                } catch (error) {
                  console.error('Error fetching payments:', error);
                  showError('Failed to fetch payment history');
                }
              }}
            >
              <div className="flex items-center justify-between mb-4">
                <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center shadow-md group-hover:scale-110 transition-transform">
                  <span className="text-4xl">💰</span>
                </div>
                <span className="px-3 py-1 bg-pink-500 text-white text-xs font-bold rounded-full shadow">₹{stats.totalRevenue || 0}</span>
              </div>
              <h3 className="text-xl font-bold text-gray-800 mb-2">Revenue Management</h3>
              <p className="text-gray-600 text-sm mb-4">Payment history and financial overview</p>
              <div className="flex items-center text-pink-600 font-semibold group-hover:translate-x-2 transition-transform">
                <span>View Payments</span>
                <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </div>
            </button>
          </div>
        </div>

        {pendingDoctors.length > 0 && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-8">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-800">Pending Doctor Approvals</h2>
              <span className="px-3 py-1 bg-orange-100 text-orange-800 rounded-full text-sm font-medium">
                {stats.pendingDoctors} Pending
              </span>
            </div>

            <div className="space-y-4">
              {pendingDoctors.map((doctor) => (
                <div key={doctor._id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-800">Dr. {doctor.name}</h3>
                      <div className="grid grid-cols-2 gap-2 mt-2 text-sm text-gray-600">
                        <div>
                          <span className="font-medium">Specialization:</span> {doctor.specialization}
                        </div>
                        <div>
                          <span className="font-medium">Experience:</span> {doctor.experience} years
                        </div>
                        <div>
                          <span className="font-medium">Email:</span> {doctor.email}
                        </div>
                        <div>
                          <span className="font-medium">Phone:</span> {doctor.phone}
                        </div>
                      </div>
                      {doctor.education && (
                        <div className="mt-2 text-sm text-gray-600">
                          <span className="font-medium">Education:</span> {doctor.education}
                        </div>
                      )}
                    </div>

                    <div className="flex gap-2 ml-4">
                      <button
                        onClick={() => handleApproveDoctor(doctor._id)}
                        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                      >
                        Approve
                      </button>
                      <button
                        onClick={() => handleRejectDoctor(doctor._id)}
                        className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                      >
                        Reject
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {stats.pendingDoctors > 5 && (
              <div className="mt-4 text-center">
                <Link
                  to="/admin/users?role=doctor&status=pending"
                  className="text-blue-600 hover:text-blue-800 font-medium"
                >
                  View All Pending Doctors →
                </Link>
              </div>
            )}
          </div>
        )}

        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-2xl font-bold text-gray-800 mb-6">Recent Activity</h2>
          
          {recentActivity.length === 0 ? (
            <p className="text-center text-gray-500 py-8">No recent activity</p>
          ) : (
            <div className="space-y-4">
              {recentActivity.map((activity, index) => (
                <div key={index} className="flex items-start gap-4 border-b border-gray-200 pb-4 last:border-0">
                  <div className="flex-shrink-0 w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                    <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <p className="text-gray-800">{activity.message}</p>
                    <p className="text-sm text-gray-500 mt-1">
                      {new Date(activity.time).toLocaleString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        
        <ToastContainer />
      </div>
    </div>
  );
};

export default AdminDashboard;
