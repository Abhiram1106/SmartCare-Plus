import React, { useState, useEffect } from 'react';
import { 
  Pill, 
  FileText, 
  User, 
  Calendar, 
  Clock,
  Download,
  Eye,
  Printer
} from 'lucide-react';
import api from '../services/api';

const PrescriptionView = ({ prescriptionId, onClose, isModal = true }) => {
  const [prescription, setPrescription] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (prescriptionId) {
      fetchPrescription();
    }
  }, [prescriptionId]);

  const fetchPrescription = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await api.get(`/prescriptions/${prescriptionId}`);
      setPrescription(response.data);
    } catch (error) {
      console.error('Error fetching prescription:', error);
      setError(error.response?.data?.message || 'Failed to load prescription');
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadPDF = () => {
    // In a real implementation, you would generate a proper PDF
    // For now, we'll create a printable version
    window.print();
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8 text-center">
        <div className="text-red-600 mb-4">
          <FileText className="mx-auto h-16 w-16 mb-2" />
          <p className="text-xl font-semibold">Error Loading Prescription</p>
          <p className="text-sm">{error}</p>
        </div>
        {isModal && (
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
          >
            Close
          </button>
        )}
      </div>
    );
  }

  if (!prescription) {
    return (
      <div className="p-8 text-center">
        <FileText className="mx-auto h-16 w-16 text-gray-400 mb-4" />
        <p className="text-xl font-semibold text-gray-700">Prescription Not Found</p>
        {isModal && (
          <button
            onClick={onClose}
            className="mt-4 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
          >
            Close
          </button>
        )}
      </div>
    );
  }

  const content = (
    <div className="bg-white">
      {/* Prescription Header */}
      <div className="border-b-2 border-blue-600 pb-6 mb-6">
        <div className="text-center mb-4">
          <h1 className="text-3xl font-bold text-blue-600">Digital Prescription</h1>
          <p className="text-gray-600">SmartCare Plus Healthcare</p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Doctor Information */}
          <div className="bg-blue-50 p-4 rounded-lg">
            <h3 className="text-lg font-semibold text-blue-900 mb-3 flex items-center">
              <User className="w-5 h-5 mr-2" />
              Doctor Information
            </h3>
            <div className="space-y-2 text-sm">
              <div>
                <span className="font-medium text-gray-700">Name:</span>
                <span className="ml-2">Dr. {prescription.doctor?.name || 'N/A'}</span>
              </div>
              <div>
                <span className="font-medium text-gray-700">Specialization:</span>
                <span className="ml-2">{prescription.doctor?.specialization || 'N/A'}</span>
              </div>
              <div>
                <span className="font-medium text-gray-700">License No:</span>
                <span className="ml-2">{prescription.doctor?.licenseNumber || 'N/A'}</span>
              </div>
              <div>
                <span className="font-medium text-gray-700">Phone:</span>
                <span className="ml-2">{prescription.doctor?.phone || 'N/A'}</span>
              </div>
            </div>
          </div>

          {/* Patient Information */}
          <div className="bg-green-50 p-4 rounded-lg">
            <h3 className="text-lg font-semibold text-green-900 mb-3 flex items-center">
              <User className="w-5 h-5 mr-2" />
              Patient Information
            </h3>
            <div className="space-y-2 text-sm">
              <div>
                <span className="font-medium text-gray-700">Name:</span>
                <span className="ml-2">{prescription.patient?.name || 'N/A'}</span>
              </div>
              <div>
                <span className="font-medium text-gray-700">Age:</span>
                <span className="ml-2">{prescription.patient?.age || 'N/A'} years</span>
              </div>
              <div>
                <span className="font-medium text-gray-700">Phone:</span>
                <span className="ml-2">{prescription.patient?.phone || 'N/A'}</span>
              </div>
              <div>
                <span className="font-medium text-gray-700">Email:</span>
                <span className="ml-2">{prescription.patient?.email || 'N/A'}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Prescription Details */}
        <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-purple-50 p-3 rounded-lg text-center">
            <p className="text-xs font-medium text-purple-700">Prescription No.</p>
            <p className="text-lg font-bold text-purple-900">{prescription.prescriptionNumber}</p>
          </div>
          <div className="bg-orange-50 p-3 rounded-lg text-center">
            <p className="text-xs font-medium text-orange-700">Date Issued</p>
            <p className="text-lg font-bold text-orange-900">{formatDate(prescription.dateIssued)}</p>
          </div>
          <div className="bg-indigo-50 p-3 rounded-lg text-center">
            <p className="text-xs font-medium text-indigo-700">Valid Until</p>
            <p className="text-lg font-bold text-indigo-900">
              {prescription.validUntil ? formatDate(prescription.validUntil) : '30 days'}
            </p>
          </div>
        </div>
      </div>

      {/* Diagnosis */}
      <div className="mb-6">
        <h3 className="text-xl font-semibold text-gray-900 mb-3 flex items-center">
          <FileText className="w-6 h-6 mr-2 text-blue-600" />
          Diagnosis
        </h3>
        <div className="bg-gray-50 p-4 rounded-lg border-l-4 border-blue-500">
          <p className="text-gray-800">{prescription.diagnosis}</p>
        </div>
      </div>

      {/* Medications */}
      <div className="mb-6">
        <h3 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
          <Pill className="w-6 h-6 mr-2 text-green-600" />
          Medications ({prescription.medications?.length || 0})
        </h3>
        <div className="space-y-4">
          {prescription.medications?.map((medication, index) => (
            <div key={index} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
              <div className="flex justify-between items-start mb-3">
                <h4 className="text-lg font-semibold text-gray-900">
                  {index + 1}. {medication.name}
                </h4>
                <span className="bg-green-100 text-green-800 text-xs font-semibold px-2 py-1 rounded-full">
                  {medication.dosage}
                </span>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-3">
                <div>
                  <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Frequency</span>
                  <p className="text-sm font-medium text-gray-900">{medication.frequency}</p>
                </div>
                <div>
                  <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Duration</span>
                  <p className="text-sm font-medium text-gray-900">{medication.duration}</p>
                </div>
                <div>
                  <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Timing</span>
                  <p className="text-sm font-medium text-gray-900">{medication.timing || 'As prescribed'}</p>
                </div>
              </div>
              
              {medication.instructions && (
                <div className="bg-yellow-50 p-3 rounded-lg border-l-4 border-yellow-400">
                  <p className="text-xs font-medium text-yellow-800 mb-1">Special Instructions:</p>
                  <p className="text-sm text-yellow-900">{medication.instructions}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* General Instructions */}
      {prescription.generalInstructions && (
        <div className="mb-6">
          <h3 className="text-xl font-semibold text-gray-900 mb-3 flex items-center">
            <FileText className="w-6 h-6 mr-2 text-purple-600" />
            General Instructions
          </h3>
          <div className="bg-purple-50 p-4 rounded-lg border-l-4 border-purple-500">
            <p className="text-gray-800 leading-relaxed">{prescription.generalInstructions}</p>
          </div>
        </div>
      )}

      {/* Follow-up Information */}
      {prescription.followUp?.required && (
        <div className="mb-6">
          <h3 className="text-xl font-semibold text-gray-900 mb-3 flex items-center">
            <Calendar className="w-6 h-6 mr-2 text-indigo-600" />
            Follow-up Required
          </h3>
          <div className="bg-indigo-50 p-4 rounded-lg border-l-4 border-indigo-500">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {prescription.followUp.date && (
                <div>
                  <span className="text-xs font-medium text-indigo-700 uppercase tracking-wide">Next Visit</span>
                  <p className="text-sm font-medium text-indigo-900">{formatDate(prescription.followUp.date)}</p>
                </div>
              )}
              {prescription.followUp.instructions && (
                <div className="md:col-span-2">
                  <span className="text-xs font-medium text-indigo-700 uppercase tracking-wide">Instructions</span>
                  <p className="text-sm text-indigo-900">{prescription.followUp.instructions}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Tests Recommended */}
      {prescription.testsRecommended?.length > 0 && (
        <div className="mb-6">
          <h3 className="text-xl font-semibold text-gray-900 mb-3 flex items-center">
            <FileText className="w-6 h-6 mr-2 text-red-600" />
            Recommended Tests
          </h3>
          <div className="bg-red-50 p-4 rounded-lg border-l-4 border-red-500">
            <ul className="list-disc list-inside space-y-2">
              {prescription.testsRecommended.map((test, index) => (
                <li key={index} className="text-red-900">{test}</li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {/* Lifestyle Recommendations */}
      {(prescription.lifestyleRecommendations?.diet || 
        prescription.lifestyleRecommendations?.exercise || 
        prescription.lifestyleRecommendations?.restrictions) && (
        <div className="mb-6">
          <h3 className="text-xl font-semibold text-gray-900 mb-3 flex items-center">
            <User className="w-6 h-6 mr-2 text-teal-600" />
            Lifestyle Recommendations
          </h3>
          <div className="bg-teal-50 p-4 rounded-lg border-l-4 border-teal-500">
            <div className="space-y-3">
              {prescription.lifestyleRecommendations.diet && (
                <div>
                  <span className="font-medium text-teal-800">Diet:</span>
                  <p className="text-teal-700 mt-1">{prescription.lifestyleRecommendations.diet}</p>
                </div>
              )}
              {prescription.lifestyleRecommendations.exercise && (
                <div>
                  <span className="font-medium text-teal-800">Exercise:</span>
                  <p className="text-teal-700 mt-1">{prescription.lifestyleRecommendations.exercise}</p>
                </div>
              )}
              {prescription.lifestyleRecommendations.restrictions && (
                <div>
                  <span className="font-medium text-teal-800">Restrictions:</span>
                  <p className="text-teal-700 mt-1">{prescription.lifestyleRecommendations.restrictions}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Digital Signature */}
      <div className="border-t-2 border-gray-200 pt-6 mt-8">
        <div className="text-center">
          <div className="inline-block bg-blue-50 p-4 rounded-lg border">
            <p className="text-sm text-gray-600 mb-2">Digitally Signed by</p>
            <p className="text-lg font-semibold text-blue-900">Dr. {prescription.doctor?.name}</p>
            <p className="text-xs text-gray-500 mt-1">
              {prescription.digitalSignature?.timestamp 
                ? `Signed on ${formatDate(prescription.digitalSignature.timestamp)}`
                : 'Digital signature applied'
              }
            </p>
          </div>
        </div>
        
        <div className="mt-4 text-center text-xs text-gray-500">
          <p>This is a computer-generated prescription and is valid without physical signature.</p>
          <p>SmartCare Plus Healthcare | Contact: +91-XXX-XXXX-XXX</p>
        </div>
      </div>
    </div>
  );

  if (!isModal) {
    return content;
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[95vh] overflow-hidden flex flex-col">
        {/* Modal Header */}
        <div className="flex justify-between items-center p-6 border-b bg-gray-50">
          <h2 className="text-2xl font-bold text-gray-900 flex items-center">
            <Pill className="w-8 h-8 mr-3 text-blue-600" />
            Digital Prescription
          </h2>
          <div className="flex space-x-2">
            <button
              onClick={handleDownloadPDF}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Download className="w-4 h-4" />
              <span>Download</span>
            </button>
            <button
              onClick={() => window.print()}
              className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              <Printer className="w-4 h-4" />
              <span>Print</span>
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
            >
              Close
            </button>
          </div>
        </div>

        {/* Modal Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {content}
        </div>
      </div>
    </div>
  );
};

export default PrescriptionView;