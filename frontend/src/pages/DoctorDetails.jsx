import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Star, 
  MapPin, 
  Phone, 
  Mail, 
  Calendar,
  Award,
  BookOpen,
  DollarSign,
  Languages,
  CheckCircle,
  ArrowLeft,
  MessageCircle
} from 'lucide-react';
import api from '../services/api';
import StarRating from '../components/reviews/StarRating';
import TopRatedBadge from '../components/reviews/TopRatedBadge';
import RatingBreakdown from '../components/reviews/RatingBreakdown';
import DoctorReviewsList from '../components/reviews/DoctorReviewsList';
import ReviewForm from '../components/reviews/ReviewForm';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../hooks/useToast';
import ToastContainer from '../components/ToastContainer';

const DoctorDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { showError } = useToast();
  
  const [doctor, setDoctor] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [activeTab, setActiveTab] = useState('overview'); // overview, reviews

  useEffect(() => {
    fetchDoctorDetails();
  }, [id]);

  const fetchDoctorDetails = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/doctors/${id}`);
      setDoctor(response.data);
    } catch (error) {
      console.error('Error fetching doctor details:', error);
      showError('Failed to load doctor details');
    } finally {
      setLoading(false);
    }
  };

  const handleBookAppointment = () => {
    navigate(`/patient/book-appointment/${id}`);
  };

  const handleReviewSuccess = () => {
    setShowReviewForm(false);
    fetchDoctorDetails(); // Refresh doctor details to get updated reviews
    setActiveTab('reviews');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
        <div className="container mx-auto px-4">
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600 dark:text-gray-400">Loading doctor details...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!doctor) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
        <div className="container mx-auto px-4">
          <div className="text-center py-12">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              Doctor not found
            </h2>
            <button
              onClick={() => navigate('/patient/doctors')}
              className="text-blue-600 hover:text-blue-700 font-semibold"
            >
              Back to Doctors
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="container mx-auto px-4 max-w-6xl">
        {/* Back Button */}
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white mb-6 transition"
        >
          <ArrowLeft size={20} />
          Back
        </button>

        {/* Doctor Header Card */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden mb-6">
          <div className="bg-gradient-to-r from-blue-500 to-indigo-600 p-6">
            <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
              {/* Doctor Avatar */}
              <div className="w-32 h-32 rounded-full bg-white dark:bg-gray-700 flex items-center justify-center text-4xl font-bold text-blue-600 shadow-xl">
                {doctor.name?.charAt(0).toUpperCase() || 'D'}
              </div>

              {/* Doctor Info */}
              <div className="flex-1 text-white">
                <div className="flex flex-wrap items-center gap-3 mb-3">
                  <h1 className="text-3xl font-bold">
                    Dr. {doctor.name}
                  </h1>
                  {doctor.rating >= 4.5 && <TopRatedBadge rating={doctor.rating} size="md" />}
                  {doctor.verifiedBadge && (
                    <div className="flex items-center gap-1 px-3 py-1 bg-white/20 backdrop-blur-sm rounded-full text-sm font-semibold">
                      <CheckCircle size={16} />
                      Verified
                    </div>
                  )}
                </div>

                <p className="text-lg text-blue-100 mb-4">
                  {doctor.specialization || 'General Physician'}
                </p>

                <div className="flex flex-wrap items-center gap-4 text-sm">
                  <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm px-3 py-1.5 rounded-lg">
                    <Award size={16} />
                    <span>{doctor.experience || 0} years experience</span>
                  </div>
                  
                  <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm px-3 py-1.5 rounded-lg">
                    <Star size={16} className="fill-yellow-400 text-yellow-400" />
                    <span className="font-semibold">{doctor.rating?.toFixed(1) || '0.0'}</span>
                  </div>

                  <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm px-3 py-1.5 rounded-lg">
                    <MessageCircle size={16} />
                    <span>{doctor.totalConsultations || 0} consultations</span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col gap-3 w-full md:w-auto">
                <button
                  onClick={handleBookAppointment}
                  className="px-6 py-3 bg-white text-blue-600 hover:bg-blue-50 font-semibold rounded-lg shadow-lg transition flex items-center justify-center gap-2"
                >
                  <Calendar size={20} />
                  Book Appointment
                </button>
                
                {user?.role === 'patient' && (
                  <button
                    onClick={() => setShowReviewForm(true)}
                    className="px-6 py-3 bg-yellow-400 text-gray-900 hover:bg-yellow-500 font-semibold rounded-lg shadow-lg transition flex items-center justify-center gap-2"
                  >
                    <Star size={20} />
                    Write Review
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Contact Information */}
          <div className="p-6 border-t border-gray-200 dark:border-gray-700">
            <div className="grid md:grid-cols-3 gap-4 text-sm">
              {doctor.email && (
                <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                  <Mail size={18} className="text-blue-600" />
                  <span>{doctor.email}</span>
                </div>
              )}
              
              {doctor.phone && (
                <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                  <Phone size={18} className="text-green-600" />
                  <span>{doctor.phone}</span>
                </div>
              )}
              
              {doctor.clinicAddress && (
                <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                  <MapPin size={18} className="text-red-600" />
                  <span>{doctor.clinicAddress}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700 mb-6">
          <div className="flex border-b border-gray-200 dark:border-gray-700">
            <button
              onClick={() => setActiveTab('overview')}
              className={`
                flex-1 px-6 py-4 font-semibold transition
                ${activeTab === 'overview'
                  ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50 dark:bg-blue-900/20'
                  : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-750'
                }
              `}
            >
              Overview
            </button>
            <button
              onClick={() => setActiveTab('reviews')}
              className={`
                flex-1 px-6 py-4 font-semibold transition flex items-center justify-center gap-2
                ${activeTab === 'reviews'
                  ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50 dark:bg-blue-900/20'
                  : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-750'
                }
              `}
            >
              <Star size={18} />
              Reviews & Ratings
            </button>
          </div>
        </div>

        {/* Tab Content */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Professional Details */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 border border-gray-200 dark:border-gray-700">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
                <BookOpen size={24} className="text-blue-600" />
                Professional Details
              </h2>

              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-sm font-semibold text-gray-600 dark:text-gray-400 mb-2">
                    Specialization
                  </h3>
                  <p className="text-gray-900 dark:text-white font-medium">
                    {doctor.specialization || 'Not specified'}
                  </p>
                </div>

                <div>
                  <h3 className="text-sm font-semibold text-gray-600 dark:text-gray-400 mb-2">
                    Experience
                  </h3>
                  <p className="text-gray-900 dark:text-white font-medium">
                    {doctor.experience || 0} years
                  </p>
                </div>

                <div>
                  <h3 className="text-sm font-semibold text-gray-600 dark:text-gray-400 mb-2">
                    Consultation Fee
                  </h3>
                  <p className="text-gray-900 dark:text-white font-medium flex items-center gap-1">
                    <DollarSign size={18} className="text-green-600" />
                    ₹{doctor.consultationFee || 500}
                  </p>
                </div>

                <div>
                  <h3 className="text-sm font-semibold text-gray-600 dark:text-gray-400 mb-2">
                    Languages
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {(doctor.languages || ['English']).map((lang, index) => (
                      <span
                        key={index}
                        className="px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 rounded-full text-sm font-medium"
                      >
                        {lang}
                      </span>
                    ))}
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-semibold text-gray-600 dark:text-gray-400 mb-2">
                    Success Rate
                  </h3>
                  <p className="text-gray-900 dark:text-white font-medium">
                    {doctor.successRate || 90}%
                  </p>
                </div>

                <div>
                  <h3 className="text-sm font-semibold text-gray-600 dark:text-gray-400 mb-2">
                    Total Patients
                  </h3>
                  <p className="text-gray-900 dark:text-white font-medium">
                    {doctor.totalPatients || 0}
                  </p>
                </div>
              </div>
            </div>

            {/* Rating Overview */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 border border-gray-200 dark:border-gray-700">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
                <Star size={24} className="text-yellow-400 fill-yellow-400" />
                Rating Overview
              </h2>

              <div className="grid md:grid-cols-2 gap-6">
                <div className="text-center">
                  <div className="text-6xl font-bold text-gray-900 dark:text-white mb-2">
                    {doctor.rating?.toFixed(1) || '0.0'}
                  </div>
                  <StarRating rating={doctor.rating || 0} size={28} className="justify-center mb-2" />
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Based on patient reviews
                  </p>
                </div>

                <div>
                  {doctor.ratingBreakdown && (
                    <RatingBreakdown 
                      ratingBreakdown={doctor.ratingBreakdown}
                      totalReviews={Object.values(doctor.ratingBreakdown).reduce((a, b) => a + b, 0)}
                    />
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'reviews' && (
          <DoctorReviewsList
            doctorId={id}
            onWriteReview={() => setShowReviewForm(true)}
          />
        )}

        {/* Review Form Modal */}
        {showReviewForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <ReviewForm
                doctorId={id}
                onSuccess={handleReviewSuccess}
                onCancel={() => setShowReviewForm(false)}
              />
            </div>
          </div>
        )}
      </div>
      <ToastContainer />
    </div>
  );
};

export default DoctorDetails;
