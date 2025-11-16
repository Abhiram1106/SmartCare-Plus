import React, { useState, useEffect } from 'react';
import { 
  Star, 
  MessageSquare,
  Calendar,
  User,
  ThumbsUp,
  Filter,
  Search
} from 'lucide-react';
import StarRating from '../../components/reviews/StarRating';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../hooks/useToast';
import ToastContainer from '../../components/ToastContainer';

const DoctorReviews = () => {
  const { user } = useAuth();
  const { showSuccess, showError, showWarning } = useToast();
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('all'); // all, pending, approved, rejected
  const [sortBy, setSortBy] = useState('newest'); // newest, oldest, highest, lowest
  const [searchTerm, setSearchTerm] = useState('');
  const [respondingTo, setRespondingTo] = useState(null);
  const [responseText, setResponseText] = useState('');

  useEffect(() => {
    fetchDoctorReviews();
  }, []);

  const fetchDoctorReviews = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/reviews/doctor/${user._id}`);
      setReviews(response.data.reviews || []);
    } catch (error) {
      console.error('Fetch reviews error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRespond = async (reviewId) => {
    if (!responseText.trim()) {
      showWarning('Please enter a response');
      return;
    }

    try {
      const response = await api.post(`/reviews/${reviewId}/respond`, {
        response: responseText
      });
      
      // Update the review with the response
      setReviews(reviews.map(r => 
        r._id === reviewId ? response.data.review : r
      ));
      
      setRespondingTo(null);
      setResponseText('');
      showSuccess('Response submitted successfully');
    } catch (error) {
      console.error('Response error:', error);
      showError(error.response?.data?.message || 'Failed to submit response');
    }
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getStatusBadge = (status) => {
    const badges = {
      approved: 'bg-green-100 text-green-800',
      pending: 'bg-yellow-100 text-yellow-800',
      rejected: 'bg-red-100 text-red-800',
      flagged: 'bg-orange-100 text-orange-800'
    };
    return badges[status] || 'bg-gray-100 text-gray-800';
  };

  // Filter reviews
  const filteredReviews = reviews
    .filter(review => {
      if (filterStatus !== 'all' && review.status !== filterStatus) return false;
      if (searchTerm && !review.patient?.name?.toLowerCase().includes(searchTerm.toLowerCase()) &&
          !review.comment?.toLowerCase().includes(searchTerm.toLowerCase())) {
        return false;
      }
      return true;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'newest':
          return new Date(b.createdAt) - new Date(a.createdAt);
        case 'oldest':
          return new Date(a.createdAt) - new Date(b.createdAt);
        case 'highest':
          return b.rating - a.rating;
        case 'lowest':
          return a.rating - b.rating;
        default:
          return 0;
      }
    });

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-cyan-50 py-8">
      <div className="max-w-6xl mx-auto px-4">
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-xl p-8 mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">
            My Reviews
          </h1>
          <p className="text-gray-600">Manage reviews from your patients</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">Total Reviews</p>
                <p className="text-3xl font-bold text-blue-600">{reviews.length}</p>
              </div>
              <Star className="w-12 h-12 text-blue-600 opacity-20" />
            </div>
          </div>
          
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">Approved</p>
                <p className="text-3xl font-bold text-green-600">
                  {reviews.filter(r => r.status === 'approved').length}
                </p>
              </div>
              <ThumbsUp className="w-12 h-12 text-green-600 opacity-20" />
            </div>
          </div>
          
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">Pending</p>
                <p className="text-3xl font-bold text-yellow-600">
                  {reviews.filter(r => r.status === 'pending').length}
                </p>
              </div>
              <Calendar className="w-12 h-12 text-yellow-600 opacity-20" />
            </div>
          </div>
          
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">Average Rating</p>
                <p className="text-3xl font-bold text-purple-600">
                  {reviews.length > 0 
                    ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
                    : '0.0'}
                </p>
              </div>
              <Star className="w-12 h-12 text-purple-600 opacity-20" />
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-2xl shadow-xl p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search reviews..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Status Filter */}
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none"
              >
                <option value="all">All Status</option>
                <option value="approved">Approved</option>
                <option value="pending">Pending</option>
                <option value="rejected">Rejected</option>
                <option value="flagged">Flagged</option>
              </select>
            </div>

            {/* Sort */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
              <option value="highest">Highest Rating</option>
              <option value="lowest">Lowest Rating</option>
            </select>
          </div>
        </div>

        {/* Reviews List */}
        {filteredReviews.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-xl p-12 text-center">
            <Star className="w-20 h-20 text-gray-300 mx-auto mb-4" />
            <h3 className="text-2xl font-semibold text-gray-700 mb-2">No Reviews Found</h3>
            <p className="text-gray-500">
              {searchTerm || filterStatus !== 'all' 
                ? 'Try adjusting your filters' 
                : 'You haven\'t received any reviews yet'}
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {filteredReviews.map((review) => (
              <div key={review._id} className="bg-white rounded-2xl shadow-xl p-6 hover:shadow-2xl transition-shadow">
                {/* Review Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-bold text-lg">
                      {review.patient?.name?.charAt(0) || 'P'}
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-800">
                        {review.patient?.name || 'Anonymous Patient'}
                      </h3>
                      <p className="text-sm text-gray-500 flex items-center">
                        <Calendar className="w-4 h-4 mr-1" />
                        {formatDate(review.createdAt)}
                      </p>
                    </div>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusBadge(review.status)}`}>
                    {review.status.charAt(0).toUpperCase() + review.status.slice(1)}
                  </span>
                </div>

                {/* Rating */}
                <div className="mb-4">
                  <StarRating rating={review.rating} size="medium" readonly />
                </div>

                {/* Title */}
                {review.title && (
                  <h4 className="text-lg font-semibold text-gray-800 mb-2">{review.title}</h4>
                )}

                {/* Comment */}
                <p className="text-gray-700 mb-4 leading-relaxed">{review.comment}</p>

                {/* Sub-ratings */}
                {review.subRatings && (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4 p-4 bg-gray-50 rounded-lg">
                    <div>
                      <p className="text-sm text-gray-600 mb-1">Communication</p>
                      <StarRating rating={review.subRatings.communication} size="small" readonly />
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 mb-1">Punctuality</p>
                      <StarRating rating={review.subRatings.punctuality} size="small" readonly />
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 mb-1">Bedside Manner</p>
                      <StarRating rating={review.subRatings.bedsideManner} size="small" readonly />
                    </div>
                  </div>
                )}

                {/* Helpful Count */}
                <div className="flex items-center text-sm text-gray-600 mb-4">
                  <ThumbsUp className="w-4 h-4 mr-1" />
                  {review.helpfulCount} {review.helpfulCount === 1 ? 'person' : 'people'} found this helpful
                </div>

                {/* Doctor's Response */}
                {review.doctorResponse ? (
                  <div className="bg-blue-50 rounded-lg p-4 border-l-4 border-blue-500">
                    <div className="flex items-center mb-2">
                      <MessageSquare className="w-5 h-5 text-blue-600 mr-2" />
                      <p className="font-semibold text-blue-900">Your Response</p>
                    </div>
                    <p className="text-gray-700">{review.doctorResponse.response}</p>
                    <p className="text-xs text-gray-500 mt-2">
                      Responded on {formatDate(review.doctorResponse.respondedAt)}
                    </p>
                  </div>
                ) : review.status === 'approved' && (
                  <div>
                    {respondingTo === review._id ? (
                      <div className="space-y-3">
                        <textarea
                          value={responseText}
                          onChange={(e) => setResponseText(e.target.value)}
                          placeholder="Write your response..."
                          rows="4"
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                        <div className="flex space-x-3">
                          <button
                            onClick={() => handleRespond(review._id)}
                            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                          >
                            Submit Response
                          </button>
                          <button
                            onClick={() => {
                              setRespondingTo(null);
                              setResponseText('');
                            }}
                            className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <button
                        onClick={() => setRespondingTo(review._id)}
                        className="flex items-center space-x-2 px-4 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors"
                      >
                        <MessageSquare className="w-4 h-4" />
                        <span>Respond to Review</span>
                      </button>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
      
      <ToastContainer />
    </div>
  );
};

export default DoctorReviews;
