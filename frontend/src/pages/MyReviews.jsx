import React, { useState, useEffect } from 'react';
import { 
  Star, 
  Edit, 
  Trash2, 
  Calendar,
  User,
  MessageSquare,
  ThumbsUp
} from 'lucide-react';
import StarRating from '../components/reviews/StarRating';
import ReviewForm from '../components/reviews/ReviewForm';
import { getMyReviews, deleteReview } from '../services/reviewService';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../hooks/useToast';
import ToastContainer from '../components/ToastContainer';
import ConfirmDialog from '../components/ConfirmDialog';

const MyReviews = () => {
  const { user } = useAuth();
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingReview, setEditingReview] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const { toasts, removeToast, showSuccess, showError } = useToast();
  const [deleteConfirm, setDeleteConfirm] = useState({ isOpen: false, id: null });

  useEffect(() => {
    if (user?.role === 'patient') {
      fetchMyReviews();
    }
  }, [user]);

  const fetchMyReviews = async () => {
    try {
      setLoading(true);
      const data = await getMyReviews();
      setReviews(data.reviews || []);
    } catch (error) {
      console.error('Fetch reviews error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (review) => {
    setEditingReview(review);
    setShowEditModal(true);
  };

  const handleDelete = (reviewId) => {
    setDeleteConfirm({ isOpen: true, id: reviewId });
  };

  const confirmDelete = async () => {
    const reviewId = deleteConfirm.id;
    setDeleteConfirm({ isOpen: false, id: null });

    try {
      await deleteReview(reviewId);
      setReviews(reviews.filter(r => r._id !== reviewId));
      showSuccess('Review deleted successfully');
    } catch (error) {
      console.error('Delete error:', error);
      showError(error.response?.data?.message || 'Failed to delete review');
    }
  };

  const cancelDelete = () => {
    setDeleteConfirm({ isOpen: false, id: null });
  };

  const handleEditSuccess = (updatedReview) => {
    setReviews(reviews.map(r => 
      r._id === updatedReview._id ? updatedReview : r
    ));
    setShowEditModal(false);
    setEditingReview(null);
    fetchMyReviews(); // Refresh to get updated data
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
    return badges[status] || badges.pending;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
        <div className="container mx-auto px-4">
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600 dark:text-gray-400">Loading your reviews...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <ToastContainer toasts={toasts} removeToast={removeToast} />
      <ConfirmDialog
        isOpen={deleteConfirm.isOpen}
        title="Delete Review"
        message="Are you sure you want to delete this review? This action cannot be undone."
        onConfirm={confirmDelete}
        onCancel={cancelDelete}
        confirmText="Delete"
        type="danger"
      />
      <div className="container mx-auto px-4 max-w-5xl">
        {/* Header */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-6 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <Star size={32} className="text-yellow-400 fill-yellow-400" />
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                My Reviews
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                Manage your doctor reviews and feedback
              </p>
            </div>
          </div>
        </div>

        {/* Statistics */}
        {reviews.length > 0 && (
          <div className="grid md:grid-cols-3 gap-4 mb-6">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 border border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Total Reviews</p>
                  <p className="text-3xl font-bold text-gray-900 dark:text-white">
                    {reviews.length}
                  </p>
                </div>
                <MessageSquare size={32} className="text-blue-600" />
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 border border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Average Rating</p>
                  <p className="text-3xl font-bold text-gray-900 dark:text-white">
                    {(reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)}
                  </p>
                </div>
                <Star size={32} className="text-yellow-400 fill-yellow-400" />
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 border border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Total Helpful Votes</p>
                  <p className="text-3xl font-bold text-gray-900 dark:text-white">
                    {reviews.reduce((sum, r) => sum + (r.helpfulVotes || 0), 0)}
                  </p>
                </div>
                <ThumbsUp size={32} className="text-green-600" />
              </div>
            </div>
          </div>
        )}

        {/* Reviews List */}
        {reviews.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-12 text-center border border-gray-200 dark:border-gray-700">
            <Star size={64} className="mx-auto text-gray-400 mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              No reviews yet
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Share your experience by writing reviews for doctors you've consulted with.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {reviews.map((review) => (
              <div 
                key={review._id}
                className="bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700 overflow-hidden"
              >
                {/* Review Header */}
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-gray-750 dark:to-gray-750 px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white font-bold text-lg">
                        {review.doctor?.name?.charAt(0).toUpperCase() || 'D'}
                      </div>
                      <div>
                        <h3 className="font-semibold text-lg text-gray-900 dark:text-white">
                          Dr. {review.doctor?.name || 'Unknown'}
                        </h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {review.doctor?.specialization || 'General Physician'}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          <Calendar size={14} className="text-gray-500" />
                          <span className="text-xs text-gray-500 dark:text-gray-400">
                            {formatDate(review.createdAt)}
                          </span>
                          {review.isEdited && (
                            <span className="text-xs text-gray-400 italic">(edited)</span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusBadge(review.status)}`}>
                        {review.status.charAt(0).toUpperCase() + review.status.slice(1)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Review Content */}
                <div className="p-6">
                  <div className="flex items-center gap-2 mb-3">
                    <StarRating rating={review.rating} size={20} />
                    <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                      {review.rating}.0 / 5.0
                    </span>
                  </div>

                  <h4 className="font-semibold text-lg text-gray-900 dark:text-white mb-2">
                    {review.title}
                  </h4>

                  <p className="text-gray-700 dark:text-gray-300 mb-4 leading-relaxed">
                    {review.comment}
                  </p>

                  {/* Engagement Stats */}
                  <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400 mb-4">
                    <div className="flex items-center gap-1">
                      <ThumbsUp size={16} className="text-green-600" />
                      <span>{review.helpfulVotes || 0} helpful</span>
                    </div>
                    {review.response && (
                      <div className="flex items-center gap-1">
                        <MessageSquare size={16} className="text-blue-600" />
                        <span>Doctor responded</span>
                      </div>
                    )}
                  </div>

                  {/* Doctor Response */}
                  {review.response && (
                    <div className="bg-blue-50 dark:bg-blue-900/20 border-l-4 border-blue-500 rounded p-4 mb-4">
                      <div className="flex items-center gap-2 mb-2">
                        <MessageSquare size={16} className="text-blue-600 dark:text-blue-400" />
                        <span className="text-sm font-semibold text-blue-900 dark:text-blue-300">
                          Doctor's Response
                        </span>
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          {formatDate(review.response.respondedAt)}
                        </span>
                      </div>
                      <p className="text-sm text-gray-700 dark:text-gray-300">
                        {review.response.comment}
                      </p>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                    <button
                      onClick={() => handleEdit(review)}
                      className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition"
                    >
                      <Edit size={18} />
                      Edit Review
                    </button>
                    <button
                      onClick={() => handleDelete(review._id)}
                      className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg transition"
                    >
                      <Trash2 size={18} />
                      Delete Review
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Edit Modal */}
        {showEditModal && editingReview && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <ReviewForm
                doctorId={editingReview.doctor._id}
                existingReview={editingReview}
                onSuccess={handleEditSuccess}
                onCancel={() => {
                  setShowEditModal(false);
                  setEditingReview(null);
                }}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MyReviews;
