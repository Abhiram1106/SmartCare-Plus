import React, { useState, useEffect } from 'react';
import { 
  Shield, 
  Eye, 
  Lock, 
  Unlock,
  AlertTriangle,
  CheckCircle,
  XCircle,
  User,
  Calendar,
  Clock,
  MapPin,
  Activity,
  Filter,
  Search,
  Download,
  RefreshCw,
  TrendingUp,
  BarChart3
} from 'lucide-react';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../hooks/useToast';
import ToastContainer from '../../components/ToastContainer';

const SecurityAuditLogs = () => {
  const { user } = useAuth();
  const { showWarning, showError } = useToast();
  const [auditLogs, setAuditLogs] = useState([]);
  const [stats, setStats] = useState(null);
  const [suspiciousActivity, setSuspiciousActivity] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    action: '',
    userId: '',
    startDate: '',
    endDate: '',
    search: ''
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [encryptData, setEncryptData] = useState('');
  const [encryptedResult, setEncryptedResult] = useState('');

  useEffect(() => {
    if (user) {
      if (user.role === 'admin') {
        fetchAuditLogs();
        fetchStats();
        fetchSuspiciousActivity();
      } else {
        setLoading(false);
      }
    }
  }, [user, currentPage, filters]);

  const fetchAuditLogs = async () => {
    try {
      const params = new URLSearchParams({
        limit: 50,
        ...filters
      });
      
      // Remove empty filter values
      Object.keys(filters).forEach(key => {
        if (!filters[key]) {
          params.delete(key);
        }
      });
      
      const response = await api.get(`/security/audit-logs?${params}`);
      // Backend returns data directly, not nested in logs
      setAuditLogs(response.data?.data || []);
      setTotalPages(Math.ceil((response.data?.count || 0) / 50));
    } catch (error) {
      console.error('Error fetching audit logs:', error);
      setAuditLogs([]);
      setTotalPages(1);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await api.get('/security/audit-stats');
      setStats(response.data?.data || {});
    } catch (error) {
      console.error('Error fetching stats:', error);
      setStats({});
    }
  };

  const fetchSuspiciousActivity = async () => {
    try {
      setLoading(true);
      const response = await api.get('/security/suspicious-activity?days=7');
      const data = response.data?.data || {};
      setSuspiciousActivity(data.suspiciousPatterns || []);
    } catch (error) {
      console.error('Error fetching suspicious activity:', error);
      setSuspiciousActivity([]);
    } finally {
      setLoading(false);
    }
  };

  const handleEncrypt = async () => {
    if (!encryptData.trim()) {
      showWarning('Please enter data to encrypt');
      return;
    }

    try {
      const response = await api.post('/security/encrypt-data', {
        data: encryptData
      });
      setEncryptedResult(response.data.data.encryptedData);
    } catch (error) {
      console.error('Error encrypting data:', error);
      showError('Failed to encrypt data');
    }
  };

  const exportLogs = () => {
    const data = {
      auditLogs,
      stats,
      suspiciousActivity,
      exportedAt: new Date().toISOString(),
      exportedBy: user.name
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `security-audit-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
  };

  const getActionIcon = (action) => {
    const actionUpper = action?.toUpperCase();
    const icons = {
      'LOGIN': <CheckCircle className="w-5 h-5 text-green-600" />,
      'LOGOUT': <XCircle className="w-5 h-5 text-gray-600" />,
      'CREATE': <Activity className="w-5 h-5 text-blue-600" />,
      'UPDATE': <Activity className="w-5 h-5 text-yellow-600" />,
      'DELETE': <AlertTriangle className="w-5 h-5 text-red-600" />,
      'ACCESS_DENIED': <Lock className="w-5 h-5 text-red-600" />,
      'READ': <Eye className="w-5 h-5 text-blue-500" />,
      'PAYMENT': <Activity className="w-5 h-5 text-green-600" />
    };
    return icons[actionUpper] || <Activity className="w-5 h-5 text-gray-600" />;
  };

  const getSeverityColor = (severity) => {
    const colors = {
      'low': 'bg-green-100 text-green-800 border-green-300',
      'medium': 'bg-yellow-100 text-yellow-800 border-yellow-300',
      'high': 'bg-orange-100 text-orange-800 border-orange-300',
      'critical': 'bg-red-100 text-red-800 border-red-300'
    };
    return colors[severity] || colors['low'];
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (!user || (loading && !stats)) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-cyan-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading security logs...</p>
        </div>
      </div>
    );
  }

  if (user.role !== 'admin') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-cyan-50 flex items-center justify-center">
        <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
          <Lock className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Access Denied</h2>
          <p className="text-gray-600">Only administrators can access security audit logs.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-cyan-50 py-8">
      <div className="max-w-7xl mx-auto px-4">
        
        {/* Header */}
        <div className="mb-8 flex justify-between items-center">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent flex items-center">
              <Shield className="w-10 h-10 text-blue-600 mr-3" />
              Security & Audit Logs
            </h1>
            <p className="text-gray-600 mt-2">Monitor system security and user activity</p>
          </div>
          <div className="flex space-x-3">
            <button
              onClick={() => {
                fetchAuditLogs();
                fetchStats();
                fetchSuspiciousActivity();
              }}
              className="px-4 py-2 bg-white rounded-lg shadow-md hover:shadow-lg transition-all flex items-center space-x-2"
            >
              <RefreshCw className="w-5 h-5 text-blue-600" />
              <span>Refresh</span>
            </button>
            <button
              onClick={exportLogs}
              className="px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-lg hover:from-blue-600 hover:to-purple-600 transition-all flex items-center space-x-2"
            >
              <Download className="w-5 h-5" />
              <span>Export</span>
            </button>
          </div>
        </div>

        {/* Statistics */}
        {stats && Object.keys(stats).length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-xl shadow-lg p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm font-medium">Total Actions</p>
                  <p className="text-3xl font-bold text-blue-600">
                    {stats.totalActions?.toLocaleString() || '0'}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">{stats.period || 'Last 30 days'}</p>
                </div>
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                  <Activity className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-lg p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm font-medium">Success Rate</p>
                  <p className="text-3xl font-bold text-green-600">
                    {stats.successRate || '0'}%
                  </p>
                  <p className="text-xs text-gray-500 mt-1">Actions succeeded</p>
                </div>
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                  <CheckCircle className="w-6 h-6 text-green-600" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-lg p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm font-medium">Failed Actions</p>
                  <p className="text-3xl font-bold text-red-600">
                    {stats.failedActions?.toLocaleString() || '0'}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">Requires attention</p>
                </div>
                <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                  <XCircle className="w-6 h-6 text-red-600" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-lg p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm font-medium">Active Users</p>
                  <p className="text-3xl font-bold text-purple-600">
                    {stats.mostActiveUsers?.length || '0'}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">Top contributors</p>
                </div>
                <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                  <User className="w-6 h-6 text-purple-600" />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Suspicious Activity Alert */}
        {suspiciousActivity && suspiciousActivity.length > 0 && (
          <div className="bg-red-50 border-l-4 border-red-500 p-6 rounded-lg mb-8">
            <div className="flex items-start">
              <AlertTriangle className="w-6 h-6 text-red-600 mt-1 mr-3" />
              <div className="flex-1">
                <h3 className="font-bold text-red-900 text-lg mb-3">
                  Suspicious Activity Detected ({suspiciousActivity.length})
                </h3>
                <div className="space-y-3">
                  {suspiciousActivity.slice(0, 5).map((activity, index) => (
                    <div key={index} className="bg-white rounded-lg p-4 shadow">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <p className="font-semibold text-gray-800">{activity.pattern}</p>
                          <p className="text-sm text-gray-600">User ID: {activity.userId}</p>
                        </div>
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getSeverityColor(activity.severity)}`}>
                          {activity.severity}
                        </span>
                      </div>
                      <p className="text-sm text-gray-700 mb-2">{activity.description}</p>
                      <div className="flex items-center text-xs text-gray-600">
                        <Clock className="w-3 h-3 mr-1" />
                        {formatDate(activity.lastOccurrence)}
                        <span className="mx-2">•</span>
                        <span>{activity.count} occurrences</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Data Encryption Tool */}
        <div className="bg-white rounded-2xl shadow-xl p-6 mb-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-4 flex items-center">
            <Lock className="w-6 h-6 text-blue-600 mr-2" />
            Data Encryption Tool
          </h2>
          <p className="text-sm text-gray-600 mb-4">
            Encrypt sensitive data using AES-256 encryption before storing in database
          </p>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Data to Encrypt
              </label>
              <textarea
                value={encryptData}
                onChange={(e) => setEncryptData(e.target.value)}
                placeholder="Enter sensitive data here..."
                rows={3}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <button
              onClick={handleEncrypt}
              className="px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-lg hover:from-blue-600 hover:to-purple-600 transition-all font-semibold flex items-center space-x-2"
            >
              <Lock className="w-5 h-5" />
              <span>Encrypt Data</span>
            </button>

            {encryptedResult && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Encrypted Result
                </label>
                <div className="p-4 bg-gray-50 rounded-lg border border-gray-300 font-mono text-sm break-all">
                  {encryptedResult}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-2xl shadow-xl p-6 mb-6">
          <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center">
            <Filter className="w-5 h-5 text-blue-600 mr-2" />
            Filters
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Search</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  value={filters.search}
                  onChange={(e) => setFilters({...filters, search: e.target.value})}
                  placeholder="Search..."
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Action</label>
              <select
                value={filters.action}
                onChange={(e) => setFilters({...filters, action: e.target.value})}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Actions</option>
                <option value="login">Login</option>
                <option value="logout">Logout</option>
                <option value="create">Create</option>
                <option value="read">Read</option>
                <option value="update">Update</option>
                <option value="delete">Delete</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">User ID</label>
              <input
                type="text"
                value={filters.userId}
                onChange={(e) => setFilters({...filters, userId: e.target.value})}
                placeholder="User ID..."
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
              <input
                type="date"
                value={filters.startDate}
                onChange={(e) => setFilters({...filters, startDate: e.target.value})}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
              <input
                type="date"
                value={filters.endDate}
                onChange={(e) => setFilters({...filters, endDate: e.target.value})}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <button
            onClick={() => {
              setFilters({ action: '', userId: '', startDate: '', endDate: '', search: '' });
              setCurrentPage(1);
            }}
            className="mt-4 px-4 py-2 text-sm text-blue-600 hover:text-blue-700 font-medium"
          >
            Clear Filters
          </button>
        </div>

        {/* Audit Logs Table */}
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-2xl font-bold text-gray-800 flex items-center">
              <Eye className="w-6 h-6 text-blue-600 mr-2" />
              Audit Log Entries
            </h2>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Timestamp
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Action
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    User
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Details
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    IP Address
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {auditLogs.map((log) => (
                  <tr key={log._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {formatDate(log.timestamp)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center space-x-2">
                        {getActionIcon(log.action)}
                        <span className="text-sm font-medium text-gray-800">{log.action}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {log.user?.name || 'Unknown'}
                      <br />
                      <span className="text-xs text-gray-500">{log.user?.email || log.user?.role || 'N/A'}</span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {typeof log.details === 'object' ? JSON.stringify(log.details) : log.details || log.resource || 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      <div className="flex items-center">
                        <MapPin className="w-4 h-4 mr-1 text-gray-400" />
                        {log.ipAddress || 'N/A'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {log.status === 'success' ? (
                        <span className="px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                          Success
                        </span>
                      ) : (
                        <span className="px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800">
                          Failed
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex justify-between items-center">
            <div className="text-sm text-gray-600">
              Page {currentPage} of {totalPages}
            </div>
            <div className="flex space-x-2">
              <button
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className="px-4 py-2 text-sm bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              <button
                onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
                className="px-4 py-2 text-sm bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          </div>
        </div>
        ) : (
          <div className="bg-white rounded-xl shadow-lg p-12 text-center">
            <Shield className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-2xl font-semibold text-gray-700 mb-2">No Security Data Available</h3>
            <p className="text-gray-500 mb-6">
              There are no security logs available yet. This could be because:
            </p>
            <ul className="text-left max-w-md mx-auto text-gray-600 space-y-2 mb-6">
              <li>• No user activity has been logged yet</li>
              <li>• The security logging system is not configured</li>
              <li>• The backend security service is not running</li>
            </ul>
            <button
              onClick={() => {
                fetchAuditLogs();
                fetchStats();
                fetchSuspiciousActivity();
              }}
              className="px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-lg hover:from-blue-600 hover:to-purple-600 transition-all flex items-center space-x-2 mx-auto"
            >
              <RefreshCw className="w-5 h-5" />
              <span>Try Again</span>
            </button>
          </div>
        )}
      </div>
      <ToastContainer />
    </div>
  );
};

export default SecurityAuditLogs;
