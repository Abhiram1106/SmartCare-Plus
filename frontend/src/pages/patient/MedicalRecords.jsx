import React, { useState, useEffect } from 'react';
import { 
  Heart, 
  Activity, 
  Thermometer, 
  AlertCircle,
  Pill,
  FileText,
  User,
  Phone,
  Calendar,
  TrendingUp,
  Plus,
  Edit2,
  ArrowLeft,
  Download,
  Share2,
  Clock,
  Shield,
  CheckCircle2,
  XCircle,
  Info,
  Weight,
  Ruler,
  Droplet,
  Wind,
  X
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../hooks/useToast';
import ToastContainer from '../../components/ToastContainer';

const MedicalRecords = () => {
  const { user } = useAuth();
  const { showSuccess, showError } = useToast();
  const navigate = useNavigate();
  const [medicalRecord, setMedicalRecord] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // Modals
  const [showBasicInfoModal, setShowBasicInfoModal] = useState(false);
  const [showVitalsModal, setShowVitalsModal] = useState(false);
  const [showAllergyModal, setShowAllergyModal] = useState(false);
  const [showMedicationModal, setShowMedicationModal] = useState(false);
  const [showConditionModal, setShowConditionModal] = useState(false);

  // Form data
  const [basicInfo, setBasicInfo] = useState({
    bloodType: '',
    height: '',
    weight: '',
    emergencyContact: {
      name: '',
      phone: '',
      relationship: '',
      email: ''
    }
  });

  const [vitalsData, setVitalsData] = useState({
    height: '',
    weight: '',
    bloodPressure: { systolic: '', diastolic: '' },
    heartRate: '',
    temperature: '',
    respiratoryRate: '',
    oxygenSaturation: ''
  });

  const [allergyData, setAllergyData] = useState({
    allergen: '',
    reaction: '',
    severity: 'mild',
    diagnosedDate: ''
  });

  const [medicationData, setMedicationData] = useState({
    name: '',
    dosage: '',
    frequency: '',
    startDate: '',
    endDate: ''
  });

  const [conditionData, setConditionData] = useState({
    condition: '',
    diagnosedDate: '',
    status: 'active',
    notes: ''
  });

  useEffect(() => {
    if (user) {
      fetchMedicalRecord();
    }
  }, [user]);

  const fetchMedicalRecord = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/ehr/${user.id}`);
      setMedicalRecord(response.data.data);
      
      // Populate basic info
      setBasicInfo({
        bloodType: response.data.data.bloodType || '',
        height: getLatestVital(response.data.data.vitalSigns, 'height') || '',
        weight: getLatestVital(response.data.data.vitalSigns, 'weight') || '',
        emergencyContact: response.data.data.emergencyContact || {
          name: '',
          phone: '',
          relationship: '',
          email: ''
        }
      });
    } catch (error) {
      console.error('Error fetching medical record:', error);
      showError('Failed to load medical records');
    } finally {
      setLoading(false);
    }
  };

  const getLatestVital = (vitalSigns, field) => {
    if (!vitalSigns || vitalSigns.length === 0) return null;
    const latest = vitalSigns[vitalSigns.length - 1];
    return latest[field] || null;
  };

  const handleUpdateBasicInfo = async () => {
    try {
      await api.put(`/ehr/${user.id}/basic`, basicInfo);
      showSuccess('Basic information updated successfully!');
      setShowBasicInfoModal(false);
      fetchMedicalRecord();
    } catch (error) {
      console.error('Error updating basic info:', error);
      showError('Failed to update basic information');
    }
  };

  const handleAddVitals = async () => {
    try {
      const vitalsPayload = {
        ...vitalsData,
        bloodPressure: (vitalsData.bloodPressure.systolic && vitalsData.bloodPressure.diastolic) 
          ? vitalsData.bloodPressure 
          : undefined
      };
      
      await api.post(`/ehr/${user.id}/vitals`, vitalsPayload);
      showSuccess('Vital signs recorded successfully!');
      setShowVitalsModal(false);
      setVitalsData({
        height: '',
        weight: '',
        bloodPressure: { systolic: '', diastolic: '' },
        heartRate: '',
        temperature: '',
        respiratoryRate: '',
        oxygenSaturation: ''
      });
      fetchMedicalRecord();
    } catch (error) {
      console.error('Error adding vitals:', error);
      showError('Failed to record vital signs');
    }
  };

  const handleAddAllergy = async () => {
    try {
      await api.post(`/ehr/${user.id}/allergies`, allergyData);
      showSuccess('Allergy added successfully!');
      setShowAllergyModal(false);
      setAllergyData({ allergen: '', reaction: '', severity: 'mild', diagnosedDate: '' });
      fetchMedicalRecord();
    } catch (error) {
      console.error('Error adding allergy:', error);
      showError('Failed to add allergy');
    }
  };

  const handleAddMedication = async () => {
    try {
      await api.post(`/ehr/${user.id}/medications`, medicationData);
      showSuccess('Medication added successfully!');
      setShowMedicationModal(false);
      setMedicationData({ name: '', dosage: '', frequency: '', startDate: '', endDate: '' });
      fetchMedicalRecord();
    } catch (error) {
      console.error('Error adding medication:', error);
      showError('Failed to add medication');
    }
  };

  const handleAddCondition = async () => {
    try {
      await api.post(`/ehr/${user.id}/chronic-conditions`, conditionData);
      showSuccess('Chronic condition added successfully!');
      setShowConditionModal(false);
      setConditionData({ condition: '', diagnosedDate: '', status: 'active', notes: '' });
      fetchMedicalRecord();
    } catch (error) {
      console.error('Error adding condition:', error);
      showError('Failed to add chronic condition');
    }
  };

  const calculateBMI = () => {
    const latestHeight = getLatestVital(medicalRecord?.vitalSigns, 'height');
    const latestWeight = getLatestVital(medicalRecord?.vitalSigns, 'weight');
    
    if (latestHeight && latestWeight) {
      const heightInMeters = latestHeight / 100;
      const bmi = latestWeight / (heightInMeters * heightInMeters);
      return bmi.toFixed(1);
    }
    return 'N/A';
  };

  const getBMICategory = (bmi) => {
    if (bmi < 18.5) return { category: 'Underweight', color: 'text-yellow-600' };
    if (bmi < 25) return { category: 'Normal', color: 'text-green-600' };
    if (bmi < 30) return { category: 'Overweight', color: 'text-orange-600' };
    return { category: 'Obese', color: 'text-red-600' };
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const handleDownloadRecords = () => {
    const recordContent = `
MEDICAL RECORDS
Patient: ${user?.name || 'N/A'}
Patient ID: ${user?.userId || 'N/A'}
Generated: ${new Date().toLocaleString()}

BASIC INFORMATION:
Blood Type: ${medicalRecord?.bloodType || 'Not Set'}
Height: ${medicalRecord?.height || 'N/A'} cm
Weight: ${medicalRecord?.weight || 'N/A'} kg
BMI: ${calculateBMI()}

EMERGENCY CONTACT:
Name: ${medicalRecord?.emergencyContact?.name || 'N/A'}
Phone: ${medicalRecord?.emergencyContact?.phone || 'N/A'}
Relationship: ${medicalRecord?.emergencyContact?.relationship || 'N/A'}

ALLERGIES:
${medicalRecord?.allergies?.map((a, i) => `${i + 1}. ${a.allergen} (${a.severity}) - ${a.reaction}`).join('\n') || 'None recorded'}

CURRENT MEDICATIONS:
${medicalRecord?.currentMedications?.map((m, i) => `${i + 1}. ${m.name} - ${m.dosage}, ${m.frequency}`).join('\n') || 'None recorded'}

CHRONIC CONDITIONS:
${medicalRecord?.chronicConditions?.map((c, i) => `${i + 1}. ${c.condition} (${c.status || 'N/A'})`).join('\n') || 'None recorded'}

This is a confidential medical document. Keep it secure.
    `;
    
    const blob = new Blob([recordContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `medical-record-${user?.userId || 'patient'}-${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-cyan-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading your medical records...</p>
        </div>
      </div>
    );
  }

  const bmi = parseFloat(calculateBMI());
  const bmiInfo = !isNaN(bmi) ? getBMICategory(bmi) : { category: 'N/A', color: 'text-gray-600' };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-cyan-50 py-8">
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
                <FileText className="w-10 h-10 text-blue-600 mr-3" />
                My Medical Records
              </h1>
              <p className="text-gray-600 mt-2">Your comprehensive electronic health record - Private & Secure</p>
            </div>
            <button
              onClick={handleDownloadRecords}
              className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-lg hover:from-green-600 hover:to-emerald-600 transition-all shadow-md"
            >
              <Download className="w-5 h-5" />
              <span>Download</span>
            </button>
          </div>

          {/* Security Banner */}
          <div className="mt-6 bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-start space-x-3">
            <Shield className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
            <div className="text-sm text-blue-800">
              <p className="font-semibold mb-1">Secure & Confidential</p>
              <p>Your medical records are encrypted and protected. Only you and your authorized healthcare providers can access this information.</p>
            </div>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-lg p-6 border-t-4 border-red-500 hover:shadow-xl transition-all">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium mb-1">Blood Type</p>
                <p className="text-3xl font-bold text-red-600">{medicalRecord?.bloodType || 'Not Set'}</p>
                <p className="text-xs text-gray-500 mt-1">
                  {medicalRecord?.bloodType ? '✓ Verified' : '⚠ Update Required'}
                </p>
              </div>
              <div className="w-14 h-14 bg-gradient-to-br from-red-100 to-red-200 rounded-full flex items-center justify-center">
                <Activity className="w-7 h-7 text-red-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6 border-t-4 border-blue-500 hover:shadow-xl transition-all">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium mb-1">BMI Index</p>
                <p className={`text-3xl font-bold ${bmiInfo.color}`}>{calculateBMI()}</p>
                <p className="text-xs text-gray-500 mt-1">{bmiInfo.category}</p>
              </div>
              <div className="w-14 h-14 bg-gradient-to-br from-blue-100 to-blue-200 rounded-full flex items-center justify-center">
                <TrendingUp className="w-7 h-7 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6 border-t-4 border-orange-500 hover:shadow-xl transition-all">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium mb-1">Allergies</p>
                <p className="text-3xl font-bold text-orange-600">{medicalRecord?.allergies?.length || 0}</p>
                <p className="text-xs text-gray-500 mt-1">
                  {medicalRecord?.allergies?.length > 0 ? 'Recorded' : 'None'}
                </p>
              </div>
              <div className="w-14 h-14 bg-gradient-to-br from-orange-100 to-orange-200 rounded-full flex items-center justify-center">
                <AlertCircle className="w-7 h-7 text-orange-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6 border-t-4 border-purple-500 hover:shadow-xl transition-all">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium mb-1">Medications</p>
                <p className="text-3xl font-bold text-purple-600">
                  {medicalRecord?.medications?.filter(m => m.status === 'active').length || 0}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  {medicalRecord?.medications?.filter(m => m.status === 'active').length > 0 ? 'Active' : 'None'}
                </p>
              </div>
              <div className="w-14 h-14 bg-gradient-to-br from-purple-100 to-purple-200 rounded-full flex items-center justify-center">
                <Pill className="w-7 h-7 text-purple-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
          <button
            onClick={() => setShowBasicInfoModal(true)}
            className="flex items-center justify-center space-x-2 px-4 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg hover:from-blue-600 hover:to-blue-700 transition-all shadow-md"
          >
            <User className="w-5 h-5" />
            <span className="font-medium">Basic Info</span>
          </button>
          
          <button
            onClick={() => setShowVitalsModal(true)}
            className="flex items-center justify-center space-x-2 px-4 py-3 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg hover:from-green-600 hover:to-green-700 transition-all shadow-md"
          >
            <Activity className="w-5 h-5" />
            <span className="font-medium">Add Vitals</span>
          </button>
          
          <button
            onClick={() => setShowAllergyModal(true)}
            className="flex items-center justify-center space-x-2 px-4 py-3 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-lg hover:from-orange-600 hover:to-orange-700 transition-all shadow-md"
          >
            <AlertCircle className="w-5 h-5" />
            <span className="font-medium">Add Allergy</span>
          </button>
          
          <button
            onClick={() => setShowMedicationModal(true)}
            className="flex items-center justify-center space-x-2 px-4 py-3 bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-lg hover:from-purple-600 hover:to-purple-700 transition-all shadow-md"
          >
            <Pill className="w-5 h-5" />
            <span className="font-medium">Add Med</span>
          </button>
          
          <button
            onClick={() => setShowConditionModal(true)}
            className="flex items-center justify-center space-x-2 px-4 py-3 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-lg hover:from-red-600 hover:to-red-700 transition-all shadow-md"
          >
            <Heart className="w-5 h-5" />
            <span className="font-medium">Add Condition</span>
          </button>
        </div>

        {/* Basic Information */}
        <div className="bg-white rounded-2xl shadow-xl p-6 mb-6 border-t-4 border-blue-500">
          <h2 className="text-2xl font-bold text-gray-800 flex items-center mb-6">
            <User className="w-6 h-6 text-blue-600 mr-2" />
            Basic Information
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="flex items-center space-x-4 p-5 bg-gradient-to-r from-red-50 to-pink-50 rounded-xl border-l-4 border-red-500 hover:shadow-md transition-all">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">
                <Activity className="w-6 h-6 text-red-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">Blood Type</p>
                <p className="text-xl font-bold text-gray-800">{medicalRecord?.bloodType || 'Not Set'}</p>
              </div>
            </div>
            <div className="flex items-center space-x-4 p-5 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl border-l-4 border-green-500 hover:shadow-md transition-all">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                <TrendingUp className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">Height / Weight</p>
                <p className="text-xl font-bold text-gray-800">
                  {getLatestVital(medicalRecord?.vitalSigns, 'height') || 'N/A'} cm / {getLatestVital(medicalRecord?.vitalSigns, 'weight') || 'N/A'} kg
                </p>
              </div>
            </div>
            {medicalRecord?.emergencyContact ? (
              <>
                <div className="flex items-center space-x-4 p-5 bg-gradient-to-r from-purple-50 to-indigo-50 rounded-xl border-l-4 border-purple-500 hover:shadow-md transition-all">
                  <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <User className="w-6 h-6 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-600 mb-1">Emergency Contact</p>
                    <p className="text-xl font-bold text-gray-800">{medicalRecord.emergencyContact.name}</p>
                    <p className="text-xs text-gray-500">{medicalRecord.emergencyContact.relationship}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-4 p-5 bg-gradient-to-r from-orange-50 to-amber-50 rounded-xl border-l-4 border-orange-500 hover:shadow-md transition-all">
                  <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <Phone className="w-6 h-6 text-orange-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-600 mb-1">Contact Phone</p>
                    <p className="text-xl font-bold text-gray-800">{medicalRecord.emergencyContact.phone}</p>
                  </div>
                </div>
              </>
            ) : (
              <div className="col-span-2 p-5 bg-yellow-50 rounded-xl border-l-4 border-yellow-500">
                <div className="flex items-center space-x-3">
                  <AlertCircle className="w-5 h-5 text-yellow-600" />
                  <p className="text-sm text-yellow-800">
                    <span className="font-semibold">Emergency contact not set.</span> Click "Basic Info" button above to add emergency contact details.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Allergies */}
        {medicalRecord?.allergies && medicalRecord.allergies.length > 0 && (
          <div className="bg-white rounded-2xl shadow-xl p-6 mb-6 border-t-4 border-orange-500">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-800 flex items-center">
                <AlertCircle className="w-6 h-6 text-orange-600 mr-2" />
                Known Allergies
              </h2>
              <span className="px-3 py-1 bg-orange-100 text-orange-800 rounded-full text-sm font-semibold">
                {medicalRecord.allergies.length} {medicalRecord.allergies.length === 1 ? 'allergy' : 'allergies'}
              </span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {medicalRecord.allergies.map((allergy, index) => (
                <div key={index} className="p-5 bg-gradient-to-r from-orange-50 to-red-50 border-l-4 border-orange-500 rounded-xl hover:shadow-md transition-all">
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <AlertCircle className="w-5 h-5 text-orange-600" />
                        <h3 className="font-bold text-orange-900 text-lg">{allergy.allergen}</h3>
                      </div>
                      <p className="text-sm text-orange-700 font-medium mb-2">
                        <span className="text-gray-600">Reaction:</span> {allergy.reaction}
                      </p>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                      allergy.severity === 'severe' ? 'bg-red-500 text-white' :
                      allergy.severity === 'moderate' ? 'bg-orange-500 text-white' :
                      'bg-yellow-500 text-white'
                    }`}>
                      {allergy.severity.toUpperCase()}
                    </span>
                  </div>
                  {allergy.diagnosedDate && (
                    <div className="flex items-center space-x-2 text-xs text-gray-600">
                      <Clock className="w-3 h-3" />
                      <span>Diagnosed: {formatDate(allergy.diagnosedDate)}</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Current Medications */}
        {medicalRecord?.medications && medicalRecord.medications.filter(m => m.status === 'active').length > 0 && (
          <div className="bg-white rounded-2xl shadow-xl p-6 mb-6 border-t-4 border-purple-500">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-800 flex items-center">
                <Pill className="w-6 h-6 text-purple-600 mr-2" />
                Current Medications
              </h2>
              <span className="px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-sm font-semibold">
                {medicalRecord.medications.filter(m => m.status === 'active').length} active
              </span>
            </div>
            <div className="space-y-3">
              {medicalRecord.medications.filter(m => m.status === 'active').map((medication, index) => (
                <div key={index} className="p-5 bg-gradient-to-r from-purple-50 to-indigo-50 border-l-4 border-purple-500 rounded-xl hover:shadow-md transition-all">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <div className="w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center text-white font-bold text-sm">
                          {index + 1}
                        </div>
                        <h3 className="font-bold text-purple-900 text-lg">{medication.name}</h3>
                      </div>
                      <div className="ml-11 space-y-2">
                        <p className="text-sm text-purple-700 font-medium">
                          <span className="text-gray-600">Dosage:</span> {medication.dosage}
                        </p>
                        <p className="text-sm text-purple-700 font-medium">
                          <span className="text-gray-600">Frequency:</span> {medication.frequency}
                        </p>
                        {medication.prescribedBy && (
                          <p className="text-xs text-gray-600 flex items-center space-x-1">
                            <User className="w-3 h-3" />
                            <span>Prescribed by: {medication.prescribedBy.name}</span>
                          </p>
                        )}
                      </div>
                    </div>
                    {medication.startDate && (
                      <div className="text-right">
                        <p className="text-xs text-gray-600 flex items-center space-x-1">
                          <Clock className="w-3 h-3" />
                          <span>Since</span>
                        </p>
                        <p className="text-sm font-semibold text-gray-800">{formatDate(medication.startDate)}</p>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Chronic Conditions */}
        {medicalRecord?.chronicConditions && medicalRecord.chronicConditions.length > 0 && (
          <div className="bg-white rounded-2xl shadow-xl p-6 mb-6 border-t-4 border-red-500">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-800 flex items-center">
                <Heart className="w-6 h-6 text-red-600 mr-2" />
                Chronic Conditions
              </h2>
              <span className="px-3 py-1 bg-red-100 text-red-800 rounded-full text-sm font-semibold">
                {medicalRecord.chronicConditions.length} condition{medicalRecord.chronicConditions.length !== 1 ? 's' : ''}
              </span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {medicalRecord.chronicConditions.map((condition, index) => (
                <div key={index} className="p-5 bg-gradient-to-r from-red-50 to-pink-50 border-l-4 border-red-500 rounded-xl hover:shadow-md transition-all">
                  <div className="flex items-start space-x-3 mb-3">
                    <Heart className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
                    <div className="flex-1">
                      <h3 className="font-bold text-red-900 text-lg mb-2">{condition.condition}</h3>
                      <div className="space-y-2">
                        {condition.diagnosedDate && (
                          <p className="text-xs text-gray-600 flex items-center space-x-1">
                            <Clock className="w-3 h-3" />
                            <span>Diagnosed: {formatDate(condition.diagnosedDate)}</span>
                          </p>
                        )}
                        {condition.status && (
                          <span className={`inline-flex items-center space-x-1 px-3 py-1 rounded-full text-xs font-bold ${
                            condition.status === 'controlled' ? 'bg-green-500 text-white' :
                            'bg-yellow-500 text-white'
                          }`}>
                            {condition.status === 'controlled' ? (
                              <CheckCircle2 className="w-3 h-3" />
                            ) : (
                              <AlertCircle className="w-3 h-3" />
                            )}
                            <span>{condition.status.toUpperCase()}</span>
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Recent Vital Signs */}
        {medicalRecord?.vitalSigns && medicalRecord.vitalSigns.length > 0 && (
          <div className="bg-white rounded-2xl shadow-xl p-6 border-t-4 border-blue-500">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-800 flex items-center">
                <Activity className="w-6 h-6 text-blue-600 mr-2" />
                Recent Vital Signs
              </h2>
              <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-semibold">
                Last {Math.min(5, medicalRecord.vitalSigns.length)} records
              </span>
            </div>
            <div className="space-y-4">
              {medicalRecord.vitalSigns.slice(-5).reverse().map((vital, index) => (
                <div key={index} className="p-5 bg-gradient-to-r from-blue-50 to-cyan-50 border-l-4 border-blue-500 rounded-xl hover:shadow-md transition-all">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center space-x-2">
                      <Activity className="w-5 h-5 text-blue-600" />
                      <span className="font-semibold text-gray-800">Reading #{medicalRecord.vitalSigns.length - index}</span>
                    </div>
                    <div className="flex items-center space-x-2 text-xs text-gray-600">
                      <Clock className="w-3 h-3" />
                      <span>{formatDate(vital.recordedAt)}</span>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                    {vital.temperature && (
                      <div className="p-3 bg-white rounded-lg border border-blue-200">
                        <div className="flex items-center space-x-2 mb-1">
                          <Thermometer className="w-4 h-4 text-red-500" />
                          <p className="text-xs font-medium text-gray-600">Temp</p>
                        </div>
                        <p className="text-lg font-bold text-gray-800">{vital.temperature}°F</p>
                      </div>
                    )}
                    {vital.bloodPressure && (
                      <div className="p-3 bg-white rounded-lg border border-blue-200">
                        <div className="flex items-center space-x-2 mb-1">
                          <Heart className="w-4 h-4 text-red-500" />
                          <p className="text-xs font-medium text-gray-600">BP</p>
                        </div>
                        <p className="text-lg font-bold text-gray-800">
                          {vital.bloodPressure.systolic}/{vital.bloodPressure.diastolic}
                        </p>
                      </div>
                    )}
                    {vital.heartRate && (
                      <div className="p-3 bg-white rounded-lg border border-blue-200">
                        <div className="flex items-center space-x-2 mb-1">
                          <Activity className="w-4 h-4 text-pink-500" />
                          <p className="text-xs font-medium text-gray-600">Heart</p>
                        </div>
                        <p className="text-lg font-bold text-gray-800">{vital.heartRate} <span className="text-xs">bpm</span></p>
                      </div>
                    )}
                    {vital.respiratoryRate && (
                      <div className="p-3 bg-white rounded-lg border border-blue-200">
                        <div className="flex items-center space-x-2 mb-1">
                          <Activity className="w-4 h-4 text-green-500" />
                          <p className="text-xs font-medium text-gray-600">Resp</p>
                        </div>
                        <p className="text-lg font-bold text-gray-800">{vital.respiratoryRate} <span className="text-xs">/min</span></p>
                      </div>
                    )}
                    {vital.oxygenSaturation && (
                      <div className="p-3 bg-white rounded-lg border border-blue-200">
                        <div className="flex items-center space-x-2 mb-1">
                          <Activity className="w-4 h-4 text-blue-500" />
                          <p className="text-xs font-medium text-gray-600">O2 Sat</p>
                        </div>
                        <p className="text-lg font-bold text-gray-800">{vital.oxygenSaturation}%</p>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Empty State for Missing Records */}
        {(!medicalRecord?.allergies || medicalRecord.allergies.length === 0) &&
         (!medicalRecord?.medications || medicalRecord.medications.filter(m => m.status === 'active').length === 0) &&
         (!medicalRecord?.chronicConditions || medicalRecord.chronicConditions.length === 0) &&
         (!medicalRecord?.vitalSigns || medicalRecord.vitalSigns.length === 0) && (
          <div className="bg-white rounded-2xl shadow-xl p-12 text-center border-2 border-dashed border-gray-300">
            <FileText className="w-20 h-20 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-gray-800 mb-2">
              Your Medical Record is Ready
            </h3>
            <p className="text-gray-600 mb-6 max-w-md mx-auto">
              Start building your comprehensive health record by adding your medical information, allergies, medications, vitals, and more using the buttons above.
            </p>
          </div>
        )}
      </div>

      {/* Modals */}
      {showBasicInfoModal && (
        <BasicInfoModal
          data={basicInfo}
          setData={setBasicInfo}
          onSave={handleUpdateBasicInfo}
          onClose={() => setShowBasicInfoModal(false)}
        />
      )}

      {showVitalsModal && (
        <VitalsModal
          data={vitalsData}
          setData={setVitalsData}
          onSave={handleAddVitals}
          onClose={() => setShowVitalsModal(false)}
        />
      )}

      {showAllergyModal && (
        <AllergyModal
          data={allergyData}
          setData={setAllergyData}
          onSave={handleAddAllergy}
          onClose={() => setShowAllergyModal(false)}
        />
      )}

      {showMedicationModal && (
        <MedicationModal
          data={medicationData}
          setData={setMedicationData}
          onSave={handleAddMedication}
          onClose={() => setShowMedicationModal(false)}
        />
      )}

      {showConditionModal && (
        <ConditionModal
          data={conditionData}
          setData={setConditionData}
          onSave={handleAddCondition}
          onClose={() => setShowConditionModal(false)}
        />
      )}

      <ToastContainer />
    </div>
  );
};

// Modal Components
const Modal = ({ title, children, onClose }) => (
  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
    <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
      <div className="flex items-center justify-between p-6 border-b">
        <h2 className="text-2xl font-bold text-gray-800">{title}</h2>
        <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
          <X className="w-6 h-6" />
        </button>
      </div>
      <div className="p-6">{children}</div>
    </div>
  </div>
);

const BasicInfoModal = ({ data, setData, onSave, onClose }) => (
  <Modal title="Update Basic Information" onClose={onClose}>
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Blood Type</label>
          <select
            value={data.bloodType}
            onChange={(e) => setData({...data, bloodType: e.target.value})}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Select...</option>
            {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map(type => (
              <option key={type} value={type}>{type}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Height (cm)</label>
          <input
            type="number"
            value={data.height}
            onChange={(e) => setData({...data, height: e.target.value})}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Weight (kg)</label>
          <input
            type="number"
            value={data.weight}
            onChange={(e) => setData({...data, weight: e.target.value})}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      <div className="border-t pt-4">
        <h3 className="font-semibold mb-4">Emergency Contact</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Name</label>
            <input
              type="text"
              value={data.emergencyContact.name}
              onChange={(e) => setData({...data, emergencyContact: {...data.emergencyContact, name: e.target.value}})}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Phone</label>
            <input
              type="tel"
              value={data.emergencyContact.phone}
              onChange={(e) => setData({...data, emergencyContact: {...data.emergencyContact, phone: e.target.value}})}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Relationship</label>
            <input
              type="text"
              value={data.emergencyContact.relationship}
              onChange={(e) => setData({...data, emergencyContact: {...data.emergencyContact, relationship: e.target.value}})}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
            <input
              type="email"
              value={data.emergencyContact.email}
              onChange={(e) => setData({...data, emergencyContact: {...data.emergencyContact, email: e.target.value}})}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      </div>

      <button
        onClick={onSave}
        className="w-full bg-gradient-to-r from-blue-500 to-indigo-500 text-white py-3 rounded-lg hover:from-blue-600 hover:to-indigo-600 transition-all font-semibold"
      >
        Save Changes
      </button>
    </div>
  </Modal>
);

const VitalsModal = ({ data, setData, onSave, onClose }) => (
  <Modal title="Record Vital Signs" onClose={onClose}>
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Height (cm)</label>
          <input
            type="number"
            step="0.1"
            value={data.height}
            onChange={(e) => setData({...data, height: e.target.value})}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Weight (kg)</label>
          <input
            type="number"
            step="0.1"
            value={data.weight}
            onChange={(e) => setData({...data, weight: e.target.value})}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Systolic BP</label>
          <input
            type="number"
            value={data.bloodPressure.systolic}
            onChange={(e) => setData({...data, bloodPressure: {...data.bloodPressure, systolic: e.target.value}})}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Diastolic BP</label>
          <input
            type="number"
            value={data.bloodPressure.diastolic}
            onChange={(e) => setData({...data, bloodPressure: {...data.bloodPressure, diastolic: e.target.value}})}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Heart Rate (bpm)</label>
          <input
            type="number"
            value={data.heartRate}
            onChange={(e) => setData({...data, heartRate: e.target.value})}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Temperature (°F)</label>
          <input
            type="number"
            step="0.1"
            value={data.temperature}
            onChange={(e) => setData({...data, temperature: e.target.value})}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Respiratory Rate (/min)</label>
          <input
            type="number"
            value={data.respiratoryRate}
            onChange={(e) => setData({...data, respiratoryRate: e.target.value})}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Oxygen Saturation (%)</label>
          <input
            type="number"
            value={data.oxygenSaturation}
            onChange={(e) => setData({...data, oxygenSaturation: e.target.value})}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>
      <button
        onClick={onSave}
        className="w-full bg-gradient-to-r from-green-500 to-emerald-500 text-white py-3 rounded-lg hover:from-green-600 hover:to-emerald-600 transition-all font-semibold"
      >
        Record Vitals
      </button>
    </div>
  </Modal>
);

const AllergyModal = ({ data, setData, onSave, onClose }) => (
  <Modal title="Add Allergy" onClose={onClose}>
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Allergen</label>
        <input
          type="text"
          value={data.allergen}
          onChange={(e) => setData({...data, allergen: e.target.value})}
          placeholder="e.g., Penicillin, Peanuts"
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Reaction</label>
        <input
          type="text"
          value={data.reaction}
          onChange={(e) => setData({...data, reaction: e.target.value})}
          placeholder="e.g., Rash, Difficulty breathing"
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Severity</label>
        <select
          value={data.severity}
          onChange={(e) => setData({...data, severity: e.target.value})}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
        >
          <option value="mild">Mild</option>
          <option value="moderate">Moderate</option>
          <option value="severe">Severe</option>
        </select>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Diagnosed Date (Optional)</label>
        <input
          type="date"
          value={data.diagnosedDate}
          onChange={(e) => setData({...data, diagnosedDate: e.target.value})}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
        />
      </div>
      <button
        onClick={onSave}
        className="w-full bg-gradient-to-r from-orange-500 to-red-500 text-white py-3 rounded-lg hover:from-orange-600 hover:to-red-600 transition-all font-semibold"
      >
        Add Allergy
      </button>
    </div>
  </Modal>
);

const MedicationModal = ({ data, setData, onSave, onClose }) => (
  <Modal title="Add Medication" onClose={onClose}>
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Medication Name</label>
        <input
          type="text"
          value={data.name}
          onChange={(e) => setData({...data, name: e.target.value})}
          placeholder="e.g., Aspirin"
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
        />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Dosage</label>
          <input
            type="text"
            value={data.dosage}
            onChange={(e) => setData({...data, dosage: e.target.value})}
            placeholder="e.g., 100mg"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Frequency</label>
          <input
            type="text"
            value={data.frequency}
            onChange={(e) => setData({...data, frequency: e.target.value})}
            placeholder="e.g., Once daily"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Start Date</label>
          <input
            type="date"
            value={data.startDate}
            onChange={(e) => setData({...data, startDate: e.target.value})}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">End Date (Optional)</label>
          <input
            type="date"
            value={data.endDate}
            onChange={(e) => setData({...data, endDate: e.target.value})}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>
      <button
        onClick={onSave}
        className="w-full bg-gradient-to-r from-purple-500 to-indigo-500 text-white py-3 rounded-lg hover:from-purple-600 hover:to-indigo-600 transition-all font-semibold"
      >
        Add Medication
      </button>
    </div>
  </Modal>
);

const ConditionModal = ({ data, setData, onSave, onClose }) => (
  <Modal title="Add Chronic Condition" onClose={onClose}>
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Condition Name</label>
        <input
          type="text"
          value={data.condition}
          onChange={(e) => setData({...data, condition: e.target.value})}
          placeholder="e.g., Diabetes Type 2"
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Diagnosed Date</label>
        <input
          type="date"
          value={data.diagnosedDate}
          onChange={(e) => setData({...data, diagnosedDate: e.target.value})}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
        <select
          value={data.status}
          onChange={(e) => setData({...data, status: e.target.value})}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
        >
          <option value="active">Active</option>
          <option value="controlled">Controlled</option>
          <option value="resolved">Resolved</option>
        </select>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Notes (Optional)</label>
        <textarea
          value={data.notes}
          onChange={(e) => setData({...data, notes: e.target.value})}
          rows="3"
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
        />
      </div>
      <button
        onClick={onSave}
        className="w-full bg-gradient-to-r from-red-500 to-pink-500 text-white py-3 rounded-lg hover:from-red-600 hover:to-pink-600 transition-all font-semibold"
      >
        Add Condition
      </button>
    </div>
  </Modal>
);

export default MedicalRecords;
