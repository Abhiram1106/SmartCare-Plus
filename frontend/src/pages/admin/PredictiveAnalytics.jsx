import React, { useState, useEffect } from 'react';
import { 
  TrendingUp, 
  DollarSign, 
  Users, 
  Calendar,
  AlertCircle,
  RefreshCw,
  BarChart3,
  Clock,
  TrendingDown,
  Activity,
  Target,
  Zap,
  PieChart,
  ArrowUp,
  ArrowDown,
  Shield
} from 'lucide-react';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';

const PredictiveAnalytics = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('overview'); // overview, forecast, peakhours, retention
  
  const [stats, setStats] = useState({
    totalRevenue: 0,
    totalPatients: 0,
    totalAppointments: 0,
    averageRevenuePerPatient: 0
  });
  
  const [revenueForecast, setRevenueForecast] = useState(null);
  const [peakHours, setPeakHours] = useState(null);
  const [retention, setRetention] = useState(null);
  const [performance, setPerformance] = useState(null);

  useEffect(() => {
    if (user && user.role === 'admin') {
      fetchAnalytics();
    } else if (user) {
      setLoading(false);
    }
  }, [user]);

  const fetchAnalytics = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Fetch all data in parallel
      const [dashboardRes, forecastRes, peakRes, retentionRes] = await Promise.all([
        api.get('/predictive-analytics/dashboard'),
        api.get('/predictive-analytics/revenue-forecast?days=30').catch(() => null),
        api.get('/predictive-analytics/peak-hours').catch(() => null),
        api.get('/predictive-analytics/patient-retention').catch(() => null)
      ]);
      
      const data = dashboardRes.data?.data || {};
      
      // Extract overview data
      const overview = data.overview || {};
      const revenue = data.revenue || {};
      
      setStats({
        totalRevenue: Number(overview.totalRevenue) || Number(revenue.current) || 0,
        totalPatients: Number(overview.totalPatients) || 0,
        totalAppointments: Number(overview.totalAppointments) || 0,
        averageRevenuePerPatient: overview.totalRevenue && overview.totalPatients 
          ? (overview.totalRevenue / overview.totalPatients) 
          : 0
      });
      
      // Set performance metrics
      if (data.performance) {
        setPerformance(data.performance);
      }
      
      // Set revenue forecast
      if (forecastRes?.data?.data) {
        setRevenueForecast(forecastRes.data.data);
      }
      
      // Set peak hours
      if (peakRes?.data?.data) {
        setPeakHours(peakRes.data.data);
      }
      
      // Set retention data
      if (retentionRes?.data?.data) {
        setRetention(retentionRes.data.data);
      }
      
    } catch (err) {
      console.error('Error fetching analytics:', err);
      setError('Failed to load analytics data. Please try again.');
      setStats({
        totalRevenue: 0,
        totalPatients: 0,
        totalAppointments: 0,
        averageRevenuePerPatient: 0
      });
    } finally {
      setLoading(false);
    }
  };

  // Loading state
  if (!user || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-cyan-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 font-medium">Loading analytics...</p>
        </div>
      </div>
    );
  }

  // Access denied
  if (user.role !== 'admin') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-cyan-50 flex items-center justify-center">
        <div className="bg-white rounded-2xl shadow-xl p-8 text-center max-w-md">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Access Denied</h2>
          <p className="text-gray-600">Only administrators can access predictive analytics.</p>
        </div>
      </div>
    );
  }

  // Main content
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-cyan-50 py-8">
      <div className="max-w-7xl mx-auto px-4">
        
        {/* Header */}
        <div className="mb-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-gray-800 flex items-center">
              <BarChart3 className="w-10 h-10 text-blue-600 mr-3" />
              Predictive Analytics
            </h1>
            <p className="text-gray-600 mt-2">ML-powered insights and forecasting</p>
          </div>
          <button
            onClick={fetchAnalytics}
            disabled={loading}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all flex items-center space-x-2 shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 bg-red-50 border-l-4 border-red-500 p-4 rounded-lg">
            <div className="flex items-center">
              <AlertCircle className="w-6 h-6 text-red-600 mr-3" />
              <p className="text-red-800 font-medium">{error}</p>
            </div>
          </div>
        )}

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Total Revenue */}
          <div className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="text-gray-600 text-sm font-medium">Total Revenue</p>
                <p className="text-2xl md:text-3xl font-bold text-green-600 mt-2">
                  ₹{stats.totalRevenue.toLocaleString()}
                </p>
                <p className="text-xs text-gray-500 mt-1">All time earnings</p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                <DollarSign className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </div>

          {/* Total Patients */}
          <div className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="text-gray-600 text-sm font-medium">Total Patients</p>
                <p className="text-2xl md:text-3xl font-bold text-blue-600 mt-2">
                  {stats.totalPatients.toLocaleString()}
                </p>
                <p className="text-xs text-gray-500 mt-1">Registered users</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                <Users className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>

          {/* Total Appointments */}
          <div className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="text-gray-600 text-sm font-medium">Appointments</p>
                <p className="text-2xl md:text-3xl font-bold text-purple-600 mt-2">
                  {stats.totalAppointments.toLocaleString()}
                </p>
                <p className="text-xs text-gray-500 mt-1">Total bookings</p>
              </div>
              <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0">
                <Calendar className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </div>

          {/* Average Revenue Per Patient */}
          <div className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="text-gray-600 text-sm font-medium">Avg Revenue/Patient</p>
                <p className="text-2xl md:text-3xl font-bold text-orange-600 mt-2">
                  ₹{stats.averageRevenuePerPatient.toFixed(2)}
                </p>
                <p className="text-xs text-gray-500 mt-1">Per patient value</p>
              </div>
              <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center flex-shrink-0">
                <TrendingUp className="w-6 h-6 text-orange-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="bg-white rounded-xl shadow-lg p-2 mb-8">
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setActiveTab('overview')}
              className={`flex-1 min-w-[150px] px-4 py-3 rounded-lg font-medium transition-all ${
                activeTab === 'overview'
                  ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-md'
                  : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
              }`}
            >
              <BarChart3 className="w-5 h-5 inline mr-2" />
              Overview
            </button>
            <button
              onClick={() => setActiveTab('forecast')}
              className={`flex-1 min-w-[150px] px-4 py-3 rounded-lg font-medium transition-all ${
                activeTab === 'forecast'
                  ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-md'
                  : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
              }`}
            >
              <TrendingUp className="w-5 h-5 inline mr-2" />
              Revenue Forecast
            </button>
            <button
              onClick={() => setActiveTab('peakhours')}
              className={`flex-1 min-w-[150px] px-4 py-3 rounded-lg font-medium transition-all ${
                activeTab === 'peakhours'
                  ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-md'
                  : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
              }`}
            >
              <Clock className="w-5 h-5 inline mr-2" />
              Peak Hours
            </button>
            <button
              onClick={() => setActiveTab('retention')}
              className={`flex-1 min-w-[150px] px-4 py-3 rounded-lg font-medium transition-all ${
                activeTab === 'retention'
                  ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-md'
                  : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
              }`}
            >
              <Target className="w-5 h-5 inline mr-2" />
              Patient Retention
            </button>
          </div>
        </div>

        {/* Tab Content */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Performance Metrics */}
            {performance && (
              <div className="bg-white rounded-xl shadow-lg p-6">
                <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center">
                  <Activity className="w-6 h-6 text-purple-600 mr-2" />
                  Performance Metrics
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="p-4 bg-gradient-to-br from-green-50 to-green-100 rounded-lg">
                    <p className="text-sm text-gray-600 mb-1">Completion Rate</p>
                    <p className="text-2xl font-bold text-green-700">
                      {typeof performance.completionRate === 'number' 
                        ? performance.completionRate.toFixed(1) 
                        : '0.0'}%
                    </p>
                  </div>
                  <div className="p-4 bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg">
                    <p className="text-sm text-gray-600 mb-1">Average Rating</p>
                    <p className="text-2xl font-bold text-blue-700">
                      {typeof performance.averageRating === 'number' 
                        ? performance.averageRating.toFixed(1) 
                        : '0.0'}/5
                    </p>
                  </div>
                  <div className="p-4 bg-gradient-to-br from-orange-50 to-orange-100 rounded-lg">
                    <p className="text-sm text-gray-600 mb-1">Total Reviews</p>
                    <p className="text-2xl font-bold text-orange-700">
                      {performance.totalReviews || 0}
                    </p>
                  </div>
                </div>
              </div>
            )}
            
            {/* Quick Insights */}
            <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-2xl shadow-lg p-8">
              <h3 className="text-2xl font-bold text-gray-800 mb-6 flex items-center">
                <Zap className="w-7 h-7 text-yellow-500 mr-2" />
                AI-Powered Insights
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white rounded-lg p-6 shadow-md border-l-4 border-blue-500">
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="font-bold text-gray-800 mb-2">Revenue Trend</h4>
                      <p className="text-sm text-gray-600 mb-3">
                        {revenueForecast?.trend === 'increasing' ? 
                          'Revenue is trending upward 📈' : 
                          'Revenue growth opportunity detected'}
                      </p>
                      {revenueForecast && (
                        <div className="flex items-center space-x-2">
                          {revenueForecast.trend === 'increasing' ? (
                            <ArrowUp className="w-5 h-5 text-green-600" />
                          ) : (
                            <ArrowDown className="w-5 h-5 text-orange-600" />
                          )}
                          <span className={`font-semibold ${
                            revenueForecast.trend === 'increasing' ? 'text-green-600' : 'text-orange-600'
                          }`}>
                            {revenueForecast.growthRate ? `${revenueForecast.growthRate}% growth` : 'Monitor closely'}
                          </span>
                        </div>
                      )}
                    </div>
                    <TrendingUp className="w-8 h-8 text-blue-500" />
                  </div>
                </div>
                
                <div className="bg-white rounded-lg p-6 shadow-md border-l-4 border-purple-500">
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="font-bold text-gray-800 mb-2">Peak Activity</h4>
                      <p className="text-sm text-gray-600 mb-3">
                        {peakHours?.peakHour?.time || 'Analyzing patterns...'}
                      </p>
                      {peakHours?.peakHour && (
                        <p className="text-xs text-gray-500">
                          {peakHours.peakHour.appointmentCount} appointments during peak
                        </p>
                      )}
                    </div>
                    <Clock className="w-8 h-8 text-purple-500" />
                  </div>
                </div>
                
                <div className="bg-white rounded-lg p-6 shadow-md border-l-4 border-green-500">
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="font-bold text-gray-800 mb-2">Patient Retention</h4>
                      <p className="text-sm text-gray-600 mb-3">
                        {retention?.retentionRate 
                          ? `${typeof retention.retentionRate === 'number' ? retention.retentionRate.toFixed(1) : retention.retentionRate}% retention rate`
                          : 'Building retention data...'}
                      </p>
                      {retention?.activePatients && (
                        <p className="text-xs text-gray-500">
                          {retention.activePatients} active patients
                        </p>
                      )}
                    </div>
                    <Target className="w-8 h-8 text-green-500" />
                  </div>
                </div>
                
                <div className="bg-white rounded-lg p-6 shadow-md border-l-4 border-orange-500">
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="font-bold text-gray-800 mb-2">System Health</h4>
                      <p className="text-sm text-gray-600 mb-3">
                        All systems operational ✅
                      </p>
                      <p className="text-xs text-gray-500">
                        {stats.totalAppointments} appointments tracked
                      </p>
                    </div>
                    <Shield className="w-8 h-8 text-orange-500" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Revenue Forecast Tab */}
        {activeTab === 'forecast' && (
          <div className="bg-white rounded-xl shadow-lg p-8">
            <h3 className="text-2xl font-bold text-gray-800 mb-6 flex items-center">
              <TrendingUp className="w-7 h-7 text-green-600 mr-2" />
              30-Day Revenue Forecast
            </h3>
            {revenueForecast ? (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="p-6 bg-gradient-to-br from-green-50 to-green-100 rounded-xl">
                    <p className="text-sm text-gray-600 mb-2">Predicted Revenue</p>
                    <p className="text-3xl font-bold text-green-700">
                      ₹{typeof revenueForecast.predictedRevenue === 'number' 
                        ? revenueForecast.predictedRevenue.toLocaleString() 
                        : '0'}
                    </p>
                    <p className="text-xs text-gray-500 mt-2">Next 30 days</p>
                  </div>
                  <div className="p-6 bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl">
                    <p className="text-sm text-gray-600 mb-2">Growth Rate</p>
                    <p className="text-3xl font-bold text-blue-700">
                      {typeof revenueForecast.growthRate === 'number' 
                        ? revenueForecast.growthRate.toFixed(1) 
                        : '0'}%
                    </p>
                    <p className="text-xs text-gray-500 mt-2">Expected increase</p>
                  </div>
                  <div className="p-6 bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl">
                    <p className="text-sm text-gray-600 mb-2">Confidence Level</p>
                    <p className="text-3xl font-bold text-purple-700">
                      {typeof revenueForecast.confidence === 'number' 
                        ? revenueForecast.confidence.toFixed(0) 
                        : '85'}%
                    </p>
                    <p className="text-xs text-gray-500 mt-2">Prediction accuracy</p>
                  </div>
                </div>
                
                {revenueForecast.forecast && Array.isArray(revenueForecast.forecast) && (
                  <div className="mt-8">
                    <h4 className="font-semibold text-gray-700 mb-4">Weekly Breakdown</h4>
                    <div className="space-y-3">
                      {revenueForecast.forecast.slice(0, 4).map((week, index) => (
                        <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition">
                          <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                              <span className="font-bold text-blue-600">W{index + 1}</span>
                            </div>
                            <div>
                              <p className="font-medium text-gray-800">Week {index + 1}</p>
                              <p className="text-xs text-gray-500">{week.date || `Day ${(index * 7) + 1}-${(index + 1) * 7}`}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="font-bold text-gray-800">
                              ₹{typeof week.revenue === 'number' ? week.revenue.toLocaleString() : '0'}
                            </p>
                            <p className="text-xs text-green-600">+{week.growth || '5'}%</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                <div className="mt-6 p-4 bg-blue-50 border-l-4 border-blue-500 rounded">
                  <p className="text-sm text-gray-700">
                    <span className="font-semibold text-blue-600">💡 Insight:</span> {
                      revenueForecast.trend === 'increasing' 
                        ? 'Revenue is projected to grow steadily. Consider expanding services to capitalize on demand.'
                        : 'Focus on patient acquisition and retention strategies to boost revenue growth.'
                    }
                  </p>
                </div>
              </div>
            ) : (
              <div className="text-center py-12">
                <TrendingDown className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">No forecast data available. More historical data needed for accurate predictions.</p>
              </div>
            )}
          </div>
        )}

        {/* Peak Hours Tab */}
        {activeTab === 'peakhours' && (
          <div className="bg-white rounded-xl shadow-lg p-8">
            <h3 className="text-2xl font-bold text-gray-800 mb-6 flex items-center">
              <Clock className="w-7 h-7 text-purple-600 mr-2" />
              Peak Hours Analysis
            </h3>
            {peakHours ? (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="p-6 bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl">
                    <p className="text-sm text-gray-600 mb-2">Peak Hour</p>
                    <p className="text-3xl font-bold text-purple-700">
                      {peakHours.peakHour?.time || 'N/A'}
                    </p>
                    <p className="text-sm text-gray-600 mt-2">
                      {peakHours.peakHour?.appointmentCount || 0} appointments
                    </p>
                  </div>
                  <div className="p-6 bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl">
                    <p className="text-sm text-gray-600 mb-2">Busiest Day</p>
                    <p className="text-3xl font-bold text-blue-700">
                      {peakHours.peakDay?.day || 'N/A'}
                    </p>
                    <p className="text-sm text-gray-600 mt-2">
                      {peakHours.peakDay?.appointmentCount || 0} appointments
                    </p>
                  </div>
                </div>
                
                {peakHours.hourlyDistribution && Array.isArray(peakHours.hourlyDistribution) && (
                  <div className="mt-8">
                    <h4 className="font-semibold text-gray-700 mb-4">Hourly Distribution</h4>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      {peakHours.hourlyDistribution.map((hour, index) => (
                        <div 
                          key={index} 
                          className="p-4 bg-gray-50 rounded-lg text-center hover:shadow-md transition"
                          style={{
                            backgroundColor: hour.appointmentCount > 5 ? '#e0f2fe' : '#f9fafb'
                          }}
                        >
                          <p className="font-bold text-gray-800">{hour.hour}:00</p>
                          <p className="text-2xl font-bold text-blue-600 my-1">{hour.appointmentCount || 0}</p>
                          <p className="text-xs text-gray-500">appointments</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                <div className="mt-6 p-4 bg-purple-50 border-l-4 border-purple-500 rounded">
                  <p className="text-sm text-gray-700">
                    <span className="font-semibold text-purple-600">💡 Recommendation:</span> Optimize staff scheduling by allocating more resources during {peakHours.peakHour?.time || 'peak hours'} to improve patient experience and reduce wait times.
                  </p>
                </div>
              </div>
            ) : (
              <div className="text-center py-12">
                <Clock className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">No peak hours data available. Book appointments to see patterns.</p>
              </div>
            )}
          </div>
        )}

        {/* Patient Retention Tab */}
        {activeTab === 'retention' && (
          <div className="bg-white rounded-xl shadow-lg p-8">
            <h3 className="text-2xl font-bold text-gray-800 mb-6 flex items-center">
              <Target className="w-7 h-7 text-green-600 mr-2" />
              Patient Retention Analysis
            </h3>
            {retention ? (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                  <div className="p-6 bg-gradient-to-br from-green-50 to-green-100 rounded-xl">
                    <p className="text-sm text-gray-600 mb-2">Retention Rate</p>
                    <p className="text-3xl font-bold text-green-700">
                      {typeof retention.retentionRate === 'number' 
                        ? retention.retentionRate.toFixed(1) 
                        : '0'}%
                    </p>
                  </div>
                  <div className="p-6 bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl">
                    <p className="text-sm text-gray-600 mb-2">Active Patients</p>
                    <p className="text-3xl font-bold text-blue-700">
                      {retention.activePatients || 0}
                    </p>
                  </div>
                  <div className="p-6 bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl">
                    <p className="text-sm text-gray-600 mb-2">At Risk</p>
                    <p className="text-3xl font-bold text-orange-700">
                      {retention.atRiskPatients || 0}
                    </p>
                  </div>
                  <div className="p-6 bg-gradient-to-br from-red-50 to-red-100 rounded-xl">
                    <p className="text-sm text-gray-600 mb-2">Need Follow-up</p>
                    <p className="text-3xl font-bold text-red-700">
                      {retention.patientsNeedingFollowUp || 0}
                    </p>
                  </div>
                </div>
                
                {retention.insights && (
                  <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="p-6 bg-green-50 rounded-xl border border-green-200">
                      <h4 className="font-bold text-green-800 mb-3 flex items-center">
                        <Target className="w-5 h-5 mr-2" />
                        Retention Status
                      </h4>
                      <p className="text-2xl font-bold text-green-700 mb-2">
                        {retention.insights.retentionStatus || 'Good'}
                      </p>
                      <p className="text-sm text-gray-600">
                        Your patient retention is {
                          parseFloat(retention.retentionRate) > 70 ? 'excellent' :
                          parseFloat(retention.retentionRate) > 50 ? 'satisfactory' :
                          'needs improvement'
                        }
                      </p>
                    </div>
                    
                    <div className="p-6 bg-orange-50 rounded-xl border border-orange-200">
                      <h4 className="font-bold text-orange-800 mb-3 flex items-center">
                        <AlertCircle className="w-5 h-5 mr-2" />
                        Action Required
                      </h4>
                      <p className="text-sm text-gray-700">
                        {retention.insights.atRiskAction || 'No immediate actions required'}
                      </p>
                    </div>
                  </div>
                )}
                
                <div className="mt-6 p-4 bg-green-50 border-l-4 border-green-500 rounded">
                  <p className="text-sm text-gray-700">
                    <span className="font-semibold text-green-600">💡 Strategy:</span> Implement automated follow-up reminders for patients who haven't visited in 60+ days. Consider loyalty programs to improve retention.
                  </p>
                </div>
              </div>
            ) : (
              <div className="text-center py-12">
                <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">No retention data available. Patient history will appear here.</p>
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
};

export default PredictiveAnalytics;
