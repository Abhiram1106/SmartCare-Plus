import React, { useState, useEffect } from 'react';
import { 
  Shield, 
  CheckCircle, 
  XCircle, 
  Flag, 
  AlertTriangle,
  Search,
  Filter
} from 'lucide-react';
import ReviewCard from './ReviewCard';
import StarRating from './StarRating';
import { getAllReviews, moderateReview } from '../../services/reviewService';
import { useToast } from '../../hooks/useToast';
import ToastContainer from '../ToastContainer';

const AdminReviewModeration = () => {
  const { showSuccess, showError } = useToast();
  const [reviews, setReviews] = useState([]);
  const [statusCounts, setStatusCounts] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    page: 1,
    limit: 20,
    status: '',
    sort: '-createdAt'
  });
  const [moderationModal, setModerationModal] = useState(null);
  const [moderationNote, setModerationNote] = useState('');

  useEffect(() => {
    fetchReviews();
  }, [filters]);

  const fetchReviews = async () => {
    try {
      setLoading(true);
      const params = {};
      
      if (filters.page) params.page = filters.page;
      if (filters.limit) params.limit = filters.limit;
      if (filters.status) params.status = filters.status;
      if (filters.sort) params.sort = filters.sort;

      const data = await getAllReviews(params);
      setReviews(data.reviews);
      setPagination(data.pagination);
      setStatusCounts(data.statusCounts || []);
    } catch (error) {
      console.error('Fetch reviews error:', error);
      showError('Failed to fetch reviews');
    } finally {
      setLoading(false);
    }
  };

  const handleModerate = async (reviewId, status) => {
    try {
      const response = await moderateReview(reviewId, status, moderationNote);
      showSuccess(response.message);
      
      // Update local state
      setReviews(reviews.map(r => 
        r._id === reviewId ? { ...r, status } : r
      ));
      
      setModerationModal(null);
      setModerationNote('');
      
      // Refresh to update counts
      fetchReviews();
    } catch (error) {
      console.error('Moderate review error:', error);
      showError(error.response?.data?.message || 'Failed to moderate review');
    }
  };

  const openModerationModal = (review, action) => {
    setModerationModal({ review, action });
    setModerationNote('');
  };

  const getStatusBadge = (status) => {
    const badges = {
      approved: { color: 'bg-green-100 text-green-800', icon: CheckCircle },
      rejected: { color: 'bg-red-100 text-red-800', icon: XCircle },
      pending: { color: 'bg-yellow-100 text-yellow-800', icon: AlertTriangle },
      flagged: { color: 'bg-orange-100 text-orange-800', icon: Flag }
    };

    const badge = badges[status] || badges.pending;
    const Icon = badge.icon;

    return (
      <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold ${badge.color}`}>
        <Icon size={14} />
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  const getStatusCount = (status) => {
    const count = statusCounts.find(s => s._id === status);
    return count ? count.count : 0;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 border border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-3 mb-6">
          <Shield size={32} className="text-blue-600" />
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              Review Moderation
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Manage and moderate patient reviews
            </p>
          </div>
        </div>

        {/* Status Overview */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { status: 'approved', label: 'Approved', color: 'bg-green-50 border-green-200' },
            { status: 'pending', label: 'Pending', color: 'bg-yellow-50 border-yellow-200' },
            { status: 'flagged', label: 'Flagged', color: 'bg-orange-50 border-orange-200' },
            { status: 'rejected', label: 'Rejected', color: 'bg-red-50 border-red-200' }
          ].map(({ status, label, color }) => (
            <button
              key={status}
              onClick={() => setFilters({ ...filters, status: filters.status === status ? '' : status, page: 1 })}
              className={`
                p-4 rounded-lg border-2 transition-all
                ${filters.status === status 
                  ? 'ring-2 ring-blue-500 ' + color 
                  : 'bg-white dark:bg-gray-700 border-gray-200 dark:border-gray-600'
                }
              `}
            >
              <div className="text-2xl font-bold text-gray-900 dark:text-white">
                {getStatusCount(status)}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                {label}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 border border-gray-200 dark:border-gray-700">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <Filter size={18} className="text-gray-600 dark:text-gray-400" />
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Sort by:</span>
            <select
              value={filters.sort}
              onChange={(e) => setFilters({ ...filters, sort: e.target.value })}
              className="px-3 py-2 bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="-createdAt">Newest First</option>
              <option value="createdAt">Oldest First</option>
              <option value="-flagCount">Most Flagged</option>
              <option value="-helpfulVotes">Most Helpful</option>
            </select>
          </div>
        </div>
      </div>

      {/* Reviews List */}
      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Loading reviews...</p>
        </div>
      ) : reviews.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-12 text-center border border-gray-200 dark:border-gray-700">
          <Shield size={48} className="mx-auto text-gray-400 mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            No reviews found
          </h3>
          <p className="text-gray-600 dark:text-gray-400">
            {filters.status ? `No ${filters.status} reviews at the moment.` : 'No reviews to moderate.'}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {reviews.map((review) => (
            <div 
              key={review._id}
              className="bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700 overflow-hidden"
            >
              {/* Status Header */}
              <div className="bg-gray-50 dark:bg-gray-750 px-6 py-3 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {getStatusBadge(review.status)}
                  {review.flagCount > 0 && (
                    <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-800">
                      <Flag size={14} />
                      {review.flagCount} Flag{review.flagCount > 1 ? 's' : ''}
                    </span>
                  )}
                </div>
                
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  Review ID: {review._id.slice(-8)}
                </div>
              </div>

              {/* Review Content */}
              <div className="p-6">
                <div className="flex items-start gap-4 mb-4">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <h4 className="font-semibold text-gray-900 dark:text-white">
                        {review.patient?.name || 'Anonymous'}
                      </h4>
                      <StarRating rating={review.rating} size={16} />
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                      Doctor: {review.doctor?.name || 'Unknown'}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-500">
                      {new Date(review.createdAt).toLocaleString()}
                    </p>
                  </div>
                </div>

                <h5 className="font-semibold text-lg text-gray-900 dark:text-white mb-2">
                  {review.title}
                </h5>
                <p className="text-gray-700 dark:text-gray-300 mb-4">
                  {review.comment}
                </p>

                {/* Flag Reasons */}
                {review.flagReasons && review.flagReasons.length > 0 && (
                  <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-4">
                    <h6 className="font-semibold text-red-900 dark:text-red-300 mb-2 flex items-center gap-2">
                      <Flag size={16} />
                      Flag Reasons
                    </h6>
                    <ul className="space-y-2">
                      {review.flagReasons.map((flag, index) => (
                        <li key={index} className="text-sm text-red-800 dark:text-red-200">
                          • {flag.reason}
                          <span className="text-xs text-gray-600 dark:text-gray-400 ml-2">
                            ({new Date(flag.flaggedAt).toLocaleDateString()})
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Moderation Actions */}
                <div className="flex gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                  {review.status !== 'approved' && (
                    <button
                      onClick={() => openModerationModal(review, 'approved')}
                      className="flex-1 bg-green-600 hover:bg-green-700 text-white font-semibold py-2 rounded-lg transition flex items-center justify-center gap-2"
                    >
                      <CheckCircle size={18} />
                      Approve
                    </button>
                  )}
                  
                  {review.status !== 'rejected' && (
                    <button
                      onClick={() => openModerationModal(review, 'rejected')}
                      className="flex-1 bg-red-600 hover:bg-red-700 text-white font-semibold py-2 rounded-lg transition flex items-center justify-center gap-2"
                    >
                      <XCircle size={18} />
                      Reject
                    </button>
                  )}
                  
                  {review.status !== 'flagged' && (
                    <button
                      onClick={() => openModerationModal(review, 'flagged')}
                      className="flex-1 bg-orange-600 hover:bg-orange-700 text-white font-semibold py-2 rounded-lg transition flex items-center justify-center gap-2"
                    >
                      <Flag size={18} />
                      Flag
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {pagination && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Showing page {pagination.currentPage} of {pagination.totalPages} 
              ({pagination.totalReviews} total reviews)
            </p>
            
            <div className="flex gap-2">
              <button
                onClick={() => setFilters({ ...filters, page: filters.page - 1 })}
                disabled={filters.page === 1}
                className="px-4 py-2 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition"
              >
                Previous
              </button>
              <button
                onClick={() => setFilters({ ...filters, page: filters.page + 1 })}
                disabled={filters.page >= pagination.totalPages}
                className="px-4 py-2 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition"
              >
                Next
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Moderation Modal */}
      {moderationModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
              {moderationModal.action.charAt(0).toUpperCase() + moderationModal.action.slice(1)} Review
            </h3>
            
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Are you sure you want to {moderationModal.action} this review?
            </p>

            <textarea
              value={moderationNote}
              onChange={(e) => setModerationNote(e.target.value)}
              placeholder="Add a moderation note (optional)..."
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white resize-none mb-4"
              rows={3}
            />

            <div className="flex gap-3">
              <button
                onClick={() => handleModerate(moderationModal.review._id, moderationModal.action)}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 rounded-lg transition"
              >
                Confirm
              </button>
              <button
                onClick={() => {
                  setModerationModal(null);
                  setModerationNote('');
                }}
                className="flex-1 bg-gray-300 dark:bg-gray-600 hover:bg-gray-400 dark:hover:bg-gray-500 text-gray-800 dark:text-white font-semibold py-2 rounded-lg transition"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
      <ToastContainer />
    </div>
  );
};

export default AdminReviewModeration;
