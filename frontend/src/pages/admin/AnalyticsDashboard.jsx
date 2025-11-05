import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import RevenueChart from '../../components/analytics/RevenueChart';
import AppointmentTrendsChart from '../../components/analytics/AppointmentTrendsChart';
import PeakHoursHeatmap from '../../components/analytics/PeakHoursHeatmap';
import DoctorLeaderboard from '../../components/analytics/DoctorLeaderboard';
import PaymentAnalytics from '../../components/analytics/PaymentAnalytics';
import ComparisonChart from '../../components/analytics/ComparisonChart';

const AnalyticsDashboard = () => {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  
  // State management
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [period, setPeriod] = useState('monthly');
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(new Date());
  const [dateRange, setDateRange] = useState({
    startDate: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // Last 1 year to capture all data
    endDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0] // Tomorrow to include today's data
  });

  // Data states
  const [revenueData, setRevenueData] = useState({ data: [], totalRevenue: 0 });
  const [appointmentData, setAppointmentData] = useState({ trends: [], statusBreakdown: [] });
  const [peakHoursData, setPeakHoursData] = useState({ heatmapData: [], dayNames: [] });
  const [doctorPerformance, setDoctorPerformance] = useState({ leaderboard: [], aggregateStats: {} });
  const [paymentData, setPaymentData] = useState({
    statusBreakdown: [],
    methodBreakdown: [],
    dailyTrend: [],
    successRate: 0
  });
  const [comparisonData, setComparisonData] = useState({ monthly: null, quarterly: null });

  // Fetch all analytics data
  const fetchAllAnalytics = useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      setError(null);
      
      const { startDate, endDate } = dateRange;
      const requests = [
        api.get(`/analytics/appointments?period=${period}&startDate=${startDate}&endDate=${endDate}`),
        api.get(`/analytics/peak-hours`)
      ];

      if (isAdmin) {
        requests.push(
          api.get(`/analytics/revenue?period=${period}&startDate=${startDate}&endDate=${endDate}`),
          api.get(`/analytics/doctor-performance?startDate=${startDate}&endDate=${endDate}&limit=10`),
          api.get(`/analytics/payment-success-rate?startDate=${startDate}&endDate=${endDate}`),
          api.get(`/analytics/comparison`)
        );
      }

      const responses = await Promise.all(requests);
      
      setAppointmentData(responses[0].data);
      setPeakHoursData(responses[1].data);

      if (isAdmin) {
        console.log('Revenue API Response:', responses[2].data);
        setRevenueData(responses[2].data);
        setDoctorPerformance(responses[3].data);
        setPaymentData(responses[4].data);
        setComparisonData(responses[5].data);
      }

      setLastUpdated(new Date());
    } catch (error) {
      console.error('Error fetching analytics:', error);
      setError(error.response?.data?.message || 'Failed to load analytics. Please try again.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [period, dateRange, isAdmin]);

  // Initial load
  useEffect(() => {
    fetchAllAnalytics();
  }, [fetchAllAnalytics]);

  // Auto-refresh functionality
  useEffect(() => {
    let interval;
    if (autoRefresh) {
      interval = setInterval(() => {
        fetchAllAnalytics(true);
      }, 30000); // Refresh every 30 seconds
    }
    return () => clearInterval(interval);
  }, [autoRefresh, fetchAllAnalytics]);

  // Quick filter presets
  const quickFilters = [
    { label: 'Last 7 Days', days: 7 },
    { label: 'Last 30 Days', days: 30 },
    { label: 'Last 90 Days', days: 90 },
    { label: 'This Year', days: 365 }
  ];

  const applyQuickFilter = (days) => {
    const endDate = new Date();
    const startDate = new Date(endDate.getTime() - days * 24 * 60 * 60 * 1000);
    setDateRange({
      startDate: startDate.toISOString().split('T')[0],
      endDate: endDate.toISOString().split('T')[0]
    });
  };

  // Tab configuration
  const tabs = [
    { id: 'overview', label: 'Overview', icon: '📊' },
    ...(isAdmin ? [{ id: 'revenue', label: 'Revenue', icon: '💰' }] : []),
    { id: 'appointments', label: 'Appointments', icon: '📅' },
    { id: 'peak-hours', label: 'Peak Hours', icon: '🕐' },
    ...(isAdmin ? [
      { id: 'performance', label: 'Doctors', icon: '🏆' },
      { id: 'payments', label: 'Payments', icon: '💳' },
      { id: 'comparison', label: 'Trends', icon: '📈' }
    ] : [])
  ];

  // Calculate summary statistics
  const totalAppointments = appointmentData.trends?.reduce((sum, t) => sum + (t.total || 0), 0) || 0;
  const completedAppointments = appointmentData.trends?.reduce((sum, t) => sum + (t.completed || 0), 0) || 0;
  const cancelledAppointments = appointmentData.trends?.reduce((sum, t) => sum + (t.cancelled || 0), 0) || 0;
  const completionRate = totalAppointments > 0 ? ((completedAppointments / totalAppointments) * 100).toFixed(1) : 0;

  // Loading screen
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="relative">
            <div className="animate-spin rounded-full h-20 w-20 border-b-4 border-t-4 border-blue-600 mx-auto"></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <svg className="w-8 h-8 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" />
                <path fillRule="evenodd" d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm9.707 5.707a1 1 0 00-1.414-1.414L9 12.586l-1.293-1.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            </div>
          </div>
          <p className="mt-6 text-xl font-semibold text-gray-700">Loading Analytics Dashboard...</p>
          <p className="mt-2 text-sm text-gray-500">Fetching real-time data from database</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 py-6 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <div className="flex items-center gap-3">
                <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-3 rounded-xl shadow-lg">
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
                <div>
                  <h1 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                    Analytics Dashboard
                  </h1>
                  <p className="text-gray-600 mt-1 text-sm sm:text-base">Real-time insights from your database</p>
                </div>
              </div>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="flex items-center gap-2 px-4 py-2 bg-white rounded-lg shadow-sm border border-gray-200">
                <div className={`w-2 h-2 rounded-full ${refreshing ? 'bg-orange-500 animate-pulse' : 'bg-green-500'}`}></div>
                <span className="text-xs sm:text-sm text-gray-600">
                  {refreshing ? 'Updating...' : `Updated ${lastUpdated.toLocaleTimeString()}`}
                </span>
              </div>
              
              <button
                onClick={() => setAutoRefresh(!autoRefresh)}
                className={`px-4 py-2 rounded-lg font-medium text-sm transition-all shadow-sm ${
                  autoRefresh
                    ? 'bg-green-600 text-white hover:bg-green-700'
                    : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200'
                }`}
              >
                {autoRefresh ? '🔄 Live' : '⏸️ Paused'}
              </button>
            </div>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 bg-red-50 border-l-4 border-red-500 p-4 rounded-lg shadow-sm">
            <div className="flex items-center">
              <svg className="w-5 h-5 text-red-500 mr-3" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              <p className="text-red-800 text-sm font-medium">{error}</p>
            </div>
          </div>
        )}

        {/* Quick Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-8">
          {isAdmin && (
            <div className="group bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 p-6 text-white transform hover:-translate-y-1">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="text-green-100 text-sm font-medium mb-1">Total Revenue</p>
                  <p className="text-4xl font-bold tracking-tight">₹{(revenueData.totalRevenue || 0).toLocaleString()}</p>
                  <p className="text-green-100 text-xs mt-2">
                    {(() => {
                      // Calculate total transactions from aggregated data
                      const totalTxn = revenueData.data?.reduce((sum, item) => sum + (item.totalTransactions || 0), 0) || 0;
                      return `${totalTxn.toLocaleString()} transactions`;
                    })()}
                  </p>
                </div>
                <div className="bg-white bg-opacity-20 p-4 rounded-xl">
                  <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
            </div>
          )}
          
          <div className="group bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 p-6 text-white transform hover:-translate-y-1">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="text-blue-100 text-sm font-medium mb-1">Total Appointments</p>
                <p className="text-4xl font-bold tracking-tight">{totalAppointments}</p>
                <p className="text-blue-100 text-xs mt-2">{completionRate}% completion rate</p>
              </div>
              <div className="bg-white bg-opacity-20 p-4 rounded-xl">
                <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
            </div>
          </div>
          
          <div className="group bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 p-6 text-white transform hover:-translate-y-1">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="text-purple-100 text-sm font-medium mb-1">Completed</p>
                <p className="text-4xl font-bold tracking-tight">{completedAppointments}</p>
                <p className="text-purple-100 text-xs mt-2">{cancelledAppointments} cancelled</p>
              </div>
              <div className="bg-white bg-opacity-20 p-4 rounded-xl">
                <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </div>
          
          {isAdmin && paymentData.successRate ? (
            <div className="group bg-gradient-to-br from-orange-500 to-orange-600 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 p-6 text-white transform hover:-translate-y-1">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="text-orange-100 text-sm font-medium mb-1">Payment Success</p>
                  <p className="text-4xl font-bold tracking-tight">{paymentData.successRate}%</p>
                  <p className="text-orange-100 text-xs mt-2">{paymentData.completedPayments || 0} completed</p>
                </div>
                <div className="bg-white bg-opacity-20 p-4 rounded-xl">
                  <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                  </svg>
                </div>
              </div>
            </div>
          ) : (
            <div className="group bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 p-6 text-white transform hover:-translate-y-1">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="text-indigo-100 text-sm font-medium mb-1">Active Doctors</p>
                  <p className="text-4xl font-bold tracking-tight">{doctorPerformance.aggregateStats?.totalDoctors || 0}</p>
                  <p className="text-indigo-100 text-xs mt-2">Serving patients</p>
                </div>
                <div className="bg-white bg-opacity-20 p-4 rounded-xl">
                  <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Filters Card */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-8 border border-gray-100">
          <div className="flex flex-col lg:flex-row gap-6">
            <div className="flex-1 grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Period</label>
                <select
                  value={period}
                  onChange={(e) => setPeriod(e.target.value)}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                >
                  <option value="daily">📅 Daily</option>
                  <option value="weekly">📊 Weekly</option>
                  <option value="monthly">📈 Monthly</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Start Date</label>
                <input
                  type="date"
                  value={dateRange.startDate}
                  onChange={(e) => setDateRange({ ...dateRange, startDate: e.target.value })}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">End Date</label>
                <input
                  type="date"
                  value={dateRange.endDate}
                  onChange={(e) => setDateRange({ ...dateRange, endDate: e.target.value })}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                />
              </div>
            </div>

            <div className="lg:border-l lg:pl-6 border-gray-200">
              <label className="block text-sm font-semibold text-gray-700 mb-2">Quick Filters</label>
              <div className="grid grid-cols-2 sm:flex gap-2">
                {quickFilters.map((filter) => (
                  <button
                    key={filter.days}
                    onClick={() => applyQuickFilter(filter.days)}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-50 hover:bg-blue-50 hover:text-blue-700 rounded-lg transition-all border border-gray-200 hover:border-blue-300"
                  >
                    {filter.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="mt-4 flex gap-3">
            <button
              onClick={() => fetchAllAnalytics(true)}
              disabled={refreshing}
              className="px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all font-medium shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {refreshing ? (
                <>
                  <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Refreshing...
                </>
              ) : (
                <>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  Refresh Data
                </>
              )}
            </button>
            
            <button
              onClick={() => window.print()}
              className="px-6 py-3 bg-white text-gray-700 border border-gray-300 rounded-xl hover:bg-gray-50 transition-all font-medium shadow-sm hover:shadow-md flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
              </svg>
              Export
            </button>
          </div>
        </div>

        {/* Tabs Navigation */}
        <div className="bg-white rounded-2xl shadow-lg mb-8 overflow-hidden border border-gray-100">
          <div className="flex overflow-x-auto scrollbar-hide">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 min-w-max px-6 py-4 text-sm font-semibold transition-all relative ${
                  activeTab === tab.id
                    ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white'
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                <div className="flex items-center justify-center gap-2">
                  <span className="text-xl">{tab.icon}</span>
                  <span className="hidden sm:inline">{tab.label}</span>
                </div>
                {activeTab === tab.id && (
                  <div className="absolute bottom-0 left-0 right-0 h-1 bg-white"></div>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Content Area */}
        <div className="space-y-6">
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {isAdmin && doctorPerformance.leaderboard?.length > 0 && (
                <DoctorLeaderboard leaderboard={doctorPerformance.leaderboard.slice(0, 5)} loading={false} />
              )}
              {appointmentData.trends?.length > 0 && (
                <AppointmentTrendsChart data={appointmentData.trends} period={period} />
              )}
              {peakHoursData.heatmapData?.length > 0 && (
                <PeakHoursHeatmap heatmapData={peakHoursData.heatmapData} dayNames={peakHoursData.dayNames} />
              )}
            </div>
          )}

          {activeTab === 'revenue' && isAdmin && (
            revenueData.data?.length > 0 ? (
              <RevenueChart data={revenueData.data} period={period} />
            ) : (
              <div className="bg-white rounded-2xl shadow-lg p-12 text-center border border-gray-100">
                <svg className="w-20 h-20 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="text-xl font-semibold text-gray-600">No Revenue Data</p>
                <p className="text-gray-500 mt-2">No revenue data available for the selected period</p>
              </div>
            )
          )}

          {activeTab === 'appointments' && (
            appointmentData.trends?.length > 0 ? (
              <AppointmentTrendsChart data={appointmentData.trends} period={period} />
            ) : (
              <div className="bg-white rounded-2xl shadow-lg p-12 text-center border border-gray-100">
                <svg className="w-20 h-20 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <p className="text-xl font-semibold text-gray-600">No Appointment Data</p>
                <p className="text-gray-500 mt-2">No appointments found for the selected period</p>
              </div>
            )
          )}

          {activeTab === 'peak-hours' && (
            peakHoursData.heatmapData?.length > 0 ? (
              <PeakHoursHeatmap heatmapData={peakHoursData.heatmapData} dayNames={peakHoursData.dayNames} />
            ) : (
              <div className="bg-white rounded-2xl shadow-lg p-12 text-center border border-gray-100">
                <svg className="w-20 h-20 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="text-xl font-semibold text-gray-600">No Peak Hours Data</p>
                <p className="text-gray-500 mt-2">Insufficient data to generate peak hours analysis</p>
              </div>
            )
          )}

          {activeTab === 'performance' && isAdmin && (
            <div className="space-y-6">
              {doctorPerformance.leaderboard?.length > 0 ? (
                <>
                  <DoctorLeaderboard leaderboard={doctorPerformance.leaderboard} loading={false} />
                  
                  {doctorPerformance.aggregateStats && (
                    <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
                      <h3 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
                        <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                        </svg>
                        Aggregate Statistics
                      </h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-6 rounded-xl border border-blue-200">
                          <p className="text-sm text-blue-700 font-semibold mb-1">Total Doctors</p>
                          <p className="text-4xl font-bold text-blue-900">{doctorPerformance.aggregateStats.totalDoctors}</p>
                        </div>
                        <div className="bg-gradient-to-br from-green-50 to-green-100 p-6 rounded-xl border border-green-200">
                          <p className="text-sm text-green-700 font-semibold mb-1">Avg Completion</p>
                          <p className="text-4xl font-bold text-green-900">{doctorPerformance.aggregateStats.averageCompletionRate}%</p>
                        </div>
                        <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-6 rounded-xl border border-purple-200">
                          <p className="text-sm text-purple-700 font-semibold mb-1">Total Revenue</p>
                          <p className="text-4xl font-bold text-purple-900">₹{(doctorPerformance.aggregateStats.totalRevenue || 0).toLocaleString()}</p>
                        </div>
                        <div className="bg-gradient-to-br from-red-50 to-red-100 p-6 rounded-xl border border-red-200">
                          <p className="text-sm text-red-700 font-semibold mb-1">Avg Cancellation</p>
                          <p className="text-4xl font-bold text-red-900">{doctorPerformance.aggregateStats.averageCancellationRate}%</p>
                        </div>
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <div className="bg-white rounded-2xl shadow-lg p-12 text-center border border-gray-100">
                  <svg className="w-20 h-20 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                  <p className="text-xl font-semibold text-gray-600">No Performance Data</p>
                  <p className="text-gray-500 mt-2">No doctor performance data available</p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'payments' && isAdmin && (
            paymentData.statusBreakdown?.length > 0 ? (
              <PaymentAnalytics {...paymentData} />
            ) : (
              <div className="bg-white rounded-2xl shadow-lg p-12 text-center border border-gray-100">
                <svg className="w-20 h-20 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                </svg>
                <p className="text-xl font-semibold text-gray-600">No Payment Data</p>
                <p className="text-gray-500 mt-2">No payment data available for the selected period</p>
              </div>
            )
          )}

          {activeTab === 'comparison' && isAdmin && (
            (comparisonData.monthly || comparisonData.quarterly) ? (
              <ComparisonChart monthlyData={comparisonData.monthly} quarterlyData={comparisonData.quarterly} />
            ) : (
              <div className="bg-white rounded-2xl shadow-lg p-12 text-center border border-gray-100">
                <svg className="w-20 h-20 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                <p className="text-xl font-semibold text-gray-600">No Comparison Data</p>
                <p className="text-gray-500 mt-2">Insufficient data for comparison analysis</p>
              </div>
            )
          )}
        </div>
      </div>
    </div>
  );
};

export default AnalyticsDashboard;
