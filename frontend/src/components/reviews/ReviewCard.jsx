import React, { useState } from 'react';
import { 
  ThumbsUp, 
  ThumbsDown, 
  Flag, 
  Edit, 
  Trash2, 
  CheckCircle,
  MessageCircle,
  MoreVertical
} from 'lucide-react';
import StarRating from './StarRating';
import { voteReview, flagReview, deleteReview } from '../../services/reviewService';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../hooks/useToast';
import ToastContainer from '../ToastContainer';
import ConfirmDialog from '../ConfirmDialog';

const ReviewCard = ({ 
  review, 
  onEdit, 
  onDelete, 
  onRespond, 
  showActions = true 
}) => {
  const { user } = useAuth();
  const { showSuccess, showError, showWarning } = useToast();
  const [localReview, setLocalReview] = useState(review);
  const [showMenu, setShowMenu] = useState(false);
  const [showFlagModal, setShowFlagModal] = useState(false);
  const [flagReason, setFlagReason] = useState('');
  const [loading, setLoading] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [confirmAction, setConfirmAction] = useState(null);

  const isOwnReview = user?.id === review.patient?._id;
  const isDoctor = user?.role === 'doctor';
  const isAdmin = user?.role === 'admin';

  const handleVote = async (voteType) => {
    if (!user) {
      showWarning('Please login to vote');
      return;
    }

    try {
      setLoading(true);
      const response = await voteReview(review._id, voteType);
      setLocalReview({
        ...localReview,
        helpfulVotes: response.helpfulVotes,
        notHelpfulVotes: response.notHelpfulVotes
      });
    } catch (error) {
      console.error('Vote error:', error);
      showError(error.response?.data?.message || 'Failed to vote');
    } finally {
      setLoading(false);
    }
  };

  const handleFlag = async () => {
    if (!flagReason.trim()) {
      showWarning('Please provide a reason for flagging');
      return;
    }

    try {
      setLoading(true);
      await flagReview(review._id, flagReason);
      setShowFlagModal(false);
      setFlagReason('');
      showSuccess('Review flagged successfully');
    } catch (error) {
      console.error('Flag error:', error);
      showError(error.response?.data?.message || 'Failed to flag review');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteConfirm = () => {
    setConfirmAction({
      title: 'Delete Review',
      message: 'Are you sure you want to delete this review? This action cannot be undone.',
      onConfirm: async () => {
        try {
          setLoading(true);
          await deleteReview(review._id);
          if (onDelete) {
            onDelete(review._id);
          }
          showSuccess('Review deleted successfully');
        } catch (error) {
          console.error('Delete error:', error);
          showError(error.response?.data?.message || 'Failed to delete review');
        } finally {
          setLoading(false);
          setShowConfirmDialog(false);
        }
      }
    });
    setShowConfirmDialog(true);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 border border-gray-200 dark:border-gray-700">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-start gap-3">
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white font-bold text-lg">
            {review.patient?.name?.charAt(0).toUpperCase() || 'U'}
          </div>
          
          <div>
            <div className="flex items-center gap-2">
              <h4 className="font-semibold text-gray-900 dark:text-white">
                {review.patient?.name || 'Anonymous'}
              </h4>
              {review.verified && (
                <CheckCircle size={16} className="text-green-500" title="Verified Patient" />
              )}
            </div>
            
            <div className="flex items-center gap-2 mt-1">
              <StarRating rating={review.rating} size={16} />
              <span className="text-sm text-gray-500 dark:text-gray-400">
                {formatDate(review.createdAt)}
              </span>
              {review.isEdited && (
                <span className="text-xs text-gray-400 italic">(edited)</span>
              )}
            </div>
          </div>
        </div>

        {showActions && (
          <div className="relative">
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition"
            >
              <MoreVertical size={20} className="text-gray-600 dark:text-gray-400" />
            </button>

            {showMenu && (
              <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-700 rounded-lg shadow-lg z-10 border border-gray-200 dark:border-gray-600">
                {isOwnReview && (
                  <>
                    <button
                      onClick={() => {
                        setShowMenu(false);
                        onEdit && onEdit(review);
                      }}
                      className="w-full text-left px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-600 flex items-center gap-2"
                    >
                      <Edit size={16} />
                      Edit Review
                    </button>
                    <button
                      onClick={() => {
                        setShowMenu(false);
                        handleDeleteConfirm();
                      }}
                      className="w-full text-left px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-600 flex items-center gap-2 text-red-600"
                    >
                      <Trash2 size={16} />
                      Delete Review
                    </button>
                  </>
                )}

                {!isOwnReview && (
                  <button
                    onClick={() => {
                      setShowMenu(false);
                      setShowFlagModal(true);
                    }}
                    className="w-full text-left px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-600 flex items-center gap-2"
                  >
                    <Flag size={16} />
                    Report Review
                  </button>
                )}

                {isDoctor && onRespond && !review.response && (
                  <button
                    onClick={() => {
                      setShowMenu(false);
                      onRespond(review);
                    }}
                    className="w-full text-left px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-600 flex items-center gap-2"
                  >
                    <MessageCircle size={16} />
                    Respond
                  </button>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Review Title */}
      <h5 className="font-semibold text-lg text-gray-900 dark:text-white mb-2">
        {review.title}
      </h5>

      {/* Review Content */}
      <p className="text-gray-700 dark:text-gray-300 mb-4 leading-relaxed">
        {review.comment}
      </p>

      {/* Detailed Ratings */}
      {review.detailedRatings && Object.keys(review.detailedRatings).length > 0 && (
        <div className="mb-4 p-3 bg-gray-50 dark:bg-gray-750 rounded-lg">
          <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
            Detailed Ratings:
          </p>
          <div className="grid grid-cols-2 gap-2">
            {Object.entries(review.detailedRatings).map(([key, value]) => (
              <div key={key} className="flex items-center justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-400 capitalize">
                  {key.replace(/([A-Z])/g, ' $1').trim()}:
                </span>
                <StarRating rating={value} size={14} />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Doctor Response */}
      {review.response && (
        <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 border-l-4 border-blue-500 rounded">
          <div className="flex items-center gap-2 mb-2">
            <MessageCircle size={16} className="text-blue-600 dark:text-blue-400" />
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

      {/* Vote Buttons */}
      <div className="flex items-center gap-4 mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
        <button
          onClick={() => handleVote('helpful')}
          disabled={loading || !user}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition disabled:opacity-50"
        >
          <ThumbsUp size={16} className="text-green-600 dark:text-green-400" />
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Helpful ({localReview.helpfulVotes || 0})
          </span>
        </button>

        <button
          onClick={() => handleVote('notHelpful')}
          disabled={loading || !user}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition disabled:opacity-50"
        >
          <ThumbsDown size={16} className="text-red-600 dark:text-red-400" />
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Not Helpful ({localReview.notHelpfulVotes || 0})
          </span>
        </button>

        {review.flagCount > 0 && isAdmin && (
          <span className="ml-auto text-xs text-red-600 dark:text-red-400 flex items-center gap-1">
            <Flag size={12} />
            {review.flagCount} flag{review.flagCount > 1 ? 's' : ''}
          </span>
        )}
      </div>

      {/* Flag Modal */}
      {showFlagModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
              Report Review
            </h3>
            
            <textarea
              value={flagReason}
              onChange={(e) => setFlagReason(e.target.value)}
              placeholder="Please explain why you're reporting this review..."
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white resize-none"
              rows={4}
            />

            <div className="flex gap-3 mt-4">
              <button
                onClick={handleFlag}
                disabled={loading || !flagReason.trim()}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white font-semibold py-2 rounded-lg transition disabled:opacity-50"
              >
                {loading ? 'Reporting...' : 'Report'}
              </button>
              <button
                onClick={() => {
                  setShowFlagModal(false);
                  setFlagReason('');
                }}
                className="flex-1 bg-gray-300 dark:bg-gray-600 hover:bg-gray-400 dark:hover:bg-gray-500 text-gray-800 dark:text-white font-semibold py-2 rounded-lg transition"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirm Dialog */}
      {showConfirmDialog && confirmAction && (
        <ConfirmDialog
          title={confirmAction.title}
          message={confirmAction.message}
          onConfirm={confirmAction.onConfirm}
          onCancel={() => setShowConfirmDialog(false)}
        />
      )}
      
      <ToastContainer />
    </div>
  );
};

export default ReviewCard;
