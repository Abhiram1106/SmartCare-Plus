import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { useToast } from '../../hooks/useToast';
import ToastContainer from '../../components/ToastContainer';
import ConfirmDialog from '../../components/ConfirmDialog';

const ManageIntents = () => {
  const { showSuccess, showError, showWarning } = useToast();
  const [intents, setIntents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingIntent, setEditingIntent] = useState(null);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [confirmAction, setConfirmAction] = useState(null);
  const [formData, setFormData] = useState({
    tag: '',
    patterns: '',
    responses: '',
    category: 'general',
    isActive: true
  });

  useEffect(() => {
    fetchIntents();
  }, []);

  const fetchIntents = async () => {
    try {
      setLoading(true);
      const response = await api.get('/intents');
      setIntents(response.data || []);
    } catch (error) {
      console.error('Error fetching intents:', error);
      showError('Failed to fetch intents');
    } finally {
      setLoading(false);
    }
  };

  const handleSeedIntents = async () => {
    setConfirmAction({
      title: 'Seed Default Intents',
      message: 'This will seed default intents. Continue?',
      onConfirm: async () => {
        try {
          await api.post('/intents/seed');
          showSuccess('Intents seeded successfully');
          fetchIntents();
        } catch (error) {
          console.error('Error seeding intents:', error);
          showError('Failed to seed intents');
        }
        setShowConfirmDialog(false);
      }
    });
    setShowConfirmDialog(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const intentData = {
      tag: formData.tag,
      patterns: formData.patterns.split('\n').filter(p => p.trim()),
      responses: formData.responses.split('\n').filter(r => r.trim()),
      category: formData.category,
      isActive: formData.isActive
    };

    try {
      if (editingIntent) {
        await api.put(`/intents/${editingIntent._id}`, intentData);
        showSuccess('Intent updated successfully');
      } else {
        await api.post('/intents', intentData);
        showSuccess('Intent created successfully');
      }
      
      setShowModal(false);
      setEditingIntent(null);
      setFormData({
        tag: '',
        patterns: '',
        responses: '',
        category: 'general',
        isActive: true
      });
      fetchIntents();
    } catch (error) {
      console.error('Error saving intent:', error);
      showError('Failed to save intent');
    }
  };

  const handleEdit = (intent) => {
    setEditingIntent(intent);
    setFormData({
      tag: intent.tag,
      patterns: intent.patterns.join('\n'),
      responses: intent.responses.join('\n'),
      category: intent.category,
      isActive: intent.isActive
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    setConfirmAction({
      title: 'Delete Intent',
      message: 'Are you sure you want to delete this intent? This action cannot be undone.',
      onConfirm: async () => {
        try {
          await api.delete(`/intents/${id}`);
          showSuccess('Intent deleted successfully');
          fetchIntents();
        } catch (error) {
          console.error('Error deleting intent:', error);
          showError('Failed to delete intent');
        }
        setShowConfirmDialog(false);
      }
    });
    setShowConfirmDialog(true);
  };

  const handleToggleActive = async (id, isActive) => {
    try {
      await api.put(`/intents/${id}`, { isActive: !isActive });
      fetchIntents();
    } catch (error) {
      console.error('Error toggling intent:', error);
      showError('Failed to toggle intent status');
    }
  };

  const getCategoryColor = (category) => {
    switch (category) {
      case 'greeting':
        return 'bg-blue-100 text-blue-800';
      case 'appointment':
        return 'bg-green-100 text-green-800';
      case 'medical':
        return 'bg-purple-100 text-purple-800';
      case 'emergency':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading intents...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4">
        <div className="mb-8 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">Manage Chatbot Intents</h1>
            <p className="text-gray-600 mt-2">Configure chatbot training data and responses</p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={handleSeedIntents}
              className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              Seed Default Intents
            </button>
            <button
              onClick={() => {
                setEditingIntent(null);
                setFormData({
                  tag: '',
                  patterns: '',
                  responses: '',
                  category: 'general',
                  isActive: true
                });
                setShowModal(true);
              }}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Add New Intent
            </button>
          </div>
        </div>

        {intents.length === 0 ? (
          <div className="bg-white rounded-lg shadow-md p-12 text-center">
            <svg className="mx-auto h-16 w-16 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
            </svg>
            <h3 className="text-xl font-semibold text-gray-700 mb-2">No intents found</h3>
            <p className="text-gray-500 mb-6">Get started by seeding default intents or creating a new one.</p>
            <button
              onClick={handleSeedIntents}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Seed Default Intents
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6">
            {intents.map((intent) => (
              <div key={intent._id} className="bg-white rounded-lg shadow-md p-6">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-xl font-semibold text-gray-800">{intent.tag}</h3>
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${getCategoryColor(intent.category)}`}>
                        {intent.category}
                      </span>
                      <button
                        onClick={() => handleToggleActive(intent._id, intent.isActive)}
                        className={`px-3 py-1 rounded-full text-xs font-medium ${
                          intent.isActive
                            ? 'bg-green-100 text-green-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {intent.isActive ? 'Active' : 'Inactive'}
                      </button>
                    </div>
                  </div>

                  <div className="flex gap-2 ml-4">
                    <button
                      onClick={() => handleEdit(intent)}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(intent._id)}
                      className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                    >
                      Delete
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 mb-2">Patterns ({intent.patterns.length})</h4>
                    <div className="bg-gray-50 rounded-lg p-4 max-h-48 overflow-y-auto">
                      <ul className="space-y-1">
                        {intent.patterns.map((pattern, index) => (
                          <li key={index} className="text-sm text-gray-600">• {pattern}</li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  <div>
                    <h4 className="text-sm font-medium text-gray-700 mb-2">Responses ({intent.responses.length})</h4>
                    <div className="bg-blue-50 rounded-lg p-4 max-h-48 overflow-y-auto">
                      <ul className="space-y-1">
                        {intent.responses.map((response, index) => (
                          <li key={index} className="text-sm text-blue-700">• {response}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {showModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <h2 className="text-2xl font-bold mb-4">
                {editingIntent ? 'Edit Intent' : 'Add New Intent'}
              </h2>

              <form onSubmit={handleSubmit}>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tag (Intent Name)
                  </label>
                  <input
                    type="text"
                    value={formData.tag}
                    onChange={(e) => setFormData({ ...formData, tag: e.target.value })}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="e.g., greeting, appointment_booking"
                    required
                  />
                </div>

                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Category
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="general">General</option>
                    <option value="greeting">Greeting</option>
                    <option value="appointment">Appointment</option>
                    <option value="medical">Medical</option>
                    <option value="emergency">Emergency</option>
                  </select>
                </div>

                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Patterns (one per line)
                  </label>
                  <textarea
                    value={formData.patterns}
                    onChange={(e) => setFormData({ ...formData, patterns: e.target.value })}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    rows="6"
                    placeholder="Hello&#10;Hi there&#10;Good morning"
                    required
                  />
                  <p className="text-sm text-gray-500 mt-1">Enter user input patterns that should trigger this intent</p>
                </div>

                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Responses (one per line)
                  </label>
                  <textarea
                    value={formData.responses}
                    onChange={(e) => setFormData({ ...formData, responses: e.target.value })}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    rows="6"
                    placeholder="Hello! How can I help you?&#10;Hi! I'm here to assist you.&#10;Good morning! What can I do for you?"
                    required
                  />
                  <p className="text-sm text-gray-500 mt-1">Enter bot responses (one will be randomly selected)</p>
                </div>

                <div className="mb-6">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={formData.isActive}
                      onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <span className="ml-2 text-sm text-gray-700">Active (intent will be used by chatbot)</span>
                  </label>
                </div>

                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setShowModal(false);
                      setEditingIntent(null);
                    }}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    {editingIntent ? 'Update Intent' : 'Create Intent'}
                  </button>
                </div>
              </form>
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

export default ManageIntents;
