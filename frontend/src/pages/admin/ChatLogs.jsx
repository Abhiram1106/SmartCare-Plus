import React, { useState, useEffect } from 'react';
import api from '../../services/api';

const ChatLogs = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchChatLogs();
  }, []);

  const fetchChatLogs = async () => {
    try {
      setLoading(true);
      const response = await api.get('/chatlogs');
      setLogs(response.data || []);
    } catch (error) {
      console.error('Error fetching chat logs:', error);
      alert('Failed to fetch chat logs');
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsReviewed = async (id) => {
    try {
      await api.put(`/chatlogs/${id}/review`);
      fetchChatLogs();
    } catch (error) {
      console.error('Error marking as reviewed:', error);
      alert('Failed to mark as reviewed');
    }
  };

  const filteredLogs = logs.filter(log => {
    const matchesFilter = 
      filter === 'all' || 
      (filter === 'needs-review' && log.needsReview) ||
      (filter === 'reviewed' && !log.needsReview);
    
    const matchesSearch = 
      log.userMessage?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.botResponse?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.user?.name?.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesFilter && matchesSearch;
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading chat logs...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800">Chat Logs</h1>
          <p className="text-gray-600 mt-2">Review chatbot conversations and improve responses</p>
        </div>

        <div className="mb-6 flex flex-col md:flex-row gap-4">
          <input
            type="text"
            placeholder="Search chat logs..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="flex-1 px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          
          <div className="flex gap-2">
            <button
              onClick={() => setFilter('all')}
              className={`px-4 py-2 rounded-lg transition-colors ${
                filter === 'all'
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-100'
              }`}
            >
              All ({logs.length})
            </button>
            <button
              onClick={() => setFilter('needs-review')}
              className={`px-4 py-2 rounded-lg transition-colors ${
                filter === 'needs-review'
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-100'
              }`}
            >
              Needs Review ({logs.filter(l => l.needsReview).length})
            </button>
            <button
              onClick={() => setFilter('reviewed')}
              className={`px-4 py-2 rounded-lg transition-colors ${
                filter === 'reviewed'
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-100'
              }`}
            >
              Reviewed ({logs.filter(l => !l.needsReview).length})
            </button>
          </div>
        </div>

        {filteredLogs.length === 0 ? (
          <div className="bg-white rounded-lg shadow-md p-12 text-center">
            <svg className="mx-auto h-16 w-16 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
            </svg>
            <h3 className="text-xl font-semibold text-gray-700 mb-2">No chat logs found</h3>
            <p className="text-gray-500">No conversations match your search criteria.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredLogs.map((log) => (
              <div key={log._id} className="bg-white rounded-lg shadow-md p-6">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                      <span className="text-blue-600 font-medium">
                        {log.user?.name?.charAt(0).toUpperCase() || 'U'}
                      </span>
                    </div>
                    <div>
                      <p className="font-semibold text-gray-800">{log.user?.name || 'Anonymous'}</p>
                      <p className="text-sm text-gray-500">
                        {new Date(log.createdAt).toLocaleString()}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {log.needsReview && (
                      <span className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs font-medium">
                        Needs Review
                      </span>
                    )}
                    {log.confidence !== undefined && (
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                        log.confidence >= 0.8
                          ? 'bg-green-100 text-green-800'
                          : log.confidence >= 0.5
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {Math.round(log.confidence * 100)}% confidence
                      </span>
                    )}
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="bg-blue-50 rounded-lg p-4">
                    <div className="flex items-start gap-3">
                      <svg className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-blue-900 mb-1">User Message</p>
                        <p className="text-blue-700">{log.userMessage}</p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-green-50 rounded-lg p-4">
                    <div className="flex items-start gap-3">
                      <svg className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-green-900 mb-1">Bot Response</p>
                        <p className="text-green-700">{log.botResponse}</p>
                        {log.detectedIntent && (
                          <p className="text-sm text-green-600 mt-2">
                            Intent: <span className="font-medium">{log.detectedIntent}</span>
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {log.needsReview && (
                  <div className="mt-4 flex justify-end">
                    <button
                      onClick={() => handleMarkAsReviewed(log._id)}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      Mark as Reviewed
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {filteredLogs.length > 0 && (
          <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-blue-900 mb-2">Chat Analytics</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <p className="text-sm text-blue-700">Total Conversations</p>
                <p className="text-2xl font-bold text-blue-900">{logs.length}</p>
              </div>
              <div>
                <p className="text-sm text-blue-700">Needs Review</p>
                <p className="text-2xl font-bold text-blue-900">{logs.filter(l => l.needsReview).length}</p>
              </div>
              <div>
                <p className="text-sm text-blue-700">Average Confidence</p>
                <p className="text-2xl font-bold text-blue-900">
                  {logs.length > 0
                    ? Math.round((logs.reduce((sum, l) => sum + (l.confidence || 0), 0) / logs.length) * 100)
                    : 0}%
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatLogs;
