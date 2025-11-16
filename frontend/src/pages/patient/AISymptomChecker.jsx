import React, { useState, useEffect } from 'react';
import { 
  Brain, 
  Plus, 
  Trash2, 
  AlertTriangle,
  TrendingUp,
  Stethoscope,
  Activity,
  FileText,
  Calendar,
  Search,
  CheckCircle,
  XCircle,
  ArrowRight,
  ArrowLeft,
  Download,
  Share2,
  BookOpen,
  Info
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import jsPDF from 'jspdf';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../hooks/useToast';
import ToastContainer from '../../components/ToastContainer';
import ConfirmDialog from '../../components/ConfirmDialog';

const AISymptomChecker = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toasts, removeToast, showSuccess, showError, showWarning, showInfo } = useToast();
  const [symptoms, setSymptoms] = useState([{ name: '', severity: 'mild', duration: '' }]);
  const [patientAge, setPatientAge] = useState('');
  const [patientGender, setPatientGender] = useState('');
  const [medicalHistory, setMedicalHistory] = useState('');
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState([]);
  const [showHistory, setShowHistory] = useState(false);
  const [commonSymptoms, setCommonSymptoms] = useState([]);
  const [specialists, setSpecialists] = useState([]);
  const [selectedReview, setSelectedReview] = useState(null);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState({ isOpen: false, id: null });

  useEffect(() => {
    fetchCommonSymptoms();
    fetchSpecialists();
    fetchHistory();
  }, []);

  const fetchCommonSymptoms = async () => {
    try {
      const response = await api.get('/ai-symptom-checker/symptoms-list');
      setCommonSymptoms(response.data.data);
    } catch (error) {
      console.error('Error fetching symptoms:', error);
    }
  };

  const fetchSpecialists = async () => {
    try {
      const response = await api.get('/ai-symptom-checker/specialists');
      setSpecialists(response.data.data);
    } catch (error) {
      console.error('Error fetching specialists:', error);
    }
  };

  const fetchHistory = async () => {
    try {
      const response = await api.get('/ai-symptom-checker/history');
      setHistory(response.data.data);
    } catch (error) {
      console.error('Error fetching history:', error);
    }
  };

  const addSymptom = () => {
    setSymptoms([...symptoms, { name: '', severity: 'mild', duration: '' }]);
  };

  const removeSymptom = (index) => {
    const newSymptoms = symptoms.filter((_, i) => i !== index);
    setSymptoms(newSymptoms.length > 0 ? newSymptoms : [{ name: '', severity: 'mild', duration: '' }]);
  };

  const updateSymptom = (index, field, value) => {
    const newSymptoms = [...symptoms];
    newSymptoms[index][field] = value;
    setSymptoms(newSymptoms);
  };

  const handleAnalyze = async () => {
    const validSymptoms = symptoms.filter(s => s.name.trim());
    
    if (validSymptoms.length === 0) {
      showWarning('Please add at least one symptom');
      return;
    }

    setLoading(true);
    try {
      // Transform symptoms to match backend API expectations
      const transformedSymptoms = validSymptoms.map(s => ({
        symptom: s.name,  // Backend expects 'symptom' not 'name'
        severity: s.severity,
        duration: s.duration
      }));

      console.log('Sending symptoms for analysis:', transformedSymptoms);

      const response = await api.post('/ai-symptom-checker/analyze', {
        symptoms: transformedSymptoms,
        patientAge: patientAge ? parseInt(patientAge) : undefined,
        patientGender: patientGender || undefined,
        medicalHistory: medicalHistory || undefined
      });
      
      console.log('Analysis response:', response.data);
      
      if (response.data.success && response.data.data) {
        setAnalysis(response.data.data);
        fetchHistory(); // Refresh reviews
        showSuccess('Analysis completed successfully!');
        
        if (response.data.data.predictions && response.data.data.predictions.length > 0) {
          window.scrollTo({ top: 600, behavior: 'smooth' });
        } else {
          showInfo('No matching conditions found. Please consult a healthcare professional for accurate diagnosis.');
        }
      }
    } catch (error) {
      console.error('Error analyzing symptoms:', error);
      console.error('Error details:', error.response?.data);
      showError(error.response?.data?.message || 'Failed to analyze symptoms. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setSymptoms([{ name: '', severity: 'mild', duration: '' }]);
    setPatientAge('');
    setPatientGender('');
    setMedicalHistory('');
    setAnalysis(null);
  };

  const viewPastAnalysis = async (id) => {
    try {
      const response = await api.get(`/ai-symptom-checker/analysis/${id}`);
      setSelectedReview(response.data.data);
      setShowReviewModal(true);
    } catch (error) {
      console.error('Error fetching analysis:', error);
      showError('Failed to load review details');
    }
  };

  const closeReviewModal = () => {
    setShowReviewModal(false);
    setSelectedReview(null);
  };

  const deleteReview = async (id, e) => {
    e.stopPropagation(); // Prevent triggering view modal
    setDeleteConfirm({ isOpen: true, id });
  };

  const confirmDelete = async () => {
    const id = deleteConfirm.id;
    setDeleteConfirm({ isOpen: false, id: null });

    try {
      await api.delete(`/ai-symptom-checker/analysis/${id}`);
      
      // Remove from local state
      setHistory(history.filter(item => item._id !== id));
      
      // Show success message
      showSuccess('Review deleted successfully!');
    } catch (error) {
      console.error('Error deleting review:', error);
      showError(error.response?.data?.message || 'Failed to delete review. Please try again.');
    }
  };

  const cancelDelete = () => {
    setDeleteConfirm({ isOpen: false, id: null });
  };

  const downloadReviewPDF = (review) => {
    const printWindow = window.open('', '_blank');
    
    const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>AI Symptom Analysis Report - ${review._id?.slice(-6) || 'Report'}</title>
      <style>
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        
        body {
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          padding: 40px;
          background: white;
          color: #333;
          line-height: 1.6;
        }
        
        .container {
          max-width: 800px;
          margin: 0 auto;
          border: 2px solid #3b82f6;
          padding: 30px;
          position: relative;
        }
        
        .watermark {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%) rotate(-45deg);
          font-size: 100px;
          color: rgba(59, 130, 246, 0.05);
          font-weight: bold;
          z-index: 0;
          pointer-events: none;
        }
        
        .content {
          position: relative;
          z-index: 1;
        }
        
        .header {
          background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%);
          color: white;
          padding: 30px;
          border-radius: 12px 12px 0 0;
          margin: -30px -30px 30px -30px;
          text-align: center;
        }
        
        .header h1 {
          font-size: 32px;
          font-weight: bold;
          margin-bottom: 10px;
        }
        
        .header p {
          font-size: 14px;
          opacity: 0.9;
        }
        
        .report-info {
          background: #f8fafc;
          border-left: 4px solid #3b82f6;
          padding: 20px;
          border-radius: 8px;
          margin-bottom: 30px;
        }
        
        .report-info table {
          width: 100%;
          border-collapse: collapse;
        }
        
        .report-info td {
          padding: 8px 0;
          font-size: 14px;
        }
        
        .report-info .label {
          color: #64748b;
          font-weight: 500;
          width: 40%;
        }
        
        .report-info .value {
          color: #1e293b;
          font-weight: 600;
        }
        
        .section-title {
          color: #3b82f6;
          font-size: 20px;
          font-weight: bold;
          margin: 30px 0 15px;
          padding-bottom: 10px;
          border-bottom: 2px solid #dbeafe;
          display: flex;
          align-items: center;
          gap: 10px;
        }
        
        .symptom-card {
          background: white;
          border: 2px solid #e5e7eb;
          border-radius: 8px;
          padding: 15px;
          margin-bottom: 12px;
        }
        
        .symptom-card.mild {
          border-left: 4px solid #22c55e;
          background: #f0fdf4;
        }
        
        .symptom-card.moderate {
          border-left: 4px solid #eab308;
          background: #fefce8;
        }
        
        .symptom-card.severe {
          border-left: 4px solid #ef4444;
          background: #fef2f2;
        }
        
        .symptom-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 8px;
        }
        
        .symptom-name {
          font-size: 16px;
          font-weight: 700;
          color: #1e293b;
        }
        
        .severity-badge {
          padding: 4px 12px;
          border-radius: 12px;
          font-size: 12px;
          font-weight: 600;
          text-transform: uppercase;
        }
        
        .severity-badge.mild {
          background: #dcfce7;
          color: #166534;
        }
        
        .severity-badge.moderate {
          background: #fef9c3;
          color: #854d0e;
        }
        
        .severity-badge.severe {
          background: #fee2e2;
          color: #991b1b;
        }
        
        .symptom-details {
          color: #64748b;
          font-size: 13px;
          margin-top: 5px;
        }
        
        .prediction-card {
          background: white;
          border: 2px solid #e5e7eb;
          border-radius: 8px;
          padding: 20px;
          margin-bottom: 15px;
          position: relative;
        }
        
        .prediction-rank {
          position: absolute;
          top: 15px;
          left: 15px;
          width: 35px;
          height: 35px;
          background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%);
          color: white;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: bold;
          font-size: 16px;
        }
        
        .prediction-content {
          margin-left: 50px;
        }
        
        .prediction-header {
          display: flex;
          justify-content: space-between;
          align-items: start;
          margin-bottom: 12px;
        }
        
        .disease-name {
          font-size: 18px;
          font-weight: 700;
          color: #1e293b;
        }
        
        .confidence-badge {
          padding: 6px 16px;
          border-radius: 20px;
          font-size: 14px;
          font-weight: 700;
          color: white;
        }
        
        .confidence-high {
          background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%);
        }
        
        .confidence-medium {
          background: linear-gradient(135deg, #eab308 0%, #ca8a04 100%);
        }
        
        .confidence-low {
          background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
        }
        
        .prediction-description {
          color: #64748b;
          font-size: 14px;
          line-height: 1.6;
          margin-bottom: 12px;
        }
        
        .matched-symptoms {
          background: #f0fdf4;
          border-left: 3px solid #22c55e;
          padding: 10px;
          border-radius: 4px;
          font-size: 13px;
          color: #166534;
        }
        
        .recommendation-box {
          background: #fff7ed;
          border: 2px solid #fed7aa;
          border-radius: 8px;
          padding: 20px;
          margin-bottom: 20px;
        }
        
        .recommendation-box h3 {
          color: #ea580c;
          font-size: 16px;
          font-weight: 600;
          margin-bottom: 12px;
          display: flex;
          align-items: center;
          gap: 8px;
        }
        
        .recommendation-box p {
          color: #9a3412;
          font-size: 14px;
          line-height: 1.6;
        }
        
        .recommendation-box ul {
          list-style-position: inside;
          color: #9a3412;
          font-size: 14px;
          line-height: 1.8;
          margin-top: 10px;
        }
        
        .disclaimer {
          background: #fef2f2;
          border: 2px solid #fecaca;
          border-radius: 8px;
          padding: 20px;
          margin-top: 30px;
        }
        
        .disclaimer h3 {
          color: #dc2626;
          font-size: 16px;
          font-weight: 600;
          margin-bottom: 10px;
          display: flex;
          align-items: center;
          gap: 8px;
        }
        
        .disclaimer p {
          color: #991b1b;
          font-size: 13px;
          line-height: 1.7;
        }
        
        .footer {
          margin-top: 40px;
          padding-top: 20px;
          border-top: 2px solid #e5e7eb;
          text-align: center;
          color: #64748b;
          font-size: 12px;
        }
        
        .footer p {
          margin-bottom: 5px;
        }
        
        @media print {
          body {
            padding: 0;
          }
          
          .container {
            border: none;
            page-break-inside: avoid;
          }
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="watermark">SmartCare+</div>
        
        <div class="content">
          <!-- Header -->
          <div class="header">
            <h1>🧠 AI SYMPTOM ANALYSIS REPORT</h1>
            <p>SmartCarePlus Healthcare System - Advanced Diagnostic Support</p>
          </div>
          
          <!-- Report Information -->
          <div class="report-info">
            <table>
              <tr>
                <td class="label">Generated:</td>
                <td class="value">${new Date().toLocaleString('en-US', {
                  month: 'long', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit'
                })}</td>
              </tr>
              <tr>
                <td class="label">Patient:</td>
                <td class="value">${user?.name || 'N/A'}</td>
              </tr>
              <tr>
                <td class="label">Report ID:</td>
                <td class="value">#${review._id?.slice(-8) || 'N/A'}</td>
              </tr>
            </table>
          </div>
          
          <!-- Reported Symptoms -->
          <div class="section-title">
            📋 Reported Symptoms
          </div>
          ${review.symptoms?.map((symptom, index) => `
            <div class="symptom-card ${symptom.severity}">
              <div class="symptom-header">
                <div class="symptom-name">${index + 1}. ${symptom.symptom || symptom.name}</div>
                <div class="severity-badge ${symptom.severity}">${symptom.severity}</div>
              </div>
              <div class="symptom-details">
                ${symptom.duration ? `Duration: ${symptom.duration}` : 'Duration: Not specified'}
              </div>
            </div>
          `).join('') || '<p>No symptoms recorded</p>'}
          
          <!-- AI Predictions -->
          <div class="section-title">
            🤖 AI Analysis & Predictions
          </div>
          ${review.predictions?.slice(0, 5).map((prediction, index) => {
            const confidence = Math.round(prediction.confidence * 100);
            const confidenceClass = confidence >= 70 ? 'high' : confidence >= 40 ? 'medium' : 'low';
            
            return `
              <div class="prediction-card">
                <div class="prediction-rank">${index + 1}</div>
                <div class="prediction-content">
                  <div class="prediction-header">
                    <div class="disease-name">${prediction.disease}</div>
                    <div class="confidence-badge confidence-${confidenceClass}">${confidence}%</div>
                  </div>
                  <div class="prediction-description">
                    ${prediction.description || 'No description available'}
                  </div>
                  ${prediction.matchedSymptoms && prediction.matchedSymptoms.length > 0 ? `
                    <div class="matched-symptoms">
                      <strong>✓ Matched Symptoms:</strong> ${prediction.matchedSymptoms.slice(0, 4).join(', ')}
                    </div>
                  ` : ''}
                </div>
              </div>
            `;
          }).join('') || '<p>No predictions available</p>'}
          
          <!-- Recommendations -->
          <div class="section-title">
            💡 Recommendations
          </div>
          ${review.recommendedSpecialist ? `
            <div class="recommendation-box">
              <h3>👨‍⚕️ Recommended Specialist</h3>
              <p><strong>${review.recommendedSpecialist}</strong></p>
              <p>Please consult this specialist for accurate diagnosis and treatment plan.</p>
            </div>
          ` : ''}
          
          ${review.predictions && review.predictions[0]?.recommendedActions ? `
            <div class="recommendation-box">
              <h3>📌 Recommended Actions</h3>
              <ul>
                ${review.predictions[0].recommendedActions.slice(0, 5).map(action => `
                  <li>${action}</li>
                `).join('')}
              </ul>
            </div>
          ` : ''}
          
          <!-- Medical Disclaimer -->
          <div class="disclaimer">
            <h3>⚠️ IMPORTANT MEDICAL DISCLAIMER</h3>
            <p>
              This AI-powered analysis is for informational purposes only and should NOT replace professional 
              medical advice, diagnosis, or treatment. Always seek the advice of your physician or qualified 
              health provider with any questions regarding a medical condition. Never disregard professional 
              medical advice or delay seeking it because of something you have read in this report.
            </p>
          </div>
          
          <!-- Footer -->
          <div class="footer">
            <p><strong>SmartCarePlus - Advanced Healthcare Management System</strong></p>
            <p>For support: support@smartcareplus.com | Emergency: 911</p>
            <p>This report was generated using AI technology and should be reviewed by a medical professional.</p>
          </div>
        </div>
      </div>
    </body>
    </html>
  `;
  
  // Open in new tab for viewing
  printWindow.document.write(html);
  printWindow.document.close();
  
  // Also trigger automatic download
  setTimeout(() => {
    printWindow.print();
  }, 500);
  
  showSuccess('PDF Report opened in new tab and download started!');
  };

  const getSeverityColor = (severity) => {
    const colors = {
      'mild': 'bg-green-100 text-green-800 border-green-300',
      'moderate': 'bg-yellow-100 text-yellow-800 border-yellow-300',
      'severe': 'bg-red-100 text-red-800 border-red-300'
    };
    return colors[severity] || colors['mild'];
  };

  const getConfidenceColor = (confidence) => {
    if (confidence >= 0.7) return 'text-green-600';
    if (confidence >= 0.4) return 'text-yellow-600';
    return 'text-red-600';
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

  const handleDownloadReport = () => {
    if (!analysis) return;
    
    const reportContent = `
AI SYMPTOM CHECKER REPORT
Generated: ${new Date().toLocaleString()}
Patient: ${user?.name || 'N/A'}

SYMPTOMS:
${symptoms.filter(s => s.name.trim()).map((s, i) => `${i + 1}. ${s.name} (${s.severity}) - Duration: ${s.duration || 'Not specified'}`).join('\n')}

PREDICTIONS:
${analysis.predictions.map((p, i) => `
${i + 1}. ${p.disease} - ${Math.round(p.confidence * 100)}% confidence
   ${p.description}
   Recommended Actions: ${p.recommendedActions?.join(', ') || 'Consult a doctor'}
`).join('\n')}

RECOMMENDED SPECIALIST: ${analysis.recommendedSpecialist || 'N/A'}

DISCLAIMER: This is an AI-powered prediction tool and should not replace professional medical advice.
    `;
    
    const blob = new Blob([reportContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `symptom-analysis-${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-cyan-50 py-8">
      <ToastContainer toasts={toasts} removeToast={removeToast} />
      <ConfirmDialog
        isOpen={deleteConfirm.isOpen}
        title="Delete Review"
        message="Are you sure you want to delete this symptom analysis review? This action cannot be undone."
        onConfirm={confirmDelete}
        onCancel={cancelDelete}
        confirmText="Delete"
        type="danger"
      />
      <div className="max-w-7xl mx-auto px-4">
        
        {/* Back Button */}
        <button
          onClick={() => navigate('/patient/dashboard')}
          className="mb-6 flex items-center space-x-2 text-gray-700 hover:text-blue-600 transition-colors group"
        >
          <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
          <span className="font-medium">Back to Dashboard</span>
        </button>

        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent flex items-center">
                <Brain className="w-10 h-10 text-blue-600 mr-3" />
                AI Symptom Checker
              </h1>
              <p className="text-gray-600 mt-2">Get AI-powered disease predictions based on your symptoms</p>
            </div>
            {analysis && (
              <button
                onClick={handleDownloadReport}
                className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-lg hover:from-green-600 hover:to-emerald-600 transition-all shadow-md"
              >
                <Download className="w-5 h-5" />
                <span>Download Report</span>
              </button>
            )}
          </div>
          
          {/* Info Banner */}
          <div className="mt-6 bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-start space-x-3">
            <Info className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
            <div className="text-sm text-blue-800">
              <p className="font-semibold mb-1">How it works:</p>
              <p>Our AI analyzes your symptoms using advanced machine learning algorithms trained on medical data. Enter your symptoms, severity, and duration for more accurate predictions.</p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="mb-6 flex flex-wrap gap-4">
          <button
            onClick={() => setShowHistory(!showHistory)}
            className="px-6 py-3 bg-white rounded-lg shadow-md hover:shadow-lg transition-all flex items-center space-x-2 text-gray-700 font-medium"
          >
            <FileText className="w-5 h-5" />
            <span>{showHistory ? 'New Analysis' : 'My Reviews'}</span>
          </button>
          
          <button
            onClick={() => navigate('/patient/doctors')}
            className="px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg shadow-md hover:shadow-lg transition-all flex items-center space-x-2 font-medium"
          >
            <Stethoscope className="w-5 h-5" />
            <span>Book Appointment</span>
          </button>
        </div>

        {showHistory ? (
          /* Previous Analysis Reviews */
          <div className="bg-white rounded-2xl shadow-xl p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-800 flex items-center">
                <Calendar className="w-6 h-6 text-blue-600 mr-2" />
                Previous Analysis Reviews
              </h2>
              <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-semibold">
                {history.length} {history.length === 1 ? 'review' : 'reviews'}
              </span>
            </div>

            {history.length === 0 ? (
              <div className="text-center py-12">
                <Brain className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600 font-semibold mb-2">No previous reviews found</p>
                <p className="text-sm text-gray-500">Your symptom analysis reviews will appear here</p>
              </div>
            ) : (
              <div className="space-y-4">
                {history.map((item) => (
                  <div
                    key={item._id}
                    className="border-2 border-gray-200 rounded-xl p-5 hover:border-blue-400 hover:shadow-xl transition-all bg-gradient-to-r from-white to-gray-50"
                  >
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <Calendar className="w-4 h-4 text-blue-600" />
                          <h3 className="font-semibold text-gray-800">
                            {formatDate(item.createdAt)}
                          </h3>
                        </div>
                        <div className="flex flex-wrap gap-2 mb-3">
                          {item.symptoms.slice(0, 3).map((symptom, idx) => (
                            <span
                              key={idx}
                              className={`px-3 py-1 rounded-full text-xs font-semibold border ${getSeverityColor(symptom.severity)}`}
                            >
                              {symptom.symptom || symptom.name}
                            </span>
                          ))}
                          {item.symptoms.length > 3 && (
                            <span className="px-3 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-800 border border-blue-300">
                              +{item.symptoms.length - 3} more
                            </span>
                          )}
                        </div>
                        <div className="flex items-center space-x-2 text-sm mb-3">
                          <TrendingUp className="w-4 h-4 text-green-600" />
                          <span className="text-gray-700">
                            <span className="font-semibold">Top:</span> {item.predictions[0]?.disease}
                          </span>
                          <span className="px-2 py-0.5 bg-green-100 text-green-800 rounded text-xs font-semibold">
                            {Math.round(item.predictions[0]?.confidence * 100)}%
                          </span>
                        </div>
                        
                        {/* Action Buttons */}
                        <div className="grid grid-cols-3 gap-2 mt-3">
                          <button
                            onClick={() => viewPastAnalysis(item._id)}
                            className="px-3 py-2 bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-lg hover:from-blue-600 hover:to-cyan-600 transition-all shadow-md hover:shadow-lg flex items-center justify-center space-x-1 font-medium text-sm"
                          >
                            <Search className="w-4 h-4" />
                            <span>View</span>
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              downloadReviewPDF(item);
                            }}
                            className="px-3 py-2 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-lg hover:from-green-600 hover:to-emerald-600 transition-all shadow-md hover:shadow-lg flex items-center justify-center space-x-1 font-medium text-sm"
                          >
                            <Download className="w-4 h-4" />
                            <span>PDF</span>
                          </button>
                          <button
                            onClick={(e) => deleteReview(item._id, e)}
                            className="px-3 py-2 bg-gradient-to-r from-red-500 to-rose-500 text-white rounded-lg hover:from-red-600 hover:to-rose-600 transition-all shadow-md hover:shadow-lg flex items-center justify-center space-x-1 font-medium text-sm"
                          >
                            <Trash2 className="w-4 h-4" />
                            <span>Delete</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          /* Analysis Form and Results */
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            
            {/* Left Column - Input Form */}
            <div className="space-y-6">
              
              {/* Symptom Input */}
              <div className="bg-white rounded-2xl shadow-xl p-6 border-t-4 border-blue-500">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-2xl font-bold text-gray-800">Enter Your Symptoms</h2>
                  <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-semibold">
                    {symptoms.filter(s => s.name.trim()).length} symptom{symptoms.filter(s => s.name.trim()).length !== 1 ? 's' : ''}
                  </span>
                </div>
                
                <div className="space-y-4">
                  {symptoms.map((symptom, index) => (
                    <div key={index} className="border-2 border-gray-200 rounded-xl p-4 hover:border-blue-300 transition-all bg-gradient-to-r from-white to-blue-50">
                      <div className="flex justify-between items-start mb-3">
                        <h3 className="font-semibold text-gray-700 flex items-center">
                          <span className="w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-xs mr-2">
                            {index + 1}
                          </span>
                          Symptom {index + 1}
                        </h3>
                        {symptoms.length > 1 && (
                          <button
                            onClick={() => removeSymptom(index)}
                            className="text-red-500 hover:text-red-700"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>

                      <div className="space-y-3">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Symptom Name *
                          </label>
                          <select
                            value={symptom.name}
                            onChange={(e) => updateSymptom(index, 'name', e.target.value)}
                            className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-800 font-medium hover:border-blue-400 transition-all cursor-pointer"
                          >
                            <option value="" className="text-gray-400">Select a symptom...</option>
                            {commonSymptoms.map((s, i) => (
                              <option key={i} value={s} className="text-gray-800 py-2">
                                {s}
                              </option>
                            ))}
                          </select>
                          <p className="text-xs text-gray-500 mt-1">Choose from common symptoms or type to search</p>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Severity Level
                          </label>
                          <select
                            value={symptom.severity}
                            onChange={(e) => updateSymptom(index, 'severity', e.target.value)}
                            className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-800 font-medium hover:border-blue-400 transition-all cursor-pointer"
                          >
                            <option value="mild" className="text-green-700 py-2">🟢 Mild - Slight discomfort</option>
                            <option value="moderate" className="text-yellow-700 py-2">🟡 Moderate - Noticeable discomfort</option>
                            <option value="severe" className="text-red-700 py-2">🔴 Severe - Significant pain/distress</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Duration (optional)
                          </label>
                          <input
                            type="text"
                            value={symptom.duration}
                            onChange={(e) => updateSymptom(index, 'duration', e.target.value)}
                            placeholder="e.g., 3 days, 1 week, 2 hours"
                            className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-800 hover:border-blue-400 transition-all"
                          />
                          <p className="text-xs text-gray-500 mt-1">How long have you had this symptom?</p>
                        </div>
                      </div>
                    </div>
                  ))}

                  <button
                    onClick={addSymptom}
                    className="w-full py-3 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-blue-500 hover:text-blue-500 transition-all flex items-center justify-center space-x-2"
                  >
                    <Plus className="w-5 h-5" />
                    <span>Add Another Symptom</span>
                  </button>
                </div>
              </div>

              {/* Additional Information */}
              <div className="bg-white rounded-2xl shadow-xl p-6 border-t-4 border-purple-500">
                <h2 className="text-2xl font-bold text-gray-800 mb-4 flex items-center">
                  <Activity className="w-6 h-6 text-purple-600 mr-2" />
                  Additional Information
                </h2>
                <p className="text-sm text-gray-600 mb-4">Providing additional details helps improve prediction accuracy</p>
                
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Age (optional)
                      </label>
                      <input
                        type="number"
                        value={patientAge}
                        onChange={(e) => setPatientAge(e.target.value)}
                        placeholder="25"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Gender (optional)
                      </label>
                      <select
                        value={patientGender}
                        onChange={(e) => setPatientGender(e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="">Select...</option>
                        <option value="male">Male</option>
                        <option value="female">Female</option>
                        <option value="other">Other</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Medical History (optional)
                    </label>
                    <textarea
                      value={medicalHistory}
                      onChange={(e) => setMedicalHistory(e.target.value)}
                      placeholder="Any chronic conditions, allergies, or relevant medical history..."
                      rows={4}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col space-y-3">
                <button
                  onClick={handleAnalyze}
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-blue-500 to-purple-500 text-white py-4 rounded-xl hover:from-blue-600 hover:to-purple-600 transition-all font-semibold flex items-center justify-center space-x-2 disabled:opacity-50 shadow-lg hover:shadow-xl"
                >
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                      <span>Analyzing your symptoms...</span>
                    </>
                  ) : (
                    <>
                      <Brain className="w-5 h-5" />
                      <span>Analyze Symptoms with AI</span>
                    </>
                  )}
                </button>
                <button
                  onClick={handleReset}
                  className="w-full px-6 py-3 bg-gray-200 text-gray-700 rounded-xl hover:bg-gray-300 transition-all font-semibold"
                >
                  Reset Form
                </button>
              </div>
            </div>

            {/* Right Column - Results */}
            <div>
              {analysis ? (
                <div className="space-y-6">
                  
                  {/* Disclaimer */}
                  <div className="bg-yellow-50 border-l-4 border-yellow-500 p-4 rounded-lg">
                    <div className="flex items-start">
                      <AlertTriangle className="w-5 h-5 text-yellow-600 mt-0.5 mr-3" />
                      <div>
                        <h3 className="font-semibold text-yellow-900">Medical Disclaimer</h3>
                        <p className="text-sm text-yellow-800 mt-1">
                          This is an AI-powered prediction tool and should not replace professional medical advice. 
                          Please consult a healthcare provider for accurate diagnosis.
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Predictions */}
                  <div className="bg-white rounded-2xl shadow-xl p-6 border-t-4 border-green-500">
                    <div className="flex items-center justify-between mb-6">
                      <h2 className="text-2xl font-bold text-gray-800 flex items-center">
                        <TrendingUp className="w-6 h-6 text-blue-600 mr-2" />
                        Possible Conditions
                      </h2>
                      <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-xs font-semibold">
                        {analysis.predictions.length} predictions
                      </span>
                    </div>

                    <div className="space-y-4">
                      {analysis.predictions.map((prediction, index) => (
                        <div
                          key={index}
                          className={`border-2 rounded-xl p-5 hover:shadow-xl transition-all ${
                            index === 0 ? 'border-green-400 bg-gradient-to-r from-green-50 to-emerald-50' :
                            index === 1 ? 'border-yellow-400 bg-gradient-to-r from-yellow-50 to-amber-50' :
                            'border-gray-200 bg-gradient-to-r from-white to-gray-50'
                          }`}
                        >
                          <div className="flex justify-between items-start mb-3">
                            <div className="flex items-center space-x-3">
                              <span className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center font-bold text-white ${
                                index === 0 ? 'bg-gradient-to-r from-green-500 to-emerald-500' :
                                index === 1 ? 'bg-gradient-to-r from-yellow-500 to-amber-500' :
                                'bg-gradient-to-r from-gray-400 to-gray-500'
                              }`}>
                                {index + 1}
                              </span>
                              <h3 className="text-lg font-semibold text-gray-800">
                                {prediction.disease}
                              </h3>
                            </div>
                            <div className="text-right">
                              <span className={`text-3xl font-bold ${getConfidenceColor(prediction.confidence)}`}>
                                {Math.round(prediction.confidence * 100)}%
                              </span>
                              <p className="text-xs text-gray-600">confidence</p>
                            </div>
                          </div>
                          <p className="text-sm text-gray-600 mb-3">{prediction.description}</p>
                          
                          {prediction.matchedSymptoms && prediction.matchedSymptoms.length > 0 && (
                            <div className="mb-3">
                              <p className="text-xs font-semibold text-gray-700 mb-2">Matched Symptoms:</p>
                              <div className="flex flex-wrap gap-2">
                                {prediction.matchedSymptoms.map((symptom, idx) => (
                                  <span
                                    key={idx}
                                    className="px-2 py-1 bg-green-100 text-green-800 rounded text-xs flex items-center"
                                  >
                                    <CheckCircle className="w-3 h-3 mr-1" />
                                    {symptom}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}

                          {prediction.recommendedActions && prediction.recommendedActions.length > 0 && (
                            <div>
                              <p className="text-xs font-semibold text-gray-700 mb-2">Recommended Actions:</p>
                              <ul className="text-sm text-gray-600 space-y-1">
                                {prediction.recommendedActions.map((action, idx) => (
                                  <li key={idx} className="flex items-start">
                                    <span className="text-blue-500 mr-2">•</span>
                                    {action}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Recommended Specialists */}
                  {analysis.recommendedSpecialist && (
                    <div className="bg-white rounded-2xl shadow-xl p-6 border-t-4 border-purple-500">
                      <h2 className="text-2xl font-bold text-gray-800 mb-4 flex items-center">
                        <Stethoscope className="w-6 h-6 text-purple-600 mr-2" />
                        Recommended Specialist
                      </h2>
                      <div className="bg-gradient-to-r from-purple-50 to-pink-50 border-2 border-purple-400 p-6 rounded-xl">
                        <div className="flex items-center space-x-3 mb-3">
                          <div className="w-12 h-12 bg-purple-500 rounded-full flex items-center justify-center">
                            <Stethoscope className="w-6 h-6 text-white" />
                          </div>
                          <p className="font-bold text-purple-900 text-xl">
                            {analysis.recommendedSpecialist}
                          </p>
                        </div>
                        <p className="text-sm text-purple-700 mb-4">
                          Based on your symptoms, consulting with this specialist is recommended for accurate diagnosis and treatment.
                        </p>
                        <button
                          onClick={() => navigate('/patient/doctors')}
                          className="w-full bg-gradient-to-r from-purple-500 to-pink-500 text-white py-3 rounded-lg hover:from-purple-600 hover:to-pink-600 transition-all font-semibold flex items-center justify-center space-x-2"
                        >
                          <Calendar className="w-5 h-5" />
                          <span>Book Appointment Now</span>
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Next Steps */}
                  <div className="bg-white rounded-2xl shadow-xl p-6 border-t-4 border-orange-500">
                    <h2 className="text-2xl font-bold text-gray-800 mb-4 flex items-center">
                      <BookOpen className="w-6 h-6 text-orange-600 mr-2" />
                      Next Steps
                    </h2>
                    <div className="space-y-3">
                      <div className="flex items-start space-x-3 p-3 bg-orange-50 rounded-lg">
                        <CheckCircle className="w-5 h-5 text-orange-600 mt-0.5 flex-shrink-0" />
                        <p className="text-sm text-gray-700">
                          <span className="font-semibold">Save this report:</span> Download a copy for your records
                        </p>
                      </div>
                      <div className="flex items-start space-x-3 p-3 bg-orange-50 rounded-lg">
                        <CheckCircle className="w-5 h-5 text-orange-600 mt-0.5 flex-shrink-0" />
                        <p className="text-sm text-gray-700">
                          <span className="font-semibold">Consult a doctor:</span> Schedule an appointment for professional diagnosis
                        </p>
                      </div>
                      <div className="flex items-start space-x-3 p-3 bg-orange-50 rounded-lg">
                        <CheckCircle className="w-5 h-5 text-orange-600 mt-0.5 flex-shrink-0" />
                        <p className="text-sm text-gray-700">
                          <span className="font-semibold">Monitor symptoms:</span> Keep track of any changes or new symptoms
                        </p>
                      </div>
                      <div className="flex items-start space-x-3 p-3 bg-orange-50 rounded-lg">
                        <CheckCircle className="w-5 h-5 text-orange-600 mt-0.5 flex-shrink-0" />
                        <p className="text-sm text-gray-700">
                          <span className="font-semibold">Seek emergency care:</span> If symptoms worsen rapidly, visit ER immediately
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="bg-white rounded-2xl shadow-xl p-12 text-center border-2 border-dashed border-gray-300">
                  <div className="mb-6">
                    <Brain className="w-24 h-24 text-blue-300 mx-auto mb-4 animate-pulse" />
                    <h3 className="text-2xl font-bold text-gray-800 mb-2">
                      Ready to Analyze
                    </h3>
                    <p className="text-gray-600 max-w-md mx-auto">
                      Enter your symptoms in the form and click "Analyze Symptoms with AI" to get instant predictions powered by advanced machine learning
                    </p>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 mt-8 text-left">
                    <div className="p-4 bg-blue-50 rounded-lg">
                      <TrendingUp className="w-8 h-8 text-blue-600 mb-2" />
                      <h4 className="font-semibold text-sm text-gray-800 mb-1">Accurate Predictions</h4>
                      <p className="text-xs text-gray-600">AI-powered analysis of your symptoms</p>
                    </div>
                    <div className="p-4 bg-purple-50 rounded-lg">
                      <Stethoscope className="w-8 h-8 text-purple-600 mb-2" />
                      <h4 className="font-semibold text-sm text-gray-800 mb-1">Specialist Recommendations</h4>
                      <p className="text-xs text-gray-600">Get matched with the right doctor</p>
                    </div>
                    <div className="p-4 bg-green-50 rounded-lg">
                      <CheckCircle className="w-8 h-8 text-green-600 mb-2" />
                      <h4 className="font-semibold text-sm text-gray-800 mb-1">Instant Results</h4>
                      <p className="text-xs text-gray-600">Get results in seconds</p>
                    </div>
                    <div className="p-4 bg-orange-50 rounded-lg">
                      <FileText className="w-8 h-8 text-orange-600 mb-2" />
                      <h4 className="font-semibold text-sm text-gray-800 mb-1">Save History</h4>
                      <p className="text-xs text-gray-600">Track your health over time</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Review Details Modal */}
        {showReviewModal && selectedReview && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
            <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              
              {/* Modal Header */}
              <div className="sticky top-0 bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6 rounded-t-2xl">
                <div className="flex justify-between items-start">
                  <div>
                    <h2 className="text-2xl font-bold mb-2 flex items-center">
                      <FileText className="w-7 h-7 mr-3" />
                      Review Details
                    </h2>
                    <p className="text-blue-100 text-sm">
                      Analysis from {formatDate(selectedReview.createdAt)}
                    </p>
                  </div>
                  <button
                    onClick={closeReviewModal}
                    className="text-white hover:bg-white hover:bg-opacity-20 rounded-full p-2 transition-all"
                  >
                    <XCircle className="w-6 h-6" />
                  </button>
                </div>
              </div>

              {/* Modal Content */}
              <div className="p-6 space-y-6">
                
                {/* Reported Symptoms */}
                <div>
                  <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center">
                    <Activity className="w-5 h-5 text-blue-600 mr-2" />
                    Reported Symptoms
                  </h3>
                  <div className="grid gap-3">
                    {selectedReview.symptoms?.map((symptom, index) => (
                      <div
                        key={index}
                        className={`border-2 rounded-xl p-4 ${getSeverityColor(symptom.severity)}`}
                      >
                        <div className="flex items-start space-x-3">
                          <span className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-bold">
                            {index + 1}
                          </span>
                          <div className="flex-1">
                            <p className="font-semibold text-gray-800">
                              {symptom.symptom || symptom.name}
                            </p>
                            <div className="flex items-center space-x-4 text-sm mt-1">
                              <span className="font-medium">
                                Severity: <span className="uppercase">{symptom.severity}</span>
                              </span>
                              {symptom.duration && (
                                <span className="text-gray-600">
                                  Duration: {symptom.duration}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* AI Predictions */}
                <div>
                  <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center">
                    <TrendingUp className="w-5 h-5 text-purple-600 mr-2" />
                    AI Predictions ({selectedReview.predictions?.length || 0})
                  </h3>
                  <div className="space-y-4">
                    {selectedReview.predictions?.map((prediction, index) => (
                      <div
                        key={index}
                        className={`border-2 rounded-xl p-5 ${
                          index === 0 ? 'border-green-400 bg-gradient-to-r from-green-50 to-emerald-50' :
                          index === 1 ? 'border-yellow-400 bg-gradient-to-r from-yellow-50 to-amber-50' :
                          'border-gray-200 bg-gradient-to-r from-white to-gray-50'
                        }`}
                      >
                        <div className="flex justify-between items-start mb-3">
                          <div className="flex items-center space-x-3">
                            <span className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center font-bold text-white ${
                              index === 0 ? 'bg-gradient-to-r from-green-500 to-emerald-500' :
                              index === 1 ? 'bg-gradient-to-r from-yellow-500 to-amber-500' :
                              'bg-gradient-to-r from-gray-400 to-gray-500'
                            }`}>
                              {index + 1}
                            </span>
                            <h4 className="text-lg font-bold text-gray-800">
                              {prediction.disease}
                            </h4>
                          </div>
                          <div className="text-right">
                            <span className={`text-2xl font-bold ${getConfidenceColor(prediction.confidence)}`}>
                              {Math.round(prediction.confidence * 100)}%
                            </span>
                            <p className="text-xs text-gray-600">confidence</p>
                          </div>
                        </div>
                        
                        <p className="text-sm text-gray-600 mb-3">{prediction.description}</p>
                        
                        {prediction.matchedSymptoms && prediction.matchedSymptoms.length > 0 && (
                          <div className="mb-3">
                            <p className="text-xs font-semibold text-gray-700 mb-2">Matched Symptoms:</p>
                            <div className="flex flex-wrap gap-2">
                              {prediction.matchedSymptoms.map((symptom, idx) => (
                                <span
                                  key={idx}
                                  className="px-2 py-1 bg-green-100 text-green-800 rounded text-xs flex items-center"
                                >
                                  <CheckCircle className="w-3 h-3 mr-1" />
                                  {symptom}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}

                        {prediction.recommendedActions && prediction.recommendedActions.length > 0 && (
                          <div>
                            <p className="text-xs font-semibold text-gray-700 mb-2">Recommended Actions:</p>
                            <ul className="text-sm text-gray-600 space-y-1">
                              {prediction.recommendedActions.map((action, idx) => (
                                <li key={idx} className="flex items-start">
                                  <span className="text-blue-500 mr-2">•</span>
                                  {action}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Recommended Specialist */}
                {selectedReview.recommendedSpecialist && (
                  <div>
                    <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center">
                      <Stethoscope className="w-5 h-5 text-purple-600 mr-2" />
                      Recommended Specialist
                    </h3>
                    <div className="bg-gradient-to-r from-purple-50 to-pink-50 border-2 border-purple-400 p-5 rounded-xl">
                      <div className="flex items-center space-x-3">
                        <div className="w-12 h-12 bg-purple-500 rounded-full flex items-center justify-center flex-shrink-0">
                          <Stethoscope className="w-6 h-6 text-white" />
                        </div>
                        <div>
                          <p className="font-bold text-purple-900 text-lg">
                            {selectedReview.recommendedSpecialist}
                          </p>
                          <p className="text-sm text-purple-700">
                            Consult this specialist for accurate diagnosis
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Disclaimer */}
                <div className="bg-yellow-50 border-l-4 border-yellow-500 p-4 rounded-lg">
                  <div className="flex items-start">
                    <AlertTriangle className="w-5 h-5 text-yellow-600 mt-0.5 mr-3 flex-shrink-0" />
                    <div>
                      <h3 className="font-semibold text-yellow-900 mb-1">Medical Disclaimer</h3>
                      <p className="text-sm text-yellow-800">
                        This AI-powered analysis is for informational purposes only. Always consult a healthcare professional for proper diagnosis and treatment.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="sticky bottom-0 bg-gray-50 px-6 py-4 rounded-b-2xl border-t-2 border-gray-200">
                <div className="flex space-x-3">
                  <button
                    onClick={() => downloadReviewPDF(selectedReview)}
                    className="flex-1 px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-xl hover:from-green-600 hover:to-emerald-600 transition-all shadow-md hover:shadow-lg flex items-center justify-center space-x-2 font-semibold"
                  >
                    <Download className="w-5 h-5" />
                    <span>Download PDF Report</span>
                  </button>
                  <button
                    onClick={closeReviewModal}
                    className="px-6 py-3 bg-gray-200 text-gray-700 rounded-xl hover:bg-gray-300 transition-all font-semibold"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AISymptomChecker;
