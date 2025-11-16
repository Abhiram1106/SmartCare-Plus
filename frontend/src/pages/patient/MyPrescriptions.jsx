import React, { useState, useEffect } from 'react';
import { 
  Pill, 
  FileText, 
  Calendar, 
  User,
  Eye,
  Download,
  Search,
  Filter
} from 'lucide-react';
import api from '../../services/api';
import PrescriptionView from '../../components/PrescriptionView';
import { generatePrescriptionPDF } from '../../utils/pdfGenerator';
import { useToast } from '../../hooks/useToast';
import ToastContainer from '../../components/ToastContainer';

const MyPrescriptions = () => {
  const { showError } = useToast();
  const [prescriptions, setPrescriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterBy, setFilterBy] = useState('all');
  const [selectedPrescription, setSelectedPrescription] = useState(null);
  const [showPrescriptionModal, setShowPrescriptionModal] = useState(false);

  useEffect(() => {
    fetchPrescriptions();
  }, []);

  const fetchPrescriptions = async () => {
    try {
      setLoading(true);
      const response = await api.get('/prescriptions/patient');
      // Handle the response format from backend
      const data = response.data?.prescriptions || response.data?.data || response.data || [];
      setPrescriptions(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error fetching prescriptions:', error);
      setPrescriptions([]); // Set empty array on error
      // Show error message but don't block the UI
      const errorMsg = error.response?.data?.message || error.message || 'Failed to fetch prescriptions';
      showError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const viewPrescription = (prescription) => {
    setSelectedPrescription(prescription);
    setShowPrescriptionModal(true);
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const filteredPrescriptions = prescriptions.filter(prescription => {
    const matchesSearch = prescription.diagnosis?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         prescription.doctor?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         prescription.prescriptionNumber?.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (filterBy === 'all') return matchesSearch;
    
    const now = new Date();
    const prescriptionDate = new Date(prescription.dateIssued);
    const daysDiff = Math.floor((now - prescriptionDate) / (1000 * 60 * 60 * 24));
    
    switch (filterBy) {
      case 'recent':
        return matchesSearch && daysDiff <= 30;
      case 'older':
        return matchesSearch && daysDiff > 30;
      default:
        return matchesSearch;
    }
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-cyan-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading your prescriptions...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-cyan-50 py-8">
      <div className="max-w-7xl mx-auto px-4">
        
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            My Prescriptions
          </h1>
          <p className="text-gray-600 mt-2">View and manage your digital prescriptions</p>
        </div>

        {/* Search and Filter */}
        <div className="mb-6 bg-white rounded-xl shadow-lg p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search by diagnosis, doctor name, or prescription number..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <select
                value={filterBy}
                onChange={(e) => setFilterBy(e.target.value)}
                className="pl-10 pr-8 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none bg-white"
              >
                <option value="all">All Prescriptions</option>
                <option value="recent">Recent (Last 30 days)</option>
                <option value="older">Older (30+ days)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium">Total Prescriptions</p>
                <p className="text-3xl font-bold text-blue-600">{prescriptions.length}</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                <Pill className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium">Recent (30 days)</p>
                <p className="text-3xl font-bold text-green-600">
                  {prescriptions.filter(p => {
                    const daysDiff = Math.floor((new Date() - new Date(p.dateIssued)) / (1000 * 60 * 60 * 24));
                    return daysDiff <= 30;
                  }).length}
                </p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                <Calendar className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium">Unique Doctors</p>
                <p className="text-3xl font-bold text-purple-600">
                  {new Set(prescriptions.map(p => p.doctor?._id)).size}
                </p>
              </div>
              <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                <User className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Prescriptions List */}
        {filteredPrescriptions.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-xl p-12 text-center">
            <Pill className="mx-auto h-20 w-20 text-gray-300 mb-4" />
            <h3 className="text-2xl font-semibold text-gray-700 mb-2">
              {searchTerm || filterBy !== 'all' ? 'No matching prescriptions found' : 'No prescriptions yet'}
            </h3>
            <p className="text-gray-500">
              {searchTerm || filterBy !== 'all' 
                ? 'Try adjusting your search or filter criteria.' 
                : 'Your digital prescriptions will appear here after doctor consultations.'
              }
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {filteredPrescriptions.map((prescription) => (
              <div key={prescription._id} className="bg-white rounded-2xl shadow-xl p-6 hover:shadow-2xl transition-all duration-300">
                
                {/* Prescription Header */}
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-white font-bold text-lg">
                      <Pill className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold text-gray-800">
                        Prescription #{prescription.prescriptionNumber}
                      </h3>
                      <p className="text-gray-600">Dr. {prescription.doctor?.name}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-500">Issued</p>
                    <p className="font-semibold text-gray-800">{formatDate(prescription.dateIssued)}</p>
                  </div>
                </div>

                {/* Prescription Details */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4 p-4 bg-gray-50 rounded-xl">
                  <div className="flex items-center space-x-2">
                    <User className="w-5 h-5 text-blue-600" />
                    <div>
                      <p className="text-xs text-gray-500">Doctor</p>
                      <p className="font-semibold">{prescription.doctor?.name}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <FileText className="w-5 h-5 text-green-600" />
                    <div>
                      <p className="text-xs text-gray-500">Specialization</p>
                      <p className="font-semibold">{prescription.doctor?.specialization || 'General'}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Pill className="w-5 h-5 text-purple-600" />
                    <div>
                      <p className="text-xs text-gray-500">Medications</p>
                      <p className="font-semibold">{prescription.medications?.length || 0} items</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Calendar className="w-5 h-5 text-orange-600" />
                    <div>
                      <p className="text-xs text-gray-500">Valid Until</p>
                      <p className="font-semibold">
                        {prescription.validUntil 
                          ? formatDate(prescription.validUntil)
                          : '30 days'
                        }
                      </p>
                    </div>
                  </div>
                </div>

                {/* Diagnosis */}
                <div className="mb-4 p-4 bg-blue-50 rounded-xl border-l-4 border-blue-500">
                  <h4 className="font-semibold text-blue-900 mb-2 flex items-center">
                    <FileText className="w-4 h-4 mr-2" />
                    Diagnosis
                  </h4>
                  <p className="text-blue-800">{prescription.diagnosis}</p>
                </div>

                {/* Key Medications Preview */}
                {prescription.medications && prescription.medications.length > 0 && (
                  <div className="mb-4 p-4 bg-purple-50 rounded-xl border-l-4 border-purple-500">
                    <h4 className="font-semibold text-purple-900 mb-2 flex items-center">
                      <Pill className="w-4 h-4 mr-2" />
                      Key Medications ({prescription.medications.length})
                    </h4>
                    <div className="space-y-2">
                      {prescription.medications.slice(0, 2).map((medication, index) => (
                        <div key={index} className="flex justify-between items-center text-sm">
                          <span className="text-purple-800 font-medium">{medication.name}</span>
                          <span className="text-purple-600">{medication.dosage} - {medication.frequency}</span>
                        </div>
                      ))}
                      {prescription.medications.length > 2 && (
                        <p className="text-xs text-purple-600 italic">
                          +{prescription.medications.length - 2} more medications...
                        </p>
                      )}
                    </div>
                  </div>
                )}

                {/* Actions */}
                <div className="flex flex-wrap gap-3">
                  <button
                    onClick={() => viewPrescription(prescription)}
                    className="flex items-center space-x-2 px-6 py-2 bg-gradient-to-r from-blue-500 to-indigo-500 text-white rounded-lg hover:from-blue-600 hover:to-indigo-600 transition-all shadow-md hover:shadow-lg font-semibold"
                  >
                    <Eye className="w-4 h-4" />
                    <span>View Full Prescription</span>
                  </button>
                  
                  <button
                    onClick={() => generatePrescriptionPDF(prescription)}
                    className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-lg hover:from-green-600 hover:to-emerald-600 transition-all"
                  >
                    <Download className="w-4 h-4" />
                    <span>Download PDF</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Prescription Modal */}
        {showPrescriptionModal && selectedPrescription && (
          <PrescriptionView
            prescriptionId={selectedPrescription._id}
            onClose={() => setShowPrescriptionModal(false)}
            isModal={true}
          />
        )}
      </div>
      
      <ToastContainer />
    </div>
  );
};

export default MyPrescriptions;